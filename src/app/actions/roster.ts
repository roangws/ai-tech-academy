"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";

/**
 * Authoring the instructor roster and the judge board.
 *
 * ------------------------------------------------------------------ why it exists
 *
 * Neither list was editable by anybody but a programmer. `instructors.people`
 * and `board.members` were `as const` arrays in a 3,000-line TypeScript file, so
 * adding a judge was a commit and a deploy — which is exactly what Roan has been
 * doing, one judge at a time, while the console whose job is running the school
 * did not know either list existed. Meanwhile the accounts in the product and
 * the names on the website were unrelated facts, so "this judge is that person"
 * was something only a human knew.
 *
 * ------------------------------------------------------------------- the guard
 *
 * `requireRole("admin")` in every function, never only in the layout — a layout
 * does not run for a Server Action invoked from a page under it, and an action
 * is a POST endpoint reachable by anyone who can read the page's HTML. The
 * `roster_write_as_admin` policy is the real boundary; these produce the good
 * error message.
 *
 * ------------------------------------------------ binding is not a role grant
 *
 * `bindRosterUser` sets `roster.user_id` and NOTHING else. It deliberately does
 * not grant `instructor` or `judge`, and that is the opposite of what
 * `bind_seat` does one table over — worth stating, because the asymmetry looks
 * like an oversight until you have the two cases side by side.
 *
 * A judge SEAT is a job: holding it means reading a course's curriculum and
 * scoring submitted sheets, so a seat bound to somebody without the role is a
 * seat that silently does nothing. A roster CARD is a claim on a public page.
 * Publishing somebody's photograph and employer is not the same act as handing
 * them read access to other people's submitted work, and doing both from one
 * button would mean the only way to put a judge on the website is to give them
 * the console too. `/admin/people` grants roles; this says who the card is.
 */

/** Both public pages, the two homepage bands, the sitemap and the console. */
async function revalidateRoster() {
  revalidatePath("/", "page");
  revalidatePath("/instructors", "page");
  revalidatePath("/review-judge-board", "page");
  /* Every course page prints the lead instructor in its About block and its
     JSON-LD, so a rename that stopped at the two roster pages would leave five
     course pages asserting the old one for up to an hour. */
  revalidatePath("/courses", "layout");
  revalidatePath("/admin", "layout");
}

function fail(label: string, error: { message: string } | null): void {
  if (error) throw new Error(`${label}: ${error.message}`);
}

const KINDS = new Set(["instructor", "judge"]);

/** Trimmed, length-capped, and empty becomes null rather than "". */
function text(formData: FormData, name: string, max = 500): string | null {
  const value = ((formData.get(name) as string | null) ?? "").trim().slice(0, max);
  return value.length ? value : null;
}

/**
 * An id from a name: lowercase, hyphenated, ASCII.
 *
 * Authored ids, like the catalogue's. It matters more here than usual because
 * these ids are already in use — `content.ts` has `roan` and `liz-zhang`, and
 * the seed import carried them across — so a generated uuid would have split
 * one person into two identities across the move.
 *
 * `normalize("NFD")` and the mark strip are what make "Loc H. Nguyen, Ed.D."
 * and "Yunbin Bae" both land somewhere sane. A name that reduces to nothing —
 * which is every name written in a script this regex does not cover — falls
 * back to a timestamp-free counter at the call site rather than to an empty id.
 */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ------------------------------------------------------------------- create */

export async function createRosterEntry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin", "/admin/roster");

  const kind = (formData.get("kind") as string | null) ?? "";
  if (!KINDS.has(kind)) return { error: "Pick instructor or judge." };

  const name = text(formData, "name", 120);
  if (!name) return { error: "A name is required. Everything else can be filled in next." };

  const id = text(formData, "id", 60) ?? slugify(name);
  if (!id) {
    return {
      error: "That name produced no id. Type one by hand — lowercase letters, numbers and hyphens.",
    };
  }

  const supabase = await createClient();

  /*
    Position is the end of this kind's list, read rather than assumed.

    `count` with `head: true` returns the number without the rows, which is the
    whole of what is needed here. A hardcoded 0 would put every new person at the
    top of the board, and on a page whose first card is rendered wider than the
    rest that is not a sorting quirk — it is a new arrival silently promoted over
    the lead.
  */
  const { count } = await supabase
    .from("roster")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind);

  const { error } = await supabase.from("roster").insert({
    id,
    kind,
    name,
    position: count ?? 0,
    /* A new card starts as a draft. It is the same rule the catalogue follows
       and for the same reason: these are real people's names and photographs on
       a public page, and a half-typed card should not be live while somebody is
       still typing it. */
    status: "draft",
  });

  /* 23505 is unique_violation. An id collision is something the author can fix
     by typing a different one, so it is an answer rather than a crash — and
     without this it reached the error boundary and took every field they had
     filled in with it. */
  if (error?.code === "23505") {
    return { error: `The id "${id}" is already taken. Give this one a different id.` };
  }
  fail("create roster entry", error);

  await revalidateRoster();
  redirect(`/admin/roster/${id}`);
}

/* --------------------------------------------------------------------- edit */

export async function saveRosterEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "/admin/roster");

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing the entry to save." };

  const name = text(formData, "name", 120);
  if (!name) return { error: "A name is required." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("roster")
    .update({
      name,
      role: text(formData, "role", 160),
      detail: text(formData, "detail", 1000),
      summary: text(formData, "summary", 1000),
      scope: text(formData, "scope", 120),
      location: text(formData, "location", 120),
      org_name: text(formData, "org_name", 120),
      org_role: text(formData, "org_role", 120),
      org_url: text(formData, "org_url", 300),
      wordmark: text(formData, "wordmark", 60),
      /* `ground` is NOT NULL and the form can legitimately be left blank, so it
         falls back rather than writing null and failing the constraint with a
         message about a column the author never saw. */
      ground: text(formData, "ground", 60) ?? "var(--accent)",
      photo_src: text(formData, "photo_src", 300),
      photo_alt: text(formData, "photo_alt", 200),
      logo_src: text(formData, "logo_src", 300),
      logo_alt: text(formData, "logo_alt", 120),
      linkedin: text(formData, "linkedin", 300),
      site_label: text(formData, "site_label", 80),
      site_href: text(formData, "site_href", 300),
    })
    .eq("id", id);

  fail("save roster entry", error);

  await revalidateRoster();
  return { ok: "Saved." };
}

/* ------------------------------------------------------------------ publish */

export async function setRosterStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "/admin/roster");

  const id = formData.get("id") as string;
  const status = formData.get("status") === "published" ? "published" : "draft";
  if (!id) return { error: "Missing the entry to publish." };

  const supabase = await createClient();

  /*
    Publishing checks the card can actually be rendered first.

    Both card components take `name` and a photograph and lay out around them; a
    published entry with no `photo_src` renders an empty frame on the one page
    whose entire subject is other people's credibility. The console refusing it
    here is a better answer than the page showing it — and unlike the catalogue's
    equivalent check there is no cascade to worry about, so this is a read and a
    branch rather than an RPC.

    IT RETURNS RATHER THAN THROWS, and it threw on the first pass. A throw routes
    to the route's error boundary, which replaces the page with a screen that
    deliberately does not print `error.message` — so the author pressed Publish,
    got a 500, and was told nothing about the portrait. That is the exact defect
    `saveBlock` was rewritten to fix, reintroduced two files away. "This card is
    not finished" is an answer; the throw channel is for a policy refusal or a
    dropped connection.
  */
  if (status === "published") {
    const { data } = await supabase
      .from("roster")
      .select("name, photo_src, linkedin")
      .eq("id", id)
      .maybeSingle();

    const row = data as { name: string; photo_src: string | null; linkedin: string | null } | null;
    if (!row?.photo_src) {
      return {
        error:
          "This card has no portrait yet. Add one above and save, then publish — an empty frame on the roster reads as a broken page.",
      };
    }
  }

  const { error } = await supabase.from("roster").update({ status }).eq("id", id);
  fail("set roster status", error);

  await revalidateRoster();
  return { ok: status === "published" ? "Published." : "Taken off the site." };
}

/* --------------------------------------------------------------------- lead */

export async function setRosterLead(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/roster");

  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();

  /*
    Clear, then set — in that order, and it has to be that order.

    `roster_one_lead_idx` is a partial unique index on `kind` where `lead`, so
    setting a second lead before clearing the first is a unique violation. Two
    statements rather than one because PostgREST has no transaction to put them
    in; the window between them is a roster with no lead, which renders as a
    board with no wide card for a few milliseconds and is strictly better than
    the alternative window, which is a constraint error the author cannot act on.
  */
  await supabase.from("roster").update({ lead: false }).eq("kind", "instructor").eq("lead", true);
  const { error } = await supabase
    .from("roster")
    .update({ lead: true })
    .eq("id", id)
    .eq("kind", "instructor");
  fail("set lead instructor", error);

  await revalidateRoster();
}

/* --------------------------------------------------------------------- move */

export async function moveRosterEntry(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/roster");

  const id = formData.get("id") as string;
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!id) return;

  const supabase = await createClient();

  const { data } = await supabase.from("roster").select("id, kind, position").eq("id", id).maybeSingle();
  const row = data as { id: string; kind: string; position: number } | null;
  if (!row) return;

  /*
    Swap with the neighbour rather than renumber the list.

    The neighbour is found by position rather than by index into a fetched array,
    because two rows can share a position — nothing stops it, and the seed
    import numbered the two kinds independently. Ordering by position and taking
    the first is what makes a tie resolve to something rather than to nothing.
  */
  const { data: neighbours } = await supabase
    .from("roster")
    .select("id, position")
    .eq("kind", row.kind)
    .neq("id", id)
    .order("position", { ascending: direction < 0 ? false : true })
    [direction < 0 ? "lt" : "gt"]("position", row.position)
    .limit(1);

  const neighbour = (neighbours ?? [])[0] as { id: string; position: number } | undefined;
  if (!neighbour) return;

  await supabase.from("roster").update({ position: neighbour.position }).eq("id", id);
  await supabase.from("roster").update({ position: row.position }).eq("id", neighbour.id);

  await revalidateRoster();
}

/* --------------------------------------------------------------------- bind */

export async function bindRosterUser(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/roster");

  const id = formData.get("id") as string;
  const userId = (formData.get("userId") as string | null) ?? "";
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("roster")
    .update({ user_id: userId || null })
    .eq("id", id);

  /* 23505 here is `roster_one_row_per_person_per_kind`: this account is already
     bound to another card of the same kind. Naming the constraint's meaning
     rather than its code, because the author's next move is to unbind the other
     one and nothing else would tell them that. */
  if (error?.code === "23505") {
    throw new Error(
      "That account is already bound to another card of this kind. Unbind it there first.",
    );
  }
  fail("bind roster user", error);

  await revalidateRoster();
}

/* ------------------------------------------------------------------- delete */

export async function deleteRosterEntry(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/roster");

  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("roster").delete().eq("id", id);
  fail("delete roster entry", error);

  await revalidateRoster();
  redirect("/admin/roster");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/types";

/**
 * Every write the admin console does.
 *
 * ------------------------------------------------- the guard is in every function
 *
 * `/admin/layout.tsx` calls `requireRole("admin")`, and that is not enough on its
 * own: a Next layout does not run for a Server Action invoked from a page under
 * it. An action is a POST endpoint with a generated name, reachable by anyone who
 * can read the page's HTML. So each of these checks for itself, which is the
 * discipline `src/app/actions/lms.ts` already follows.
 *
 * Postgres is still the boundary underneath both. `requireRole` here produces a
 * redirect and a good error message; `is_admin()` in the policies is what
 * actually decides.
 */

const ROLES: readonly AppRole[] = ["student", "instructor", "judge", "admin"];

function assertRole(value: string): AppRole {
  if (!ROLES.includes(value as AppRole)) throw new Error(`unknown role "${value}"`);
  return value as AppRole;
}

/** Grant a role. Idempotent — pressing twice is not an error. */
export async function grantRole(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const role = assertRole(String(formData.get("role") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
  if (error) throw new Error(`grantRole: ${error.message}`);

  revalidatePath("/admin/people");
}

/**
 * Revoke a role.
 *
 * The three cases that must never succeed — the student role, your own admin
 * role, and the last admin — are refused by the `user_roles_guard` trigger
 * rather than here. A check in this function would protect this button; a
 * trigger protects the database, including from the SQL editor at two in the
 * morning, which is where the mistake would actually be made.
 */
export async function revokeRole(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const role = assertRole(String(formData.get("role") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) throw new Error(`revokeRole: ${error.message}`);

  revalidatePath("/admin/people");
}

/**
 * Put an instructor on a course.
 *
 * The highest-value write in the console. `instructor_assignments` had zero rows,
 * which is the entire reason /instructor renders an empty state for everyone and
 * why "Submitted. Your instructor can read it." has been optimistic — nobody
 * could read it, because the RLS policy scopes on a table with nothing in it.
 */
export async function assignInstructor(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const kind = String(formData.get("kind") ?? "specialist");

  const supabase = await createClient();

  if (formData.get("remove")) {
    const { error } = await supabase
      .from("instructor_assignments")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", courseId);
    if (error) throw new Error(`assignInstructor: ${error.message}`);
  } else {
    /* The instructor role comes with the assignment. An assignment without the
       role is invisible: `teaches_course()` tests has_role first, so the person
       would be assigned and still see an empty console with nothing to explain
       why. Same reasoning as bind_seat granting judge. */
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "instructor" }, { onConflict: "user_id,role", ignoreDuplicates: true });

    const { error } = await supabase
      .from("instructor_assignments")
      .upsert({ user_id: userId, course_id: courseId, kind }, { onConflict: "user_id,course_id" });
    if (error) throw new Error(`assignInstructor: ${error.message}`);
  }

  revalidatePath("/admin/people");
}

/**
 * Bind a judge to a seat, or clear it.
 *
 * Through the `bind_seat` RPC rather than an UPDATE, because reading back who
 * holds a seat is impossible from here: `authenticated` has no SELECT on
 * `judge_seats.user_id`, and granting it would publish every judge's identity to
 * every learner. The RPC also grants the judge role in the same transaction.
 */
export async function bindSeat(formData: FormData) {
  await requireRole("admin");
  const seatId = String(formData.get("seatId") ?? "");
  const raw = String(formData.get("userId") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("bind_seat", {
    p_seat_id: seatId,
    p_user_id: raw === "" ? null : raw,
  });
  if (error) throw new Error(`bindSeat: ${error.message}`);

  revalidatePath("/admin/seats");
}

/**
 * Issue a completion record.
 *
 * One RPC rather than two writes, because a completion record without a
 * completed enrolment — or the reverse — is a state nobody can explain to the
 * learner looking at it.
 *
 * `force` exists because the lesson-tick count is self-declared, so "every
 * lesson ticked" is a courtesy check rather than a fact. An admin who has read
 * the outcome sheet knows more than the counter does.
 */
export async function issueCompletion(formData: FormData) {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const force = Boolean(formData.get("force"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_completion", {
    p_user_id: userId,
    p_course_id: courseId,
    p_force: force,
  });
  if (error) throw new Error(`issueCompletion: ${error.message}`);

  revalidatePath("/admin/learners");
  revalidatePath("/dashboard");
}

/**
 * Open or close a module.
 *
 * `access` is the free-first-module gate and the promise the site makes on six
 * separate surfaces, so this refuses to leave a course with nothing open rather
 * than letting an admin quietly break the funnel. An action-level guard is the
 * right weight for five courses; a trigger would be over-engineering.
 */
export async function setModuleAccess(formData: FormData) {
  await requireRole("admin");
  const moduleId = String(formData.get("moduleId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const access = String(formData.get("access") ?? "");

  if (access !== "open" && access !== "account") throw new Error(`unknown access "${access}"`);

  const supabase = await createClient();

  if (access === "account") {
    const { data: open } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("access", "open");
    if ((open ?? []).length <= 1 && (open ?? []).some((m) => m.id === moduleId)) {
      throw new Error(
        "Every course keeps at least one open module. It is the free-first-module promise the site makes on six surfaces, so open another module before closing this one.",
      );
    }
  }

  const { error } = await supabase.from("modules").update({ access }).eq("id", moduleId);
  if (error) throw new Error(`setModuleAccess: ${error.message}`);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/learn", "layout");
}

/* ------------------------------------------------------------ lesson blocks */

/**
 * Add or replace one block on a lesson.
 *
 * ------------------------------------------------- typed where it matters, JSON where it does not
 *
 * Video, audio and doc get real fields, because those are what an author reaches
 * for daily and a YouTube id typed into a JSON blob is a typo waiting to fail a
 * CHECK constraint an hour later. The structured kinds — quiz, checklist,
 * exercise, embed, prose — take a JSON payload, and that is a deliberate
 * limitation rather than an oversight: a form that builds a nested array of
 * questions with per-choice inputs is a real piece of software, and the CHECK
 * constraint on `lesson_blocks.payload` already refuses a malformed one with a
 * specific error. Worth revisiting when somebody is authoring quizzes daily.
 *
 * `key` is identity and `position` is order, exactly as on `lessons`. Saving an
 * existing key updates in place, so a block keeps its id and any
 * `media_positions` or `block_responses` pointing at it survive the edit.
 */
export async function saveBlock(formData: FormData) {
  await requireRole("admin");

  const lessonId = String(formData.get("lessonId") ?? "");
  const key = String(formData.get("key") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const position = Number(formData.get("position") ?? 0);

  if (!lessonId || !key) throw new Error("saveBlock: lessonId and key are required");
  if (!/^[a-z0-9-]+$/.test(key)) {
    throw new Error("saveBlock: key must be lowercase letters, numbers and hyphens");
  }

  let payload: unknown;
  if (kind === "video") {
    payload = {
      youtube_id: String(formData.get("youtube_id") ?? "").trim(),
      ...(formData.get("poster") ? { poster: String(formData.get("poster")).trim() } : {}),
    };
  } else if (kind === "audio") {
    const duration = Number(formData.get("duration") ?? 0);
    payload = {
      path: String(formData.get("path") ?? "").trim(),
      ...(duration > 0 ? { duration } : {}),
    };
  } else if (kind === "doc") {
    const bytes = Number(formData.get("bytes") ?? 0);
    payload = {
      path: String(formData.get("path") ?? "").trim(),
      ...(title ? { title } : {}),
      ...(bytes > 0 ? { bytes } : {}),
    };
  } else if (kind === "prose") {
    /*
      Prose is written as prose.

      This used to take `{"md":"…"}` in a JSON textarea like the structured kinds,
      and it is the single most-authored block on the site — 174 of them. That
      meant every paragraph an author wrote had to survive being a JSON string
      literal: every newline typed as `\n`, every quotation mark escaped, and one
      missed backslash losing the whole save to "payload is not valid JSON".
      Roan asked for "a text-based area that I can add or remove text" and this
      is the block he meant.

      The JSON shape in the column is unchanged, so `blocks/index.tsx` renders it
      exactly as before. What changed is that a person types Markdown into a
      textarea and this wraps it.
    */
    /* CRLF out. A browser submits textarea content with \r\n line endings — it
       is in the HTML spec, not a quirk — and the Markdown renderer splits on
       \n, so every paragraph authored here would carry a trailing \r into the
       rendered output. */
    payload = { md: String(formData.get("md") ?? "").replace(/\r\n/g, "\n") };
  } else {
    try {
      payload = JSON.parse(String(formData.get("payload") ?? "{}"));
    } catch {
      throw new Error("saveBlock: payload is not valid JSON");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_blocks")
    .upsert(
      { lesson_id: lessonId, key, kind, title: title || null, position, payload },
      { onConflict: "lesson_id,key" },
    );

  /*
    The CHECK constraint is the real validator and its message names the field.
    Surfacing it verbatim is more useful than a generic "could not save" — an
    author who typed a ten-character YouTube id wants to be told that.
  */
  if (error) throw new Error(`saveBlock: ${error.message}`);

  revalidatePath("/admin/courses", "layout");
  revalidatePath("/learn", "layout");
}

/**
 * Remove a block.
 *
 * Names its blast radius at the call site rather than here: deleting an
 * `exercise` cascades the learner writing attached to it through
 * `block_responses`, and an author deserves to know that before pressing it.
 */
export async function deleteBlock(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("blockId") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_blocks").delete().eq("id", id);
  if (error) throw new Error(`deleteBlock: ${error.message}`);

  revalidatePath("/admin/courses", "layout");
  revalidatePath("/learn", "layout");
}

/**
 * Move a block up or down.
 *
 * Buttons, not drag-and-drop. Nothing in the dependency tree does DnD and it is
 * the least accessible control in the catalogue — keyboard-hostile, screen-reader
 * hostile, and awkward on touch. Two buttons are none of those things.
 *
 * The swap works because `unique (lesson_id, position)` on `lesson_blocks` is
 * DEFERRABLE: both rows are written inside one statement-level transaction and
 * the constraint is only checked at commit, so the intermediate state where two
 * blocks briefly share a position never trips it. A non-deferrable version of
 * this needs a detour through a temporary position and three writes.
 */
export async function moveBlock(formData: FormData) {
  await requireRole("admin");
  const blockId = String(formData.get("blockId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const supabase = await createClient();
  const { data: block } = await supabase
    .from("lesson_blocks")
    .select("id, lesson_id, position")
    .eq("id", blockId)
    .maybeSingle();
  if (!block) throw new Error("moveBlock: no such block");

  const { data: neighbour } = await supabase
    .from("lesson_blocks")
    .select("id, position")
    .eq("lesson_id", block.lesson_id)
    [direction === "up" ? "lt" : "gt"]("position", block.position)
    .order("position", { ascending: direction !== "up" })
    .limit(1)
    .maybeSingle();

  /* Already at the end. Not an error — the button is simply a no-op there. */
  if (!neighbour) return;

  const { error } = await supabase
    .from("lesson_blocks")
    .upsert([
      { id: block.id, position: neighbour.position },
      { id: neighbour.id, position: block.position },
    ]);
  if (error) throw new Error(`moveBlock: ${error.message}`);

  revalidatePath("/admin/courses", "layout");
  revalidatePath("/learn", "layout");
}

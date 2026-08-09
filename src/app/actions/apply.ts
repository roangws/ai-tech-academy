"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationTrack } from "@/lib/supabase/types";

/**
 * Applying to teach, and applying to judge.
 *
 * ------------------------------------------------------- the guard is in here
 *
 * `requireUser` in every function, not only in the page. A Server Action is a
 * POST endpoint with a generated name, reachable by anyone who can read the
 * page's HTML, and a layout does not run for one. src/app/actions/admin.ts has
 * the same note and follows the same rule.
 *
 * Postgres is the boundary underneath: `applications_own` decides which row this
 * can touch and `applications_guard` decides which fields and which transitions.
 * Nothing below re-implements either. What it does do is fail early with a
 * sentence a person can act on, because a CHECK constraint's message is not one.
 *
 * ---------------------------------------------------------------- two writes
 *
 * Saving and submitting are one function and two statements, and they have to
 * be two. The insert guard forces a new row to 'draft', which is deliberate --
 * a row cannot be created already submitted -- so a first-time applicant
 * pressing Submit would otherwise write a draft and watch nothing happen. The
 * content is upserted first, then the status is moved. If the second statement
 * fails the answers are still saved, which is the right way round.
 */

export type ApplyState = { error?: string; ok?: string; submitted?: boolean } | null;

const TRACKS: readonly ApplicationTrack[] = ["instructor", "judge"];

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Trim, cap, and turn an empty string into a null the column can hold. */
function text(form: FormData, name: string, max: number): string | null {
  const value = ((form.get(name) as string | null) ?? "").trim().slice(0, max);
  return value || null;
}

function checkbox(form: FormData, name: string): boolean {
  return form.get(name) === "on" || form.get(name) === "true";
}

/**
 * A URL the reviewer can open, or nothing.
 *
 * Somebody typing `linkedin.com/in/name` means `https://linkedin.com/in/name`,
 * and the column's CHECK does not agree — so the fix belongs here, where the
 * intent is legible, rather than in a constraint that would have to be loosened
 * for it. A value that is still not a URL after this is returned as an error
 * rather than silently dropped: an application missing its one link is the
 * application the board cannot check.
 */
function url(form: FormData, name: string, max: number): string | null | false {
  const raw = ((form.get(name) as string | null) ?? "").trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return parsed.toString().slice(0, max);
  } catch {
    return false;
  }
}

export async function saveApplication(_prev: ApplyState, form: FormData): Promise<ApplyState> {
  const track = String(form.get("track") ?? "") as ApplicationTrack;
  if (!TRACKS.includes(track)) return { error: "Unknown application track." };

  const viewer = await requireUser(`/apply/${track}`);
  const supabase = await createClient();

  const submitting = form.get("intent") === "submit";

  const fullName = ((form.get("full_name") as string | null) ?? "").trim().slice(0, 160);
  const linkedin = url(form, "linkedin_url", 300);
  const site = url(form, "site_url", 300);
  const sample = url(form, "sample_url", 300);

  if (linkedin === false) return { error: "That LinkedIn address is not a link we can open." };
  if (site === false) return { error: "That website address is not a link we can open." };
  if (sample === false) return { error: "That sample address is not a link we can open." };
  if (linkedin && !/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(linkedin)) {
    return { error: "The LinkedIn field wants a linkedin.com profile address." };
  }

  /*
    Checked here AND on the bucket AND by the column's CHECK. The bucket is the
    one that counts, because a direct upload to the storage API never runs this
    function; failing here first turns a 413 from an API nobody has heard of into
    a sentence about the file being too big. actions/profile.ts has the long
    version of this note.
  */
  const file = form.get("photo");
  let photoUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { error: "That image is over 2MB. Try a smaller one." };
    if (!TYPES.has(file.type)) return { error: "Images only: PNG, JPEG, WebP or GIF." };

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    /* The folder name IS the access control: the storage policy requires the
       first path segment to equal auth.uid(). The id comes from the session, so
       this cannot be pointed at anyone else's folder even in principle. */
    const key = `${viewer.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(key, file, { contentType: file.type, upsert: false });
    if (upErr) return { error: `Upload failed: ${upErr.message}` };

    photoUrl = supabase.storage.from("avatars").getPublicUrl(key).data.publicUrl;

    /*
      ONE PHOTOGRAPH PER PERSON, not two.

      The portrait uploaded here also becomes the account's avatar. The
      alternative is a second picture that can disagree with the one in the
      header, and an applicant who changes their photo in /account and cannot
      work out why the board still has the old one. The application keeps its
      own copy of the URL because it is a document submitted on a date, but both
      point at the same object.
    */
    await supabase.from("profiles").update({ avatar_url: photoUrl }).eq("id", viewer.id);
  }

  const patch: Record<string, unknown> = {
    user_id: viewer.id,
    track,
    full_name: fullName,
    headline: text(form, "headline", 200),
    org: text(form, "org", 160),
    location: text(form, "location", 160),
    linkedin_url: linkedin,
    site_url: site,
    phone: text(form, "phone", 40),
    whatsapp: text(form, "whatsapp", 40),
    course_id: text(form, "course_id", 40),
    focus: text(form, "focus", 400),
    evidence: text(form, "evidence", 4000),
    sample_url: sample,
    in_person: checkbox(form, "in_person"),
    in_person_city: text(form, "in_person_city", 120),
    reviews_curriculum: checkbox(form, "reviews_curriculum"),
    notes: text(form, "notes", 4000),
  };

  /* Only when a new file arrived. Sending `photo_url: null` on every save would
     clear the portrait of anybody who edits a draft without re-picking a file. */
  if (photoUrl) patch.photo_url = photoUrl;

  const { error } = await supabase
    .from("applications")
    .upsert(patch, { onConflict: "user_id,track" });
  if (error) return { error: error.message };

  if (!submitting) {
    revalidatePath(`/apply/${track}`);
    return { ok: "Saved. Nothing has been sent yet." };
  }

  /*
    The required three are checked here as well as in the guard, and the two
    messages are different on purpose. The guard's exists because the database
    is the boundary and a submitted application missing a phone number is
    unusable to the board however it got there. This one exists because it can
    name the field.
  */
  if (!fullName) return { error: "Your name, as the board should read it." };
  if (!patch.phone) return { error: "A phone number, so somebody can call you." };
  if (!patch.evidence) return { error: "The evidence section is the application. It cannot be empty." };

  const { error: submitErr } = await supabase
    .from("applications")
    .update({ status: "submitted" })
    .eq("user_id", viewer.id)
    .eq("track", track);
  if (submitErr) return { error: submitErr.message };

  revalidatePath(`/apply/${track}`);
  return { ok: "Submitted to the advisory board.", submitted: true };
}

/**
 * Pull an application back.
 *
 * The replacement for a delete, which is revoked at the table. An application
 * that can be deleted is a queue entry that can vanish between the board reading
 * it and answering it; withdrawing says the same thing to the applicant and
 * leaves the board something to answer.
 */
export async function withdrawApplication(form: FormData) {
  const track = String(form.get("track") ?? "") as ApplicationTrack;
  if (!TRACKS.includes(track)) throw new Error("unknown application track");

  const viewer = await requireUser(`/apply/${track}`);
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("user_id", viewer.id)
    .eq("track", track);
  if (error) throw new Error(`withdrawApplication: ${error.message}`);

  revalidatePath(`/apply/${track}`);
}

/** Back to a draft, which is the only reopening the guard allows. */
export async function reopenApplication(form: FormData) {
  const track = String(form.get("track") ?? "") as ApplicationTrack;
  if (!TRACKS.includes(track)) throw new Error("unknown application track");

  const viewer = await requireUser(`/apply/${track}`);
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({ status: "draft" })
    .eq("user_id", viewer.id)
    .eq("track", track);
  if (error) throw new Error(`reopenApplication: ${error.message}`);

  revalidatePath(`/apply/${track}`);
}

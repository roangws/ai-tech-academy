import { createClient } from "@/lib/supabase/server";

/**
 * The one place a stored path becomes something a browser can fetch.
 *
 * ------------------------------------------------------- paths, never URLs
 *
 * `lesson_blocks.payload` stores `audio/gtm/04-account-brief.mp3`, not
 * `https://<project>.supabase.co/storage/v1/object/public/course-media/audio/...`.
 * Everything that follows from that is the point: a bucket can move between
 * public and private, the project can move behind a CDN, and the storage host
 * can change, and each of those is an edit to this file rather than a migration
 * over every row that mentions it.
 *
 * The counter-example is in this repo. `profiles.avatar_url` stores a resolved
 * public URL, so `src/app/actions/profile.ts` has to `indexOf("/avatars/")` and
 * slice the path back out of it in order to delete the object it replaced. That
 * is what storing a URL costs, and it is cheap to avoid here.
 *
 * ------------------------------------------------------ the path names its bucket
 *
 * The first segment routes it, so nothing needs to carry a bucket name
 * alongside a path:
 *
 *   audio/<courseId>/<file>    course-media  public
 *   posters/<courseId>/<file>  course-media  public
 *   docs/<courseId>/<file>     course-docs   private, signed per render
 *
 * The second segment is the course id, which is what the storage write policies
 * scope on via `teaches_course()` — the same trick the avatars bucket plays with
 * the first segment being the user id. The path is access control, not decoration.
 */

const PUBLIC_PREFIXES = ["audio/", "posters/"] as const;
const PRIVATE_PREFIXES = ["docs/"] as const;

/** How long a document link lives. Long enough to read, short enough to not be a share. */
const DOC_URL_TTL_SECONDS = 60 * 60;

export function bucketFor(path: string): "course-media" | "course-docs" | null {
  if (PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return "course-media";
  if (PRIVATE_PREFIXES.some((p) => path.startsWith(p))) return "course-docs";
  return null;
}

/**
 * A public object's URL, built rather than fetched.
 *
 * `getPublicUrl` is a pure string concatenation in supabase-js — it makes no
 * request — but it still needs a client instance, and this is called once per
 * audio block on a page that may be rendered for a signed-out reader. Building
 * it from the env var keeps this synchronous and dependency-free.
 *
 * Returns null rather than a broken URL for a path in the private bucket, so a
 * caller that reaches for the wrong helper fails visibly instead of rendering a
 * link that 400s.
 */
export function publicMediaUrl(path: string): string | null {
  if (bucketFor(path) !== "course-media") return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base.replace(/\/$/, "")}/storage/v1/object/public/course-media/${path}`;
}

/**
 * Signed URLs for private documents, in one round trip.
 *
 * Batched deliberately. A lesson with four attachments should cost one request,
 * not four, and `createSignedUrls` takes the whole list — the plural is easy to
 * miss and the singular in a `.map()` is the obvious wrong version of this.
 *
 * A path that fails to sign is omitted from the map rather than throwing. One
 * bad attachment should cost that attachment, not the lesson.
 */
export async function signDocUrls(
  paths: readonly string[],
): Promise<Map<string, string>> {
  const wanted = paths.filter((p) => bucketFor(p) === "course-docs");
  const signed = new Map<string, string>();
  if (wanted.length === 0) return signed;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("course-docs")
    .createSignedUrls([...wanted], DOC_URL_TTL_SECONDS);

  if (error || !data) return signed;

  for (const row of data) {
    /* `path` comes back without the bucket prefix and matches what was sent.
       `signedUrl` is null on a per-object failure, which is why this is a filter
       rather than a straight zip. */
    if (row.path && row.signedUrl) signed.set(row.path, row.signedUrl);
  }
  return signed;
}

/** Bytes as something a human reads before deciding to download. */
export function fileSize(bytes: number | undefined): string | null {
  if (!bytes || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Seconds as a timecode.
 *
 * Hours only appear when there are hours, so a 12-minute episode reads "12:04"
 * rather than "0:12:04". Used by the audio transport and by chapter buttons.
 */
export function timecode(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * The same duration, spoken.
 *
 * A screen reader announcing an `aria-valuetext` of "743" tells a listener
 * nothing. This is what goes in the scrubber instead.
 */
export function spokenDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (seconds || !minutes) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/**
 * Formatting helpers that both sides of the boundary need.
 *
 * These live apart from `lib/lms/media.ts` for one concrete reason: that module
 * imports the Supabase server client, which imports `next/headers`, and pulling
 * a timecode formatter into the audio player therefore dragged `next/headers`
 * into a client bundle and failed the build outright.
 *
 * Nothing here touches a request, a cookie or an environment variable, so it is
 * safe on the server and in the browser. Anything that resolves a storage path
 * belongs in media.ts, not here.
 */

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
 * rather than "0:12:04".
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

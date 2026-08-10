/**
 * Wall clocks and instants, for anything scheduled in a named zone.
 *
 * ------------------------------------------------------------------ the problem
 *
 * `<input type="datetime-local">` yields "2026-09-12T09:00" — a wall clock with
 * no zone on it. `new Date("2026-09-12T09:00")` reads that in the *runtime's*
 * zone, which on Vercel is UTC. So an administrator in California typing 9am for
 * a hackathon lands 9am UTC, and every judge is told to turn up at 2 in the
 * morning. This is the same class of defect as the enrol button announcing
 * tomorrow's start date from mid-afternoon Pacific, and it is worse here: a
 * course start date being a day out is embarrassing, an event time being eight
 * hours out means nobody comes.
 *
 * The zone that matters is the EVENT's, not the server's and not the reader's. A
 * hackathon in Berlin starts at 9am in Berlin whoever is looking at it, so
 * `judge_events.timezone` carries an IANA name and both directions go through it.
 *
 * -------------------------------------------------------------- how it works
 *
 * There is no platform API for "what instant is this wall clock in this zone" —
 * `Intl` only goes the other way. The standard trick is to go the other way
 * twice: read the naive string as if it were UTC, ask `Intl` what that instant
 * looks like in the target zone, and the difference between the two is the
 * offset to subtract.
 *
 * The second pass is not optional. It exists for the ~2 hours a year when the
 * offset the first pass measured is not the offset in force at the answer — a
 * wall clock an hour after a DST transition, where the guess lands on the other
 * side of it. Without the correction those events are an hour out; with it they
 * are exact everywhere except inside the skipped hour itself, which is not a
 * wall clock that exists and which the browser's own picker will happily accept.
 *
 * `Temporal` deletes this whole file when it is available everywhere. It is not
 * yet, and a date library for one form field is not a trade worth making.
 */

/** Milliseconds `tz` is ahead of UTC at this instant. */
function offsetAt(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    /* `hourCycle: "h23"` rather than `hour12: false`, which yields "24" for
       midnight in some ICU builds and parses as the next day. */
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const at = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const asIfUtc = Date.UTC(
    Number(at("year")),
    Number(at("month")) - 1,
    Number(at("day")),
    Number(at("hour")),
    Number(at("minute")),
    Number(at("second")),
  );

  return asIfUtc - instant.getTime();
}

/**
 * A `datetime-local` value read as a wall clock in `tz`, as an ISO instant.
 *
 * Returns null for an empty or unparseable string, so an optional field left
 * blank stays null rather than becoming 1970.
 */
export function wallClockToInstant(value: string | null | undefined, tz: string): string | null {
  const naive = (value ?? "").trim();
  if (!naive) return null;

  /* Seconds are optional in what the picker submits. */
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(naive) ? `${naive}:00` : naive;
  const guess = new Date(`${withSeconds}Z`);
  if (Number.isNaN(guess.getTime())) return null;

  const first = new Date(guess.getTime() - offsetAt(guess, tz));
  const corrected = new Date(guess.getTime() - offsetAt(first, tz));
  return corrected.toISOString();
}

/** The reverse, for putting a stored instant back into the form that wrote it. */
export function instantToWallClock(iso: string | null | undefined, tz: string): string {
  if (!iso) return "";
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";
  const shifted = new Date(instant.getTime() + offsetAt(instant, tz));
  /* `toISOString` on the shifted instant reads the wall clock back out. */
  return shifted.toISOString().slice(0, 16);
}

/**
 * An instant, written the way somebody reads a calendar invitation.
 *
 * The zone abbreviation is always printed. A time with no zone beside it is the
 * thing this file exists to stop.
 */
export function formatEventTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

/** Just the date, for a deadline where the hour is noise. */
export function formatEventDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * The zones the console offers.
 *
 * A short list rather than the full IANA database: a `<select>` with 400 options
 * is a worse control than a text field, and this is the set the school and its
 * partners actually run events in. The column takes any IANA name, so adding one
 * is a line here rather than a migration.
 */
export const EVENT_ZONES: readonly { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific — Los Angeles" },
  { value: "America/Denver", label: "Mountain — Denver" },
  { value: "America/Chicago", label: "Central — Chicago" },
  { value: "America/New_York", label: "Eastern — New York" },
  { value: "America/Sao_Paulo", label: "Brazil — São Paulo" },
  { value: "Europe/London", label: "United Kingdom — London" },
  { value: "Europe/Berlin", label: "Central Europe — Berlin" },
  { value: "Asia/Dubai", label: "Gulf — Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo" },
  { value: "Australia/Sydney", label: "Australia — Sydney" },
  { value: "UTC", label: "UTC" },
];

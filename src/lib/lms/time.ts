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
 * Returns null for anything that is not a complete wall clock, so an optional
 * field left blank stays null rather than becoming 1970.
 *
 * ------------------------------------------------------------- what it rejects
 *
 * The shape is checked rather than handed to `new Date`, and that is a fix, not
 * decoration. The first version only used the regex to decide whether to append
 * `:00` and passed everything else through, so `"2026-09-12"` — a plausible
 * hand-rolled POST, and what some pickers submit when the time is left empty —
 * parsed as `2026-09-12T00:00Z` and silently created a midnight event instead of
 * returning the "needs a start date and time" answer the form is written to give.
 *
 * ---------------------------------------------------- the two hours a year
 *
 * Twice a year a local wall clock is not a single instant, and no amount of
 * arithmetic fixes that, because the input genuinely does not identify a moment:
 *
 *   * In the SKIPPED hour (spring forward) the wall clock never happens. This
 *     resolves it to a real instant either side of the gap, and which side
 *     depends on the sign of the zone's offset: 2:30am in Los Angeles comes back
 *     as 1:30 PST, an hour earlier than typed, while 2:30am in Berlin comes back
 *     as 3:30 CEST, an hour later. Measured, not assumed.
 *   * In the REPEATED hour (autumn back) the wall clock happens twice, and this
 *     always picks the first. So an event stored at the second 1:30am and then
 *     re-saved from the form, even with nothing changed, moves an hour earlier.
 *
 * Both are left as they are. `formatEventTime` prints the zone abbreviation
 * alongside every time, so the card always says which of the two it means, and
 * an administrator who lands on the wrong one can see it and move the event. The
 * alternative is carrying an explicit offset per event, which is real complexity
 * for an hour a year, on a school that has run no events in those hours yet.
 */
const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export function wallClockToInstant(value: string | null | undefined, tz: string): string | null {
  const naive = (value ?? "").trim();
  if (!WALL_CLOCK.test(naive)) return null;

  /* Seconds are optional in what the picker submits. */
  const withSeconds = naive.length === 16 ? `${naive}:00` : naive;
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
export function isEventZone(value: string): boolean {
  return EVENT_ZONES.some((z) => z.value === value);
}

export const EVENT_ZONES: readonly { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Sao_Paulo", label: "Brazil (São Paulo)" },
  { value: "Europe/London", label: "United Kingdom (London)" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Asia/Dubai", label: "Gulf (Dubai)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
  { value: "UTC", label: "UTC" },
];

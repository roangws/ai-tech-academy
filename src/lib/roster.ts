import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { instructors as instructorCopy, board as boardCopy, personCopy } from "@/lib/content";
import type { Person, Seat } from "@/lib/content";

/**
 * The instructor roster and the judge board, from Postgres.
 *
 * -------------------------------------------------- the same shapes, on purpose
 *
 * Every function here returns `Person[]` or `Seat[]` — the exact types
 * `content.ts` declares and `InstructorCard` and `BoardCard` already take. That
 * is the whole design: the two rosters moved from a TypeScript literal into a
 * table, and not one card component knows. It is the same trick `lib/catalog.ts`
 * plays for the course catalogue, and it works for the same reason: the type is
 * the contract, and where the rows come from is an implementation detail behind
 * it.
 *
 * The one thing that does NOT move is the copy around the lists — the headline,
 * the intro, the SEO description. Those are editorial, there is no console
 * behind them, and putting them in a table would mean a migration to fix a
 * comma. `instructors` and `board` in content.ts keep them, and this module
 * re-exports them beside the rows so a page has one import rather than two
 * halves of one idea.
 *
 * ---------------------------------------------------------- null is not absent
 *
 * Postgres gives back `null` for an unset column; the `Person` and `Seat` types
 * spell the same thing `undefined`, because that is what an absent key in an
 * object literal is. The difference matters here more than it usually does:
 * `role`, `detail`, `scope` and `org` are absent on real people BY POLICY —
 * content.ts spends four paragraphs on why a job title nobody supplied must
 * render as nothing rather than as a plausible sentence — and `role: null` in a
 * JSX expression renders nothing while `role: "null"` renders the word. So every
 * mapping below converts explicitly, and the optional objects (`org`, `photo`,
 * `site`) are built only when their required field is present rather than
 * assembled with holes in them.
 */

type RosterRow = {
  id: string;
  kind: "instructor" | "judge";
  user_id: string | null;
  name: string;
  role: string | null;
  detail: string | null;
  summary: string | null;
  scope: string | null;
  location: string | null;
  org_name: string | null;
  org_role: string | null;
  org_url: string | null;
  wordmark: string | null;
  ground: string;
  photo_src: string | null;
  photo_alt: string | null;
  logo_src: string | null;
  logo_alt: string | null;
  linkedin: string | null;
  site_label: string | null;
  site_href: string | null;
  lead: boolean;
  position: number;
  status: "draft" | "published";
};

/** A roster row with the admin-only fields the public types have no slot for. */
export type RosterEntry = RosterRow;

const COLUMNS =
  "id, kind, user_id, name, role, detail, summary, scope, location, org_name, org_role, org_url, wordmark, ground, photo_src, photo_alt, logo_src, logo_alt, linkedin, site_label, site_href, lead, position, status";

/**
 * The rows, ordered as the pages print them.
 *
 * `cache`d per request, because `/instructors` renders the band AND the page's
 * own grid AND the JSON-LD from the same list, and a page that queries three
 * times for one answer is how a static-feeling page becomes three round trips.
 *
 * Drafts are excluded by RLS rather than by a filter here — see the migration.
 * An admin reading this gets their drafts back, which is correct: the console
 * previews what it is editing.
 */
const allRows = cache(async (): Promise<RosterRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roster")
    .select(COLUMNS)
    .order("kind")
    .order("position");

  /*
    An empty list rather than a throw.

    These two rosters are decoration on pages that have other reasons to exist:
    the homepage still works with no instructor band, and a failed query here
    must not take down the whole marketing site. The pages below render their
    own empty state, and the error goes to the server log where somebody can act
    on it.
  */
  if (error) {
    console.error("roster read failed:", error.message);
    return [];
  }
  return (data ?? []) as RosterRow[];
});

function toPerson(r: RosterRow): Person {
  return {
    id: r.id,
    name: r.name,
    ...(r.role ? { role: r.role } : {}),
    ...(r.detail ? { detail: r.detail } : {}),
    ...(r.scope ? { scope: r.scope } : {}),
    /* Built only when there is a name to build it around. `org_role` and
       `org_url` are meaningless without one, and an object of three nulls is
       what makes a card print ", " with nothing either side of it. */
    ...(r.org_name
      ? {
          org: {
            name: r.org_name,
            ...(r.org_role ? { role: r.org_role } : {}),
            ...(r.org_url ? { url: r.org_url } : {}),
          },
        }
      : {}),
    ground: r.ground,
    ...(r.photo_src ? { photo: { src: r.photo_src, alt: r.photo_alt ?? r.name } } : {}),
    ...(r.logo_src ? { logo: { src: r.logo_src, alt: r.logo_alt ?? r.org_name ?? "" } } : {}),
    ...(r.lead ? { lead: true } : {}),
    ...(r.linkedin ? { linkedin: r.linkedin } : {}),
    ...(r.site_href && r.site_label ? { site: { label: r.site_label, href: r.site_href } } : {}),
    /*
      The two fields on a card that are editorial rather than columns.

      A book somebody wrote and the companies they have invested in are copy, not
      roster data — content.ts has the argument at `personCopy`, and the short
      version is that nullable columns and console fields to carry four
      hyperlinks is a schema built for a hypothetical. The join is on the profile
      URL, which is the only field on a row that identifies a specific person.

      `investments` is here because the move to a table dropped it silently: the
      field has existed on `Person` since the lead card was built, the table has
      no column for it, and a card renders the line only when it is present. So
      "Investor in …" came off the page with nothing failing. That is the second
      time this shape of bug has landed, and it is why the map is general.

      `linkedin` is checked before the lookup rather than let through as
      `undefined`: a row with no profile URL must not match an entry, and `find`
      comparing `undefined === undefined` would hand somebody else's book to the
      first person without one.

      No match is the normal case — four of the five have neither field — and the
      spread of an empty object leaves both keys absent, which is what the card's
      conditionals are written against.
    */
    ...(r.linkedin
      ? (() => {
          const copy = personCopy.find((c) => c.linkedin === r.linkedin);
          return {
            ...(copy?.book ? { book: copy.book } : {}),
            ...(copy?.investments?.length ? { investments: copy.investments } : {}),
          };
        })()
      : {}),
  };
}

function toSeat(r: RosterRow): Seat {
  return {
    id: r.id,
    name: r.name,
    /* `Seat.role`, `Seat.photo` and `Seat.linkedin` are REQUIRED in the type,
       and the table allows them to be null — the console has to be able to save
       a half-written card. The fallbacks here are what keeps a draft-in-progress
       from crashing the board rather than an invention: an empty string renders
       as nothing, and `#` is a link that goes nowhere rather than a guessed
       profile URL. A published card with holes is an authoring mistake the
       console shows; it is not this function's job to hide it. */
    role: r.role ?? "",
    ...(r.org_name ? { org: r.org_name } : {}),
    ...(r.location ? { location: r.location } : {}),
    ...(r.summary ? { summary: r.summary } : {}),
    ground: r.ground,
    photo: { src: r.photo_src ?? "", alt: r.photo_alt ?? r.name },
    ...(r.logo_src ? { logo: { src: r.logo_src, alt: r.logo_alt ?? r.org_name ?? "" } } : {}),
    ...(r.wordmark ? { wordmark: r.wordmark } : {}),
    linkedin: r.linkedin ?? "#",
  };
}

/**
 * Rows fit to be shown on a public page.
 *
 * ------------------------------------------------------- RLS is not the filter here
 *
 * `roster_read` grants an admin every row including drafts, which is right for
 * the console and wrong for `/instructors` and `/review-judge-board` — those are
 * public pages, and an admin reading one was being shown half-written cards that
 * no visitor can see. That is not a leak outward, it is worse in a quieter way:
 * the person responsible for the roster is the one person who cannot tell what
 * the roster looks like. QA caught it by creating a draft judge and finding it on
 * the live board.
 *
 * So the public readers filter explicitly, exactly as `getCatalog` does for
 * courses — RLS is the boundary, this is the view.
 *
 * The portrait check goes with it. `Seat.photo` is required by the type and the
 * cards lay out around it; `setRosterStatus` refuses to publish without one, so
 * this should never fire — but a row published before that check existed, or one
 * whose portrait was cleared afterwards, would otherwise reach `<Image src="">`,
 * which Next warns about and which renders as a broken frame on the one page
 * whose subject is other people's credibility.
 */
function publicRows(rows: RosterRow[], kind: RosterRow["kind"]): RosterRow[] {
  return rows.filter((r) => r.kind === kind && r.status === "published" && r.photo_src);
}

/** The instructor roster, lead first. */
export async function getInstructors(): Promise<Person[]> {
  const rows = publicRows(await allRows(), "instructor");
  /*
    The lead is first regardless of `position`, because both pages destructure
    `const [lead, ...specialists]` and render the head of the array into a
    different, wider card. Leaving that to hand-kept ordering means one
    mis-drag in the console turns a specialist into the lead card — a real
    person given a title they do not hold, which is the exact class of claim
    this roster is careful about everywhere else.
  */
  return rows
    .slice()
    .sort((a, b) => Number(b.lead) - Number(a.lead) || a.position - b.position)
    .map(toPerson);
}

/** The judge board, in the order the console set. */
export async function getJudges(): Promise<Seat[]> {
  return publicRows(await allRows(), "judge")
    .sort((a, b) => a.position - b.position)
    .map(toSeat);
}

/** Every row, both kinds, drafts included for an admin. For the console. */
export async function getRoster(kind?: "instructor" | "judge"): Promise<RosterEntry[]> {
  const rows = await allRows();
  return kind ? rows.filter((r) => r.kind === kind) : rows;
}

/** One row by id, drafts included for an admin. For the console's edit form. */
export async function getRosterEntry(id: string): Promise<RosterEntry | null> {
  return (await allRows()).find((r) => r.id === id) ?? null;
}

/**
 * The roster card bound to this account, if any.
 *
 * This is what the binding is FOR: the instructor console can say "you are
 * Aaron Jimenez, and this is your public card" rather than treating a signed-in
 * instructor as an anonymous holder of a role. Returns both kinds, because
 * somebody can be on both lists.
 */
export async function getMyRosterEntries(userId: string): Promise<RosterEntry[]> {
  return (await allRows()).filter((r) => r.user_id === userId);
}

/* The editorial copy around the lists stays in content.ts. Re-exported here so a
   page imports one module rather than reaching into two for one section. */
export const instructorCopySafe = instructorCopy;
export const boardCopySafe = boardCopy;

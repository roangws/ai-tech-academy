/**
 * Push the reference data from content.ts into Postgres: judge seats and the
 * rubric. The COURSE catalogue is no longer among them — see the note below.
 *
 *   node --env-file=.env.local scripts/seed-catalog.mjs
 *
 * ------------------------------------------------------------ why it exists
 *
 * content.ts is the source of truth for the catalog and the database holds a
 * structural mirror of it: five courses, forty modules, 173 lessons, six judge
 * seats. Writing that mirror out by hand would create a second copy of the same
 * facts that nothing keeps in step, and the first curriculum edit would silently
 * desynchronise a learner's progress from the course they are on.
 *
 * So it is derived, and re-derived. Run this after any curriculum change.
 *
 * ------------------------------------------------------- why the slug is the key
 *
 * The interesting problem here is that lessons have no natural key. They have a
 * name, and a name is what an author edits.
 *
 * The first version of this script deleted every lesson and re-inserted the set,
 * which is correct for the rows and catastrophic for everything pointing at
 * them: lesson_progress cascades from lesson_id, so re-seeding after fixing a
 * typo would delete every completion on the site. That version carried progress
 * across in a temp table keyed on (course, module, slot) and re-attached it
 * afterwards, which worked and was a lot of machinery to undo damage it had just
 * caused itself.
 *
 * The second version upserted on UNIQUE (module_id, position) and argued that
 * the slot had been the key the whole time. It is not, and the argument only
 * held because no lesson had yet been inserted anywhere but the end. A slot is a
 * position in a list, and every row below an insert moves. Upserting on the slot
 * after adding a lesson at index 1 writes lesson 2's content into lesson 1's
 * row, keeps that row's uuid, and hands every completion of the old lesson 1 to
 * whatever now sits there. It is silent, the counts stay plausible, and it is
 * unrecoverable after the fact because nothing recorded what the slots used to
 * mean.
 *
 * So lessons now carry an authored `slug`, unique within their module, and that
 * is the conflict target. It does not move when the list is reordered, which
 * makes `position` presentation and nothing more. A rename is still an UPDATE;
 * reordering is now free; inserting in the middle is now safe.
 *
 * The one case that still needs a delete is a lesson removed from content.ts.
 * That is the sweep at the bottom — `slug NOT IN (the module's slugs)` — and it
 * is the only place this script removes anything. A learner who had completed a
 * lesson that no longer exists loses that completion, which is the correct
 * outcome, and changing a slug is how an author says "this is a different
 * lesson now".
 *
 * ------------------------------------------------------------------- access
 *
 * The catalog tables are admin-write under RLS, so this needs a key that clears
 * that: SUPABASE_SERVICE_ROLE_KEY if it is set, which is what CI should use.
 * Falling back to the publishable key works only while a temporary seeding
 * policy is in place, and the script says so rather than failing with PostgREST's
 * "new row violates row-level security policy" and no explanation.
 */

import { createClient } from "@supabase/supabase-js";
import { board, instructors } from "../src/lib/content.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    "Missing credentials. Set NEXT_PUBLIC_SUPABASE_URL and one of\n" +
      "  SUPABASE_SERVICE_ROLE_KEY (preferred)\n" +
      "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (needs the temporary seeding policy)\n" +
      "Try: node --env-file=.env.local scripts/seed-catalog.mjs",
  );
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("! No service-role key. Falling back to the publishable key, which\n" +
               "  only works while the temporary seeding policy is applied.\n");
}

const db = createClient(url, key, { auth: { persistSession: false } });

/* PostgREST answers with an error object rather than throwing, so every call has
   to be checked. Doing it in one place keeps the steps below readable and means
   a failure names the step it happened in. */
async function run(label, promise) {
  const { data, error } = await promise;
  if (error) {
    console.error(`✗ ${label}\n  ${error.message}${error.hint ? `\n  hint: ${error.hint}` : ""}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
  return data;
}

/* --------------------------------------------------- courses live in Postgres
   Courses, modules, lessons and their scaffold blocks used to be pushed from
   here, because content.ts was the source of truth for the catalogue and the
   database held a mirror of it. That is the wrong way round for a product an
   instructor is meant to run, and it is no longer true: the catalogue IS the
   database, and the admin console is how it is edited.

   Re-adding a course seeder would recreate the exact problem this file's own
   header describes at length — two copies of the same facts, and nothing
   keeping them in step — only with the authoritative copy now being the one in
   code. What remains below is the reference data that genuinely still ships
   with the site: the judge seats and the rubric. */

/* -------------------------------------------------------------- judge seats */
/*
  Seat.reviews is a badge ("Course A") for five of the six seats and free text
  for the learning-design seat, which reads assessment across all five. The badge
  resolves to a course id where it resolves and stays null where it does not —
  and that null is load-bearing rather than missing data: holds_seat() reads a
  null reviews_course_id as "this seat covers every course", which is what that
  seat does.

  user_id is not written at all. Every seat on the site is unnamed today, because
  Seat.name "is absent until the person AND their employer clear it". Binding a
  person to a seat is an admin action, and leaving the column out of the upsert
  is what stops a re-seed from unbinding one that has been filled.
*/
/* The seats name the course they read by its BADGE ("Course A"), which is a
   column now rather than a literal, so this reads the live catalogue. */
const catalog = await run("read catalogue", db.from("courses").select("id, badge"));
const byBadge = new Map(catalog.map((c) => [c.badge, c.id]));

await run(
  `judge seats (${board.members.length})`,
  db.from("judge_seats").upsert(
    board.members.map((s, i) => ({
      id: s.id,
      seat: s.seat,
      reviews_course_id: byBadge.get(s.reviews) ?? null,
      reviews_label: s.reviews,
      checks: s.checks,
      ground: s.ground,
      position: i,
    })),
    { onConflict: "id" },
  ),
);

/* ---------------------------------------------------------- rubric criteria */
/*
  [FILL: rubric criteria] — the site names a rubric exactly once, as a lesson
  title at content.ts:1178, and never says what is on it. These four are a
  proposal and are labelled as one wherever they surface. They are derived from
  the only definition of completion the site does give, in the FAQ: "A course
  completes when your workflow runs live and you have measured it."

  Seeded identically for all five courses so one course can diverge later without
  a schema change. Existing rows are left alone — a judge who has re-weighted a
  criterion should not have that undone by a re-seed.
*/
const rubric = [
  ["Deployment verified", "The workflow runs in a working environment, not a demo.", 2],
  ["Measurement quality", "Before and after measure the same thing, the same way.", 2],
  ["Workflow durability", "It keeps running without the learner standing over it.", 1],
  ["Documentation", "Someone else on the team could pick it up.", 1],
];

const existing = await run("read back rubric", db.from("rubric_criteria").select("course_id, label"));
const have = new Set(existing.map((r) => `${r.course_id}/${r.label}`));
const missing = catalog.flatMap((c) =>
  rubric
    .map(([label, description, weight], i) => ({
      course_id: c.id, label, description, weight, position: i,
    }))
    .filter((r) => !have.has(`${r.course_id}/${r.label}`)),
);

if (missing.length) {
  await run(`rubric criteria (${missing.length} new)`, db.from("rubric_criteria").insert(missing));
} else {
  console.log("✓ rubric criteria (already present)");
}

/* ------------------------------------------------- instructor assignments */
/*
  [FILL: instructor to course mapping.]

  Nothing here is derivable, so nothing here is written. content.ts carries five
  people and, by policy, no `scope` on the four specialists, so there is no
  mapping in the data to seed from. src/lib/seo.ts:67 records the same gap in
  prose and is the reason courseJsonLd currently names one person as the
  instructor of all five courses.

  Printed rather than skipped silently, so the decision has somewhere to be made.
*/
const lead = instructors.people.find((p) => p.lead);
console.log("\n[FILL] instructor assignments — not seeded, nothing to derive from.");
console.log(`  Lead: ${lead?.name ?? "unknown"} — ${lead?.scope ?? "scope unset"} (needs an account, then five rows)`);
for (const p of instructors.people.filter((x) => !x.lead)) {
  console.log(`  Specialist: ${p.name} — ground ${p.ground}, no course in content.ts`);
}

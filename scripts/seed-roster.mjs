/**
 * Push the instructor roster and the judge board into `public.roster`, once.
 *
 *   node --env-file=.env.local scripts/seed-roster.mjs
 *
 * ------------------------------------------------------------- read this first
 *
 * THIS IS A ONE-WAY IMPORT, NOT A MIRROR, and that is the difference between it
 * and `seed-catalog.mjs`. The catalogue seeder is re-run after every curriculum
 * change because content.ts is still the source of truth for judge seats and the
 * rubric. This one runs once, to carry the two hand-written rosters across; from
 * then on the table is the truth and `/admin/roster` is how it is edited.
 *
 * Which is why every write here is `ignoreDuplicates`. Re-running it must not
 * overwrite an edit somebody made in the console — the whole point of the move
 * was that the console can change these people without a deploy, and a seeder
 * that quietly reverts to a TypeScript literal would take that back. New rows
 * land; existing rows are left exactly as they are.
 *
 * `user_id` is never written for the same reason it is never written by the
 * catalogue seeder: binding a roster card to an account is an admin action, and
 * including the column in the upsert is how a re-seed unbinds one.
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
    "Missing credentials. Try: node --env-file=.env.local scripts/seed-roster.mjs",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function run(label, promise) {
  const { data, error } = await promise;
  if (error) {
    console.error(`✗ ${label}\n  ${error.message}${error.hint ? `\n  hint: ${error.hint}` : ""}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
  return data;
}

/*
  The two shapes differ in three places and agree everywhere else, which is the
  evidence for one table rather than two:

    instructor            judge
    ----------            -----
    org: {role,name,url}  org: string
    detail                summary
    scope, site, lead     location, wordmark

  `Person.org` is an object because an instructor card prints "Co-founder,
  n-aible" from two separate fields — content.ts has the note on why that split
  exists and what it fixed in the structured data. A judge's `org` is the plain
  employer name. Both collapse into the same three columns, with `org_role` null
  for a judge.
*/
const rows = [
  ...instructors.people.map((p, i) => ({
    id: p.id,
    kind: "instructor",
    name: p.name,
    role: p.role ?? null,
    detail: p.detail ?? null,
    summary: null,
    scope: p.scope ?? null,
    location: null,
    org_name: p.org?.name ?? null,
    org_role: p.org?.role ?? null,
    org_url: p.org?.url ?? null,
    wordmark: null,
    ground: p.ground,
    photo_src: p.photo?.src ?? null,
    photo_alt: p.photo?.alt ?? null,
    logo_src: p.logo?.src ?? null,
    logo_alt: p.logo?.alt ?? null,
    linkedin: p.linkedin ?? null,
    site_label: p.site?.label ?? null,
    site_href: p.site?.href ?? null,
    lead: p.lead === true,
    position: i,
    status: "published",
  })),
  ...board.members.map((m, i) => ({
    id: m.id,
    kind: "judge",
    name: m.name,
    role: m.role ?? null,
    detail: null,
    summary: m.summary ?? null,
    scope: null,
    location: m.location ?? null,
    org_name: m.org ?? null,
    org_role: null,
    org_url: null,
    wordmark: m.wordmark ?? null,
    ground: m.ground,
    photo_src: m.photo?.src ?? null,
    photo_alt: m.photo?.alt ?? null,
    logo_src: m.logo?.src ?? null,
    logo_alt: m.logo?.alt ?? null,
    linkedin: m.linkedin ?? null,
    site_label: null,
    site_href: null,
    lead: false,
    position: i,
    status: "published",
  })),
];

/*
  The two ids could in principle collide — one table, two lists, authored ids —
  and a collision would silently drop a person rather than fail. `roan` as an
  instructor and `roan` as a judge is a real possibility the moment Roan adds
  himself to the board, and it is exactly the case the primary key cannot
  express. Caught here rather than discovered later as a missing card.
*/
const seen = new Map();
for (const row of rows) {
  if (seen.has(row.id)) {
    console.error(
      `✗ duplicate id "${row.id}" — ${seen.get(row.id)} and ${row.kind} cannot share one row.\n` +
        `  Give one of them a distinct id in content.ts (e.g. "${row.id}-judge").`,
    );
    process.exit(1);
  }
  seen.set(row.id, row.kind);
}

await run(
  `import ${rows.length} roster entries (${instructors.people.length} instructors, ${board.members.length} judges)`,
  db.from("roster").upsert(rows, { onConflict: "id", ignoreDuplicates: true }),
);

const after = await run("count", db.from("roster").select("id, kind, name, status"));
console.log(
  `\n  ${after.filter((r) => r.kind === "instructor").length} instructors, ` +
    `${after.filter((r) => r.kind === "judge").length} judges in the table.`,
);

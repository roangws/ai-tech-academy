# LMS QA checklist

For the LMS built on 8 Aug 2026. Companion to `LMS-ARCHITECTURE.md`.

Items marked **[verified]** were executed against the live database or the
production build during the build session, and the result is recorded. Everything
else needs a human with a browser.

---

## 0. Before you start

- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **`SUPABASE_SERVICE_ROLE_KEY` must
      not be set in any environment the app runs in** — only in CI or a
      developer's shell for `scripts/seed-catalog.mjs`.
- [ ] `npm run build` — **[verified]** clean. 21 routes. Marketing pages still
      Static/SSG with 1h revalidate; the eight LMS routes Dynamic; `ƒ Proxy`
      present.
- [ ] `npx tsc --noEmit` — **[verified]** clean.
- [ ] `npm run lint` — **[verified]** clean.
- [x] **Email confirmation is OFF** (`mailer_autoconfirm: true`, set 8 Aug 2026).
      Sign-up returns a live session and lands on `/dashboard`; no mail is sent,
      so the built-in SMTP rate limit no longer applies. The trade-off accepted:
      nobody proves they own the address they type. Turning it back on needs real
      SMTP first — the code handles both paths and `/auth/confirm` is built.

---

## 0a. Verified end to end in a headless browser, 11 Aug 2026

Run against a dev server on the live database, driving the real UI as an admin
and then as a learner, with the resulting rows checked in Postgres. Test course
and the four QA accounts deleted afterwards; row counts confirmed back to where
they started (5 courses, 1 user, 173 lessons, 174 blocks).

**Authoring, as an admin** — every console page loaded (Overview, People, Judge
seats, Learners, Courses) → created a course from the Courses page → landed in
its editor → filled every field on the course form including the one-per-line
lists and the `label | value` facts and stats, and confirmed each persisted →
renamed the first module and set its artifact → added a second lesson → opened
the lesson editor → wrote a prose block as Markdown with no JSON → published →
the course appeared on the homepage, on `/courses`, on its own
`/courses/<slug>` page and in the footer.

**Reading it, as a learner** — the authored prose rendered with its bullets, no
scaffolding banner → the primary control read "Complete and open the next
lesson" → pressing it completed and advanced in one press → the destination named
the lesson just finished and its real progress ("1 of 2 in module 01").

Zero console errors and zero failed requests across the whole run.

**Found and fixed by this pass, in order:**

1. Every course page 500'd — three client components imported a counter or the
   `Course` type from `catalog.ts`, putting `next/headers` in the browser graph.
2. Writing the first lesson of a draft answered "There is nothing at this
   address": the lesson editor resolved the course through the published
   catalogue.
3. A duplicate course id threw to the error boundary, which hides
   `error.message`, so the author saw "This page broke" and lost the form.
4. Textareas submit CRLF, so every authored paragraph carried a trailing `\r`.
5. Draft courses were readable through PostgREST by anyone with the publishable
   key; the filter was a WHERE clause in application code.
6. "1 lessons" on a module page, reachable once a module could have one lesson.
7. The module-page acknowledgement claimed the module was finished whenever a
   reader arrived from its last lesson, however many they had skipped.
8. Hardcoded "five courses" copy on six surfaces.

## 0b. Verified end to end in a real browser, on production

Run against `academy.roanweigert.com` on 8 Aug 2026, driving the actual UI and
checking the resulting rows in Postgres rather than trusting the screen.

**Student** — sign-up across all three steps → landed signed in on `/dashboard`
("Welcome back, Qa.") → a previously locked module (04) opened → ticked a lesson
(`aria-pressed` false→true, persisted) → wrote and submitted an artifact
("Submitted. Your instructor can read it.") → dashboard showed the course at
"1 of 39 lessons" **without ever pressing Enrol**, confirming the auto-enrolment
fix → filled and submitted an outcome sheet → sheet correctly froze
("no longer editable") → signed out → `/dashboard` redirected to `/sign-in`.

Database confirmed: profile with the optional step-2 role and step-3 source
captured, `roles = {student}` from the trigger, 1 enrolment, 1 lesson, 1
submitted artifact, 1 submitted sheet with its measure row.

**Instructor** — signed in, header showed the Instructor link, console listed the
assigned course and the learner's submitted artifact, feedback sent, artifact
moved to `reviewed` with the text stored.

**Judge** — seat rendered as "Revenue operations" with its `checks` sentence,
"1 sheet to score", **no learner name or id anywhere on either judge screen**,
curriculum review filed (`2026-H2` / `concerns`, stored against the right seat
and course), and the rubric scored with a **different value on each of the four
criteria**. Database confirmed all four landed on the correct criteria —
Deployment verified 2, Measurement quality 3, Workflow durability 4,
Documentation 5. That is the regression test for the shared-radio-name bug, and
it passes.

Two bugs were found by the teardown itself and are fixed:

- `artifacts_feedback_ck` paired `feedback_at` with `feedback_by`, which is
  `ON DELETE SET NULL` — so **deleting an instructor who had ever left feedback
  failed outright**. Re-paired to `instructor_feedback`/`feedback_at`; who wrote
  it is allowed to become unknown.
- `outcome_rows_guard` blocked its own cascade, because during a cascade the
  parent sheet is already gone and a NULL status read as "not draft" — so **any
  learner who had submitted an outcome sheet could not delete their account**.
  A missing parent is now treated as the sheet being removed, not as tampering.

Both contradicted the privacy policy's promise that closing an account deletes
the account and the work stored against it. Account deletion now works.

All QA identities and their data were removed afterwards; the catalog (5 courses,
40 modules, 173 lessons, 6 seats, 20 criteria) is intact and `auth.users` is
empty.

---

## 1. Access control — the part that must not be wrong

### Verified by probe against the live database

Each of these was attempted as a real `authenticated` role with JWT claims set,
i.e. exactly what a PostgREST call with the publishable key can do.

| Attack | Result |
|---|---|
| Learner inserts `admin` into `user_roles` | **BLOCKED** |
| Learner binds themselves to a `judge_seats` row | **BLOCKED** |
| Learner inserts their own `instructor_assignments` row | **BLOCKED** |
| Learner reads another learner's `profiles` row | **BLOCKED** |
| Learner reads `instructor_assignments` (staff uuids) | **BLOCKED** (0 rows) |
| Learner reads `curriculum_reviews` (judges' private notes) | **BLOCKED** (0 rows) |
| Learner writes their own `instructor_feedback` / `status='reviewed'` | **BLOCKED** |
| Learner sets their own sheet to `verified` | **BLOCKED** |
| Learner edits a **submitted** sheet's content | **BLOCKED** |
| Learner un-submits a scored sheet | **BLOCKED** |
| Learner rewrites `outcome_rows` on a submitted sheet | **BLOCKED** |
| Learner sets their own enrolment to `completed` | **BLOCKED** |
| Judge reads a sheet outside their seat's course | **BLOCKED** |
| Judge scores a sheet outside their seat | **BLOCKED** |
| Judge attaches another course's rubric criterion to a sheet | **BLOCKED** |
| Judge reads a learner's `profiles` row | **BLOCKED** |
| Judge reads `judge_seats.user_id` (who holds other seats) | **BLOCKED** |
| Learner rewrites `profiles.email` | **BLOCKED** |
| Learner edits `profiles.first_name` | allowed, correct |
| Anonymous reads courses / lessons / judge seats | allowed (5 / 173 / 6), correct |

Also verified: **0 tables without RLS**, 41+ policies, no leftover seed policies,
and the full happy path — learner submits a sheet through the RPC → seated judge
sees it and its measures → files 4 rubric scores → learner reads all 4 back.

**Two privilege mistakes were made and caught by probing rather than by reading
the DDL. Both are the same shape and worth remembering:**

1. `REVOKE SELECT (col) … FROM authenticated` does nothing while a table-wide
   `GRANT SELECT` exists — Postgres checks table privileges first. The fix is to
   revoke the table grant and re-grant per column.
2. `REVOKE EXECUTE ON FUNCTION … FROM anon` does nothing, because `PUBLIC` holds
   EXECUTE on every new function by default. The fix is to revoke from `PUBLIC`.

**Always verify a privilege change with `has_table_privilege` /
`has_function_privilege` / a live probe. A successful `REVOKE` statement is not
evidence that anything was revoked.**

### Still to check by hand

- [ ] Sign in as a learner, open devtools, and call the REST API directly with
      the publishable key. Confirm you cannot read another learner's rows.
- [ ] Confirm the service-role key appears nowhere in the client bundle:
      `grep -r "service_role" .next/static/ || echo clean`
- [ ] `/dashboard`, `/instructor`, `/judge` while signed out → redirect to
      `/sign-in?next=…`, and after signing in you land where you were going.
- [ ] `/instructor` as a plain student → redirect to `/dashboard`.
- [ ] `/judge` as a plain student → redirect to `/dashboard`.

---

## 2. The free-first-module gate

This is the site's central promise and it is stated on six surfaces.

- [ ] Signed out, `/learn/applied-ai-for-gtm-teams` renders the full contents
      with module 01 open and 02–08 marked "Account".
- [ ] Signed out, `/learn/applied-ai-for-gtm-teams/01` renders the lessons.
- [ ] Signed out, `/learn/applied-ai-for-gtm-teams/04` renders the locked panel —
      **and View Source contains none of module 4's lesson names.** The gate is an
      early return before the content is built, not CSS. This is the check that
      matters.
- [ ] The locked page has an `<h1>` (it is `LockedPanel as="h1"`).
- [ ] From the locked panel, "Create your free account" → sign-up → after
      confirming, you land back on module 04, now open.
- [ ] A course page (`/courses/<slug>`) offers "or start module 1 without one"
      under the enrol button, and it reaches module 1 with no account.

---

## 3. Auth

- [ ] Sign up with all three steps → "Confirm your email" screen naming the
      address you typed.
- [ ] Sign up and skip steps 2 and 3 → same, and `profiles.company` / `role_title`
      / `source` are null rather than empty strings.
- [ ] Sign up with an address that already has an account → error on the **email
      field on step 1**, wizard jumps back to step 1, focus lands on that field.
- [ ] **Then fix the address and press Continue twice.** You must reach step 3 and
      be able to submit. (The wizard previously trapped you on step 1 forever
      after any server error — this is the regression test for it.)
- [ ] Typing in a field with a server error clears the red state immediately.
- [ ] Click the confirmation link → signed in, landed on `next` or `/dashboard`.
- [ ] Click the same link twice → `/sign-in?confirm=failed` with an explanation,
      not a bare 400.
- [ ] Open the confirmation link in a **different browser** → same friendly
      failure (PKCE keeps its verifier in a cookie; this case is common).
- [ ] Sign in with an unconfirmed account → "Confirm your email", not "wrong
      password".
- [ ] Sign in with a genuinely wrong password → one generic message. It must not
      be possible to tell whether an address has an account here.
- [ ] Sign out → header shows signed-out controls, `/dashboard` redirects.
- [ ] **Open redirect.** Every one of these must land on `/dashboard`, not
      off-site:
      `/sign-in?next=//evil.example` ·
      `/sign-in?next=/%5Cevil.example` ·
      `/sign-in?next=https://evil.example` ·
      `/sign-in?next=/%09/evil.example`
      (`/\evil.example` defeated the original string-matching check.)
- [ ] Stay signed in for over an hour, then navigate. The session must survive —
      the proxy's `getClaims()` call is what refreshes it.

---

## 4. Student

- [ ] Empty dashboard offers the catalog rather than an empty grid.
- [ ] Ticking a lesson from a module page **enrols you**, and the course appears
      on the dashboard. (Previously only the "Add to my courses" button enrolled,
      so a learner who signed up from a locked module had a permanently empty
      dashboard while working through a course.)
- [ ] The tick is a real toggle: `aria-pressed` flips, and a screen reader
      announces the change.
- [ ] Progress counts on the dashboard match the module page.
- [ ] Save an artifact as a draft → it is not on `/instructor`.
- [ ] Submit it → it is.
- [ ] **Press "Save draft" on a submitted artifact.** It must stay submitted.
- [ ] Outcome sheet: fill three measures, save draft, reload → values persist.
- [ ] Leave a measure blank → that row is dropped, not stored empty.
- [ ] Submit the sheet → fields become read-only **but still tabbable and
      selectable** (`readOnly`, not `disabled` — the learner has to be able to
      quote from their own record).
- [ ] Submit a sheet with no measures → refused with a message.

---

## 5. Instructor

- [ ] With no assignment: the empty state names `instructor_assignments` rather
      than rendering an empty table.
- [ ] With an assignment: only that course's submitted work appears.
- [ ] Drafts never appear.
- [ ] Leaving feedback moves the item to Reviewed and the learner sees it on the
      module page.
- [ ] The course list does not reorder between page loads.

---

## 6. Judge

- [ ] With no seat: the empty state explains seats and links to the public board.
- [ ] With a seat: only that seat's course's submitted sheets appear.
- [ ] **No learner name, email or id appears anywhere** on either judge screen.
- [ ] The Verdict control is a `<fieldset>` with a `<legend>` — focus entering it
      announces "Verdict".
- [ ] **File a curriculum review, then reload.** It must appear in the list below.
- [ ] As the learning-design seat (`reads_all_courses`): a Course dropdown
      appears and filing works. (This seat previously could not file at all — the
      form submitted no course and the action returned silently.)
- [ ] **Score a sheet with a different value on each criterion, save, reopen.**
      Every criterion must show the score you gave it. (Every radio previously
      shared `name="score"`, so all criteria were one group: one score was saved
      and attributed to the wrong criterion.)
- [ ] After scoring, the sheet is marked "You have scored this" and the "to
      score" count drops.

---

## 7. Cross-cutting

- [ ] Every LMS page at 375px wide: the nav row below the header is reachable.
- [ ] Keyboard only, each page: skip link works, focus is always visible, no trap.
- [ ] Headings on each page run h1 → h2 → h3 with no skipped level.
- [ ] Green (`--state-open`) appears **only** on "open with no account". Not on
      done, complete, reviewed, pass or verified.
- [ ] Kill the network mid-navigation → the branded error boundary, not a raw 500.
- [ ] A bad course slug or module number → the branded 404 with navigation.
- [ ] Marketing pages are byte-identical to before the LMS existed.

---

## 8. Known gaps — not defects, decisions outstanding

- **[FILL: email delivery]** — see the blocker above.
- **[FILL: instructor→course mapping]** — nobody is assigned to anything.
  `content.ts` gives four of five instructors no course, by policy, so nothing is
  derivable. Until rows exist, `/instructor` is empty for everyone and
  "Submitted. Your instructor can read it." is optimistic.
- **[FILL: judge identities]** — all six seats are unbound. `/judge` is empty for
  everyone until an admin binds one.
- **[FILL: rubric criteria]** — the four seeded per course are a proposal derived
  from the FAQ's definition of completion, not a specification. Confirm with the
  board.
- **[FILL: term definition]** — free text (`2026-H2`) until someone defines the
  calendar.
- **[FILL: events]** — the board copy promises a panel judging events where
  learners present. No event exists anywhere in the product. Either the copy or
  the feature has to give; nothing here invents one.
- **[FILL: completion record]** — `completion_records` is admin-write only and
  nothing issues one. `enrollments.status='completed'` is likewise never set. So
  the third of the three artifacts `outcomes.leaveWith` promises does not exist
  yet, and the learner-facing view of `judgements` is not built either — a
  learner can be scored without being shown the score.
- ~~[FILL: lesson bodies]~~ **Superseded 10 Aug.** `lesson_blocks` carries video,
  audio, docs, quizzes, embeds, exercises and checklists, gated in Postgres. The
  prose is still being written and a lesson with no blocks says so at the top of
  the page. Original note follows.
- **[FILL: lesson bodies]** — there is no lesson content in the repo: no video, no
  text, no storage bucket. A lesson is currently a name, a kind and a tick.
- **[FILL: file uploads]** — artifacts are text only. Avatars are the one upload
  that exists (`avatars` bucket, one folder per user enforced by policy).
- **[FILL: account deletion does not reap the avatar]** — and it cannot be fixed
  in SQL. `storage.objects` has no foreign key to `auth.users`, so nothing
  cascades, and Supabase installs a `storage.protect_delete()` trigger that
  refuses direct SQL deletes from storage tables outright. A delete-my-account
  feature therefore has to call the Storage API to remove
  `avatars/<user id>/…` before deleting the user. There is no delete-account
  feature yet, so nothing is leaking today — but the privacy policy promises one,
  and whoever builds it needs to know this.
- **Column-level grants are a whitelist, and a new column is not in it.** This
  schema has now been bitten three times by privilege changes that looked applied
  and were not: a column REVOKE shadowed by a table grant, a function REVOKE
  shadowed by the PUBLIC grant, and `profiles.avatar_url` added after the
  column-level UPDATE grant was written — so a portrait uploaded to storage
  correctly and the row that records its URL was silently refused. Any column
  added to `profiles` from here needs an explicit decision about whether a
  learner may write it.
- **[FILL: teams]** — individual enrolment only, which matches the current copy.
- **No admin UI.** Granting a role, assigning an instructor and binding a judge
  seat are all SQL. This is deliberate — a self-service path into `user_roles` is
  the one escalation this schema exists to prevent — but it is undocumented
  anywhere a non-engineer would find it.
- **The first admin must be created in SQL.** `handle_new_user` hardcodes
  `student` and `user_roles` is admin-write only, so there is no bootstrap path
  through the app. That is correct; do not "fix" it by loosening the policy.
- ~~Lesson identity is positional.~~ **Fixed 10 Aug** — lessons carry an authored
  `slug`, unique per module, and the seed script upserts on it. Original note
  follows, because the failure it describes is worth keeping.
- **Lesson identity is positional.** `lessons` is keyed `(module_id, position)`,
  and `content.ts` gives lessons no id. Renaming a lesson is safe; **inserting or
  removing one in the middle of a module shifts every completion below it onto
  the wrong lesson.** Adding an `id` to the `Lesson` type is the fix and it has
  not been done. Append and re-seed is safe; reorder is not.
- **Button styling.** The LMS renders 8px flat controls where the marketing site
  uses `LiquidButton` glass pills. Cosmetic, and the two surfaces do not match at
  the seam.
- **The Supabase MCP connection is write-enabled against production**, no branch,
  no `read_only`. Fine while there are no learners; scope it before there are.
- **`.env` holds a `gmi-api-key` JWT.** Untracked and unread by the app, but it is
  a live-looking credential in the working tree and it is loaded into every
  `next dev` process.

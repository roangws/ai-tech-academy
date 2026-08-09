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
- [ ] **[BLOCKER — decide before launch]** Email confirmation is currently **ON**
      (`mailer_autoconfirm: false`) and Supabase's built-in SMTP is rate-limited
      to a handful of messages an hour. Either wire real SMTP or turn
      confirmations off deliberately. The code handles both, but with the
      built-in sender most sign-ups will silently never receive a link.
      See [FILL: email delivery].

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
- **[FILL: lesson bodies]** — there is no lesson content in the repo: no video, no
  text, no storage bucket. A lesson is currently a name, a kind and a tick.
- **[FILL: file uploads]** — artifacts are text only.
- **[FILL: teams]** — individual enrolment only, which matches the current copy.
- **No admin UI.** Granting a role, assigning an instructor and binding a judge
  seat are all SQL. This is deliberate — a self-service path into `user_roles` is
  the one escalation this schema exists to prevent — but it is undocumented
  anywhere a non-engineer would find it.
- **The first admin must be created in SQL.** `handle_new_user` hardcodes
  `student` and `user_roles` is admin-write only, so there is no bootstrap path
  through the app. That is correct; do not "fix" it by loosening the policy.
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

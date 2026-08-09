# LMS architecture — instructors, students, judges

Design document for turning the AI Tech Education Academy marketing site into a
working LMS. Written 8 Aug 2026.

> **Naming note.** The brief specifies user setup with **Super Bass**. The tool
> actually wired to this repo — and the one this document builds against — is
> **Supabase** (project ref `gusexlvelgmgnecvytxf`, configured in `.mcp.json`).
> Read "Super Bass" and "Supabase" as the same system throughout.

---

## 1. Where we start

Two halves, and they do not touch each other yet.

**The frontend is finished and good.** Next.js 16.3 App Router, React 19.2,
Tailwind v4 configured entirely in `src/app/globals.css` (no `tailwind.config.js`).
Nine routes, all prerendered. A 3,442-line `src/lib/content.ts` holds every
course, module, lesson, instructor and judge seat as `as const` literals.

**The backend is empty.** The Supabase project resolves but has zero tables,
zero migrations, zero edge functions and zero users. No `@supabase/*` package is
installed. There is no `proxy.ts`, no route handler, no server action, no
`process.env` read anywhere in `src/`.

The two auth screens are complete, accessible, validated UI whose submit handlers
call `preventDefault()` and render "this form is not live". Nothing needs
unwinding — the wiring is purely additive.

### The one architectural decision that shapes everything else

> **REVERSED, 11 Aug 2026.** What follows is the original decision and the
> reasoning that overturned it. Both are kept because the original argument was
> not wrong, it was answering a different question.

**Original:** `content.ts` is the source of truth for catalog copy; Postgres
holds a structural mirror of it, plus everything that is per-person. Moving
3,442 lines of curated prose into the database would turn five statically
rendered, JSON-LD-annotated, SEO-load-bearing pages into runtime queries and put
a copy edit behind a migration. It buys nothing: nobody but the author edits that
prose.

**What that missed.** "Nobody but the author edits that prose" is a description
of who *could*, not of who *should*. Creating a course meant editing a
TypeScript literal and deploying, so the admin console — the screen whose entire
purpose is running the school — could change exactly one thing about a course:
whether a module required an account. Handing the product to an instructor was
impossible by construction.

**Now:** Postgres owns the catalogue. `src/lib/catalog.ts` reads it; the
`Course`, `CourseModule` and `Lesson` types stay in `content.ts` and are what it
maps rows into, so every component is unchanged and there is still one
definition of what a course is. `content.ts` keeps the homepage copy, the
method, the FAQs, the instructor roster and the legal pages — editorial content
with no console behind it.

The SEO concern in the original was real and is addressed rather than accepted:
the marketing pages are still `revalidate = 3600` static renders, and every
admin write calls `revalidateCatalog()`, so an edit is live on the next
navigation instead of within the hour. `/courses/[slug]` took `dynamicParams`,
because a course created in the console has a slug that did not exist when the
deployment was built.

This preserves the `id` / `slug` split that `content.ts:704` argues for at
length: **`id` is the private key everything internal uses, `slug` is a public
contract that changes when copy changes.** The database keys on `id`.

---

## 2. Roles

Four roles. Three are in the brief; `admin` exists because someone has to grant
the other three.

| Role | Gets | Cannot |
|---|---|---|
| `student` | Enrol, read modules, complete lessons, save artifacts, author an outcome sheet, submit it, read their own completion record | See anyone else's work |
| `instructor` | Everything a student can, plus: roster and artifacts for **courses they are assigned to**, and leaving feedback on them | Touch a course they are not assigned to |
| `judge` | Read the curriculum of the **course their seat reads**, file a per-term curriculum review, and score submitted outcome sheets against rubric criteria | See unsubmitted work; see learner email addresses |
| `admin` | Grant and revoke roles, assign instructors to courses, bind a judge seat to a person | — |

### How roles are stored, and why not on the JWT

Roles live in a `user_roles(user_id, role)` table, not in
`auth.users.raw_app_meta_data` and not in a `profiles.role` column.

- **A table, not a JWT claim.** A claim is stale until the access token is
  refreshed, so revoking `instructor` would leave up to an hour of access behind
  it. Reading the table means revocation takes effect on the next request.
- **A table, not a column on `profiles`.** Roles are not exclusive. The lead
  instructor is also a judge on the learning-design seat; a judge who takes a
  course is also a student. One row per grant models that; an enum column does not.
- **Its own table, not `profiles`, because of the recursion.** RLS policies on
  `profiles` need to ask "is the caller an instructor?". If the answer lives in
  `profiles`, that policy queries the table it is protecting, and Postgres
  recurses. A separate table with its own simple policy breaks the cycle.

Every role check goes through one `SECURITY DEFINER` helper:

```sql
public.has_role(uid uuid, r app_role) returns boolean
```

`SECURITY DEFINER` so the function itself is not subject to the RLS of the table
it reads, `STABLE` so the planner calls it once per statement rather than once
per row, and `search_path = ''` so a caller cannot shadow `user_roles` with
something of their own.

`student` is granted automatically to every new account by the
`handle_new_user()` trigger on `auth.users`. `instructor`, `judge` and `admin`
are granted only by an admin, or by SQL.

---

## 3. Data model

Fifteen tables in three groups.

### Catalog — authored in the console, read by everything

```
courses(id text PK, slug, badge, title, level, duration,
        workload_hours, ground, summary, position)
modules(id uuid PK, course_id → courses, n text, name, summary,
        step int, artifact text, access module_access, position)
        UNIQUE (course_id, n)
lessons(id uuid PK, module_id → modules, name, kind lesson_kind,
        minutes int, position)
```

`module_access` is `'open' | 'account'` — the exact vocabulary `content.ts:920`
already uses. Module `01` of every course is `'open'`; that single value is what
the whole free-first-module gate reads.

### Per-person — the actual LMS

```
profiles(id → auth.users PK, first_name, last_name, email,
         company, role_title, source, created_at, updated_at)
user_roles(user_id → auth.users, role app_role) PK (user_id, role)

enrollments(id, user_id, course_id, status, enrolled_at, completed_at)
            UNIQUE (user_id, course_id)
lesson_progress(user_id, lesson_id, completed_at) PK (user_id, lesson_id)
artifacts(id, user_id, module_id, title, body, status, submitted_at,
          instructor_feedback, feedback_by, feedback_at)
          UNIQUE (user_id, module_id)

outcome_sheets(id, user_id, course_id, title, status, measured_after_days,
               footnote, submitted_at)
outcome_rows(id, sheet_id, measure, before_value, after_value,
             before_n, after_n, position)
completion_records(id, user_id, course_id, reference, issued_at)
```

`artifacts` is one row per learner per module, which is exactly the shape
`CourseModule.artifact` already implies — 8 per course, 40 in total, each named
("Baseline and use-case map", "Pipeline scorecard", "Completion record").

`outcome_sheets` + `outcome_rows` is a direct normalisation of the `outcomes.sheet`
literal at `content.ts:2060` — the before/after measure table that the site
already renders as its definition of what a learner leaves with.

### Instruction and judging

```
instructor_assignments(id, user_id, course_id, kind, scope)
                       UNIQUE (user_id, course_id)
judge_seats(id text PK, seat, reviews_course_id, checks, user_id, position)
rubric_criteria(id, course_id, label, description, weight, position)
judgements(id, sheet_id, judge_id, criterion_id, score, notes)
           UNIQUE (sheet_id, judge_id, criterion_id)
curriculum_reviews(id, seat_id, judge_id, course_id, term, verdict, notes)
                   UNIQUE (seat_id, term)
```

`instructor_assignments.kind` is `'lead' | 'specialist'` — the distinction
`Person.lead` already makes, and `scope` is the free-text field `Person.scope`
already reserves ("All five courses"). This closes the gap `src/lib/seo.ts:67`
documents explicitly: today `courseJsonLd` hardcodes `instructors.people[0]` as
the instructor of all five courses because nothing in `content.ts` says which
specialist teaches which.

`judge_seats.id` carries the six existing seat ids verbatim — `revops`, `post`,
`governance`, `platform`, `smb`, `learning` — because those ids are already the
public anchor targets on `/review-judge-board#<id>`. `user_id` is nullable: a
seat exists before a named person clears it, which is the current state of all
six and is the whole reason `Seat.name` is optional.

`curriculum_reviews` gives the board's first job a record — the `checks` sentence
is the criterion, `term` is the period, `verdict` is `pass | concerns | fail`.
`judgements` gives it the second: scoring what a learner deployed, one row per
criterion per judge, so two judges scoring the same sheet is a natural join and
not a conflict.

### Enums

`app_role` (student/instructor/judge/admin), `module_access` (open/account),
`lesson_kind` (lesson/lab/template), `enrollment_status`
(active/completed/withdrawn), `artifact_status` (draft/submitted/reviewed),
`sheet_status` (draft/submitted/verified), `review_verdict`
(pass/concerns/fail), `assignment_kind` (lead/specialist).

---

## 4. Access control

**RLS is enabled on all fifteen tables, and every one has explicit policies.**
A table with RLS on and no policy denies everything; a table with RLS off is
readable by anyone holding the publishable key. Both are failure modes, so
neither is left to chance.

The rules, stated once:

- **Catalog** (`courses`, `modules`, `lessons`, `rubric_criteria`,
  `judge_seats`): `SELECT` to everyone including anonymous. Writes to admins
  only. These are already public on the marketing site.
- **`profiles`**: you read and update your own. Instructors read the profiles of
  learners enrolled in their assigned courses. Admins read all. Judges read none
  — a judge scores work, not people.
- **`user_roles`**: you read your own; only admins write. Non-negotiable, since
  a self-service `INSERT` here is a privilege escalation.
- **`enrollments`, `lesson_progress`, `artifacts`, `outcome_sheets`,
  `outcome_rows`**: owner has full access. Instructors read rows belonging to
  learners in their assigned courses. Judges read `outcome_sheets` and
  `outcome_rows` **only where `status <> 'draft'`** — submitting is what makes
  work visible, and a judge must never see a draft.
- **`judgements`**: a judge writes and reads their own. The learner reads
  judgements on their own sheet. Instructors read judgements on their course.
- **`curriculum_reviews`**: a judge writes only for the seat they hold
  (`judge_seats.user_id = auth.uid()`); everyone signed in can read them,
  because a curriculum review is a public statement about the course.
- **`completion_records`**: owner reads; nobody but the system writes.

Two enforcement layers sit above RLS:

1. **`proxy.ts`** (Next 16's rename of `middleware.ts` — the old name is
   deprecated) refreshes the Supabase session cookie on every request and
   redirects unauthenticated traffic away from `/dashboard`, `/learn`,
   `/instructor` and `/judge`.
2. **Server-side role guards** in `src/lib/auth.ts` (`requireUser`,
   `requireRole`) run inside each protected layout.

Neither replaces RLS. The proxy sees a cookie, not a role, and cannot be the
authorisation boundary; the guards are defence in depth for a direct API call.

### The free-first-module gate

One rule, enforced in one place, and it is the rule the site already advertises:

> Module `01` (`access = 'open'`) is readable with no account. Modules 02–08
> (`access = 'account'`) require a signed-in user.

Enforced in `src/lib/lms/access.ts`, called by the `/learn` route before
rendering. It is a server check, not a UI state, so the lock is not a `hidden`
attribute someone can delete in devtools.

---

## 5. What gets reused

The frontend audit's payoff. Almost nothing needs to be built new.

| Existing | Path | Reused for |
|---|---|---|
| `Container`, `Section`, `Panel`, `SectionHeader` | `src/components/ui/index.tsx` | Every LMS page's layout |
| `ButtonLink`, `EnrollButton`, `TextAction`, `TextButton` | same | Every action |
| `StatusChip`, `SkillChip`, `FactsLine`, `CheckList` | same | Progress state, module meta, judge checks |
| `LiquidButton` | `ui/liquid-glass-button.tsx` | Primary submits |
| `useDisclosureSet` + `AccordionItem` | `ui/accordion.tsx` | Course-player module list |
| `CourseGlyph`, `courseGlyphs` | `course/icons.tsx` | Course identity everywhere |
| `CourseCard` | `sections/courses.tsx` | Dashboard enrolment cards |
| `BoardCard` | `board-card.tsx` | Judge console seat header |
| `OutcomeSheet` markup | `outcome-sheet.tsx` | The editor's read view |
| `cn()` | `src/lib/utils.ts` | All of it |
| Design tokens, `t-*` type scale, `--path-a..e` hues | `src/app/globals.css` | Every new surface |
| `courseHref`, `moduleCount`, `totalLessons`, `lessonCount` | `content.ts` | Unchanged |
| `AuthScreen` shell | `auth/auth-screen.tsx` | Kept exactly; only the forms' submit path changes |

New primitives are limited to what genuinely does not exist: a progress bar, a
`Field` wrapper for the many new forms, and a signed-in account menu in the
header. Everything else composes.

The auth forms keep their three-step structure, their client-side validation,
their `aria-invalid` / `aria-describedby` wiring and their focus management.
The change is `onSubmit={e => e.preventDefault()}` becoming a Server Action via
`useActionState`, and the "not live" note becoming a real error slot.

---

## 6. Route map

```
(site)/…                    unchanged, static, public
/sign-in, /sign-up          unchanged UI, live submit
/dashboard                  student home — enrolments, continue, outcome sheets
/learn/[slug]               course contents, gate state per module
/learn/[slug]/[module]      the player: lessons, completion, artifact
/dashboard/outcome/[id]     outcome sheet editor
/instructor                 assigned courses + roster
/instructor/[slug]          submitted artifacts, feedback
/judge                      seat, curriculum review, sheets awaiting score
/judge/review/[sheetId]     score against rubric criteria
/auth/signout               POST-only sign-out route handler
```

`/learn/[slug]` is dynamic and uncached; the marketing `/courses/[slug]` stays
statically generated with `revalidate = 3600`. They are different pages for
different jobs and are deliberately not merged.

---

## 7. Requirements not yet supplied

Real gaps, carried as placeholders rather than invented:

- **[FILL: email delivery]** — Supabase's default SMTP is rate-limited to a
  handful of messages an hour and is not for production. Confirmation email is
  therefore **disabled** in this build (sign-up returns a live session
  immediately). Turning it on needs a real SMTP provider.
- **[FILL: legal entity]** — `content.ts:3109` still carries literal
  `[placeholder]` for entity name, address, jurisdiction and contact. The
  privacy policy already promises account deletion; that promise is unenforceable
  copy until the entity exists.
- **[FILL: judge identities]** — all six seats have `name` absent by policy,
  pending the person and their employer clearing it. Seats are seeded unbound
  (`user_id IS NULL`).
- **[FILL: instructor→course mapping]** — the four specialists have no `scope`
  in `content.ts`, by policy. `instructor_assignments` is seeded with the lead
  on all five courses only; the specialists' rows need a decision.
- **[FILL: rubric criteria]** — the site has exactly one rubric reference, a
  lesson name at `content.ts:1178`. A defensible four-criterion default is
  seeded per course (deployment verified / measurement quality / workflow
  durability / documentation) and is explicitly a proposal.
- **[FILL: term definition]** — the board "reads the courses each term". Term is
  stored as free text (`2026-H2`) until someone defines the calendar.
- **[FILL: events]** — `content.ts:2550` already flags this: the board copy
  promises a panel judging events, and no event exists anywhere else on the site.
  Not modelled. Either the copy or the feature has to give.
- **[FILL: completion record]** — modelled as a row with a reference string.
  Whether it renders as a page, a PDF or a verifiable URL is undecided.
- **[FILL: teams]** — `content.ts:2421` describes groups with a shared launch
  date. Out of scope; individual enrolment only, which matches the current copy.
- ~~[FILL: file uploads]~~ **Answered 10 Aug.** Two buckets exist — `course-media`
  (public, audio and posters) and `course-docs` (private, signed per render).
  `lesson_blocks.payload` stores a path and never a URL. See docs/LMS-REBUILD.md.
  Whether a learner needs to attach a diagram or a video is unanswered.

---

## 8. Risks accepted

- **`.env` contains a committed-to-disk `gmi-api-key` JWT.** It is untracked
  (`.gitignore` covers `.env*`) and unread by the app, but it is a live-looking
  credential sitting in the working tree. Flagged, not touched.
- **The Supabase MCP connection is write-enabled against production** with no
  `read_only` flag and no branch. Fine while the project is empty; it should be
  branch-scoped once there is real learner data.
- **The service-role key is never used.** Everything runs through the
  publishable key under RLS, so a policy bug is a bug and not a total bypass.
  The seed script is the one exception and runs from a developer's machine.

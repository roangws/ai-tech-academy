# LMS UX review

Ten specialists were pointed at the signed-in LMS on `academy.roanweigert.com` and
told to be harsh. They read the code and 38 full-page production screenshots
captured as four real roles at 1440 and 390. They returned **140 findings**:
39 P0, 72 P1, 26 P2, 3 P3.

This document is the record and the acceptance checklist. Every claim that drives
a P0 was re-verified against the code by hand before it was written down; where a
specialist overstated something, the correction is in **Corrections** below.

| Severity | Meaning | Count |
|---|---|---|
| P0 | Broken, dishonest, inaccessible, or actively loses the learner | 39 |
| P1 | Seriously damages the experience; a competitor obviously does better | 72 |
| P2 | Real improvement, not urgent | 26 |
| P3 | Polish | 3 |

## How it was produced

- QA accounts created in production Supabase (student, instructor, judge, admin),
  with realistic state seeded: one enrolment, six completed lessons, one artifact
  awaiting an instructor, one outcome sheet awaiting a judge. No screen in the
  capture is an empty state that a real learner would not also hit.
- Screenshots in `references/lms-review/before/` (gitignored).
- Each specialist read the screenshots *and* the code, and every finding names a
  file. Findings that could not be tied to a file were discarded.

---

## The ten headlines

Each specialist's single strongest opinion, verbatim.

**Information architecture & navigation**

> The three-level hierarchy is only navigable downwards: nothing in this product remembers or shows where the learner actually is, and the one control named "Continue" dumps them on a table of contents two clicks away from the lesson they left. Inside a lesson — the only screen a learner spends real time on — there is no syllabus, no module progress, no course structure and 496px of deliberately empty column where all of it should live.

**Visual & interaction design**

> This is a marketing site with an LMS pasted into its content slot: every signed-in screen inherits a 44px display greeting, a 335px sitemap footer and a 1280px brochure container, and then puts the actual product in a 650px column against 600px of dead white. There is no app shell, no persistent course context and no current-page state anywhere in the navigation — so the deepest, most-visited screen in the product (a lesson) is a document with a back link, which is exactly the shape that will collapse the moment you drop a video player, a podcast and a quiz into it.

**Learning experience / instructional design**

> This is not a course, it is a checklist with a progress bar bolted to it: all 173 "lessons" are the same four-heading template with the title find-and-replaced by a seed script, completion means clicking a circle you can click without opening the lesson, and the one genuine assessment — judges scoring your outcome sheet — has no code path that shows the learner the score, no code path that ever marks a sheet verified, and no code path that ever marks a course complete. Every honesty rule the project wrote for itself (don't invent 120 durations) is scrupulously observed while the far bigger lie — 173 auto-generated lesson bodies presented as a curriculum — sits in production.

**Video player UX**

> This product already sells video it does not have: 81 lessons wear a play button, one lesson claims "14 MIN", and the seeded body of every one of them opens with the word "Watch" — over a page of text. Strip that fiction out today, because the moment real video lands, the lesson page is the single worst-shaped surface in the app for it: a bare 720px text column with no syllabus rail, no resume, no block model, and a 380px marketing footer where the next lesson should be.

**Podcast / audio UX**

> This shell is structurally incapable of playing a podcast: there is no persistent client boundary anywhere in `(app)`, so any player you mount dies the instant the learner clicks anything, and there is nowhere in the schema to store a playback position — `lesson_progress` is a binary tick and `enrollments.last_module_id` is written but never read by a single query. Before you record one minute of audio you need a router-persistent player host, a `position_seconds` column, and a transcript model, or you will ship a podcast that forgets where you were, stops when you turn the page, and is silent to deaf learners.

**Accessibility (WCAG 2.2 AA)**

> The text contrast is genuinely good — someone did the maths — but nobody checked non-text contrast, and the result is that every input, textarea, select, secondary button and judge score box in this product is drawn with a 1.32:1 border, i.e. no perceivable boundary at all. Layer on top of that: Server Actions that mutate a learner's work and announce nothing, an irreversible "Submit to the review board" sitting 16px from "Save draft" with no confirmation, and a skip link whose destination has `outline-none` on it. The a11y work here is thoughtful in the comments and unverified in the pixels.

**Mobile, responsive & perceived performance**

> This is a desktop product that has been allowed to reflow, not a mobile product — the single most important artifact in the whole course, the outcome sheet's After column, is physically off-screen at 390px, and every primary action in the LMS ("Continue", "Next lesson", "Outcome sheet") is a bare 20px-tall text link that fails WCAG target-size AA. On top of that nothing on any signed-in route is prerendered or streamed, so a learner on a phone network stares at a white page for the full server round-trip on every hard navigation, then gets a skeleton shaped like a different page.

**Admin / back-office tooling UX**

> There is no back office — there is a 404, two read-only staff pages that only work if someone has already run SQL against production, and a 3,463-line TypeScript file that is the CMS. The person running this platform logs in and is greeted with "Welcome back, Admin. Five courses, all open. Start with the one closest to the work you already do", which is the product telling its owner it has no idea who they are or what their job is.

**Competitive teardown & innovation**

> This is a well-built shell around a course that does not exist: 173 machine-generated lesson bodies that say "Watch" with nothing to watch, and a footer on every lesson admitting the prose is unwritten. Worse, the product's one genuine differentiator — a judge-verified before/after number per learner — is written to Postgres (before_n, after_n, last_module_id, completion_records) and then read by absolutely nothing, so the thing no competitor can copy is the thing you throw away at write time.

**Copy, microcopy, empty states & onboarding**

> This product writes for the engineer who built it, not the learner who uses it: production UI ships an unresolved `[FILL:]` authoring token, every one of the 173 lessons carries a signed confession that the prose is unwritten and tells you to "Watch" something that does not exist, and the two role consoles greet their only users by naming Postgres tables. There is no onboarding of any kind, and a brand-new account's very first screen says "Welcome back."

---

## Verified by hand

These were re-checked directly rather than taken on trust, because they carry the
most weight.

**Contrast ratios**, computed from the real token values in `src/app/globals.css`:

| Pair | Ratio | WCAG 1.4.11 (3:1) |
|---|---|---|
| `--line` #d8e1e8 on `--surface` #ffffff | 1.32:1 | **fail** |
| `--line` #d8e1e8 on `--surface-subtle` #eef3f7 | 1.19:1 | **fail** |
| `--line-strong` #aebecb on #ffffff | 1.90:1 | **fail** |
| `--surface-sunken` #e7eef4 on #ffffff | 1.17:1 | **fail** |
| `--ink-muted` #5c6e7f on #ffffff | 5.26:1 | pass |
| `--accent` #0a3fe0 on #ffffff | 7.50:1 | pass |

`--line` is the only boundary on every input, textarea, select and secondary
button in the product. Text contrast on this site was done carefully; non-text
contrast was never checked, and that single token is a large part of why the
product reads as unfinished.

**Other checks:**

- `grep -rn "aria-live" src/app/(app) src/components/lms` → **zero matches.** No
  server action anywhere announces its result.
- `grep -rn "completion_records\|CompletionRecord" src scripts` → **one match**,
  the type declaration at `src/lib/supabase/types.ts:158`. Nothing writes or
  reads it.
- `grep -n "minutes:" src/lib/content.ts` → **one real value**, `minutes: 14` at
  line 1086. 173 of 174 lessons carry no duration.
- `min-w-[560px]` on the outcome-sheet table at
  `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:183`, inside a 358px
  column at 390px. The After column is off-screen.
- The lesson URL really is a bare array index: the capture resolved to
  `/learn/applied-ai-for-gtm-teams/01/0`.

**The security finding that started this**, proven with a live unauthenticated
request using only the publishable key that ships in the browser bundle:

```
GET /rest/v1/lessons?module_id=eq.<module 02 of course A>
→ 200, 5 lessons, ~1,120 chars of body each
```

Module 02 is `access = 'account'`. `catalog_lessons_read` is `using (true)`, so
the free-first-module gate exists only in the rendering layer. Today it leaks
scaffolding; once lessons carry YouTube ids, podcast paths and quiz answers it
gives away the course.

## Found during implementation, missed by all ten

**Every 404 in the signed-in app returns HTTP 200.** Confirmed against the dev
server:

```
/learn/no-such-course      → 200   (renders the branded not-found page)
/learn/no-such-course/01   → 200
/totally-made-up           → 404   (no page.tsx — Next handles it directly)
```

`notFound()` is called from inside a page whose `(app)` layout has already
flushed the shell — the layout awaits `AppHeader`, which awaits `getViewer()`,
so the header streams before the page body resolves. Next cannot revise the
status line after that, so it recovers on the client and the response stays 200.
The reader sees the right page; every machine sees a success.

That costs monitoring (a broken-link sweep finds nothing), analytics (404s are
invisible), and correctness for anything reading status codes. It is not caused
by the slug work — the same is true of any bad URL under `(app)` today. Fixed in
Phase 5, where the layout is restructured and the viewer-dependent chrome moves
behind a Suspense boundary so the status resolves before the shell flushes.

**A related, smaller one:** the numeric→slug redirect added in Phase 2b lands
correctly in a real browser but degrades from a 308 to a `<meta http-equiv=
"refresh">` for the same reason. Acceptable here — these routes are `noindex`
and transitional — and it resolves itself when the streaming order is fixed.

## Corrections

Two specialist claims were softened after checking:

1. **The `[FILL: rubric criteria.]` leak is latent, not live.** It is genuinely
   rendered JSX at `src/app/(app)/judge/review/[sheetId]/page.tsx:160`, not a
   comment — but it only renders when a course has no rubric rows, and all five
   currently have four each. It will ship the moment a sixth course is added.
   Still worth fixing, and still worth the CI guard; it is not currently on
   screen for a judge.
2. **The other `[FILL:]` markers are correctly confined to comments**, including
   `src/components/auth/sign-in-form.tsx:137`, which a naive grep flags as a
   leak. Six of the seven are fine.

---

## What this changes about the plan

The approved plan already covers most of this. Three things it did **not**
account for, all promoted into the work:

1. **The `--line` contrast failure** (P0, product-wide). A new `--line-control`
   token at ≥3:1 and a swap at every control call site. Cheap, and it fixes the
   single most common reason the product reads as unfinished.
2. **No status announcements anywhere.** Every server action returns silently.
   `useActionState` plus a live region present on first paint, following the
   pattern `src/components/lms/account-form.tsx` already gets right.
3. **Irreversible submits with no confirmation.** "Submit to the review board"
   sits 16px from "Save draft", is permanent, and has no confirm step. WCAG 3.3.4.

And one thing the plan had as a nice-to-have that the panel unanimously treats as
the top of the list: **"Continue" does not continue.** Five of ten specialists
raised it independently. `enrollments.last_module_id` is already written by
`touchEnrollment` and read by no query in the codebase.

---

## P0 — 39 findings

Each is broken, dishonest, inaccessible, or actively loses the learner.

### Every form control in the product is bounded by a 1.32:1 border — 1.4.11 Non-text Contrast fails product-wide

`a11y` · **Every signed-in surface: outcome sheet, artifact textarea, judge rubric (score boxes + notes), judge curriculum form, account form, all secondary buttons** · `src/app/globals.css:57`

**Evidence.** `--line: #d8e1e8`. Computed against the grounds it actually sits on: 1.32:1 on `--surface` #ffffff and 1.19:1 on `--surface-subtle` #eef3f7. `--line-strong` #aebecb is 1.90:1 on white. Every `<input>`, `<textarea>`, `<select>` and outline button in (app) uses `border border-line` as its only boundary — outcome sheet `fieldClass` (dashboard/outcome/[courseId]/page.tsx:293), the artifact textarea (learn/[slug]/[n]/page.tsx:229), the judge's five 40x40 score boxes and the Optional note field (judge/review/[sheetId]/page.tsx:203, 221), 'Save draft' (learn/[slug]/[n]/page.tsx:245). In 31-judge-review-sheet--mobile the 1-2-3-4-5 boxes read as five floating numerals; in 15-student-outcome-sheet--desktop the 'Measured after (days)' field has no visible edge. SC 1.4.11 requires 3:1 for 'visual information required to identify user interface components'; 1.32:1 is a quarter of that.

**Cost.** A low-vision learner cannot see where the outcome sheet's fields are, cannot tell the 1-5 score boxes from the paragraph above them, and cannot find the 'Save draft' button at all. This is also the single largest reason the whole product reads as unfinished to sighted users — the owner's 'UX/UI design is very bad' is, in large part, this one token.

**Fix.** Split the token: keep `--line` #d8e1e8 for decorative dividers (`divide-y`, `border-t` rules, card edges), and add `--line-control` at 3:1 or better against white for anything a user operates. #8494a2 measures 3.05:1 on white and 2.87 on `--surface-subtle` — go to #7d8d9c (3.31:1 / 3.12:1) so both grounds clear. Swap `border-line` for `border-line-control` in the six control call sites listed above.

### Server Actions mutate the learner's work and announce nothing — 4.1.3 Status Messages fails on every save in the app

`a11y` · **Module page (artifact save/submit), judge curriculum review, judge score form, lesson tick, course-board enrol** · `src/app/actions/lms.ts:191`

**Evidence.** `saveArtifact` and `saveCurriculumReview` end in `revalidatePath()` with no `redirect()`, so React re-renders in place with no document navigation. The only feedback is a plain `<span className="t-meta text-ink-muted">Saved as a draft. Only you can see it.</span>` at learn/[slug]/[n]/page.tsx:258-264 and, for the judge, a new `<li>` appended 200px below the button (judge/page.tsx:238-250). Neither is in a live region — `grep -rn "aria-live" src/app/(app)/` returns nothing, and the only `role="status"` in the group is on a *static* server-rendered paragraph (dashboard/outcome/[courseId]/page.tsx:122), which never fires because it never changes.

**Cost.** A screen-reader user writes a 20,000-character artifact, presses Save draft, and receives absolutely no confirmation that it landed. The rational response is to press it again, or to assume failure and copy the text out. This is the exact moment the product's core promise ('it stays in your account') has to be believed.

**Fix.** Move each action to `useActionState` (the pattern account-form.tsx:42 and :165-173 already gets right — it has `role="alert"`/`role="status"`) and render the returned message into a container that is present in the DOM on first paint with `role="status" aria-live="polite"`, then filled on response. An empty live region added at response time is not reliably announced.

### Enrolling destroys keyboard focus: the button that was focused is unmounted and replaced by a link

`a11y` · **Course board /learn/[slug], 'Add to my courses'** · `src/app/(app)/learn/[slug]/page.tsx:124`

**Evidence.** `{enrollment ? <Link .../> : <form action={enroll}><button>Add to my courses</button></form>}`. `enroll` (actions/lms.ts:53-76) revalidates without redirecting, so on response the `<form>` subtree is unmounted and a `<Link>` mounts at the same position. Different element type at the same slot means React destroys the focused `<button>`; the browser resets focus to `<body>`.

**Cost.** A keyboard user presses Enter on 'Add to my courses' and is silently returned to the top of the document. To reach the thing they just unlocked they must Tab through the logo, four nav links, the avatar, Sign out and the breadcrumb again. Nothing tells them anything happened. SC 2.4.3 Focus Order plus 4.1.3.

**Fix.** Either `redirect('/learn/' + slug)` at the end of `enroll` so it becomes a real navigation, or keep the same element (render one `<button>`/`<a>` at that slot with a stable `key`) and move focus explicitly to the resume control after the transition, with the state change announced in the live region from the previous finding.

### 'Submit to the review board' is irreversible, unconfirmed, and 16px from 'Save draft' — 3.3.4 Error Prevention fails

`a11y` · **Outcome sheet /dashboard/outcome/[courseId]; artifact 'Submit for review' on every module page** · `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:272`

**Evidence.** Both submits are `h-11` buttons in the same `flex ... gap-x-4` row, differing only by fill. Submitting sets `status` out of 'draft', and `locked = Boolean(sheet && sheet.status !== 'draft')` (line 80) then makes every field `readOnly` — permanently, enforced by the `sheets_guard` trigger. The artifact is the same: `alreadyOut && !submitting ? existing.status : status` in actions/lms.ts:239 means a submitted artifact can never return to draft. There is no confirmation step, no review-before-submit screen, and no undo anywhere in the codebase.

**Cost.** SC 3.3.4 (AA) covers pages that 'submit user test responses' or 'modify user-controllable data' and requires the action to be reversible, checked, or confirmed. None of the three is present. A learner with a motor impairment, or anyone who mis-hits by 16px, permanently loses the ability to correct the record of the one deployment the whole course exists to produce.

**Fix.** Add a confirm step to the submit intent only: on first press render a `role="alertdialog"` (or a server-rendered `?confirm=1` state) that shows the three measures back and requires a second, differently-worded press. Separate the two buttons visually and in the DOM — 'Save draft' as a text action, 'Submit' as the sole filled control, with at least 24px between their bounding boxes.

### There is no admin console. /admin returns the raw framework 404, not even the app's own not-found page.

`admin-ux` · **/admin (screenshot 43)** · `src/app/(app)/ — no admin directory exists (verified: `find src/app -iname "*admin*"` returns nothing)`

**Evidence.** Screenshot 43 is a bare white page with '404 / This page could not be found.' in the default Next.js system font stack — no header, no logo, no nav. src/app/(app)/not-found.tsx exists and is branded, but /admin sits outside the (app) group so it never renders. There is no route, no layout, no link, and nothing in the header for an admin (app-header.tsx:37-45 adds Instructor and Judge links for admins and nothing else).

**Cost.** Every operational act — granting a role, assigning an instructor, seating a judge, publishing a lesson, finding a learner, answering 'is anyone stuck' — currently requires opening the Supabase SQL editor against production. That is not a workflow that survives a second staff member, and it is a workflow where one mistyped WHERE clause deletes learner progress. The whole content plan (video, audio, docs, quizzes) is blocked behind this.

**Fix.** Build /admin as a real console with its own layout and its own left rail (this is the one place the no-sidebar rule must break — back-office is a destination, not a reading surface). Five sections: Overview, People, Courses, Queues, Content. Screen 1, Overview, is a single scroll at ~1200px max-width, no hero, no greeting, h1 at 24px not 44px. Row 1: five stat tiles, 88px tall, number at 32px with a 14px label and a 7-day delta — Learners (new this week), Active this week, Artifacts awaiting review (oldest N days), Sheets awaiting a score (oldest N days), Courses live / drafted. Every tile is a link into a filtered list. Row 2, two columns: left, 'Needs a human' — one dense list of the ten oldest unactioned items across both queues, each row 44px: [type icon] [course badge] [module or sheet ref] [assignee or UNASSIGNED in red] [age]; right, 'Recently changed' — an audit feed of the last 20 admin actions with actor, verb, object, timestamp. Row 3: full-width table, one row per course — enrolled, started module 1, reached module 8, submitted a sheet, scored — so drop-off is readable across five courses in one glance. That screen answers 'is anything broken and is anyone waiting' in under five seconds, which is the only job an admin home has.

### The admin's home screen is the learner dashboard. The owner of the platform is invited to 'Start module 1'.

`admin-ux` · **/dashboard as admin (screenshot 40)** · `src/app/(app)/dashboard/page.tsx:50`

**Evidence.** `<h1 className="t-display">Welcome back, {viewer.name}.</h1>` renders 'Welcome back, Admin.' at display size, followed by 'Five courses, all open. Start with the one closest to the work you already do.' and five course cards whose primary action is 'Start module 1 →'. Nothing on the page differs by role. The first ~250px of the viewport is a greeting; the entire fold is a course catalog.

**Cost.** There is no signed-in surface anywhere that tells the operator how the business is doing. Not one query in src/lib/lms/queries.ts aggregates across learners — every function is scoped to `userId` or to a single assignment. An operator who wants to know how many people signed up this week has to write SQL, which means they will not look.

**Fix.** Route by role at the shell, not by content: if the viewer holds `admin`, /dashboard redirects to /admin. Keep /dashboard reachable as 'View as a learner' from the admin rail so the operator can still check the learner experience deliberately. On the admin home, kill the greeting entirely — an operations screen opens with numbers, not with the operator's own name. Density target: the Overview fold should carry roughly 30 discrete facts, against the current 5 course titles.

### An admin has full route access and zero data access. Every staff page keys off personal assignment rows, so oversight is structurally impossible without falsifying the data model.

`admin-ux` · **/instructor and /judge as admin (screenshots 41, 42)** · `src/lib/auth.ts:122; src/app/(app)/instructor/page.tsx:39-40; src/app/(app)/judge/page.tsx:54-56`

**Evidence.** `requireRole` waves admins through (`if (!viewer.is(role) && !viewer.is("admin")) redirect("/dashboard")`), but the pages then call `getTaughtCourses(viewer.id)` and `getMySeat()` — both scoped to the caller personally. Screenshot 41: an admin on /instructor sees 'No courses assigned yet'. Screenshot 42: the same admin on /judge sees 'You do not hold a seat yet'. The admin was let in specifically so they could administer these views, and both are empty by construction.

**Cost.** The only way for an operator to read a learner's submitted artifact, check whether an instructor is responding, or verify a judge's scores is to insert themselves into `instructor_assignments` and `judge_seats` — which pollutes the assignment tables with fake teaching relationships and makes 'who is actually responsible for course A' unanswerable. Quality control on the whole marking pipeline is currently unavailable to the one person accountable for it.

**Fix.** Stop overloading the staff consoles with admin. Give admin its own read surfaces under /admin that are course-scoped rather than assignment-scoped, backed by their own RLS policies (`is_admin()`), and mark them visually as oversight not participation — a persistent 'Viewing as administrator' bar, and admin-authored feedback either disabled or explicitly attributed. Revert auth.ts:122 to a strict role check once /admin exists; the comment there ('an admin locked out of the instructor view they are meant to be administering') is a workaround for a missing screen, not a policy.

### Empty states ship raw Postgres table names to external practitioners and offer no action.

`admin-ux` · **/instructor and /judge, first-run (screenshots 41, 42)** · `src/app/(app)/instructor/page.tsx:56-63; src/app/(app)/judge/page.tsx:61-73`

**Evidence.** The instructor console renders 'Course assignments are made by an administrator, in `instructor_assignments`.' with the table name in a code chip. The judge console renders 'A seat is bound to a person by an administrator, in `judge_seats`.' Both are the entire first-run experience. Neither offers a contact, a request-access action, or an email address; the judge's only link goes to the public marketing page /review-judge-board.

**Cost.** These consoles are for named external practitioners — the people whose faces are on the marketing site. Their first impression of the platform is an internal schema identifier and a dead end. It also leaks the data model to every unassigned account, and it tells the reader that the fix lives somewhere they cannot reach, with no way to ask.

**Fix.** Rewrite both to be person-facing and actionable: title 'You are not teaching a course yet', body 'Roan assigns courses. If you expected one here, ask and it will appear within a day.', primary action a real mailto/contact button, secondary 'See the five courses'. Then delete the need for them: the admin People screen must make assignment a two-click action, so the empty state becomes rare rather than the norm it is today (four of five named instructors have no course).

### Roles, instructor assignments and judge seats are hand-written SQL against production. There is no list of who holds what, no revoke, and no audit trail.

`admin-ux` · **everywhere — the entire permissions model** · `src/lib/auth.ts:76 (the only read of `user_roles` in the codebase; nothing in src ever writes it, or `instructor_assignments`, or `judge_seats`)`

**Evidence.** No route, action or component writes `user_roles`, `instructor_assignments` or `judge_seats`. src/app/actions/ contains lms.ts, profile.ts and auth.ts and none of them touch roles. There is no audit table referenced anywhere (grep 'audit' in src returns only course copy). The seed script runs from a laptop with SUPABASE_SERVICE_ROLE_KEY and deliberately omits `user_id` from the judge_seats upsert to avoid unbinding people — a hazard that only exists because binding is manual.

**Cost.** Granting or revoking access is an untracked, unreviewable, hand-typed UPDATE against production by one person. Nobody can answer 'who can read learner submissions today' without querying the database, revocation depends on someone remembering, and there is no record of who granted what or when — which is both an operational and a data-protection liability given instructors read learners' written work.

**Fix.** Screen 2, People. A single table at full width, 44px rows, sorted by last-active desc, with a persistent search box (name, email — one field, no dropdown) and three filter chips: Role, Course, Status. Columns: avatar+name, email, roles as small chips, courses/seat, enrolled count, last active, and a right-aligned '···' menu. The table is the whole screen; no cards. Row click opens a right-hand drawer (480px, does not navigate away — an admin granting five people a role should never lose their place in the list) containing: identity block, Roles as toggles (learner/instructor/judge/admin) that write immediately with an undo toast, Course assignments as a multi-select, Judge seat as a single select showing the six seats with their current holder inline so double-booking is visible at the point of decision, then Enrollments and Activity, then destructive actions behind a confirm-by-typing. Every one of those writes an audit row rendered on the Overview feed. Two clicks to make someone an instructor of Course A, from a screen the operator was already on.

### There is no persistent client boundary in the (app) shell, so audio stops on every navigation

`audio-ux` · **Every signed-in route — /learn/[slug]/[n]/[pos], /learn/[slug]/[n], /dashboard (screenshots 11-14)** · `src/app/(app)/layout.tsx:27-43`

**Evidence.** The layout is a server component that renders exactly `<a skip> <AppHeader/> <main id="main">{children}</main> <SiteFooter/>`. There is no client component, no portal target, no player host, no context provider. Grep across src/ for `"use client"` under (app) and components/lms returns only error.tsx and account-form.tsx. Any `<audio>` element therefore has to live inside the page segment, which React unmounts on every route change. Worse: the header's own nav (app-header.tsx:39) points "Catalog" at /courses, which lives in the sibling `(site)` route group — crossing route groups tears down the entire `(app)` layout tree, so even a layout-hosted player dies on one of the three nav links you show every learner on every page.

**Cost.** The entire value proposition of podcast audio is that you listen while doing something else. Here, pressing "Complete and continue", prev/next, a breadcrumb, or Catalog silences the episode mid-sentence with no way to get back to the second you were on. Every podcast app and every LMS that ships audio (Coursera, Blinkist, Audible, Spotify's course product) keeps a mini-player alive across navigation. This one cannot.

**Fix.** Add a client `PlayerHost` mounted once in src/app/(app)/layout.tsx, outside `<main>`, holding a single long-lived `<audio>` element in a React context (or a module-level singleton so it survives even a Fast Refresh). Pages publish a track descriptor to it; they never own the element. Then either (a) move /courses into the (app) group for signed-in users, or (b) point the header's Catalog link at an in-group route so no primary nav link crosses the group boundary. Verify persistence with a real click-through, not by reasoning about it.

### The schema has nowhere to store a playback position — resume-where-you-stopped is not buildable today

`audio-ux` · **Data model behind /learn/* and /dashboard (screenshot 10)** · `src/lib/supabase/types.ts:109-113`

**Evidence.** `LessonProgress` is exactly `{ user_id, lesson_id, completed_at }` — a row that exists or does not. There is no `position_seconds`, no `duration_seconds`, no `updated_at`. `LessonRow` (types.ts:65-74) is `{ id, module_id, name, kind, minutes, body, position }` — no media reference of any kind. The only near-miss is `Enrollment.last_module_id` (types.ts:106), which `touchEnrollment` writes at src/app/actions/lms.ts:109-115 — and which no query in src/lib/lms/queries.ts ever selects. Grep for `last_module_id` in queries.ts: zero hits. It is a dead column.

**Cost.** Cross-device resume is the single most-expected podcast behaviour — a listener starts on the commute and finishes at a desk. Without a position column there is no server-side resume at all, and because `last_module_id` is unread there isn't even module-level resume. Storing it in localStorage instead would be a device-local hack that breaks the exact scenario audio exists to serve.

**Fix.** Add `position_seconds int not null default 0` and `updated_at timestamptz` to `lesson_progress`, and make the row upsert on first play rather than only on completion (so an in-progress lesson has a row). Add `duration_seconds` and a media reference to the lesson/block table. Throttle position writes to one every 10-15s plus one on `pause`/`ended`/`visibilitychange:hidden`, and use `navigator.sendBeacon` for the unload write since a Server Action will not complete during teardown.

### "Continue" on the dashboard does not continue anything — it dumps you at the course board

`audio-ux` · **/dashboard (screenshots 10 desktop + mobile: "Applied AI for GTM teams · 6 of 39 lessons · 15% · Continue →")** · `src/app/(app)/dashboard/page.tsx:97`

**Evidence.** `href={`/learn/${course.slug}`}` — the identical URL used by the "Start module 1" link on the untouched courses in the same list. The only thing that differs between a learner 6 lessons in and one who has never opened the course is the label string at line 102 (`isStarted ? "Continue" : "Start module 1"`). The page's own docstring at line 29 claims "Continue and Start are the same control", which is honest about the code and dishonest to the learner. And the h1 above it says "Pick up where you left off".

**Cost.** This is already the worst bug on the dashboard for text lessons, and audio makes it fatal. A returning listener expects one tap to land in the episode at 14:32. Today they get a course index and must remember which of 39 lessons they were on. Every podcast app on earth has solved this; this one has the data (`last_module_id`) written and throws it away.

**Fix.** Read `enrollments.last_module_id` in getDashboard, plus the most recently touched `lesson_progress` row, and make Continue deep-link to `/learn/[slug]/[n]/[pos]`. Once positions exist, label it with the real state: "Resume · Module 02, Lesson 3 · 14:32 left". If nothing has been started, keep the current href and say "Start module 1".

### No transcript model, and prose.tsx structurally cannot carry one — audio would be inaccessible on day one

`audio-ux` · **/learn/[slug]/[n]/[pos] (screenshot 14)** · `src/components/lms/prose.tsx:26-101`

**Evidence.** The renderer supports exactly `## heading`, `- bullet`, `---`, `**bold**`, `_italic_`. There is no cue syntax, no timestamp token, no anchor. `LessonRow.body` (types.ts:72) is a single text column that is already the lesson prose, so there is no second field a transcript could occupy. Grep for `vtt`, `caption`, `transcript` across src/: nothing but marketing image captions in content.ts. There is no WebVTT file, no `<track>` element anywhere (the one video component, src/components/video-player.tsx:69-81, ships `<video controls>` with no `<track>` either).

**Cost.** A podcast lesson with no transcript is a lesson deaf and hard-of-hearing learners cannot take, on a product whose entire positioning is "free, open to everyone, module 1 needs no account". It is also the only way anyone skims, searches, or quotes an episode, and it is the only reason an audio lesson is indexable. WCAG 1.2.1 makes a transcript the minimum for prerecorded audio-only; there is no compliant path from the current data model.

**Fix.** Give the block/lesson table a `transcript_vtt text` column (WebVTT, not plain text — you get cue timings for free and can render a click-to-seek transcript). Render it as a collapsible panel under the player with the active cue highlighted and each cue seeking the shared audio element on click. Feed the same VTT to a `<track kind="captions">` on any video block. Do not let an admin publish an audio block without one.

### An unresolved `[FILL:]` authoring marker is rendered as visible UI in production

`copy` · **/judge/review/[sheetId] — the judge scoring screen, whenever a course has no rubric rows** · `src/app/(app)/judge/review/[sheetId]/page.tsx:160`

**Evidence.** The rendered JSX string is literally `No rubric criteria exist for this course yet. [FILL: rubric criteria.]`. It is not in a comment — it is the `<p>` inside the `criteria.length === 0` branch. Six other `[FILL: …]` markers exist in this codebase and all six are correctly confined to doc comments (learn/[slug]/[n]/page.tsx:60, outcome/[courseId]/page.tsx:40, judge/page.tsx:39 and :159, account/page.tsx:20, instructor/page.tsx:30). This one leaked into the DOM.

**Cost.** An external judge — a person recruited for their credibility, whose name is on the public Practitioner Review Judge Board page — opens a learner's submitted work and is shown an internal TODO. It tells them the assessment instrument does not exist, in the project's own shorthand. Nothing recovers credibility from that.

**Fix.** Replace with copy addressed to the judge: title `Scoring opens when the rubric is set`, body `This course has no rubric yet. Your reading of the sheet is recorded when the criteria are published.` Then add a CI check (`grep -n '\[FILL:' src --include=*.tsx` restricted to non-comment lines) so an authoring marker can never ship inside JSX text again.

### Every one of the 173 lessons ships an author's confession that the prose is unwritten, plus "Watch, then write down" when there is nothing to watch

`copy` · **/learn/[slug]/[n]/[pos] — every lesson in all five courses** · `scripts/seed-catalog.mjs:158, :202`

**Evidence.** Screenshot 14 shows both, verbatim: the `What this covers` section opens `Watch, then write down where this applies to your own process.` (seed-catalog.mjs:158, applied to every `kind: "lesson"`), and the body ends in italics with `Course scaffolding: the structure of this lesson is final, the prose is being written. The labs, the template and the artifact it feeds are real and are what the module is assessed on.` (seed-catalog.mjs:202, appended to all 173 bodies). Ground truth confirms there is no video player anywhere in (app) and prose.tsx structurally cannot emit one — so "Watch" points at nothing.

**Cost.** The one screen the entire product exists to deliver tells the learner, in the product's own voice, that it is a placeholder. "Watch" then asks them to consume media that is absent, so they hunt for a broken player before concluding the site is broken. This is the single most damaging string on the site and it appears 173 times.

**Fix.** Two separate jobs. (a) Delete line 202 outright — an unwritten lesson should render the existing fallback at learn/[slug]/[n]/[pos]/page.tsx:113 (`This lesson has no written content yet.`), rewritten to `Written prose for this lesson is in progress. The lab and the artifact below are the assessed work.` and shown once at the top, not signed at the bottom of fake prose. (b) Make line 158 conditional on media actually existing: a `lesson` kind with no media block should read `Read this, then write down where it applies to your own process.` Reinstate "Watch" only when the Phase 3 lesson_blocks video model lands.

### The empty states on both role consoles explain Postgres tables to their readers

`copy` · **/instructor (screenshot 41) and /judge (screenshot 42) — the entire first screen for every unassigned instructor and unseated judge** · `src/app/(app)/instructor/page.tsx:56, src/app/(app)/judge/page.tsx:62`

**Evidence.** Instructor: `No courses assigned yet` / `Course assignments are made by an administrator, in instructor_assignments. Until one exists there is nothing here to read, and no learner work is visible to you.` — with `instructor_assignments` set in a monospace `<code>` chip. Judge: `You do not hold a seat yet` / `A seat is bound to a person by an administrator, in judge_seats.` — same treatment. Both screenshots confirm the table names render. Ground truth says there is no admin console, so the named remedy is unreachable by anyone reading it.

**Cost.** Instructors and judges are outside experts, not staff. Their first and possibly only screen names a database table they cannot see, in a system they cannot access, and offers no human to contact. It reads as a leaked implementation detail because it is one. The judge state is worse — its only action is `See the six seats`, a marketing page, which is a dead end.

**Fix.** Strip both table names. Instructor: `Nothing assigned yet` / `Roan assigns courses by hand while the admin console is being built. Email him and he will attach yours.` with a mailto button. Judge: `Your seat is being set up` / `The board has six seats, one per course. Roan binds yours by hand today. Email him to confirm which course you are reading.` Both must name a person and a channel, because a person is the actual mechanism.

### A brand-new account's first screen in the product says "Welcome back"

`copy` · **/dashboard — first load after email confirmation, for every account ever created** · `src/app/(app)/dashboard/page.tsx:50`

**Evidence.** `<h1 className="t-display text-ink">Welcome back, {viewer.name}.</h1>` is unconditional. Only the subline below it branches on `inProgress` (line 53). src/app/actions/auth.ts:88 sends the confirmation link to `/auth/confirm?next=…` and :166 redirects to `next`, which is `/dashboard` for anyone who signed up from the header — so the first thing a person sees after creating an account is a greeting written for a returning user. Screenshots 10 and 17 confirm the 44px h1.

**Cost.** It is the first sentence of the relationship and it is factually wrong. It also signals that nobody has walked the new-account path, which is the exact impression a free product cannot afford at the moment a stranger has just handed over an email address.

**Fix.** Branch the h1 on the same value the subline already computes: `inProgress ? \`Welcome back, ${viewer.name}.\` : \`You are in, ${viewer.name}.\``. Better, branch on whether any enrollment exists at all rather than on lessons completed, since a learner who enrolled but finished nothing is also not "back".

### There is no first-run onboarding of any kind; the entire welcome is one conditional sentence

`copy` · **Every signed-in surface, for a brand-new account** · `src/app/(app)/dashboard/page.tsx:52-56`

**Evidence.** `grep -rni "onboard|first run|welcome|getting started|tour|checklist" src/app/(app) src/components/lms` returns exactly two hits: the greeting h1 and an unrelated word inside a code comment in ui.tsx. The only new-user accommodation in the product is the alternate subline `Five courses, all open. Start with the one closest to the work you already do.` Nothing anywhere explains the model the product is built on: that completion means you deployed a workflow and measured it, that each module ends in an artifact written into a textarea, that each course ends in an outcome sheet scored by a review board, or that the account they just made opened modules 2 to 8.

**Cost.** This product's mechanic is unusual and load-bearing. A learner arriving from the marketing site has read "completion by deployment"; a learner arriving from a search result has not. Without a first-run explanation they treat it as a normal course site, click through lessons, never touch the artifact textarea, and never produce the one output the whole system exists to collect.

**Fix.** Ship a dismissible first-run panel above the course grid, rendered when `enrolled.length === 0`, with three lines that name the mechanic: `You deploy one workflow. Each module ends in an artifact you write here. Each course ends in an outcome sheet the review board scores.` Persist dismissal as a column on `profiles` (`onboarded_at`), not localStorage, so it survives devices. No modal, no tour — a panel that stops appearing is enough.

### "Continue" does not continue — it goes to the course's table of contents, and no resume position is stored anywhere

`ia-nav` · **/dashboard (10), /learn/[slug] (11)** · `src/app/(app)/dashboard/page.tsx:99`

**Evidence.** Screenshot 10: the Course A card reads "6 of 39 lessons · 15%" and the primary control is "Continue →". The href is `/learn/${course.slug}` — the course board. From there the board's own Continue (src/app/(app)/learn/[slug]/page.tsx:117) goes to `/learn/${slug}/${resumeN}` — a module, still not a lesson. `resume` is computed at request time as "first unlocked module with done < lessons.length" (learn/[slug]/page.tsx:70-72). A grep across src/lib and src/app for last_lesson / last_position / current_module returns nothing: there is no persisted position in the schema. A learner who was on lesson 3 of module 2 pays three clicks and two navigation decisions to get back, and the app never once tells them which lesson that was.

**Cost.** Resume is the single most-used control in any LMS and it is the whole reason a signed-in learner opens the site on day two. Making them re-derive their own place, every session, from a 39-lesson contents list is how a free course dies at lesson 4. Every competitor (Teachable, Thinkific, Coursera, even Notion-based courses) resumes to the exact unit.

**Fix.** Add `lesson_progress.last_seen_at` (or a `user_course_position` row written by toggleLesson and by the lesson page render). Make the dashboard card's Continue point at `/learn/<slug>/<n>/<pos>` of the last-seen lesson and label it with that lesson's name: "Continue · Find the high-value use cases". Fall back to the first incomplete lesson, then to `/learn/<slug>/01/0`. Same href on the course board's Continue button.

### The lesson page — the only screen with dwell time — has no syllabus, no module progress, and 496px of empty column

`ia-nav` · **/learn/[slug]/[n]/[pos] (14 desktop + mobile)** · `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:95`

**Evidence.** The lesson page renders a single `<div className="mt-5 max-w-[720px]">` inside a 1280px Container with lg:px-8 — 1216px of usable width, 720px used, 496px left blank (visible as dead space in screenshot 14 desktop). The module page one level up renders `grid lg:grid-cols-[minmax(0,1fr)_320px]` with a sticky "THIS MODULE" rail (learn/[slug]/[n]/page.tsx:106, 323-340). So the level that needs context least has a persistent progress rail and the level that needs it most has nothing. While reading, a learner cannot see the other 3 lessons in this module, cannot see how far through the module they are, and cannot jump to lesson 4 without leaving the page.

**Cost.** "What is this part of, and what is next" is unanswerable from inside the content. To move from lesson 1 to lesson 4 of the same module you either click Next three times through content you don't want, or go up to the module and back down (2 loads, losing scroll position). When video and audio arrive, losing playback position on every up-and-down navigation turns this from annoying into destructive.

**Fix.** Reuse the module page's aside on the lesson page: same grid, sticky at lg:top-24, containing the Meter plus the module's lesson list with the current one marked `aria-current="page"`. Under lg, collapse it to a `<details>` "Module 01 · 4 lessons" disclosure directly under the breadcrumb, not at the page foot.

### There is no course. 173 lessons are seed-script scaffolding that tells the learner to watch a video that does not exist

`innovation` · **/learn/[slug]/[n]/[pos] — every lesson in all five courses** · `scripts/seed-catalog.mjs:155-161, rendered by src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:113`

**Evidence.** Screenshot 14: the lesson body reads "Watch, then write down where this applies to your own process", the header says "14 MIN" beside a play glyph, and the page ends in italics with "Course scaffolding: the structure of this lesson is final, the prose is being written." lessonBody() in seed-catalog.mjs generates that string from a three-key map on lesson.kind; there is no media anywhere in (app).

**Cost.** Udemy will not publish a course without media; Coursera gates on it; even Skool and Teachable show a duration bar that maps to something real. A learner who signs up, opens lesson 1 and reads a machine-written outline that tells them to watch nothing and then admits it is a placeholder does not come back, and will not tell a colleague. Every other finding in this report is downstream of this one.

**Fix.** Until real bodies exist, stop shipping the lie: drop the play icon and the "N min" chip for lessons with no media (kindIcon in [pos]/page.tsx:32-35 and the minutes chip at :104), replace the generated "Watch, then..." opener, and hoist the scaffolding disclaimer to the top of the page as a visible banner rather than burying it after 600 words. Then write module 1 of one course end to end and ship that as the only unlocked content.

### Judges score "Deployment verified" with literally zero evidence in front of them

`innovation` · **/judge/review/[sheetId]** · `src/lib/lms/queries.ts:566 (SHEET_COLUMNS) and :617-637 (getSheetForReview)`

**Evidence.** Screenshot 31: the judge sees a title, three self-typed measure rows and a footnote paragraph, then scores four criteria 1-5 including "Deployment verified — The workflow runs in a working environment, not a demo". getSheetForReview selects only outcome_sheets columns plus outcome_rows; it joins no artifacts, no URLs, no screenshots, no run logs. The eight module artifacts the learner spent six weeks writing are never shown to the judge.

**Cost.** The judge board is the product's entire credibility claim and the reason to prefer this over a YouTube playlist. Right now a judge is rubber-stamping a text box. If one verified sheet is ever shown to be fabricated, the "Practitioner Review Judge Board" in your footer becomes a liability rather than a moat.

**Fix.** Join the learner's submitted artifacts (artifacts where module.course_id = sheet.course_id and status <> 'draft') into getSheetForReview and render them beside the rubric, plus an evidence block on the sheet form: a required URL or file per claim, and a "what a judge can check" field. If a criterion cannot be evidenced, delete the criterion.

### The learner never sees their score, and the judge is told they can

`innovation` · **/dashboard/outcome/[courseId] vs /judge/review/[sheetId]** · `src/app/(app)/dashboard/outcome/[courseId]/page.tsx (whole file) and src/app/(app)/judge/review/[sheetId]/page.tsx`

**Evidence.** Screenshot 31 ends with "Your scores are yours. Other judges on this sheet file their own, and the learner can read all of them." Screenshot 15 is the same sheet from the learner's side: status chip "SUBMITTED" and read-only boxes, nothing else. grep for "judgements" in src/ returns only the judge pages and the write action; queries.ts exports no learner-side score read, and the outcome page renders none.

**Cost.** The whole spine of the product is build → measure → get judged. The learner reaches the end of a six-week course, submits, is redirected to the dashboard, and the loop never closes. Coursera returns a graded rubric with per-criterion feedback; Maven returns a human review; even Sololearn returns a pass/fail on a code challenge. Here the reward for finishing is silence, and a sentence in the judge UI that is factually false.

**Fix.** Add getMyJudgements(sheetId) and render, on the outcome sheet, each criterion with the score, the judge's note and the seat that filed it (seat name, never person — the seat is already public on /review-judge-board). Show "2 of 3 judges have filed" while incomplete. If scores are deliberately private, fix the copy in the judge page instead — but pick one.

### Completion issues nothing. completion_records is typed, never written, never read

`innovation` · **end of every course; /dashboard** · `src/lib/supabase/types.ts:158-164`

**Evidence.** CompletionRecord { reference, issued_at } exists as a type. grep -rn "completion_records|CompletionRecord" across src/ and scripts/ returns exactly one hit: the type declaration. Meanwhile module 08 of Course A is titled "Governance and capstone — the controls that let it run without you, and the record that proves it ran" and its artifact is named "Completion record" (screenshot 11).

**Cost.** You promise a record in the curriculum copy and never issue one. Every competitor — Coursera, Udemy, Google/Microsoft/NVIDIA in your own benchmark folder, Sololearn, even Duolingo — ends with a shareable artifact the learner posts to LinkedIn, which is the only free distribution channel a free course has. You are giving away the course and keeping none of the marketing.

**Fix.** Issue the record on sheet verification: write completion_records, add /record/[reference] as a public, indexable page showing course, seat(s) that verified, the pre-registered measures and the delta, plus an OG image. That page is your acquisition engine and it costs one route.

### Every lesson body in the product is the same machine-generated template with the title substituted in

`learning-design` · **/learn/[slug]/[n]/[pos] — all 173 lessons, all five courses** · `scripts/seed-catalog.mjs:155-204`

**Evidence.** lessonBody() emits a fixed skeleton for every lesson: bold course/module/lesson line, the module summary verbatim, '## What this covers', one of three canned shape sentences keyed off lesson.kind, three bullets generated by string-interpolating the lesson's own name ('Where "map your customer journey end to end" fits in the gtm ai operating model.' / 'The two failure modes teams hit here' / 'A worked example on a process the size of yours'), '## Why it is here' (which just restates the module artifact), '## Before you move on', and a closing italic: 'Course scaffolding: the structure of this lesson is final, the prose is being written.' (seed-catalog.mjs:202). The 14-student-lesson screenshot is that template verbatim. No per-lesson content exists anywhere else — lessons.body is written only by this function.

**Cost.** A learner opens lesson 1, reads 'the two failure modes teams hit here' with no failure modes named, then opens lesson 2 to find the identical page with a different title. By lesson 3 they have decoded the template and there is nothing left to discover — the pattern is the content. Day 3 does not exist: nobody returns to read the same generated page a ninth time. This one fact makes every other instructional-design question moot, and it shipped behind a UI that agonised over aria-pressed.

**Fix.** Stop seeding bodies. Add a status column to `lessons` ('authored' | 'unwritten') and render an explicit 'not written yet' state (learn/[slug]/[n]/[pos]/page.tsx:114-118 already handles a null body) instead of generated filler. Then either author the ~35 lessons of one course properly and ship one course, or mark the catalogue in-development. Publishing 173 generated pages as a curriculum is the thing to reverse before anything else on this list.

### A learner is scored by four weighted judge criteria and there is no code path anywhere that shows them the score

`learning-design` · **/dashboard/outcome/[courseId] vs /judge/review/[sheetId]** · `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:52-290`

**Evidence.** The learner's outcome-sheet page imports getOutcomeSheet only, which selects outcome_sheets + outcome_rows and nothing else. `judgements` is read in exactly one place in the entire app — the judge's own 'have I already scored this' set at src/lib/lms/queries.ts:598-605. Meanwhile the judge review screen prints, under File my scores: 'Your scores are yours. Other judges on this sheet file their own, and the learner can read all of them.' (31-judge-review-sheet--desktop.png). The learner cannot read any of them. 15-student-outcome-sheet shows a submitted sheet with no score, no criteria, no judge note, no ETA and no 'what happens next'.

**Cost.** This is the entire feedback loop of the product and it terminates in a void. The whole pedagogy rests on 'deploy, measure, get judged by practitioners' — the learner does the hardest work the program can ask for (a real deployment, a real before/after) and receives literally nothing back. It is also a false statement rendered to judges, who file scores believing they are writing to the learner.

**Fix.** Add getJudgementsForSheet(sheetId) returning criterion label, description, weight, score and note per judge (RLS: sheet owner may read judgements on their own sheet), and render it above the read-only form on dashboard/outcome/[courseId] as a per-criterion breakdown with the weighted total. Until that ships, delete the sentence at the bottom of judge/review/[sheetId]/page.tsx — do not tell judges the learner will read something the learner cannot read.

### Completion is unreachable: nothing ever writes sheet status 'verified' or enrollment status 'completed'

`learning-design` · **/dashboard, /dashboard/outcome/[courseId]** · `src/app/actions/lms.ts:397-453`

**Evidence.** saveJudgement upserts into `judgements` and returns; it never touches outcome_sheets.status. Grepping the repo for 'verified' finds it only in the type union (src/lib/supabase/types.ts:30), the seeded rubric label, and one unreachable copy branch at dashboard/outcome/[courseId]/page.tsx:125-126 ('The review board has verified this sheet'). 'completed' appears only in the enum (types.ts:28) and in the dashboard chip that reads it (dashboard/page.tsx:83) — no write exists anywhere. No instructor or admin control promotes a sheet either.

**Cost.** The FAQ (content.ts:2732) says 'A course completes when your workflow runs live and you have measured it… That pairing is what makes the completion record worth sharing.' The product cannot express completion. A learner who deploys, measures over 30 days, submits and is scored by three judges will see the word 'submitted' on their dashboard forever. There is nothing to share, nothing to celebrate, no terminal state — the single strongest reason to come back on day 10 does not exist in the codebase.

**Fix.** Give the judge console a 'verify this sheet' action (or auto-verify once every seated judge for the course has filed and the weighted total clears a threshold) that writes outcome_sheets.status='verified' and enrollments.status='completed'. Then build the completion record as a real page — /record/[sheetId] with the before/after table, the criteria scores, the judge seats that read it and a date — because that page is the product's actual promise.

### Progress is 100% self-declared and can be maxed out without opening a single lesson

`learning-design` · **/learn/[slug]/[n] and every progress meter in the app** · `src/app/(app)/learn/[slug]/[n]/page.tsx:163-198`

**Evidence.** The module page renders a per-lesson tick form inline in the lesson list, so the module screen offers 4-6 one-click completion buttons beside titles the learner has not opened (12-student-module-done, 13-student-module-partial). toggleLesson (actions/lms.ts:127-179) writes a lesson_progress row on a button press with no precondition — no dwell time, no scroll, no artifact, no question answered. Every number in the product derives from that table: the '6 of 39 lessons / 15%' meter (components/lms/ui.tsx Meter), the dashboard cards, the resume target, the module DONE chip.

**Cost.** The only signal the system collects about learning is one the learner generates by clicking, and the product treats it as evidence — it drives resume, the dashboard, the outcome-sheet gate, and renders a confident '15%' next to 'DONE'. A learner who clicked through in ninety seconds and one who did the work are indistinguishable to every screen and to the instructor console.

**Fix.** Two changes. (1) Remove the tick buttons from the module list — completion should only be markable from inside the lesson, where learn/[slug]/[n]/[pos]/page.tsx:136-146 already has the correct 'Complete and continue' control. (2) Stop calling it progress: relabel the meter 'lessons you have marked done', or better, derive the headline number from artifacts submitted (artifacts rows with status <> 'draft') — '2 of 8 artifacts' is a claim the system can actually back.

### The learner never sees the rubric they will be scored against

`learning-design` · **/learn/[slug]/[n] (artifact), /dashboard/outcome/[courseId]** · `src/lib/lms/queries.ts:642-644`

**Evidence.** rubric_criteria is queried in exactly one place, inside the judge-only getRubric path consumed by judge/review/[sheetId]/page.tsx:153-160. Grepping 'rubric' across src/ returns judge pages plus one lesson title. The four criteria and weights are hard-coded at scripts/seed-catalog.mjs:292-296 — Deployment verified (weight 2), Measurement quality (2), Workflow durability (1), Documentation (1) — and are invisible to the person being assessed. Neither the artifact editor nor the outcome-sheet page mentions them.

**Cost.** The learner is asked to deploy a production workflow and will be judged on durability and documentation, and is never told that durability and documentation are scored, or that deployment and measurement are worth twice as much. That is not assessment, it is a trap. Publishing criteria before the work is the cheapest instructional-design intervention that exists and it changes what learners build.

**Fix.** Render the four criteria with descriptions and weights on /dashboard/outcome/[courseId] above the form, and as a collapsed 'How this will be judged' block beside the module 08 artifact. Same query, no new schema. Show the same rows the judge sees so the two cannot drift.

### The outcome sheet's AFTER column is completely off-screen at 390px, with no scroll affordance

`mobile-perf` · **/dashboard/outcome/[courseId] (screenshot 15-student-outcome-sheet--mobile)** · `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:182-183`

**Evidence.** `<div className="mt-8 overflow-x-auto"><table className="w-full min-w-[560px]">`. Container is `px-4` at mobile (src/components/ui/index.tsx:25), so the content column at 390 is 358px. 560 - 358 = 202px of the table, i.e. the entire third column, sits outside the viewport. The mobile capture confirms it: the header row reads "MEASURE | BEFORE" and stops; the first measure input renders as "Research time per ac" clipped mid-word; there is no AFTER column, no scrollbar, no fade, no shadow, nothing that says more exists. iOS/Android hide overlay scrollbars until you scroll, so a learner has no signal at all that a third of the form is there.

**Cost.** The outcome sheet IS completion. The product's definition of finishing a course is "you deployed a workflow and measured before and after". On a phone the after half of before-and-after does not exist. A learner fills in three measures and three before values, presses Submit, and ships a sheet that judges score as incomplete — and it is the site's fault, not theirs. This is the highest-stakes form in the product and it is the most broken screen at 390.

**Fix.** Drop `min-w-[560px]` and stop using a `<table>` layout below `sm`. Render the same data as three stacked field groups per measure (Measure / Before / After as labelled inputs in a card) under sm, and keep the `<table>` from sm up — a `<div className="hidden sm:block">` + `<div className="sm:hidden">` pair over the same three field names is fine because the server action already reads parallel `measure`/`before`/`after` fields. If the table has to stay, at minimum add a visible scroll affordance (right-edge mask + `tabIndex={0}` `role="region"` on the scroller so it is keyboard-reachable) and cut the min-width to ~440.

### Every primary action in the LMS is a 20px-tall bare text link — fails WCAG 2.5.8 AA, and the codebase already has the fix and does not use it

`mobile-perf` · **Dashboard, course board, module, lesson, judge console — all mobile screenshots** · `src/app/(app)/dashboard/page.tsx:100 (and :110, :117); src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:170,178,188,196; src/app/(app)/learn/[slug]/[n]/page.tsx:300,311,335; src/app/(app)/judge/page.tsx:64`

**Evidence.** Thirteen call sites use hand-rolled `className="t-button inline-flex items-center gap-1.5 …"` with no padding and no min-height. `t-button` is `font-size:14px; line-height:20px` (src/app/globals.css:358-362), so the hit area is exactly 20px tall. That includes "Continue" on every dashboard card, both prev/next lesson links, both prev/next module links, "All … modules", and the "Outcome sheet · submitted" link. Meanwhile src/components/ui/index.tsx:398-399 defines `textActionClass` as `inline-flex min-h-[44px] items-center py-2.5 … lg:min-h-0` with a comment saying "44px minimum tap target below lg" — the correct component exists, is exported as `TextAction`, and is imported by exactly one LMS page (learn/[slug]/page.tsx) for a footnote link, not for any of the primary actions. The header's own nav links are the same: `t-nav` (14/20) with no padding, in a row that is `py-2.5` (src/components/lms/app-header.tsx:145,161).

**Cost.** WCAG 2.5.8 (AA) requires 24×24 CSS px; 20px fails outright, and Apple/Material both ask 44/48. On a phone the single most-used control in the entire product — "Continue" — is a 20px strip. Mis-taps land on the card body (which is not a link) and nothing happens, which reads as the app being broken rather than as a missed tap.

**Fix.** Replace all thirteen with `TextAction`/`TextButton` from src/components/ui/index.tsx, which already carries `min-h-[44px] py-2.5 lg:min-h-0 lg:py-0`. For the header nav, give `HeaderLink` `inline-flex min-h-[44px] items-center` (app-header.tsx:157-165) and change the mobile row's `gap-y-1` to `gap-y-0` so the taller links do not add height. Promote the dashboard "Continue" and the lesson "Next" to real buttons at mobile — full-width `h-11` accent buttons — since they are the product's forward path.

### Nothing renders until auth and data both complete: no static shell, no streaming, no PPR — a hard navigation on a phone network is a white screen for the whole server round-trip

`mobile-perf` · **Every route under (app)** · `src/app/(app)/layout.tsx:36; src/app/(app)/dashboard/page.tsx:11,33-34; next.config.ts`

**Evidence.** `export const dynamic = "force-dynamic"` is on every page in the group. `next.config.ts` has no `ppr` and no `cacheComponents`, and `grep -rn "Suspense" src/app/(app)/ src/components/lms/` returns nothing. The layout awaits `<AppHeader />`, which is `async` and awaits `getViewer()` (src/components/lms/app-header.tsx:35), so even the logo and the nav bar wait on Supabase. The sequence per hard navigation is: proxy middleware `supabase.auth.getClaims()` (src/proxy.ts:126) → page `getViewer()` = `getClaims()` then `Promise.all([roles, profile])` (src/lib/auth.ts:71-75) → the page query, which itself does a `rows()` then a nested `Promise.all` of three more (src/lib/lms/queries.ts:296, 146, 241). That is roughly four sequential network hops to Supabase before a single byte of HTML is flushed. `loading.tsx` only covers client-side navigations — it is a Suspense fallback and there is no Suspense boundary to stream into on a cold request. I did not measure TTFB in production; the structural claim is that 100% of the page is behind it.

**Cost.** On a phone this is the whole experience: opening a bookmarked /dashboard, following a link from an email, or a cold tab after the app is evicted from memory all mean staring at white with no brand, no header, no spinner. Learners hit reload, which restarts the same four hops. It is also the one perf problem that gets strictly worse when the course content becomes video and audio, because more of the page will depend on more queries.

**Fix.** Three things, in order of leverage. (1) Split the header out of the dynamic tree: render the logo and static nav immediately and wrap the viewer-dependent part (avatar, sign-out, role links) in `<Suspense>` so the shell streams at TTFB≈0. (2) Wrap each page's data region in `<Suspense>` with a route-shaped fallback so `force-dynamic` no longer blocks the document. (3) Collapse the auth waterfall — `getViewer` already runs roles+profile in parallel, but the middleware `getClaims()` and the page `getClaims()` are two separate hops; pass the claims through instead. Consider `cacheComponents` in next.config.ts once the shell is split, so the static parts of /learn/[slug] prerender.

### 81 lessons render a play-circle icon that plays nothing

`video-ux` · **/learn/[slug]/[n] (module) and /learn/[slug]/[n]/[pos] (lesson); screenshots 02, 12, 13, 14** · `src/app/(app)/learn/[slug]/[n]/page.tsx:35-39 and src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:32-36`

**Evidence.** `const kindIcon: Record<LessonKind, typeof PlayCircleIcon> = { lesson: PlayCircleIcon, ... }`. `grep -o 'kind: "lesson"' src/lib/content.ts | wc -l` returns 81 of 174 lessons. In 02-signedout-open-module--desktop.png every row in the module 01 list carries the ⊙▶ glyph at x=121, and in 14-student-lesson--desktop.png the same glyph sits in the meta line at y=179 next to the word LESSON. There is no video element, iframe, audio element or media URL anywhere under src/app/(app)/ — confirmed by grep across the tree; the only <video> in the repo is src/components/video-player.tsx, imported once, by src/components/sections/modules.tsx (marketing).

**Cost.** The play button is the strongest affordance in e-learning. A first-time learner clicks it expecting a lecture, gets three paragraphs of scaffolding prose, and correctly concludes the course is unfinished. This is the first impression of the free module — the exact surface the whole acquisition funnel points at. It is not a missing feature, it is a false claim rendered 81 times.

**Fix.** Until a real media URL exists on the lesson row, map `lesson` to a text glyph (`ArticleIcon` / `TextAlignLeftIcon`) in both `kindIcon` maps. When video lands, gate the play icon on the presence of a media block, not on `lesson.kind` — the kind enum is a pedagogy label and must never again double as a media-type claim.

### Every seeded lesson body literally instructs the learner to "Watch" a video that does not exist

`video-ux` · **Every lesson page for a `lesson`-kind lesson; screenshot 14 at y=427** · `scripts/seed-catalog.mjs:158`

**Evidence.** `lesson: "Watch, then write down where this applies to your own process."` — this string is written into `lessons.body` in Postgres for all 81 lesson-kind rows and rendered verbatim by `<Prose>` under the "What this covers" heading. 14-student-lesson--desktop.png line 1 of the body reads exactly that. The same body then says "go back to the example above" (seed-catalog.mjs, `Before you move on`) — there is no example above.

**Cost.** Copy that tells you to watch something, on a page with nothing to watch, reads as a broken page rather than a placeholder. The footnote at the bottom ("Course scaffolding: the structure of this lesson is final, the prose is being written") does not rescue it — by then the learner has already hunted for a player. A candid "Written lesson. Read it, then…" costs nothing and loses nobody.

**Fix.** Change the `lesson` shape string in seed-catalog.mjs to "Read this, then write down where it applies to your own process." and re-run the seed. Delete the "go back to the example above" branch, which references content that was never generated. Both are one-line edits and neither should wait for the video pipeline.

### "14 MIN" is the only duration in the entire product, and it is attached to a 90-second read

`video-ux` · **Lesson page meta line, module list, homepage hero card, /courses; screenshots 02, 14** · `src/lib/content.ts:1086 (the only `minutes:` value) and src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:104-106`

**Evidence.** `grep -n "minutes:" src/lib/content.ts` returns exactly two hits — one is a code comment (line 530), one is real data: `{ name: "Map your customer journey end to end", kind: "lesson", minutes: 14 }`. 173 of 174 lessons have `minutes: null`, so the module list renders "lesson" with no duration for all of them and "lesson · 14 min" for one. Marketing then leans its whole hero on that single number: content.ts:543 `action: "Watch now"`, content.ts:542 `duration: "14 min"`, and content.ts:2789 "It read 'Module 1 is open. It takes 14 minutes.'"

**Cost.** Two failures at once. First, the one duration shown is a runtime for a video that was never shot, on a page whose actual read time is well under two minutes — the number is fabricated. Second, when 173 of 174 lessons show no duration, the learner cannot plan a session at all, which is the single most-used piece of metadata in every video LMS (Coursera, Udemy and LinkedIn Learning all surface per-item and per-module runtime on the syllabus).

**Fix.** Delete `minutes: 14` and the `duration: "14 min"` / `action: "Watch now"` hero claims until real media exists. When video lands, populate `lessons.minutes` (or better, `duration_seconds`) from the YouTube Data API at publish time so it can never drift from the file, roll it up to a per-module and per-course total on the module page and course board, and never render a duration a human typed.

### "Pick up where you left off" is false — Continue drops you at the top of the course board, and resume is structurally impossible

`video-ux` · **/dashboard; screenshot 10 at y=213 and y=447** · `src/app/(app)/dashboard/page.tsx:102-107; src/lib/supabase/types.ts:~112 (`LessonProgress`); docs/LMS-ARCHITECTURE.md:126`

**Evidence.** The subhead reads "Pick up where you left off, or start another one." The control below it is `<Link href={`/learn/${course.slug}`}>` with the label `{isStarted ? "Continue" : "Start module 1"}` — the same href in both branches. So "Continue" on a course that is 6 of 39 lessons in lands you on the course board, above module 01, with no indication of where you stopped. `enrollments.last_module_id` IS written (src/app/actions/lms.ts:108-115, `touchEnrollment`) and never read for navigation. And the progress table is `lesson_progress(user_id, lesson_id, completed_at)` — a binary tick with no position column, so there is nowhere to store a playhead even if the UI wanted one.

**Cost.** Resume is the number one reason people come back to a video course. Every competitor opens the exact frame you stopped on. Here the learner re-navigates course → module → lesson from scratch on every visit, and the dashboard's own promise is the thing that makes it feel broken rather than merely basic. Once lessons are 20-minute videos, losing the playhead means losing the session.

**Fix.** Two changes, in this order. (1) Today: point Continue at `enrollments.last_module_id` — the column is already populated. (2) Before video ships: add `lesson_progress.position_seconds int`, `duration_seconds int` and `updated_at`, throttle-write the playhead every ~10s and on `pagehide` via `navigator.sendBeacon`, and derive completion at ≥90% watched instead of relying on a manual tick. Then Continue becomes a deep link to `/learn/slug/n/pos` and the player seeks on mount with a dismissible "Resume from 8:42 / Start over" chip.

### The lesson page is a document, not a player: no lesson list, no course context, 608px of the 1440 viewport is empty white

`visual` · **/learn/[slug]/[n]/[pos] (screenshot 14, desktop + mobile)** · `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:82,95`

**Evidence.** The whole page is `<Container className="py-10 md:py-14">` with everything inside `<div className="mt-5 max-w-[720px]">`. Container is max-w-[1280px] with lg:px-8, so at 1440 the content box runs x=112→1328 and the lesson column ends at x=832. Measured on the PNG: the last pixel of content is at x≈833; from there to x=1440 is 607px of nothing — 42% of the viewport. There is no sidebar, no lesson list, no module meter, no sticky anything. The only ways out are a breadcrumb 1400px up the scroll and two 14px text links at the very bottom.

**Cost.** This is the screen a learner spends 14 minutes on and returns to 39 times per course. It gives them no sense of where they are in the module, no way to jump to lesson 4, and no persistent 'complete and continue'. It also has no room reserved for the video, audio, transcript, docs and quizzes that are about to land — a 720px text column with 600px of waste beside it is the worst possible foundation for a 16:9 player plus a transcript rail.

**Fix.** Give (app) a real two-pane shell: a 280–320px persistent lesson rail on the left (module title, meter, the module's lesson list with kind icons and tick state, collapsible under lg) and a content column that goes to ~840px so a 16:9 player renders at 840×472. Move the 'Complete and continue' button into a sticky bottom bar on the content column. Keep the prose measure at 68ch inside the wider column rather than widening the text.

### Nothing in the navigation ever says where you are — no active state, no aria-current, on any route

`visual` · **Every signed-in screen (10, 11, 12, 13, 14, 15, 16, 20, 30)** · `src/components/lms/app-header.tsx:157-166`

**Evidence.** `HeaderLink` renders `t-nav text-ink-secondary hover:text-ink` and nothing else — no `usePathname`, no `aria-current`, no underline, no tint. On screenshot 10 (the dashboard) 'Dashboard' is rendered in exactly the same #3d4f60 as 'Catalog' and 'Account'. Same on 20 with 'Instructor', same on 30 with 'Judge'. Combined with the fact that there is no sidebar anywhere, the shell emits zero location signal.

**Cost.** The header is the only persistent chrome in the product and it is decorative. In a five-course LMS with three role consoles, a learner cannot tell at a glance whether they are in the catalog or their dashboard, and an instructor cannot tell they have left the console. Every competitor — Coursera, Udemy, Teachable — marks the current section.

**Fix.** Make HeaderLink a client component (or pass the pathname down from a server parent), and give the active link `aria-current="page"` plus the accent-tint pill the design system already defines: `bg-accent-tint text-accent` at radius-full, which globals.css:81 already contrast-checked at 6.30:1 for exactly this control.

### The signed-out header advertises 'Dashboard' and 'Account' — two links that bounce you straight to sign-in

`visual` · **/learn/[slug] and /learn/[slug]/[n] signed out (screenshots 00, 01, 02)** · `src/components/lms/app-header.tsx:37-45`

**Evidence.** The `links` array is built unconditionally with `/dashboard` and `/courses` and `/account`; only Instructor and Judge are gated on `viewer?.is(...)`. Screenshot 00 shows a signed-out header with 'Dashboard  Catalog  Account' on the left and 'Sign in / Create account' on the right. The breadcrumb underneath compounds it: src/app/(app)/learn/[slug]/page.tsx:77 renders 'Dashboard /' as the root crumb for a reader who has no dashboard.

**Cost.** The whole funnel is 'module 1 is open with no account'. The first screen a prospect lands on offers them two navigation items that fail, and a breadcrumb whose home is a locked door. Two dead clicks before they have read a word is the cheapest possible way to lose the conversion this product exists for.

**Fix.** Filter `links` on `viewer` the same way Instructor/Judge already are: signed out, show Catalog only (or Catalog + the course they are on). In learn/[slug]/page.tsx:76-82 swap the root crumb to `/courses` labelled 'Courses' when `!signedIn`.

---

## P1 — 72 findings

| # | Finding | Seat | File | Fix |
|---|---|---|---|---|
| 1 | The skip link's destination has its focus indicator explicitly removed | `a11y` | `src/app/(app)/layout.tsx:37` | Drop `outline-none` from `<main>`. If a 3px purple box around the entire content area is unacceptable, keep the outline but scope it: `main:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px }` so it reads as an |
| 2 | Sticky chrome is 114px on mobile but scroll-padding-top is 84px, so shift-tabbing hides 20px-tall links entirely | `a11y` | `src/app/globals.css:448` | Make the value responsive: `html { scroll-padding-top: 84px } @media (max-width: 639px) { html { scroll-padding-top: 132px } }` — or better, drive it from a `--chrome-h` custom property set once in app-header.tsx so the two can ne |
| 3 | The Meter's track is invisible (1.05:1) and its role="img" label duplicates the text directly above it | `a11y` | `src/components/lms/ui.tsx:52` | Two changes. (1) Give the track its own edge that clears 3:1 — `border border-line-control` on the track, or darken `--surface-sunken` in this context to ~#c6d3dd (2.0:1 is still short; use a 1px 3:1 outline rather than fill contr |
| 4 | A locked module announces itself as "Account" — the padlock is aria-hidden and no text says locked | `a11y` | `src/components/lms/ui.tsx:100` | Give ModuleState a visually-hidden state sentence per branch: locked → `Account` visible plus `<span className="sr-only">— needs a free account</span>`; partial → `{done}/{total}` plus `<span className="sr-only">{done} of {total}  |
| 5 | The same 'mark this lesson done' action has two different roles, names and semantics on two adjacent pages | `a11y` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:136` | Make one component and use it in both places. Prefer checkbox semantics over aria-pressed here — the visible affordance is a tick in a circle, which reads as a checkbox to everyone: `role="checkbox" aria-checked={isDone}` with a s |
| 6 | The instructor console is not a queue. No search, no filter, no sort, no assignment, no pagination — and a hard invisible ceiling at 50 items. | `admin-ux` | `src/lib/lms/queries.ts:86, 477-487; src/app/(app)/instructor/page.tsx:107-152` | Make it a two-pane triage screen. Left rail 360px: the queue as 64px rows — learner name, course badge + module number, age ('4d', red past 7), and a 1-line body preview; above it a search field and three chips (All / Awaiting / R |
| 7 | An instructor cannot re-read or correct feedback after sending it. One submit and the work is gone from the screen. | `admin-ux` | `src/app/(app)/instructor/page.tsx:42-43, 154-168; src/app/actions/lms.ts:294-2` | Reviewed items stay selectable in the queue rail with the same detail pane, feedback editable in place, showing 'Sent 4 Aug, edited 6 Aug'. Show the learner's previous artifacts and the feedback given on them in the detail pane. K |
| 8 | Nothing notifies anyone, ever. Both queues rely on staff voluntarily revisiting a page. | `admin-ux` | `src/ — grep for `resend\|nodemailer\|notify\|notification\|webhook` returns ze` | Minimum viable: (1) a count badge on the Instructor and Judge header links, computed in the header — it is one query and the header already fetches the viewer; (2) transactional email on submit-to-instructor and on feedback-to-lea |
| 9 | The judge's curriculum review defaults to a pass and asks for no evidence. One click files the platform's only quality-control document. | `admin-ux` | `src/app/(app)/judge/page.tsx:201, 220-226; src/app/actions/lms.ts:511-515` | No default verdict — nothing pre-checked, submit disabled until one is chosen. Require notes at 'concerns' and 'fail' (and ask for them at 'pass' — 'what you checked' is the point). Replace the free-text term with a select populat |
| 10 | A judge cannot see what they have done. Scores vanish on submit and the queue looks the same either way. | `admin-ux` | `src/app/(app)/judge/page.tsx:273-297; src/app/actions/lms.ts:450-452; src/lib/` | Split the queue into 'To score' and 'Filed', with filed rows showing the scores inline as four small numbers plus the date. Add a per-sheet completeness indicator ('2 of 3 judges scored'). On submit, stay on the sheet and confirm  |
| 11 | The CMS is a 3,463-line TypeScript file plus a laptop-run script holding the service-role key — and it is currently publishing machine-generated placeholder prose to real learners. | `admin-ux` | `src/lib/content.ts (3,463 lines); scripts/seed-catalog.mjs:136-212` | Screen 5, Content — and do not build a 40-field form. Build a block composer: a lesson is a title, a one-line summary, an estimated time, and an ordered list of blocks. '+ Add block' opens a palette of eight types (Text, Video, Au |
| 12 | Editing content can silently delete learner progress. The seed script's sweep cascades through lesson_progress with no warning, no dry run and no diff. | `admin-ux` | `scripts/seed-catalog.mjs:229-246` | Two changes, both required. First, give lessons a stable id/slug that survives reordering and key progress to it, so position becomes presentation. Second, put publishing behind a review screen: 'Publish 6 changes to Course A', li |
| 13 | No Media Session API, no manifest, no service worker — lock screen, AirPods and car controls will all be dead | `audio-ux` | `src/app/layout.tsx:32-95` | In the PlayerHost effect: set `navigator.mediaSession.metadata = new MediaMetadata({ title: lesson.name, artist: course.title, album: `Module ${module.n}`, artwork: [...] })` on track change; register `play`, `pause`, `seekbackwar |
| 14 | Every lesson already shows a play button that plays nothing, and `LessonKind` has no value for audio | `audio-ux` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:32-36` | Stop deriving the icon from `kind` (which is pedagogical: lesson/lab/template) and derive it from medium. Add a `medium` discriminator on the block model — `text \| audio \| video \| doc \| quiz` — with distinct glyphs (headphones |
| 15 | Duration is a hand-typed integer, not a property of a media file | `audio-ux` | `src/lib/content.ts:1086` | Store `duration_seconds` on the media row, written by the upload pipeline (ffprobe on ingest, or read `loadedmetadata` once and persist). Render `mm:ss` for audio, not rounded minutes. Keep `minutes` only as an editorial estimate  |
| 16 | Nothing in the repo is a player primitive — the only media component is a marketing `<video controls>` unusable in (app) | `audio-ux` | `src/components/video-player.tsx:66-114` | Build a custom transport against a headless `<audio>`: play/pause (min 44x44 hit area), skip back 15, skip forward 30, a `preservesPitch = true` speed cycle (0.8/1/1.25/1.5/1.75/2), a scrubber, elapsed/remaining in `mm:ss` tabular |
| 17 | You cannot listen to a lesson while writing the module artifact — the two are different routes | `audio-ux` | `src/app/(app)/learn/[slug]/[n]/page.tsx:20` | Two changes, both needed: (a) the layout-hosted player from finding 1, so audio continues across the module↔lesson hop; (b) a collapsed mini-player docked in the shell showing title, elapsed, and skip controls, so a learner on the |
| 18 | No download / offline path, and the delivery layer for self-hosted audio has not been thought about | `audio-ux` | `next.config.ts` | Serve audio from Supabase Storage or a CDN with `Cache-Control: public, max-age=31536000, immutable` and content-hashed filenames (audio files are immutable once cut; re-cuts get a new key). Confirm the origin honours HTTP Range — |
| 19 | The layout reserves no space for a docked player and handles no safe-area inset | `audio-ux` | `src/app/layout.tsx:103` | Reserve the player height on `<body>` (or on `<main>`) as a CSS var — `padding-bottom: calc(var(--player-h, 0px) + env(safe-area-inset-bottom))` — set to 0 when nothing is playing. Pad the player itself with `env(safe-area-inset-b |
| 20 | "Continue" does not continue — it drops the learner two clicks short of where they were | `copy` | `src/app/(app)/dashboard/page.tsx:104, src/app/(app)/learn/[slug]/page.tsx:117` | Until Phase 6 lands real resume positions, change the dashboard label to `Open course` and the course-board label to `Go to module ${resumeN}` — both truthful, both still one clear action. When resume positions exist, restore `Con |
| 21 | The lesson page states the same course/module/lesson coordinates three times before the first sentence of content | `copy` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:78-107, scripts/seed-catalog.mjs` | Delete seed-catalog.mjs:182 and :184 from the generated body — position belongs to the chrome, not the prose, and the chrome already carries it twice. Then collapse the two remaining chrome layers into one: keep the breadcrumb, an |
| 22 | Submitting the outcome sheet is irreversible, is never warned about, and produces no confirmation | `copy` | `src/app/actions/lms.ts:377, src/app/(app)/dashboard/outcome/[courseId]/page.ts` | (a) Rewrite the helper string to disclose before the act: `A draft stays private. Submitting sends it to the review board and locks it, because judges score the figures as submitted.` (b) Redirect to `/dashboard/outcome/${courseId |
| 23 | Raw database enum values are used as UI labels in four places | `copy` | `src/app/(app)/dashboard/page.tsx:117, src/app/(app)/dashboard/outcome/[courseI` | Add one mapping function in src/lib/lms/ and use it at all four sites: `draft → "Draft, private to you"`, `submitted → "With the review board"`, `verified → "Verified"`. On the dashboard, make the link label the action (`Read your |
| 24 | An acronym is destroyed by `toLowerCase()` in a field label shipped to every learner | `copy` | `src/app/(app)/learn/[slug]/[n]/page.tsx:222` | Drop the transform. `Your {module.artifact}` reads correctly for every artifact name in content.ts because they are already sentence case (`Baseline and use-case map`, `Campaign system`, `Pipeline scorecard`). If a lowercase-initi |
| 25 | The LockedPanel — the highest-stakes conversion string on the site — opens with a confusing clause, breaks the project's own copy rules four times in one sentence, and invents a certificate | `copy` | `src/components/lms/ui.tsx:161-165` | Rewrite to state what is true and name the reward: `You finished module 1 with no account. One free account opens modules 2 to 8 in all five courses, and it stays free forever.` Then add the specific above the button: `Module 02 i |
| 26 | The greeting eats a quarter of the mobile first screen and 191px of the desktop one to say nothing | `copy` | `src/app/(app)/dashboard/page.tsx:50, src/app/globals.css:208 and :379` | Drop the greeting to `t-h3` (20px) as an eyebrow, or fold the name into the header where the avatar already sits. Then give the first screen to the answer: a single `Pick up where you left off` block naming the course, module and  |
| 27 | A student who reaches /instructor or /judge is silently teleported to the dashboard with no explanation | `copy` | `src/lib/auth.ts:118` | Redirect to `/dashboard?denied=instructor` and render a dismissible `role="status"` strip above the h1: `The instructor console is for assigned course instructors. If that should be you, email Roan.` One string, one route, and it  |
| 28 | Breadcrumbs are numbers, not names, so they orient nobody | `ia-nav` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:88-92` | Render `Module {n} · {module.name}` (truncated with clamp-1 at ~28ch) as the middle crumb and the lesson name as the leaf. Update generateMetadata on the lesson page (line 29) to `${lesson.name} — Module ${n}` instead of the bare  |
| 29 | Breadcrumb roots are inconsistent: the module and lesson trails silently drop "Dashboard" | `ia-nav` | `src/app/(app)/learn/[slug]/[n]/page.tsx:348-353` | One trail shape everywhere: Dashboard / {course} / Module {n} · {name} / {lesson}. Extract a single `<Breadcrumb items={[]} />` into src/components/lms/ui.tsx and delete the three ad-hoc copies (learn/[slug]/page.tsx:76, learn/[sl |
| 30 | The lesson page states its own location three times in the first 145px, and one of those is baked into the content | `ia-nav` | `scripts/seed-catalog.mjs:182` | Drop line 182 from scripts/seed-catalog.mjs and strip it from existing `lessons.body` rows with a migration. Keep the eyebrow (kind · N of M · minutes · Done) as the only positional statement on the page, and let the breadcrumb ca |
| 31 | Lesson identity is an array position, off by one from its own label, and prev/next mixes position lookup with index arithmetic | `ia-nav` | `src/lib/lms/queries.ts:381` | Add `lessons.slug` (unique per module) and route `/learn/[slug]/[n]/[lessonSlug]`, keeping the position route as a 301. Until then, at minimum fix queries.ts:404-405 to find by position (`lessons.find(l => l.position === pos - 1)` |
| 32 | The footer under every lesson is a marketing sitemap that routes learners out of the LMS | `ia-nav` | `src/lib/content.ts:2950-2955` | Give (app) its own footer: legal row plus a small "this course" block (course board, outcome sheet, account, support). If the marketing sitemap must stay, repoint the Courses column to `/learn/<slug>` when a viewer is present — th |
| 33 | On mobile the module's progress and its only "back to course" link are buried ~2,200px down, below the artifact form | `ia-nav` | `src/app/(app)/learn/[slug]/[n]/page.tsx:106` | Order the aside before the lesson list under lg (`order-first lg:order-none` on the aside, or move the Meter into the header block and keep only the "All modules" link in the rail). Better: render the Meter inline under the FactsL |
| 34 | The outcome sheet is an IA orphan: no course in the breadcrumb, no course in the h1, no link back to the course | `ia-nav` | `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:88` | Breadcrumb `Dashboard / {course.title} / Outcome sheet` with the middle crumb linking to `/learn/${course.slug}`. h1 `Outcome sheet` with the course as a subtitle line, and metadata.title `Outcome sheet — ${course.title}`. Link th |
| 35 | "Catalog" in the app nav ejects the learner into the marketing shell, and there is no route back to the course they were in | `ia-nav` | `src/components/lms/app-header.tsx:39` | Point Catalog at `/dashboard` (which already lists all five courses with progress) and rename it "All courses", or build `/learn` as an in-app index. If the marketing course page must stay reachable, link to it from inside the cou |
| 36 | "Continue" does not continue — and the resume pointer you already store is never read | `innovation` | `src/app/(app)/dashboard/page.tsx:99, src/app/(app)/learn/[slug]/page.tsx:70-72` | Add last_lesson_id (and later last_position_seconds for video) to enrollments, write it in toggleLesson and on lesson view, and point both Continue links at /learn/{slug}/{n}/{pos} directly. Label it with the lesson name — "Contin |
| 37 | Lesson URLs are array indexes, so the admin console you are about to build will break every link in the product | `innovation` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:59-60, src/lib/supabase/types.ts` | Add a unique lesson slug (already on your roadmap as Phase 2b — do it before the authoring console, not after), route on /learn/{course}/{module}/{lesson-slug}, and keep position purely for ordering. |
| 38 | The content model is one text column and a three-value enum; none of it survives the video/audio/quiz pivot | `innovation` | `src/lib/supabase/types.ts:27 and :65-77, src/components/lms/prose.tsx:52-105` | Do Phase 3 (lesson_blocks) before Phase 7 (admin console). Model an ordered block list per lesson with typed payloads (video{provider,id,duration}, audio{path,duration}, prose{md}, quiz{...}, checklist{...}, embed{allowlisted host |
| 39 | No search anywhere in the signed-in product | `innovation` | `src/components/lms/app-header.tsx:37-45` | Ship a header search over lessons + modules + artifact names using Postgres full-text (a tsvector column on lessons, GIN index), open on "/" and on click, results grouped by course. Extend it to transcripts when video lands — that |
| 40 | Nothing in the product ever tells the learner that something happened | `innovation` | `src/app/(app)/learn/[slug]/[n]/page.tsx:284-291, src/app/actions/lms.ts:377` | Add an unread flag on artifacts.instructor_feedback (feedback_read_at), surface a count on the dashboard course card and in the header, and send one transactional email per feedback and per sheet verification. Add a confirmation s |
| 41 | Being denied a role is a silent redirect to a byte-identical page; signed-out users get nav that dead-ends | `innovation` | `src/lib/auth.ts:122, src/components/lms/app-header.tsx:37-45` | Redirect with a reason (?denied=instructor) and render a one-line notice on the dashboard. Gate the header links on viewer: signed-out gets Catalog + the course they are in + Create account. Ship a real /admin, even if it is one p |
| 42 | The one dataset no competitor has is destroyed at write time: free-text measures, no unit, no direction, no delta rendered anywhere | `innovation` | `src/app/actions/lms.ts:380-385 (numberIn), src/lib/supabase/types.ts:147-156` | Add unit (text) and direction ('lower_is_better'\|'higher_is_better') to outcome_rows, offer a per-course canonical measure list as a combobox with free text as the fallback, validate the parse at entry ("we read this as 3 — is th |
| 43 | There is no retrieval practice, no self-check, no spacing, and no feedback of any kind inside a lesson | `learning-design` | `src/components/lms/prose.tsx:1-24` | Give the lesson body a block model (already Phase 3 on the plan) whose first two block types are a check-question block (prompt → learner's typed answer stored in a lesson_responses row → model answer revealed on submit) and a rec |
| 44 | 'Pick up where you left off' drops the learner on a table of contents; last_module_id is written and never read | `learning-design` | `src/app/(app)/dashboard/page.tsx:98-104` | Add enrollments.last_lesson_id (written in toggleLesson beside last_module_id) and point the dashboard Continue straight at `/learn/{slug}/{n}/{pos}` labelled with the lesson name — 'Continue: Verify a source before it reaches a r |
| 45 | Signing up unlocks 173 lessons at once, with no sequencing, no prerequisite and no 'next thing to do' anywhere | `learning-design` | `src/lib/lms/access.ts` | Make the artifact the gate: module n+1 opens when module n's artifact is submitted (submitted, not reviewed, so nobody is blocked on a human). Surface exactly one 'Next: …' card at the top of the dashboard resolving to a single le |
| 46 | The module artifact — the only graded deliverable — is an unlabelled empty textarea with no prompt, structure, example or criteria | `learning-design` | `src/app/(app)/learn/[slug]/[n]/page.tsx:205-231` | Add artifact_prompt (markdown) and artifact_sections (string[]) to `modules`. Render the required sections as pre-filled headings in the textarea's defaultValue when the artifact is empty, show a collapsible worked example from a  |
| 47 | The outcome sheet can be submitted at 15% course progress, and submission is permanent with no path forward | `learning-design` | `src/app/(app)/dashboard/page.tsx:105-113` | Gate the sheet on the course's final artifact being submitted (module 08 for course A) and say so on the dashboard link while it is unavailable. Replace the single irreversible Submit with a confirm step that restates what submiss |
| 48 | Instructor feedback arrives silently on a page the learner has no reason to revisit | `learning-design` | `src/app/(app)/learn/[slug]/[n]/page.tsx:284-291` | Read submitted/reviewed artifacts in getDashboard and render a first-position card — 'New feedback on your baseline and use-case map' — linking straight to the module, with an unread flag (artifacts.feedback_seen_at, cleared when  |
| 49 | lesson / lab / template are three icons and one identical page | `learning-design` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:32-36, 112-118` | Branch on kind in the lesson page. lab: a step list with per-step checkboxes and a required 'what broke' capture that writes into the module artifact draft. template: the template as a copyable block with a Copy button and an 'ins |
| 50 | Every 'lesson' shows a play icon and the body opens with 'Watch, then write down…' — there is no video anywhere | `learning-design` | `scripts/seed-catalog.mjs:158` | Change the generated string to 'Read this, then write down…' and swap PlayCircleIcon for a text/article glyph until a player exists (one line in each kindIcon map). Reserve the play icon for lessons whose block list actually conta |
| 51 | loading.tsx is one dashboard-shaped skeleton used for nine differently-shaped routes, and it is ~570px shorter than the page it imitates | `mobile-perf` | `src/app/(app)/loading.tsx:13-14, 28-45` | Add per-route `loading.tsx` files: learn/[slug]/[n]/[pos]/loading.tsx (breadcrumb + meta row + title + 6 prose lines at 68ch), learn/[slug]/[n]/loading.tsx (list rows + textarea block), dashboard/outcome/[courseId]/loading.tsx (fo |
| 52 | 113px of sticky chrome on mobile carries global nav, while the nav a learner actually needs scrolls away — and no link ever shows which page you are on | `mobile-perf` | `src/components/lms/app-header.tsx:61-63, 141-152, 157-165` | Make the sticky region context-aware on /learn: replace the global link row under `sm` with a single sticky context bar carrying "Module 02 · Lesson 3 of 5" and a next-lesson chevron, and move the global links behind the avatar (a |
| 53 | An ~820-910px marketing sitemap footer sits under every LMS task page — 45% of the outcome sheet's total scroll height, and every link leads out of the product | `mobile-perf` | `src/app/(app)/layout.tsx:40; src/components/site-footer.tsx:46-68` | Give (app) its own footer: one row — copyright, Terms, Privacy, Support — at ~120px. Put the LMS's own routes (Dashboard, Your courses, Account, Sign out) in it if anything. Keep `SiteFooter` for the `(site)` group only. This is a |
| 54 | On a phone your module progress is the last thing on the page, 1,548px down, because the desktop sidebar just falls to the bottom | `mobile-perf` | `src/app/(app)/learn/[slug]/[n]/page.tsx:106, 323-340` | Add `order` classes so the aside comes first below lg: `<aside className="order-first lg:order-none lg:sticky lg:top-24">` and `<div className="min-w-0 order-last lg:order-none">`, or render a compact inline meter under the FactsL |
| 55 | The judge's measure table has no responsive handling, so the figures being judged wrap mid-value at 390 | `mobile-perf` | `src/app/(app)/judge/review/[sheetId]/page.tsx:108, 133-136` | Below sm, stack: render each row as a card — measure name on its own line, then "Before 38 min → After 11 min" on a single line at `t-figure`. Above sm keep the table. Add `whitespace-nowrap` to both figure `<td>`s regardless, and |
| 56 | The artifact textarea is a fixed 10-row nested scroll container holding work that is already submitted, with no autosave | `mobile-perf` | `src/app/(app)/learn/[slug]/[n]/page.tsx:224-231` | Give the textarea `rows={6}` with `field-sizing: content` (or a tiny client autogrow) and `max-h-[60vh]`, so it grows to its content instead of clipping. When `artifact.status !== 'draft'`, render the body through `<Prose>` in a r |
| 57 | The lesson page has no syllabus — the sticky rail exists one level up and is dropped exactly where it matters | `video-ux` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:95 vs src/app/(app)/learn/[slug]` | Promote the rail to the lesson page and make it the persistent course outline, not a meter: sticky at `top-24`, listing the module's lessons with kind icon, duration, done state and current-item highlight, plus a collapsed list of |
| 58 | A 720px column gives a 405px-tall video and wastes 496px of the viewport next to it | `video-ux` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:95, src/components/ui/index.tsx:` | Break the video block out of the prose measure. Give the lesson page the module page's `lg:grid-cols-[minmax(0,1fr)_340px]`, let the player fill the main column (≈860px at 1440, 484px tall), and keep `max-w-[68ch]` on the text blo |
| 59 | A YouTube embed cannot be added today without a config change, and there is no privacy or performance story for putting one on 81 pages | `video-ux` | `next.config.ts:44-49; src/proxy.ts (no security headers)` | Ship a facade, not an iframe: render the `maxresdefault` thumbnail plus a play button, and only inject the `www.youtube-nocookie.com/embed/ID` iframe on click (`?rel=0&modestbranding=1&cc_load_policy=1`). Add `i.ytimg.com` to `rem |
| 60 | Nothing happens when a lesson ends, and the next thing on the page is a marketing sitemap | `video-ux` | `src/app/(app)/layout.tsx:40; src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:121` | Build an end-of-video card that renders inside the player frame on `onStateChange → ENDED`: the next lesson's title and duration as a large tappable target, a Replay control, and a Mark complete confirmation (auto-tick at 90% watc |
| 61 | No captions, no transcript, no chapters — and prose.tsx cannot express any of them | `video-ux` | `src/components/lms/prose.tsx:26-105; src/lib/supabase/types.ts:64-72 (`LessonR` | Replace the flat `body` string with a `lesson_blocks` table (`lesson_id, position, type, payload jsonb`) where `type ∈ {prose, video, audio, doc, quiz, checklist}` — the admin console being built needs this anyway. On the video bl |
| 62 | No keyboard shortcuts anywhere, and the reference player is a bare native <video> | `video-ux` | `src/components/video-player.tsx:66-114` | Do not extend video-player.tsx — it is a marketing poster component and should stay one. Build a dedicated `<LessonPlayer>` wrapping the YouTube IFrame API with: speed 0.75/1/1.25/1.5/1.75/2 persisted per learner; `Space` play/pau |
| 63 | A 113px sticky backdrop-blurred header sits over the player, and phone landscape is unusable | `video-ux` | `src/components/lms/app-header.tsx:61-63 and :141-152` | Collapse the second nav row into the 72px bar on mobile (an overflow menu behind the avatar), so the sticky chrome is one row. Auto-hide the header on scroll-down while a video is playing. Add `@media (orientation: landscape) and  |
| 64 | A student who opens /instructor gets a byte-identical dashboard with no explanation whatsoever | `visual` | `src/lib/auth.ts:122` | Redirect to `/dashboard?denied=instructor` and render a dismissible line above the h1 in dashboard/page.tsx: 'The instructor console is for course instructors. You are signed in as a learner.' One `searchParams` read and one `<p>` |
| 65 | Every signed-in page burns 191px of the first screen on a greeting rendered at the marketing display size | `visual` | `src/app/(app)/dashboard/page.tsx:49-57` | Add a `t-h1-app` rank at 28px/36px 600 to globals.css and use it for every (app) h1. Drop the container to `py-8 md:py-10`. On the dashboard, replace the greeting entirely with the resume card — the learner's name is already in th |
| 66 | Five courses in a two-column grid leaves an orphan card and 598×188px of white; the in-progress course is styled identically to the four you have never opened | `visual` | `src/app/(app)/dashboard/page.tsx:57,65-71` | Split the list: render started courses as one full-width resume card (course hue, module name, 'Continue lesson 3 of 5', filled accent button, meter) and the remaining four as a `lg:grid-cols-2` grid below under a 'Start another'  |
| 67 | A 16-link marketing sitemap footer sits under every lesson: 335px on desktop, 864px on mobile — 37% of the mobile lesson page | `visual` | `src/app/(app)/layout.tsx:40` | Build an `AppFooter`: one row, ~72px — © line, Terms, Privacy, and a Help link — and swap it into src/app/(app)/layout.tsx:40. Keep SiteFooter for (site) only. That is ~270px back on every desktop page and ~790px on every mobile o |
| 68 | A submitted outcome sheet renders as read-only inputs that clip the learner's own words, while the judge gets the same data as a clean table | `visual` | `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:182-239` | Branch on `locked`: when the sheet is submitted, render the same read-only table the judge review page uses (measure / before / after, t-figure, `overflow-x-auto`), with a 'Submitted on …' line and the footnote as a quote block. R |
| 69 | The judge's evidence table has no min-width and no overflow wrapper, so measured values wrap mid-figure on a phone | `visual` | `src/app/(app)/judge/review/[sheetId]/page.tsx:108` | One line: wrap the table in `<div className="overflow-x-auto">` and add `min-w-[420px]` plus `whitespace-nowrap` on the two figure cells. Copy the pattern already sitting in the outcome sheet page. |
| 70 | The module page's 320px rail holds a progress bar and one link — and on mobile it lands below the pagination, 1550px down | `visual` | `src/app/(app)/learn/[slug]/[n]/page.tsx:106,323-340` | Either fill the rail (module meter, the lesson list with tick state, artifact status, next module) or delete it and put the meter as a 4px bar directly under the module h1. On mobile, hoist the meter above the lesson list with `or |
| 71 | The account page's primary button is a pill, breaking the radius lock that globals.css declares 12 lines from the top | `visual` | `src/components/lms/account-form.tsx:155` | Replace LiquidButton with the same markup the artifact form uses: `t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-white hover:bg-accent-hover`. Keep LiquidButton for the marketing hero where the glass stack was  |
| 72 | The instructor's home is the student dashboard, greeting and all, with no sign of the review queue | `visual` | `src/app/(app)/dashboard/page.tsx:50-55` | In dashboard/page.tsx, when `viewer.is('instructor')` or `is('judge')`, render a queue strip above the course grid: 'Awaiting your review (1)' with the submission rows and a link into the console. Same query the instructor page al |

---

## P2 — 26 findings

| # | Finding | Seat | File | Fix |
|---|---|---|---|---|
| 1 | Judge rubric criterion descriptions are not programmatically associated with the radio group they define | `a11y` | `src/app/(app)/judge/review/[sheetId]/page.tsx:174` | `<p id={`${c.id}-desc`}>` and `aria-describedby={`${c.id}-desc`}` on a `role="radiogroup"` wrapper around the five inputs (a fieldset cannot take aria-describedby reliably across AT). Add visible anchor labels — '1 not evidenced'  |
| 2 | Textareas and selects are excluded from the base focus-visible rule while carrying outline-none, so their focus ring degrades to a 1px border | `a11y` | `src/app/globals.css:466` | Add `select, textarea` to the `:where()` list, and drop `outline-none` from those four class strings (keep `focus:border-accent` as a secondary cue). The `border-radius: 4px` in that same base rule should also go — it silently res |
| 3 | Module rows are 40-word links and the module page's lesson list has no heading or accessible name | `a11y` | `src/app/(app)/learn/[slug]/page.tsx:160` | On the course board, put the module title in an `<h3>` and make only the title the link, with the row made clickable via a `::after` stretched-link overlay; give the `<Link>` an `aria-labelledby` pointing at the title id. On the m |
| 4 | No aria-current and no visual active state anywhere in the app nav | `a11y` | `src/components/lms/app-header.tsx:157` | Make `AppHeader` read `usePathname` (or pass the segment down from the layout, keeping the server component) and set `aria-current="page"` plus a visible treatment — `text-ink` with a 2px `--accent` underline — on the matching lin |
| 5 | Nav, breadcrumb and pagination targets are 17-20px tall and pass 2.5.8 only tangentially, by exactly zero pixels | `a11y` | `src/components/lms/app-header.tsx:145` | Give the mobile nav row real targets: `py-2 -my-2` on `HeaderLink` (or `min-h-[44px] inline-flex items-center`) and raise `gap-y-1` to `gap-y-2`. Do the same on the prev/next pagination links, which are the primary lesson navigati |
| 6 | No aggregate view of anything exists. Nobody can answer 'how many learners do we have' from inside the product. | `admin-ux` | `src/lib/lms/queries.ts — every exported function is scoped to a single user, c` | Add `src/lib/lms/admin-queries.ts` behind `is_admin()` with the six numbers that matter: signups by week, module-1 completion rate per course, enrollment→module-8 funnel per course, artifacts submitted vs reviewed with median age, |
| 7 | Neither console has a person-shaped view. An instructor cannot look up a learner or see who is stuck. | `admin-ux` | `src/app/(app)/instructor/page.tsx:70-88; src/lib/lms/queries.ts:435-447` | Add /instructor/course/[id] behind the course card: a roster table, one row per enrolled learner — name, module reached, lessons done as an 8-segment bar, last active, artifact status per module as eight small state dots, outcome  |
| 8 | Chapters have no data model and no place in the UI | `audio-ux` | `src/lib/supabase/types.ts:65-74` | Add a `chapters jsonb` column on the audio block — `[{ start_seconds, title }]` — authored in the admin console (it is one textarea of `mm:ss Title` lines). Render them as a seekable list below the transport, highlight the active  |
| 9 | revalidatePath(..., "layout") after a lesson tick may tear down a layout-hosted player | `audio-ux` | `src/app/actions/lms.ts:163` | Narrow it to `revalidatePath(`/learn/${slug}/${n}`)` (page, not layout) unless the layout genuinely renders the changed data — it does not; the header shows nav and an avatar. Then verify empirically: play audio, press Complete an |
| 10 | Placeholder text is used as instruction and as fake data, in three places where it teaches the wrong thing | `copy` | `src/app/(app)/dashboard/outcome/[courseId]/page.tsx:146, :209-231, :257 and sr` | (a) Keep placeholders on the measure column only and prefix them so they cannot read as data: `e.g. Time per cycle`. Leave before/after empty. (b) Rewrite the footnote placeholder in the learner's voice: `e.g. Logged by four reps  |
| 11 | One module is called three different things and every course carries a meaningless "Course A" shelf label | `ia-nav` | `src/app/(app)/learn/[slug]/[n]/page.tsx:120` | Pick one: "Module 2 of 8" everywhere, and delete `Step {n}` from the FactsLine (page.tsx:120) unless step is genuinely a different axis — if it is, name it. Replace the `badge` eyebrow on learner-facing surfaces with `course.level |
| 12 | A student who hits /instructor is silently teleported to the dashboard with no explanation | `ia-nav` | `src/lib/auth.ts:122` | Redirect to `/dashboard?denied=instructor` and render a dismissible line above the h1: "You don't have instructor access. If that's wrong, contact <owner>." Two lines in dashboard/page.tsx reading searchParams. Same for `judge`. |
| 13 | Lesson names are invisible from the course board, so cross-module navigation is blind | `ia-nav` | `src/app/(app)/learn/[slug]/page.tsx:155-198` | Make each module row on the course board a `<details>` whose summary is the current row and whose body is the lesson list (data is already loaded — `m.lessons` is in the board query). Auto-open the resume module. Add a client-side |
| 14 | The instructor console's course cards are dead, and submissions don't link to the module they came from | `ia-nav` | `src/app/(app)/instructor/page.tsx:66-89` | Wrap the course card contents in `<Link href={`/learn/${course.slug}`}>` and the submission heading in `<Link href={`/learn/${course.slug}/${item.moduleNumber}`}>`. Both routes already exist and are open to instructors. |
| 15 | Every learning page ends in a 350px marketing sitemap that contains no app routes | `innovation` | `src/app/(app)/layout.tsx:40` | Give (app) its own footer: one line with copyright, Terms, Privacy, Help. Keep the full sitemap in (site) only. |
| 16 | There is no curriculum rail, so the learner can never see where they are inside the course while learning | `innovation` | `src/app/(app)/learn/[slug]/[n]/page.tsx:323-340, src/components/lms/app-header` | Add a collapsible 320px curriculum rail to the lesson route showing the module's lessons with tick state and the current one marked, collapsing to a drawer under 1024px. Add aria-current to HeaderLink. |
| 17 | The instructor console is one flat queue of raw markdown and will not survive twenty learners | `innovation` | `src/app/(app)/instructor/page.tsx:40-43, :94-155` | Render artifact bodies through Prose (it already exists), group the queue by course and module with counts, show the learner's prior artifacts and instructor notes inline, add oldest-first sort and a saved-snippets picker for comm |
| 18 | Nothing in the signed-in product ever brings a learner back — no schedule, no streak, no email, no queue | `learning-design` | `src/app/(app)/account/page.tsx` | Three cheap ones in value order: (1) email the learner when an instructor leaves feedback or a judge files scores; (2) a 'you left off in Market and account intelligence 8 days ago' resume card at the top of the dashboard, from th |
| 19 | Judge rubric radios are 40px and the note fields are 40px — under the 44px minimum, on the console's only interaction | `mobile-perf` | `src/app/(app)/judge/review/[sheetId]/page.tsx:203, 221` | `size-11` (44px) below sm and `sm:size-10` above it — there is 126px of spare width at 390 to pay for it, and `justify-between` on the row would spread them further apart. Change the note inputs to `h-11`. |
| 20 | The course board's progress card is capped at 300px on a 358px column, leaving a 58px dead gutter and a stunted Continue button | `mobile-perf` | `src/app/(app)/learn/[slug]/page.tsx:103` | `w-full lg:max-w-[300px]` — the cap only needs to exist where the card is a column beside the header. |
| 21 | The next-lesson link truncates the thing it is naming | `mobile-perf` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:170, 188-190` | Below sm, stack the two links vertically at full width and allow two lines (`clamp-2`, drop `max-w-[45%]`), with the arrow on its own axis. Keep the 45%/one-line treatment from sm up where the row genuinely has to fit side by side |
| 22 | On the course board every module title wraps to two lines because a status chip owns a quarter of the row | `mobile-perf` | `src/app/(app)/learn/[slug]/page.tsx:161, 171, 185-192` | Below sm, move the chip onto the meta line under the title ("5 lessons · Campaign system · Not started") instead of into its own column, or render nothing at all for the not-started state and let the absence of a Done/2-of-5 chip  |
| 23 | Light-only, pure #ffffff surround — the worst possible ground for video | `video-ux` | `src/app/globals.css:49-53` | Scope a dark theme to the `(app)` route group by defining the tokens under `:root[data-theme="dark"]` and honouring `prefers-color-scheme` — every colour in the app already goes through `--surface`/`--ink`/`--line`, so this is a t |
| 24 | No storage bucket, no media pipeline, and no way to submit a screen recording as evidence | `video-ux` | `docs/LMS-ARTIFACTURE.md:326 (see docs/LMS-ARCHITECTURE.md:326); src/app/(app)/` | Create a `course-media` bucket (instructor/admin write, signed-URL read gated by module access) and a `submissions` bucket (one folder per user, enforced by policy, mirroring the `avatars` pattern already in profile.ts). Add an op |
| 25 | Seven identical grey 'NOT STARTED' chips do nothing but add noise to the course board | `visual` | `src/components/lms/ui.tsx:119` | Return `null` for the not-started case in ui.tsx:119. Keep the chip for done, in-progress, locked and open. On the signed-out board, additionally dim the locked rows' titles to `text-ink-muted` and lift module 01 with a left accen |
| 26 | Finishing a module greys out everything you finished | `visual` | `src/app/(app)/learn/[slug]/[n]/page.tsx:140-142` | Keep completed titles at `text-ink` and carry the done state on the tick alone (it is already accent-filled at line 188-192). Demote 'Submit for review' to the outline treatment once `artifact.status !== 'draft'`, and promote the  |

---

## P3 — 3 findings

| # | Finding | Seat | File | Fix |
|---|---|---|---|---|
| 1 | Global `scroll-behavior: smooth` will fight transcript-follow and chapter seeking | `audio-ux` | `src/app/globals.css:445` | Scope the smooth behaviour to the (site) group, or set `scroll-behavior: auto` on the transcript container and use `scrollIntoView({ behavior: 'auto', block: 'nearest' })` for cue-following. Suppress the follow entirely for ~2s af |
| 2 | scroll-padding-top is calibrated for the desktop header, so on mobile anchors and the skip link land 29px under the nav row | `mobile-perf` | `src/app/globals.css:448; src/components/lms/app-header.tsx:61,141` | Make it responsive: `scroll-padding-top: 125px;` inside a `@media (max-width: 639px)` block, or set it from a `--chrome-h` custom property that the header's own breakpoints update. |
| 3 | The lesson page's only affordance to move forward is a 14px text link with a clamped label | `video-ux` | `src/app/(app)/learn/[slug]/[n]/[pos]/page.tsx:185-192` | Stack prev/next vertically below `sm` and drop the 45% cap. Give the next control a card treatment: kind icon, full title on two lines, duration, and thumbnail once video exists. It should be the largest thing on screen when a les |

---

## Missing from every LMS

The innovation seat was asked for buildable ideas that are not shipped anywhere,
that fit this product's spine (free, role-based, project-based, ending in a
deployed workflow with a judge-scored before/after), and to discard its own bad
ideas. It ranked four and discarded four.

### 1. PRE-REGISTERED MEASUREMENT — rank 1, best value per unit of cost. Every ROI claim in corporate learning is picked after the result is known. Lock the measurement contract at module 1: the learner names each measure, its unit, its direction, how it will be collected and the baseline, and that becomes an immutable pre-registration row with a timestamp. At the end, the outcome sheet returns those rows read-only with only the AFTER column editable, and the judge sees "pre-registered 3 Feb, filed 12 Mar" plus a full amendment log for any measure that changed. This is clinical-trial pre-registration applied to workflow ROI and I have never seen it in a learning product, a vendor case study or an internal L&D tool. Cost is genuinely low: outcome_rows and the module-1 artifact already exist, this is two columns, a status transition and a diff view — no new content, no network effect, no cold start. Value is that it is the only thing that makes a judge's 1-5 mean anything, and it is a homepage claim nobody can match: our numbers were declared before the work started.

### 2. THE DELTA INDEX — rank 2, high value, low-to-medium cost, needs the free-text fix first. You are quietly accumulating the only structured, third-party-verified before/after corpus in AI upskilling, segmented by role. Use it twice. At module 1, the moment a learner records a baseline, show them where it sits among other learners in the same role: "38 minutes per account puts you in the slowest quartile; the median GTM team here starts at 22" — which converts the most boring lab in the course into a diagnosis they will screenshot and send to their manager. At the outcome sheet, show their delta against verified sheets only. Cost: before_n/after_n are already written to Postgres and read by nothing, so this needs unit + direction columns, a canonical measure vocabulary per course, one materialised view and one chart. Honest caveat: it is worthless below roughly twenty verified sheets per measure, so gate it on n and show nothing until then — it degrades to blank, never to a lie. Downstream, the aggregate is a free annual report ("what 400 GTM teams actually saved") that is better distribution than any ad.

### 3. THE REVERSE SYLLABUS — rank 3, high value, low cost, no new content required. Module 1 already makes the learner map their process, shortlist three candidate tasks and pick one; today that lands in a single textarea and is never referenced again. Structure it into fields and let it rewrite the rest of the course: the course board reads "Module 04 · AI-enabled selling → applied to: pre-call brief, currently 38 min/account", every artifact prompt substitutes their task and their baseline, and the outcome sheet is pre-filled with the measures they chose in week one. Cost is low because it is a token-substitution layer over prompts that already exist plus one artifact split into fields — you write zero new lessons. Nobody ships this: Coursera and Udemy are byte-identical for every learner, Duolingo personalises difficulty but never the subject, and the AI-tutor sidebars everyone is adding personalise the chat rather than the course. It is the difference between a syllabus and a consultant.

### 4. THE RUN RECEIPT — rank 4, highest value on the credibility axis but genuinely expensive, so ship it last and optional. "Completion means the learner DEPLOYED a workflow" is currently a self-typed sentence a judge cannot check. Give each learner a write-only ingest token and one line to paste into their own n8n/Zapier/Make/cron job; each run pings the academy with nothing but a timestamp. The outcome sheet then carries "ran 214 times over 30 days, last run 2 hours ago" and the judge scores Workflow durability against a run curve instead of a claim. Be honest about the cost: an ingest endpoint, token rotation, abuse rate-limiting, per-tool setup docs, and a meaningful share of learners in regulated companies who will never wire an outbound call to a third party. So it must be additive evidence that raises confidence, never a gate on completion — and it must land after pre-registration, which achieves most of the credibility for a fraction of the work. DISCARDED, and you should discard them too: a cohort feed or community tab (a free, self-paced, five-course product has no cohorts — the feed is empty forever and an empty feed is worse than no feed); peer review of artifacts (learners are pasting real internal process data and real baseline numbers, and peer quality is unusable at low n); an AI tutor in the lesson sidebar (everyone ships one, it is a wrapper, and your own benchmark notes flag Coursera's assistant for eating the content column); streaks and leaderboards (this is a six-week deploy-and-measure course where the correct behaviour is to spend two weeks waiting for data — a streak would punish exactly the learner you want).

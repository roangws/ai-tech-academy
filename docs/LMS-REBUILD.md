# The LMS rebuild

What changed, why, and what is still open. Written 10 Aug 2026, after the
ten-specialist review in `LMS-UX-REVIEW.md`.

`LMS-ARCHITECTURE.md` describes the design as it was conceived and is still the
best account of *why* the schema is shaped the way it is. This file records where
that account is now out of date, so neither document has to be rewritten to stay
honest.

---

## The security fix that started it

`catalog_lessons_read` was `using (true)`. The free-first-module gate existed
only in `src/lib/lms/access.ts` and an early return in the module page — a
*rendering* gate. Proven against production with nothing but the publishable key
that ships in the browser bundle and no session:

```
GET /rest/v1/lessons?module_id=eq.<module 02, access='account'>
→ 200, five lessons, ~1,120 characters of body each
```

It could not be fixed while content lived on `lessons`, because lesson **names**
must stay world-readable — they are public copy on `/courses/[slug]` — while
lesson **content** must not. That is not expressible as one row policy over one
table. It is trivial once content is a child row, which is the strongest reason
`lesson_blocks` landed before any media.

Now: `catalog_blocks_read` is `using (lesson_is_open(lesson_id) or auth.uid() is
not null)`. Verified live — signed out returns 1 of 3 probe blocks, `DELETE`
returns 401, a signed-in learner returns 3 of 3, and a learner writing to the
catalogue gets a 403 RLS violation.

## Schema added

| Object | What it is |
|---|---|
| `lessons.slug` | Stable identity. Replaces `(module_id, position)` as the seed script's upsert key. |
| `lesson_blocks` | Ordered, typed lesson content: prose, video, audio, doc, quiz, embed, exercise, checklist. `CHECK` per kind. |
| `block_responses` | Learner state for `exercise` and `checklist` blocks. |
| `media_positions` | Playback bookmarks. **Not** completion — see below. |
| `enrollments.last_lesson_id`, `.last_seen_at` | The resume pointer. |
| `course-media`, `course-docs` | Storage buckets. Audio public, documents signed. |
| 7 × `*_read_as_admin` | Policies the admin console reads through. |
| `lesson_is_open()` | The gate, in SQL. |
| `admin_seats()`, `bind_seat()`, `issue_completion()` | Definer/invoker RPCs for the console. |
| `user_roles_guard` | Refuses to revoke the student role, your own admin role, or the last admin. |

Migrations are in `supabase/migrations/`. **The first fifteen are not yet
recovered** — see that directory's README; it needs the database password and one
command.

## Corrections to LMS-ARCHITECTURE.md

- §7 `[FILL: file uploads]` is answered. Two buckets exist, `payload` stores a
  path and never a URL, and `src/lib/lms/media.ts` is the only place a path
  becomes fetchable.
- "No admin console" is no longer true. `/admin` has five screens.
- The route map gains `/admin/*` and moves `/learn/*` into a `(learn)` route
  group so learn mode can drop the marketing footer.
- §8's accepted risks stand, with one addition: the MCP connection is still
  write-enabled and unbranched against production, and this rebuild used it.

## Corrections to LMS-QA.md

- §8 "lesson identity is positional" — fixed. Lessons carry an authored slug.
- §8 "there is no lesson content" — the model exists; the content is still being
  written, and a lesson with no blocks now says so at the top of the page.
- §8 "no admin UI, all role grants are SQL" — fixed.
- §8 "completion_records never issued" and "`enrollments.status='completed'`
  never set" — both closed by `issue_completion()`.
- §8 "a learner can be scored without being shown the score" — fixed; the
  dashboard reads `judgements_read_by_learner`, which had existed since the
  schema was written and was read by nothing.
- §0 records the marketing pages as Static/SSG on 1h revalidate. **They are
  dynamic**, and were before this work — verified by building the tree at the
  commit before any of it. Whatever changed that predates this rebuild.

## Two things learned the hard way

**A REVOKE that returns success is still not evidence — in both directions.**
The QA doc records `REVOKE ... FROM anon` doing nothing because the grant
belonged to `PUBLIC`. This rebuild hit the mirror image: `REVOKE ... FROM PUBLIC`
did nothing because `ALTER DEFAULT PRIVILEGES` on this project grants EXECUTE to
`anon` **explicitly**, and revoking from PUBLIC does not remove an explicit
grant. Three admin functions were executable by `anon` until it was asserted with
`has_function_privilege`. Both revokes are needed and neither implies the other.

**`npm run build | tail` reports a failing build as passing.** A pipeline's exit
status is the last command's, so the gate had been green over a broken build.
The gate is now `cmd > log 2>&1 && echo PASS || { tail log; exit 1; }`, and it
immediately caught a client component importing `next/headers`.

## Deliberate non-decisions

- **Completion stays self-declared.** A row in `lesson_progress` exists because
  somebody pressed a button. `media_positions` is a bookmark and nothing is
  derived from it; auto-complete at ~90% listened is an affordance on top,
  calling the same `toggleLesson`, never a schema concept.
- **No streaks.** On a self-paced course measured in weeks, the correct behaviour
  includes spending a fortnight waiting for data, and a streak would punish
  exactly the learner the product wants.
- **No instructor read on `media_positions`.** How far a named learner got into
  a podcast is surveillance, not teaching.
- **Quiz answer keys ride in the payload.** The quiz grades nothing and gates
  nothing. The day one gates completion it needs its own table with the key
  revoked and grading behind a definer function.
- **Catalogue prose stays in `content.ts`.** The marketing pages import it
  directly and are frozen, so authority splits by column: prose ships with the
  site, structure and media live in the database. Revisit when a second person
  needs to author a course — that means unfreezing `(site)` and moving it to
  `use cache` + `cacheTag`.

## Still open

- The first fifteen migrations are not in the repo. One command, needs the
  database password.
- The block editor takes typed fields for video, audio and doc, and raw JSON for
  quiz, checklist, exercise, embed and prose. Fine while nobody authors quizzes
  daily; a real question builder the moment somebody does.
- **Every 404 under `(app)` and `(learn)` returns HTTP 200.** The layout awaits
  `getViewer()` and flushes the shell before a page can call `notFound()`, so
  Next recovers on the client and the status line is already sent. Predates this
  work. The fix is a Suspense boundary around the viewer-dependent chrome.
- No transcripts. `lesson_blocks.payload.audio` reserves a `transcript` path;
  nothing renders it, and an audio lesson without one is a lesson a deaf learner
  cannot take. This should block the first published podcast episode.
- No notifications. Both staff queues rely on somebody revisiting a page.

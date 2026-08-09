# The ten-agent review

The review workflow specified in the brief: ten independent sub-agents, five
assigned to the front end and five to the back end, each given a single
dimension, its own file ownership, and an instruction to verify every claim in
source before reporting it.

They ran concurrently and did not see each other's findings. Three of them
independently found the same highest-severity bug from three different angles,
which is the main argument for running them this way rather than as one pass.

---

## The ten

### Front end

| # | Agent | Assignment | Owned |
|---|---|---|---|
| 1 | **A11y** | Labels, focus, announcements, headings, table semantics, radio grouping, contrast | `components/lms/*`, all `(app)` pages, the three modified auth components |
| 2 | **Design system** | Reuse vs reinvention, token vs raw value, type scale, documented design rules | `components/lms/*`, all `(app)` pages, against `globals.css` + `DESIGN-SPEC.md` |
| 3 | **React / Next 16** | Server/client boundaries, `useActionState`, set-state-during-render, caching and revalidation, request-scoped clients | `proxy.ts`, `lib/supabase/*`, `lib/auth.ts`, both action files, all `(app)` pages |
| 4 | **Journeys & copy** | The four role journeys end to end; empty/error/loading states; copy that contradicts a promise in `content.ts` | all `(app)` pages, both action files, read against `content.ts` |
| 5 | **Client security** | Open redirect, secrets in the bundle, data over-exposure, whether the content gate is real, IDOR via hidden fields, CSRF, XSS | `proxy.ts`, `lib/**`, both action files, `.env*`, `.gitignore` |

### Back end

| # | Agent | Assignment | Owned |
|---|---|---|---|
| 6 | **RLS audit** | Adversarial policy audit: command coverage, `USING (true)`, escalation, missing `WITH CHECK`, definer-function safety, column grants | live `pg_policies`, `pg_proc`, advisors |
| 7 | **Schema & data model** | Cascade behaviour, missing constraints, missing indexes, drift between `content.ts` and the catalog mirror, concurrency | live `information_schema`, `pg_constraint`, `pg_indexes`, the seed script |
| 8 | **Server Action security** | Per-action authorization, IDOR, state-machine violations, input validation, mass assignment, error handling | both action files, `lib/auth.ts`, `lib/lms/access.ts` |
| 9 | **Query correctness & perf** | PostgREST embed semantics, N+1, unbounded results, index coverage, RLS evaluation cost, unstable ordering | `lib/lms/queries.ts`, `lib/auth.ts`, `(app)` pages, live `EXPLAIN` |
| 10 | **Auth & session lifecycle** | Cookie handling against the `@supabase/ssr` contract, token refresh, `handle_new_user` escalation vectors, sign-out, email confirmation | `proxy.ts`, `lib/supabase/*`, `lib/auth.ts`, `node_modules/@supabase/ssr` source, live auth settings |

---

## What it caught

The findings that changed the code, and which agents found them.

### One blocker

**Email confirmation is ON and the sign-up flow assumed it was off.** (Agent 10,
by querying the project's live auth settings rather than trusting the code's
comment.) `signUp` returned `session: null`, the action redirected anyway, the
proxy bounced the reader to sign-in with no explanation, and there was no route
handler to exchange the PKCE `?code=` the confirmation email came back with. No
account could ever be completed — `auth.users` had zero rows, which is the
evidence. Fixed with a `data.session` branch, a "check your inbox" screen, and
`src/app/auth/confirm/route.ts`.

### Found three times, independently

**Every rubric radio shared `name="score"`.** (Agents 1, 3 and 8.) HTML groups
radios by name within a form, so N criteria × 5 buttons were one group: scoring
the second criterion cleared the first, the browser submitted one `score`, and
the action's index-zip attributed it to criterion 0. A judge filed five scores
and one was written, against the wrong thing. Agent 1 found it as a screen-reader
defect, agent 3 as a React/form defect, agent 8 as data corruption.

### The rest

| Finding | Found by |
|---|---|
| Open redirect: `safeNext` defeated by `/\evil.example` and `/%09/…` | 5, 8 |
| Sign-up wizard permanently trapped on step 1 after any server error | 3 |
| A learner could forge their own instructor feedback and mark themselves reviewed | 6, 8 |
| A learner could verify, rewrite or un-submit an already-scored outcome sheet | 5, 6, 8 |
| An instructor could reassign a learner's artifact to themselves (`WITH CHECK` gap) | 6 |
| Any judge could score any sheet, on any course, against any rubric, including drafts | 6, 8 |
| Staff `auth.users` uuids readable anonymously via `instructor_assignments` | 5, 6 |
| Judges' private review notes readable by every signed-in user | 5, 6 |
| `profiles.email` user-writable and shown to instructors as identity | 7 |
| Progress never enrolled anyone, so the dashboard stayed permanently empty | 4 |
| No link anywhere from the marketing site to the free module | 4 |
| The learning-design seat could not file a curriculum review at all, silently | 3, 4, 8 |
| "Save draft" silently withdrew a submitted or reviewed artifact | 3, 4, 7 |
| `revalidatePath("/", "layout")` purged the whole ISR site on every auth event | 3 |
| Every Supabase `error` discarded — failed writes reported success | 8, 9 |
| `saveOutcomeSheet` deleted rows then inserted, unchecked, in no transaction | 8, 9 |
| `/learn/[slug]` crashed for signed-in readers on an un-seeded course | 3 |
| Judge review page fetched every sheet on the site to render one | 9 |
| `getDashboard` fetched the entire catalog on every render | 9 |
| Unbounded lists; the instructor profile lookup 400s past ~600 learners | 9 |
| Missing indexes on 7 foreign keys and both `submitted_at` sorts | 7, 9 |
| Cache-control headers dropped from `setAll` — CDN could serve one user's session to another | 10 |
| `holds_seat` ignored the judge role, and a course delete promoted a seat to all courses | 6, 7 |
| No error, loading or not-found boundary anywhere in the app | 4 |
| Locked module page had no `h1` | 1 |
| Verdict radios had no `fieldset`/`legend` | 1 |
| Lesson tick had no `aria-pressed` and announced nothing on change | 1 |
| Judge's measures table had no row headers | 1 |
| A verified sheet used `disabled`, so a learner could not read back their own record | 1 |
| Signed-in nav unreachable below 640px | 1 |
| Green used for done/complete/pass, against the documented rule — and both meanings in one list | 2 |
| Coloured icon tiles, `t-stat` misuse, `--accent` as card background, header 8px short | 2 |
| Legal pages still said "Accounts are not open yet" while collecting personal data | 4 |
| `lib/supabase/client.ts` was dead code describing a feature that did not exist | 10 |

### What they cleared

Recorded because a verified-safe result is worth as much as a finding, and
because these were the things most likely to be wrong:

- The content gate is a genuine early return; a locked module's lessons never
  reach the browser. (5)
- No secret in the client bundle; the service-role key appears only in the seed
  script. (5)
- `handle_new_user` cannot be induced to grant a role — it hardcodes `student`
  and reads nothing role-shaped from `raw_user_meta_data`. (6, 10)
- `getClaims()` genuinely refreshes the token and writes cookies, verified
  through the `auth-js` source; the project uses ES256, so verification is local
  and costs no round trip. (10)
- Cookies survive both redirect paths in the proxy. (10)
- Supabase clients are per-request, so no session can leak between requests. (3)
- Sign-out is a POST; nothing state-changing is reachable by GET. (5)
- No XSS: the only `dangerouslySetInnerHTML` uses are JSON-LD from static
  content. (5)
- The PostgREST to-one embed returns an object, not an array — the cast in
  `getDashboard` was right and the comment above it was wrong. (9)

---

## The thing worth carrying forward

Two privilege changes in this schema were written, applied successfully, and did
nothing:

- `REVOKE SELECT (user_id) … FROM authenticated`, defeated by the table-wide
  `GRANT SELECT` that Postgres checks first.
- `REVOKE EXECUTE ON FUNCTION … FROM anon`, defeated by the `PUBLIC` grant every
  new function gets by default.

Both were caught by probing as the role rather than by re-reading the migration.
**A `REVOKE` that returns success is not evidence that anything was revoked.**
Verify with `has_table_privilege` / `has_function_privilege`, or by executing the
query you are trying to prevent.

-- The fourth time this schema has been bitten by a grant that was never needed
-- because the privilege was already there.
--
-- `20260812150000_judge_events.sql` ends with its own verification select, per
-- the house rule, and the select failed on two of five:
--
--     judge_can_invite  t   -- expected f
--     anon_may_issue    t   -- expected f
--
-- Neither is a typo in that file. Both are `pg_default_acl`:
--
--   * Every new table in `public` starts with ALL privileges granted to `anon`
--     AND to `authenticated`. So `grant select, update on
--     judge_event_invitations to authenticated` added nothing and removed
--     nothing — INSERT and DELETE were already there. Writing a narrow GRANT and
--     reading it as a narrow privilege is the mistake; a GRANT is additive and
--     says nothing about what it leaves behind.
--
--   * Every new function starts with EXECUTE granted to `anon` explicitly, not
--     only through PUBLIC — which is why `admin_console_revoke_anon_execute`
--     exists and why the README says helpers need the revoke spelled out.
--     `revoke execute ... from public` therefore left `anon` holding it.
--
-- What this actually closes: `issue_judge_event` is SECURITY DEFINER and its
-- only authorisation check is `is_admin()`, which an anonymous caller fails — so
-- the exposure was a reachable endpoint that always raised, not an open one. The
-- invitations INSERT is the real one: `judge_event_invitations` had no INSERT
-- policy, so RLS refused it, but that is one policy standing between a signed-in
-- learner and writing invitation rows. Both layers are supposed to be closed.

revoke insert, delete, truncate, references, trigger
  on public.judge_event_invitations from authenticated;

revoke execute on function public.issue_judge_event(uuid) from anon;

/* A trigger function is nobody's endpoint. `artifacts_guard`, `sheets_guard`,
   `outcome_rows_guard`, `enrollments_guard` and `touch_updated_at` all hold
   EXECUTE from neither role, and this one should match them — calling it over
   PostgREST would only ever raise "trigger functions can only be called as
   triggers", but an endpoint that always errors is still an endpoint, and the
   database linter reports it as one. */
revoke execute on function public.judge_event_invitations_guard() from anon, authenticated;

/* Expect: f, t, t, f, t, f. */
select
  has_table_privilege('anon', 'public.judge_events', 'SELECT')                     as anon_reads_events,
  has_table_privilege('authenticated', 'public.judge_events', 'INSERT')            as admin_can_write_events,
  has_table_privilege('authenticated', 'public.judge_event_invitations', 'UPDATE') as judge_can_answer,
  has_table_privilege('authenticated', 'public.judge_event_invitations', 'INSERT') as judge_can_invite,
  has_function_privilege('authenticated', 'public.issue_judge_event(uuid)', 'EXECUTE') as auth_may_issue,
  has_function_privilege('anon', 'public.issue_judge_event(uuid)', 'EXECUTE')          as anon_may_issue;

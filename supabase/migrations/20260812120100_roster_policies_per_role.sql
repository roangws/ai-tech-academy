-- Split the roster read policy by role, because the combined one refuses
-- every signed-out visitor.
--
-- ------------------------------------------------------------------ the failure
--
-- `20260812120000_roster_is_a_table.sql` created one policy covering both roles:
--
--   create policy roster_read_published on public.roster
--     for select using (status = 'published' or public.is_admin());
--
-- `is_admin()` is granted to `authenticated` and deliberately not to `anon`, and
-- Postgres resolves EXECUTE when it PLANS the policy rather than when the branch
-- is reached — so short-circuit evaluation does not save it. Every `anon` read of
-- this table came back "permission denied for function is_admin", which for a
-- table whose entire purpose is two PUBLIC pages means /instructors and
-- /review-judge-board would be empty for every visitor who is not signed in.
--
-- ---------------------------------------------------------------- already known
--
-- This repository has hit this before and wrote it down:
-- `20260811120000_drafts_are_admin_only.sql` names the failure in a comment and
-- ships the same one-policy-per-role fix for the catalogue. That note was read
-- after this migration was written rather than before it, which is the whole
-- lesson — the pattern is now in two places and neither is the last word.
--
-- Kept as a second migration rather than folded into the first, matching how the
-- catalogue's own fix is recorded and what the database actually has applied.
-- Rewriting the earlier file would make this repository disagree with the
-- deployed history and erase the evidence for a mistake worth not repeating.
--
-- `roster_write_as_admin` is recreated only to scope it `to authenticated`. It
-- was implicitly `to public`, which put `is_admin()` in front of `anon` on the
-- write path too.

drop policy if exists roster_read_published on public.roster;
drop policy if exists roster_write_as_admin on public.roster;

create policy roster_read_public on public.roster
  for select to anon using (status = 'published');

create policy roster_read on public.roster
  for select to authenticated using (status = 'published' or public.is_admin());

create policy roster_write_as_admin on public.roster
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

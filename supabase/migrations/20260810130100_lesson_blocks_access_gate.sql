-- The free-first-module gate, enforced by Postgres instead of by the renderer.
--
-- src/lib/lms/access.ts argues correctly that the proxy is too coarse and the UI
-- is too late. It does not say what the database does, and until now the answer
-- was nothing: `catalog_lessons_read` is `using (true)`, so anyone holding the
-- publishable key could read every locked lesson over PostgREST. That key ships
-- in the browser bundle.
--
-- Lesson names stay world-readable on purpose. They are already public copy in
-- content.ts and rendered on /courses/[slug], and a course whose syllabus is
-- secret cannot be marketed. It is the *content* that is gated, which is only
-- expressible now that content is a child row.

-- SECURITY DEFINER because the policy has to see `modules.access` for a lesson
-- the caller may not otherwise be entitled to reason about, and STABLE so the
-- planner hoists it. `set search_path = ''` matches every other helper here.
create or replace function public.lesson_is_open(lid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
     where l.id = lid
       and m.access = 'open'
  );
$$;

-- Revoke from PUBLIC, not from anon. PUBLIC holds EXECUTE on every new function
-- by default, so `revoke ... from anon` is the statement that returns success
-- and changes nothing -- one of the two mistakes recorded in docs/LMS-QA.md as
-- having looked applied and not been.
revoke execute on function public.lesson_is_open(uuid) from public;

-- ...and then grant it back to anon DELIBERATELY. Every other helper on this
-- schema has EXECUTE revoked from anon, which is right for is_admin() and
-- teaches_course() and wrong here: this one is called by a policy granted
-- `to anon`, and a signed-out reader hitting `permission denied for function`
-- is every reader of module 01 -- the single surface the whole funnel points at.
grant execute on function public.lesson_is_open(uuid) to anon, authenticated;

-- ------------------------------------------------------------------ policies

-- Named to the catalog_*_read convention, but pointedly NOT `using (true)`.
-- Module 01 is readable by anyone; everything else needs a session. That is the
-- product's promise stated in SQL: one free account opens modules 2 to 8.
create policy catalog_blocks_read on public.lesson_blocks
  for select to anon, authenticated
  using (
    public.lesson_is_open(lesson_id)
    or (select auth.uid()) is not null
  );

create policy catalog_blocks_write on public.lesson_blocks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- A learner owns their own exercise and checklist state.
create policy responses_own on public.block_responses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- An instructor may read submitted work from a learner they teach, matching the
-- artifacts_read_as_instructor shape: submitted only, never drafts.
create policy responses_read_as_instructor on public.block_responses
  for select to authenticated
  using (
    status <> 'draft'
    and public.teaches_learner((select auth.uid()), user_id)
  );

-- ------------------------------------------------------------------- grants
--
-- ALTER DEFAULT PRIVILEGES on this project grants arwdDxtm -- everything,
-- including DELETE -- to `anon` on every new table in public. Verified against
-- pg_default_acl, not assumed. RLS is therefore the only thing between an
-- anonymous key holder and `DELETE FROM lesson_blocks`, and a table holding
-- per-learner writing should not be relying on that alone.
revoke all on public.lesson_blocks   from anon;
grant  select on public.lesson_blocks to anon;

revoke all on public.block_responses from anon;

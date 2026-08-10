-- The completion record, issued by finishing the course rather than by asking.
--
-- ------------------------------------------------------------------ the state
--
-- `completion_records` and `issue_completion` shipped in the admin console
-- migration and the table has stayed empty since. The only writer is an admin
-- pressing a button on /admin/learners, and there was no reader at all: the
-- learner is never shown the reference, and a stranger holding one has no way to
-- check it. Meanwhile the curriculum promises the thing in public — module 08 of
-- course A is titled "the record that proves it ran".
--
-- Three functions close that, and each one exists for a different reader.
--
--   mint_completion_reference   the format, in one place, so the two issuing
--                               paths cannot drift
--   claim_completion            the learner's path. Finishing the course is the
--                               authorisation
--   verify_completion           the stranger's path. A reference in, four public
--                               fields out, and nothing else
--
-- --------------------------------------------- why two of these are DEFINER
--
-- `toggle_lesson` and `save_outcome_sheet` both argue at length for INVOKER, and
-- both are right: a definer function is a way around every policy it touches, so
-- the default has to be invoker and the exception has to be justified per file.
--
-- The justification here is that each of these two has its entire authorisation
-- rule written inside it, and the rule takes no argument from the caller that
-- could widen it.
--
--   claim_completion    the subject is auth.uid(), never a parameter, and the
--                       test is "has this person completed every lesson of this
--                       course". There is no p_force. An admin who wants to
--                       issue early still goes through issue_completion, which
--                       is INVOKER and checks is_admin() — that is the override
--                       and it stays where it was.
--
--   verify_completion   it is reachable by `anon` on purpose and returns four
--                       fields chosen one at a time. The alternative was an anon
--                       SELECT policy on completion_records, which would expose
--                       user_id and let anybody with the publishable key
--                       enumerate who has completed what. A function that takes
--                       a reference and cannot be asked "list them all" is a
--                       much smaller public surface than a policy.

/* ---------------------------------------------------------------- the format

   Lifted verbatim out of issue_completion so that the learner path and the admin
   path mint the same string. It is a public identifier printed on a document
   somebody may still be holding in five years, so the format is frozen:

     AITE-<COURSE>-<YEAR>-<6 chars of base32 without the ambiguous glyphs>

   No O, 0, I or 1, because the reference has to survive being read aloud over a
   phone and typed back in by the person listening.

   ------------------------------------------------------- and one live defect

   `extensions.gen_random_bytes`, qualified, and that qualification is a bug fix
   rather than a style choice.

   issue_completion shipped with `set search_path = ''` and an unqualified
   `gen_random_bytes(8)`. pgcrypto installs into `extensions` on this project,
   not into public, so that call resolves against nothing: the function raises
   42883 the moment it reaches that line. A plpgsql body is not parsed at CREATE
   time, so it was accepted, and the only caller is the "Issue record" button on
   /admin/learners, which nobody had pressed. Hence a table with zero rows and no
   error to show for it.

   This file found it by putting the same expression in a `language sql` function,
   which Postgres does parse at CREATE time, and being refused. */
create or replace function public.mint_completion_reference(p_course_id text)
returns text
language sql
volatile
set search_path = ''
as $$
  select 'AITE-' || upper(p_course_id) || '-' || to_char(now(), 'YYYY') || '-' ||
         upper(substr(translate(encode(extensions.gen_random_bytes(8), 'base64'), '+/=OoIl01', 'ABCDEFGHJ'), 1, 6));
$$;

comment on function public.mint_completion_reference(text) is
  'The frozen reference format, in one place so the two issuing paths cannot drift.';

revoke execute on function public.mint_completion_reference(text) from public;
revoke execute on function public.mint_completion_reference(text) from anon;

-- issue_completion now calls it rather than carrying its own copy. Everything
-- else about this function is unchanged, including SECURITY INVOKER and the
-- is_admin() check, and including p_force: an admin issuing early is a real case
-- and it is the one thing the learner path deliberately cannot do.
create or replace function public.issue_completion(
  p_user_id uuid,
  p_course_id text,
  p_force boolean default false
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_done  integer;
  v_ref   text;
begin
  if not public.is_admin() then
    raise exception 'only an admin may issue a completion record';
  end if;

  select count(*) into v_total
    from public.lessons l join public.modules m on m.id = l.module_id
   where m.course_id = p_course_id;

  select count(*) into v_done
    from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course_id and lp.user_id = p_user_id;

  if not p_force and v_done < v_total then
    raise exception 'learner has completed % of % lessons; pass p_force to issue anyway', v_done, v_total;
  end if;

  insert into public.completion_records (user_id, course_id, reference)
  values (p_user_id, p_course_id, public.mint_completion_reference(p_course_id))
  on conflict (user_id, course_id) do update set reference = public.completion_records.reference
  returning reference into v_ref;

  update public.enrollments
     set status = 'completed', completed_at = coalesce(completed_at, now())
   where user_id = p_user_id and course_id = p_course_id;

  return v_ref;
end
$$;

revoke execute on function public.issue_completion(uuid, text, boolean) from public;
revoke execute on function public.issue_completion(uuid, text, boolean) from anon;
grant  execute on function public.issue_completion(uuid, text, boolean) to authenticated;

/* ------------------------------------------------------ the guard, widened

   `enrollments_guard` raises 'only an admin may complete an enrolment' on any
   non-admin transition into completed, which was correct while an admin was the
   only issuer and is now the thing standing in front of the learner path.

   The new condition says the same rule from the other end: the record is the
   authority and the enrolment status follows it. A row in completion_records is
   not something a learner can write — the table's only policies are read-own,
   read-as-instructor and write-as-admin — so "a record exists for this pair" is
   as strong a claim as "an admin is asking", and it is the claim that is
   actually true when claim_completion runs.

   The immutability check on user_id is untouched. */
create or replace function public.enrollments_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'enrollments.user_id is immutable';
  end if;

  if new.status = 'completed'::public.enrollment_status
     and old.status <> 'completed'::public.enrollment_status
     and not public.is_admin()
     and not exists (
       select 1 from public.completion_records cr
        where cr.user_id = new.user_id and cr.course_id = new.course_id
     ) then
    raise exception 'an enrolment completes when a completion record is issued for it';
  end if;

  return new;
end;
$$;

/* ------------------------------------------------------------ the learner path

   Called by the server action that ticks a lesson, on the tick that finishes the
   course, and by a button on the certificate page for anybody who finished
   before this shipped. Both are the same call and it is idempotent.

   The `on conflict do update set reference = the existing reference` is not a
   no-op written the long way: `do nothing` would not return a row, and the
   caller needs the reference back on the second call as much as on the first.
   The reference itself never changes once issued. */
create or replace function public.claim_completion(p_course_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_total integer;
  v_done  integer;
  v_ref   text;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  select count(*) into v_total
    from public.lessons l join public.modules m on m.id = l.module_id
   where m.course_id = p_course_id;

  /* A course with no lessons has not been completed by anybody. Without this,
     count(*) = count(*) = 0 issues a record for an empty draft. */
  if v_total = 0 then
    raise exception 'course % has no lessons', p_course_id;
  end if;

  select count(*) into v_done
    from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course_id and lp.user_id = v_user;

  if v_done < v_total then
    raise exception 'completed % of % lessons', v_done, v_total
      using errcode = 'check_violation';
  end if;

  insert into public.completion_records (user_id, course_id, reference)
  values (v_user, p_course_id, public.mint_completion_reference(p_course_id))
  on conflict (user_id, course_id) do update set reference = public.completion_records.reference
  returning reference into v_ref;

  update public.enrollments
     set status = 'completed', completed_at = coalesce(completed_at, now())
   where user_id = v_user and course_id = p_course_id;

  return v_ref;
end
$$;

comment on function public.claim_completion(text) is
  'Issue the caller their own completion record, if they have finished every lesson of the course.';

revoke execute on function public.claim_completion(text) from public;
revoke execute on function public.claim_completion(text) from anon;
grant  execute on function public.claim_completion(text) to authenticated;

/* ----------------------------------------------------------- the public path

   Everything a certificate prints, and nothing a certificate does not print.

   Four fields, each one already visible to anyone holding the document: the name
   on it, the course, the badge, and the date. Deliberately absent: user_id,
   email, the enrolment, how long it took, and any way to ask a second question.
   The portrait comes with them because it is on the certificate and lives in a
   public bucket already.

   `course_ground` is in there because the certificate is drawn by satori, which
   has no stylesheet and cannot resolve the `var(--path-a)` this column holds —
   but the renderer still needs to know which of the five courses it is drawing,
   and reading it back off the row beats a second map of course ids to colours
   living in the route.

   `stable`, so a page that renders it twice pays for it once.

   Dropped and recreated rather than replaced: the return columns changed, and
   `create or replace` refuses that. */
drop function if exists public.verify_completion(text);

create or replace function public.verify_completion(p_reference text)
returns table (
  reference   text,
  holder      text,
  avatar_url  text,
  course_id   text,
  course_title text,
  course_badge text,
  course_ground text,
  issued_at   timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    cr.reference,
    nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
    p.avatar_url,
    c.id,
    c.title,
    c.badge,
    c.ground,
    cr.issued_at
  from public.completion_records cr
  join public.courses c on c.id = cr.course_id
  left join public.profiles p on p.id = cr.user_id
  where cr.reference = p_reference;
$$;

comment on function public.verify_completion(text) is
  'Look up one completion record by its printed reference. Reachable by anon on purpose.';

revoke execute on function public.verify_completion(text) from public;
grant  execute on function public.verify_completion(text) to anon;
grant  execute on function public.verify_completion(text) to authenticated;

/* ---------------------------------------------------------------- the table

   completion_records was created before this file and already carries its
   policies. Restated here because ALTER DEFAULT PRIVILEGES on this project
   grants everything to `anon` on every new table in public, and the only reason
   an anonymous holder of the publishable key cannot read this table today is
   that it has no anon policy. That is one `create policy` away from being wrong,
   so the grant goes too. verify_completion is the whole public surface. */
revoke all on public.completion_records from anon;

/* Verification. A GRANT or REVOKE returning success is not evidence. */
select
  has_table_privilege('anon', 'public.completion_records', 'SELECT')                       as anon_select_must_be_false,
  has_table_privilege('anon', 'public.completion_records', 'INSERT')                       as anon_insert_must_be_false,
  has_function_privilege('anon', 'public.claim_completion(text)', 'EXECUTE')               as anon_claim_must_be_false,
  has_function_privilege('anon', 'public.mint_completion_reference(text)', 'EXECUTE')      as anon_mint_must_be_false,
  has_function_privilege('anon', 'public.issue_completion(uuid, text, boolean)', 'EXECUTE') as anon_issue_must_be_false,
  has_function_privilege('anon', 'public.verify_completion(text)', 'EXECUTE')              as anon_verify_must_be_true,
  has_function_privilege('authenticated', 'public.claim_completion(text)', 'EXECUTE')      as auth_claim_must_be_true,
  has_function_privilege('authenticated', 'public.verify_completion(text)', 'EXECUTE')     as auth_verify_must_be_true;

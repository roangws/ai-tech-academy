-- What an admin needs in order to administer anything.
--
-- `requireRole` waves admins through every route, and then each staff page calls
-- `getTaughtCourses(viewer.id)` or `getMySeat()` — both scoped to the caller
-- personally. So an admin was let into /instructor specifically to administer it
-- and saw "No courses assigned yet", and into /judge and saw "You do not hold a
-- seat yet". Both empty by construction.
--
-- The only way to read a learner's submitted work was to insert yourself into
-- `instructor_assignments`, which pollutes the assignment table with fake
-- teaching relationships and makes "who is responsible for course A"
-- unanswerable. Quality control on the marking pipeline was unavailable to the
-- one person accountable for it.
--
-- Every screen below works under RLS with `is_admin()`. No service-role client
-- enters src/ — that would turn a policy bug into a total bypass, which is the
-- risk LMS-ARCHITECTURE.md §8 explicitly accepts not taking.

/* ------------------------------------------------------------------ reading */

-- Five tables an admin could not read at all. SELECT only, deliberately: an
-- admin reading a learner's artifact is defensible, editing it is not — and
-- `artifacts_guard` would treat an admin as the instructor branch and silently
-- pin the body, which is a confusing half-failure rather than a refusal.
create policy progress_read_as_admin   on public.lesson_progress for select to authenticated using (public.is_admin());
create policy artifacts_read_as_admin  on public.artifacts       for select to authenticated using (public.is_admin());
create policy sheets_read_as_admin     on public.outcome_sheets  for select to authenticated using (public.is_admin());
create policy rows_read_as_admin       on public.outcome_rows    for select to authenticated using (public.is_admin());
create policy judgements_read_as_admin on public.judgements      for select to authenticated using (public.is_admin());
create policy responses_read_as_admin  on public.block_responses for select to authenticated using (public.is_admin());
create policy positions_read_as_admin  on public.media_positions for select to authenticated using (public.is_admin());

/* --------------------------------------------------------- the last admin */

-- `user_roles_admin_write` is ALL/is_admin(), so an admin can already revoke
-- their own admin role, or the last one. Recovery from that is raw SQL against
-- production — LMS-QA.md is explicit that the first admin must be created that
-- way and that is correct — which makes it a one-click unrecoverable mistake.
--
-- Written in the shape of `enrollments_guard`, so it reads as house style.
create or replace function public.user_roles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'student'::public.app_role then
    raise exception 'the student role is granted on sign-up and is not revocable';
  end if;

  if old.role = 'admin'::public.app_role then
    if old.user_id = (select auth.uid()) then
      raise exception 'an admin cannot revoke their own admin role';
    end if;
    if (select count(*) from public.user_roles where role = 'admin'::public.app_role) <= 1 then
      raise exception 'the last admin cannot be removed';
    end if;
  end if;

  return old;
end
$$;

create trigger user_roles_guard
  before delete on public.user_roles
  for each row execute function public.user_roles_guard();

/* -------------------------------------------------------------- judge seats */

-- `authenticated` has no SELECT on `judge_seats.user_id` at all — it is a
-- column whitelist and that column is not in it. That revoke is load-bearing:
-- `catalog_seats_read` is `using (true)`, so granting SELECT on the column would
-- publish every judge's identity to every learner. A column grant is therefore
-- not available as the fix, and this has to be a definer function.
create or replace function public.admin_seats()
returns table (
  id text, seat text, reviews_course_id text, reviews_label text,
  reads_all_courses boolean, "position" integer,
  user_id uuid, holder_name text, holder_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select js.id, js.seat, js.reviews_course_id, js.reviews_label,
         js.reads_all_courses, js."position", js.user_id,
         nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
         p.email
    from public.judge_seats js
    left join public.profiles p on p.id = js.user_id
   -- INSIDE the function. A definer function bypasses RLS, so the authorisation
   -- has to be written by hand or this is a public list of judge identities.
   where public.is_admin()
   order by js."position";
$$;

-- PUBLIC first, because PUBLIC holds EXECUTE on every new function by default.
-- That is necessary and NOT sufficient on this project — see the block at the
-- foot of this file, which revokes from `anon` as well and explains why both are
-- needed and neither implies the other.
revoke execute on function public.admin_seats() from public;
grant  execute on function public.admin_seats() to authenticated;

-- Binding a seat also grants the judge role, in the same transaction.
-- `holds_seat()` tests `has_role(uid, 'judge')` first, so a seat bound to
-- somebody without the role is a seat that silently does nothing — and the
-- person would sit looking at an empty console with no way to know why.
create or replace function public.bind_seat(p_seat_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only an admin may bind a judge seat';
  end if;

  if p_user_id is null then
    -- Unbinding does NOT revoke the role. Somebody may hold a seat on one course
    -- and be moved to another, and dropping the role mid-move would be silent.
    update public.judge_seats set user_id = null where id = p_seat_id;
    return;
  end if;

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'judge'::public.app_role)
  on conflict (user_id, role) do nothing;

  update public.judge_seats set user_id = p_user_id where id = p_seat_id;
end
$$;

revoke execute on function public.bind_seat(text, uuid) from public;
grant  execute on function public.bind_seat(text, uuid) to authenticated;

/* ------------------------------------------------------------- completion */

-- Two dead paths, closed together.
--
-- `enrollments_guard` raises 'only an admin may complete an enrolment', but the
-- only admin policy on enrollments is `enrollments_read_as_admin`, which is FOR
-- SELECT. There is no admin UPDATE policy, so that branch has never been
-- reachable: a documented rule with no path to it.
--
-- And `completion_records` has never been written by anything. The curriculum
-- copy promises a record — module 08 of course A is literally titled "the record
-- that proves it ran" — and the product cannot issue one.
create policy enrollments_write_as_admin on public.enrollments
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Issuing twice was possible. It is a public identifier; it must be one per pair.
alter table public.completion_records
  add constraint completion_records_user_course_key unique (user_id, course_id);

-- SECURITY INVOKER, so RLS and enrollments_guard both still apply — the same
-- argument save_outcome_sheet's docstring makes for not going definer.
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

  /*
    The reference has to be quotable on a CV and read aloud over a phone, so no
    O/0/I/1. Chosen once and never changed: it is a public identifier and
    changing the format invalidates every one already issued.
      AITE-<COURSE>-<YEAR>-<6 chars from base32 without the ambiguous glyphs>
  */
  v_ref := 'AITE-' || upper(p_course_id) || '-' || to_char(now(), 'YYYY') || '-' ||
           upper(substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=OoIl01', 'ABCDEFGHJ'), 1, 6));

  insert into public.completion_records (user_id, course_id, reference)
  values (p_user_id, p_course_id, v_ref)
  on conflict (user_id, course_id) do update set reference = public.completion_records.reference
  returning reference into v_ref;

  update public.enrollments
     set status = 'completed', completed_at = coalesce(completed_at, now())
   where user_id = p_user_id and course_id = p_course_id;

  return v_ref;
end
$$;

revoke execute on function public.issue_completion(uuid, text, boolean) from public;
grant  execute on function public.issue_completion(uuid, text, boolean) to authenticated;

/* ------------------------------------------------- the revoke that was not one

   The three functions above were first written with `revoke execute ... from
   public` alone, on the correct-but-incomplete reasoning that PUBLIC holds
   EXECUTE on every new function by default and that naming `anon` is the revoke
   which succeeds and changes nothing.

   That is true in general and false on this project. ALTER DEFAULT PRIVILEGES
   here ALSO grants EXECUTE explicitly:

     pg_default_acl, schema public, objtype f:
       anon=X/postgres | authenticated=X/postgres | service_role=X/postgres

   and revoking from PUBLIC does not remove an explicit grant. So `anon` could
   execute all three. Not a breach — every one checks `is_admin()` internally, so
   anon got zero rows from the first and an exception from the other two — but
   "the check inside the function is the only thing between anon and the judge
   roster" is not a sentence worth leaving true.

   BOTH revokes are needed and neither implies the other. This is the same trap
   docs/LMS-QA.md records, in its mirror image: there, a revoke naming anon did
   nothing because the grant was PUBLIC's; here, a revoke naming PUBLIC did
   nothing because the grant was anon's. Verify, always. */

revoke execute on function public.admin_seats() from anon;
revoke execute on function public.bind_seat(text, uuid) from anon;
revoke execute on function public.issue_completion(uuid, text, boolean) from anon;

/* Verification. A GRANT or REVOKE returning success is not evidence. */
select
  has_function_privilege('anon','public.admin_seats()','EXECUTE')                                as anon_seats_must_be_false,
  has_function_privilege('anon','public.bind_seat(text,uuid)','EXECUTE')                         as anon_bind_must_be_false,
  has_function_privilege('anon','public.issue_completion(uuid,text,boolean)','EXECUTE')          as anon_issue_must_be_false,
  has_function_privilege('authenticated','public.admin_seats()','EXECUTE')                       as auth_seats_must_be_true,
  has_function_privilege('authenticated','public.bind_seat(text,uuid)','EXECUTE')                as auth_bind_must_be_true,
  has_function_privilege('authenticated','public.issue_completion(uuid,text,boolean)','EXECUTE') as auth_issue_must_be_true;

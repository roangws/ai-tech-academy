-- Completing a lesson, in one round trip instead of five.
--
-- --------------------------------------------------------------- the problem
--
-- Pressing "Complete lesson" took about a second and a quarter on production,
-- and was reported as ten. Both numbers are real and they have different causes.
--
-- The measured second and a quarter is ten SEQUENTIAL round trips to Postgres,
-- five of them in the action and five in the re-render that Next streams back in
-- the same response. Each one cost ~85ms, of which ~68ms was pure geography:
-- the functions deploy to iad1 and this database is in us-west-1. `vercel.json`
-- pins the functions to sfo1 in the same commit, which takes the per-hop cost to
-- roughly 20ms on its own.
--
-- This file removes four of the five hops in the action. What was:
--
--   1. upsert/delete lesson_progress
--   2. select the module id from (course_id, n)
--   3. upsert the enrolment
--   4. update the enrolment's resume pointer
--
-- is one statement block. The fifth hop, resolving the caller, is gone too — it
-- is `auth.uid()` in here, evaluated by Postgres.
--
-- ------------------------------------------------------- and it was not atomic
--
-- Worth stating plainly, because the speed is the smaller half. Those four
-- writes had nothing spanning them. A failure after the progress row landed and
-- before `touchEnrollment` ran left a learner who had completed a lesson in a
-- course they were not enrolled on — which is exactly the state the dashboard
-- renders as "No courses started yet" while they are halfway through. The
-- `save_outcome_sheet` function in this schema was written for the same reason
-- and its comment makes the same argument.
--
-- ---------------------------------------------------------- SECURITY INVOKER
--
-- Not DEFINER, and this is the load-bearing line in the file. Every statement
-- below runs as the caller, so `lesson_progress_own`, `enrollments_own` and the
-- rest apply exactly as they did when this was four PostgREST calls. A definer
-- version would be a way around every policy it touches, which is what
-- `save_outcome_sheet` already says at length.
--
-- The user id is `auth.uid()` and is never a parameter. A `p_user_id` argument
-- would be an argument an attacker can set; the policies would refuse it, but
-- the right time to not have that hole is before writing it.

create or replace function public.toggle_lesson(
  p_lesson_id uuid,
  p_course_id text,
  p_n         text,
  p_done      boolean
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_module uuid;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  /* The lesson has to be in the module named by the URL, and that module has to
     belong to the named course. `p_lesson_id` arrives from a hidden form field,
     so without this a signed-in reader could tick any lesson of any course by
     posting its uuid — the progress row would genuinely be theirs, so RLS was
     never going to catch it. Same class of bug as the one saveArtifact fixed. */
  select m.id into v_module
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = p_lesson_id and m.course_id = p_course_id and m.n = p_n;

  if v_module is null then
    raise exception 'that lesson is not in module % of %', p_n, p_course_id;
  end if;

  if p_done then
    delete from public.lesson_progress
     where user_id = v_user and lesson_id = p_lesson_id;
  else
    /* ON CONFLICT DO NOTHING, not an error. A double-click, or the back button
       and then the button again, is a no-op rather than a 409 for somebody who
       did nothing wrong. */
    insert into public.lesson_progress (user_id, lesson_id)
    values (v_user, p_lesson_id)
    on conflict (user_id, lesson_id) do nothing;
  end if;

  /* Ticking a lesson is doing the course, so it enrols. A learner who signs up
     from a locked module and starts ticking is otherwise never enrolled, and
     getDashboard iterates enrolments — so their dashboard said "No courses
     started yet" while they were halfway through. The resume pointer is the
     other half of that promise: last_lesson_id is what Continue reads. */
  insert into public.enrollments (user_id, course_id, last_module_id, last_lesson_id, last_seen_at)
  values (v_user, p_course_id, v_module, p_lesson_id, now())
  on conflict (user_id, course_id) do update
    set last_module_id = excluded.last_module_id,
        last_lesson_id = excluded.last_lesson_id,
        last_seen_at   = excluded.last_seen_at;
end;
$$;

comment on function public.toggle_lesson(uuid, text, text, boolean) is
  'Tick or untick one lesson and touch the enrolment, atomically, as the caller.';

/* Both revokes are needed and neither implies the other — the admin_console
   migration records this trap at length. Postgres grants EXECUTE to PUBLIC on
   every new function, and revoking from `anon` does not remove PUBLIC's grant;
   revoking from PUBLIC does not remove an explicit grant to `anon`. */
revoke execute on function public.toggle_lesson(uuid, text, text, boolean) from public;
revoke execute on function public.toggle_lesson(uuid, text, text, boolean) from anon;
grant  execute on function public.toggle_lesson(uuid, text, text, boolean) to authenticated;

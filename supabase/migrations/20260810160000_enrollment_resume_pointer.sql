-- Where a learner actually left off.
--
-- `enrollments.last_module_id` already existed and was already written by
-- `touchEnrollment`. Nothing read it. Not one query in src/lib/lms/queries.ts
-- selected it, so the dashboard's "Continue" pointed at the course table of
-- contents and its subtitle promised "Pick up where you left off" — three clicks
-- and two navigation decisions away from the lesson they were on.
--
-- Five of the ten specialists raised that independently, which is the strongest
-- signal in the whole review. A module is still the wrong granularity: a module
-- has up to eleven lessons and "continue" means one of them.
--
-- `last_seen_at` exists because ordering the dashboard by `enrolled_at` answers
-- "which course did you sign up for first", and the question a returning learner
-- is asking is "what was I doing".

alter table public.enrollments
  add column if not exists last_lesson_id uuid references public.lessons (id) on delete set null,
  add column if not exists last_seen_at timestamptz;

-- ON DELETE SET NULL, not CASCADE: deleting a lesson must not delete the
-- enrolment that pointed at it. The resume target degrades to the module, and
-- from there to the first incomplete lesson.

-- Backfill from what is already known, so existing learners get a resume target
-- rather than waiting for their next tick to create one. The most recent
-- completion is the best available guess at where somebody was.
update public.enrollments e
   set last_lesson_id = p.lesson_id,
       last_seen_at   = p.completed_at
  from (
    select distinct on (lp.user_id, m.course_id)
           lp.user_id, m.course_id, lp.lesson_id, lp.completed_at
      from public.lesson_progress lp
      join public.lessons l on l.id = lp.lesson_id
      join public.modules m on m.id = l.module_id
     order by lp.user_id, m.course_id, lp.completed_at desc
  ) p
 where p.user_id = e.user_id
   and p.course_id = e.course_id
   and e.last_lesson_id is null;

-- `authenticated` holds table-level grants on enrollments (verified against
-- pg_class.relacl, unlike profiles and judge_seats which are column whitelists),
-- so both columns are readable and writable by inheritance. The owning policy
-- `enrollments_own` is unchanged and still the boundary.

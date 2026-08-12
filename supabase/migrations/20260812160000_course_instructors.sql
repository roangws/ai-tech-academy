-- Which instructors teach which course.
--
-- ---------------------------------------------------------------- what this is for
--
-- The roster is a table and the catalogue is a table, and nothing joined them.
-- The course page named one person — `const [lead] = await getInstructors()` —
-- and it named the same person on all five, because "the lead instructor" is a
-- fact about the roster rather than about a course. So the film course and the
-- infrastructure course both credited the lead and neither credited the person
-- who actually teaches it.
--
-- This is that join. A course lists the people who teach it, in the order the
-- cards should print, and the lead's presence on a course is a row like any
-- other rather than something derived: he teaches all five today, and the day he
-- hands one over there is a row to delete rather than a component to rewrite.
--
-- ------------------------------------------------------------------ the shape
--
-- Both ids are `text` because both parents are: 'media' references 'patrick'.
-- The primary key is the pair, so a person cannot be added to a course twice,
-- and `position` orders the cards inside one course rather than across the
-- roster — Patrick is fourth on /instructors and second on the film course, and
-- those two numbers have no reason to agree.
--
-- `on delete cascade` on both sides. Deleting a course should not leave rows
-- pointing at nothing, and deleting a roster entry should take their credits
-- with them; neither cascade can reach anything but this table.
--
-- NOT `instructor_assignments`, which already exists and is a different fact.
-- That table keys on `auth.users` and decides what an instructor may touch in
-- the console; it can only name somebody who has an account, and four of the
-- five instructors have none. A published roster card comes before a login and
-- often instead of one, so a credit on a public page has to key on `roster`.
--
-- Instructors only. A judge is not a teacher, and the discriminator lives on the
-- roster row, so the check is a trigger-free constraint we cannot write in a
-- foreign key — it is enforced by the reader (`kind = 'instructor'`) and by the
-- console, which only offers instructors to tick.

create table public.course_instructors (
  course_id  text not null references public.courses (id) on delete cascade,
  roster_id  text not null references public.roster (id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now(),

  primary key (course_id, roster_id)
);

create index course_instructors_course_idx
  on public.course_instructors (course_id, position);
create index course_instructors_roster_idx
  on public.course_instructors (roster_id);

-- ------------------------------------------------------------------------ RLS
--
-- Read is public, because this feeds a public course page rendered for
-- signed-out visitors and crawlers. There is nothing private in a pair of ids,
-- and whether a card is shown at all is still decided by the roster's own
-- `status = 'published'` filter one query over.
--
-- One policy per role rather than one policy with `is_admin()` in it. That
-- function is granted to `authenticated` and not to `anon`, and Postgres
-- resolves EXECUTE at plan time, so a combined policy makes every signed-out
-- read fail with "permission denied for function is_admin". This repository has
-- shipped that bug twice — `20260811120000_drafts_are_admin_only.sql` and
-- `20260812120100_roster_policies_per_role.sql` are the two fixes — and this is
-- the third table to be written the right way round from the start.

alter table public.course_instructors enable row level security;

create policy course_instructors_read_public on public.course_instructors
  for select to anon using (true);

create policy course_instructors_read on public.course_instructors
  for select to authenticated using (true);

create policy course_instructors_write_as_admin on public.course_instructors
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------- who teaches what
--
-- Roan's assignment, 11 Aug: the lead teaches every course; Patrick teaches the
-- film course; Aaron, Hendrik and Loc teach the literacy course. The other three
-- courses have the lead alone, which is true rather than thin — nobody else has
-- agreed to teach them yet, and a card for a person who does not teach a course
-- is the one thing this table exists to stop.
--
-- Written as a select against the two parent tables rather than as literal
-- pairs, so a database where one of these ids has been renamed inserts fewer
-- rows instead of failing the migration. `on conflict do nothing` so a re-run is
-- a no-op.

insert into public.course_instructors (course_id, roster_id, position)
select c.id, r.id, 0
  from public.courses c
  join public.roster r on r.id = 'roan' and r.kind = 'instructor'
 on conflict do nothing;

insert into public.course_instructors (course_id, roster_id, position)
values ('media', 'patrick', 1),
       ('literacy', 'aaron', 1),
       ('literacy', 'hendrik', 2),
       ('literacy', 'loc', 3)
 on conflict do nothing;

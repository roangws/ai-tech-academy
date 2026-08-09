-- Where a listener got to in an episode.
--
-- ------------------------------------------------- deliberately not completion
--
-- `lesson_progress` stays exactly what it is: a row that exists because a person
-- pressed a button that says "Complete lesson". The table only ever holds facts
-- somebody asserted. A row meaning "the tab was open at 0.9x duration" is a
-- different kind of fact and does not belong in the same table.
--
-- So this is a bookmark, and nothing is derived from it. Nothing in the product
-- reads a percentage to decide anything. An auto-complete at ~90% listened is an
-- affordance built on top — a client call to the existing `toggleLesson`, still
-- untickable by the learner — and never a schema concept.
--
-- One row per (learner, block), like lesson_progress, rather than an event
-- stream. The questions it has to answer are "resume where?" and "how much of
-- this gets listened to", and both are answered by one row. At 173 lessons an
-- event pipeline is analytics nobody asked for, and the table is bounded: no
-- growth over time, all primary-key addressed.
--
-- ---------------------------------------------------------------- no instructor read
--
-- Unlike lesson_progress, which instructors can read. How far a named learner
-- got into a podcast is surveillance, not teaching, and no screen in the product
-- would be improved by it. Add it if somebody asks and can say what they would
-- do with the answer.

create table public.media_positions (
  user_id     uuid not null references auth.users (id) on delete cascade,
  block_id    uuid not null references public.lesson_blocks (id) on delete cascade,
  seconds     integer not null default 0 check (seconds >= 0),
  -- Monotonic, so scrubbing backwards cannot reduce it. Kept separate from
  -- `seconds` because "where do I resume" and "how much did they hear" are
  -- different questions and one column cannot answer both.
  furthest    integer not null default 0 check (furthest >= 0),
  duration    integer check (duration > 0),
  finished_at timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, block_id)
);

create index media_positions_block_idx on public.media_positions (block_id);

alter table public.media_positions enable row level security;

create policy positions_own on public.media_positions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ALTER DEFAULT PRIVILEGES grants everything, DELETE included, to anon on every
-- new table in public. Verified against pg_default_acl rather than assumed. This
-- table holds per-learner listening data and must not rely on RLS alone.
revoke all on public.media_positions from anon;

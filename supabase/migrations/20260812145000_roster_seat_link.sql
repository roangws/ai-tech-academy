-- A roster judge card can name the board seat it holds.
--
-- Roan: "why no judge /judge?? all of those have to be here /review-judge-board
-- and be able to crud and link to a user."
--
-- Being a judge here was already three facts in three tables — a card in
-- `roster`, the `judge` role in `user_roles`, and a seat in `judge_seats` — and
-- the only thing joining the card to the seat was a shared `user_id`. Every one
-- of the five published judges has a null `user_id`, because none of them has
-- signed in, so in practice nothing joined them at all: /review-judge-board
-- listed five people, /judge said "you do not hold a seat" and pointed at
-- /review-judge-board to "see the six seats", and that page has never shown a
-- seat in its life.
--
-- `seat_id` is the missing edge, and it deliberately does NOT go through the
-- account. A seat has to be assignable to a judge who has agreed to sit and has
-- not yet made an account — which is every judge on the board today — so the
-- card is what holds the assignment and the account is bound separately when
-- there is one. `bind_seat` still owns the account side.
--
-- ---------------------------------------------------------------- recovered
--
-- This file did not exist until 9 Aug. The migration was applied to production
-- through the Supabase MCP, which writes the remote history table and no file,
-- and a code review caught the consequence: a rebuild from this repo alone gets
-- no `roster.seat_id`, `src/lib/roster.ts` swallows the resulting error into an
-- empty list, and /instructors, /review-judge-board, the homepage band and the
-- whole roster console render blank with nothing but a console line. Recovered
-- verbatim from `supabase_migrations.schema_migrations`, which keeps the text.

alter table public.roster
  add column seat_id text references public.judge_seats(id) on delete set null;

comment on column public.roster.seat_id is
  'the judge_seats row this card holds. Judges only. Null means the card is published but the person reads no particular course yet.';

-- One seat, one holder. The board is six named seats, not six categories, and
-- two cards claiming the revenue-operations seat is a contradiction the public
-- page would print without noticing.
create unique index roster_seat_id_key on public.roster (seat_id) where seat_id is not null;

-- An instructor holds no seat. `kind` and `seat_id` are two columns that can
-- disagree, so they are stopped from disagreeing here rather than in the console:
-- the roster form is not the only writer, and a check constraint is the one place
-- that holds for the SQL editor too.
alter table public.roster
  add constraint roster_seat_is_judge check (seat_id is null or kind = 'judge');

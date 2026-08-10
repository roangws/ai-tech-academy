-- The instructor roster and the judge board become data.
--
-- ---------------------------------------------------------------- what this is for
--
-- Both rosters lived in `src/lib/content.ts` as `as const` literals: five
-- instructors under `instructors.people`, and the judges under `board.members`.
-- Adding a judge therefore meant editing TypeScript and deploying, which is the
-- same "you have to be a programmer to run this" failure the catalogue move
-- fixed one table over — and it is worse here, because the people on those two
-- lists change more often than a curriculum does. Roan has been adding judges by
-- hand, one commit each, while the console that exists to run the school could
-- not see that either list existed.
--
-- It is one table with a `kind` discriminator rather than two. The two shapes
-- differ in three optional columns out of eighteen, and somebody can be both:
-- the lead instructor is also a hackathon judge. One row per (person, kind) says
-- that the way `user_roles` says it, and a second near-identical table would
-- double every policy, every query and every form for no gain.
--
-- ------------------------------------------------------------------- user_id
--
-- Nullable, and it is the point of the whole exercise. Today a name on the
-- website and an account in the product are unrelated facts; binding them is
-- what lets an instructor's console know which roster entry is them, and what
-- lets an accepted application become a published judge card without anybody
-- retyping a name. `on delete set null` so removing an account retires the
-- binding rather than deleting a published card out from under the website.
--
-- The binding does NOT grant a role. `has_role` stays the only thing that
-- decides what somebody may do; this is who the public page is about. Those two
-- being separate is what makes it safe to publish a judge card before that
-- person has ever signed in.

create type public.roster_kind as enum ('instructor', 'judge');

create table public.roster (
  /* Text, not uuid, and authored rather than generated. These ids are already
     in content.ts ('roan', 'liz-zhang') and already referenced by seed data and
     by hand-written copy; regenerating them would break the mapping for no
     benefit. It is the same id/slug argument the catalogue makes. */
  id            text primary key,
  kind          public.roster_kind not null,

  user_id       uuid references auth.users on delete set null,

  name          text not null,
  role          text,
  detail        text,
  summary       text,
  scope         text,
  location      text,

  org_name      text,
  org_role      text,
  org_url       text,
  wordmark      text,

  ground        text not null default 'var(--accent)',

  photo_src     text,
  photo_alt     text,
  logo_src      text,
  logo_alt      text,

  linkedin      text,
  site_label    text,
  site_href     text,

  /* The one instructor who writes the curriculum. Exactly zero or one, enforced
     by the partial unique index below rather than by a form, because "the lead"
     is a fact about the whole roster and no single row can check it. */
  lead          boolean not null default false,

  position      integer not null default 0,
  /* Draft is what makes it safe to build a card on the live site. The public
     pages read published only. */
  status        text not null default 'published' check (status in ('draft', 'published')),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index roster_kind_position_idx on public.roster (kind, position);
create index roster_user_idx on public.roster (user_id) where user_id is not null;

/* One lead instructor, at most. A judge cannot be a lead at all — the concept
   does not exist on that board — so the index scopes to instructors and lets
   the check constraint refuse the rest. */
create unique index roster_one_lead_idx
  on public.roster (kind) where lead and kind = 'instructor';

alter table public.roster
  add constraint roster_lead_is_an_instructor
  check (not lead or kind = 'instructor');

/* One binding per person per kind. Somebody can be an instructor and a judge;
   they cannot be two different judges. */
create unique index roster_one_row_per_person_per_kind
  on public.roster (kind, user_id) where user_id is not null;

-- ------------------------------------------------------------------------ RLS
--
-- Read is public and deliberately so: these two lists ARE public pages, and
-- `/instructors` and `/review-judge-board` are statically rendered for
-- signed-out visitors and crawlers. Draft rows are the exception, and they are
-- excluded in the policy rather than in a `where` clause on the query — the same
-- rule the catalogue migration settled on, for the same reason. A filter a
-- caller can forget is not access control.

alter table public.roster enable row level security;

create policy roster_read_published on public.roster
  for select
  using (status = 'published' or public.is_admin());

create policy roster_write_as_admin on public.roster
  for all
  using (public.is_admin())
  with check (public.is_admin());

/* `updated_at` from a trigger rather than from the application. Six call sites
   write this table and one of them would eventually forget. */
create or replace function public.touch_roster()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger roster_touch
  before update on public.roster
  for each row execute function public.touch_roster();

grant select on public.roster to anon, authenticated;
grant insert, update, delete on public.roster to authenticated;

-- Applications to teach and applications to judge.
--
-- ------------------------------------------------------- ALREADY APPLIED, 9 AUG
--
-- This is on production. It went up through the Supabase MCP's `apply_migration`
-- rather than through `npm run db:push`, so `db:push` must NOT be run against it
-- expecting a fresh apply: `create type public.application_track` would fail on
-- the type that is already there.
--
-- The filename is the version the remote recorded (`20260809221253`), not a
-- version chosen here, and that is the whole reason it reads as an odd timestamp
-- next to the files below it. `apply_migration` stamps
-- `supabase_migrations.schema_migrations` with its own clock, and a local file
-- whose version does not match is a file `supabase migration list` reports as
-- pending forever. README.md in this directory has the longer account of what
-- that tool does and does not write.
--
-- The text below is the fuller version of what was applied. The remote copy is
-- the same DDL with the commentary trimmed; where they differ, they differ only
-- in prose.
--
-- ------------------------------------------------------------------- why a table
--
-- /instructors and /review-judge-board now carry an offer, and an offer with no
-- store behind it is a mailto: link with extra steps. Two things follow from
-- what the form actually asks for, and both of them are the reason this is a
-- table in Postgres rather than a form service:
--
--   1. It collects a phone number, a WhatsApp number and a portrait. That is
--      contact data about a named person who has not been accepted to anything,
--      so it has to sit behind row-level security next to everything else, not
--      in a third party's inbox.
--   2. The applicant has to be able to see where their application stands. The
--      copy on both public pages promises exactly that -- "the page then shows
--      you where it stands" -- and a promise about state needs state.
--
-- ------------------------------------------------------------------ one row each
--
-- `unique (user_id, track)`. A person may apply once to teach and once to judge,
-- and re-applying edits the row they already have rather than filing a second
-- one. A queue with three copies of the same person in it is a queue that gets
-- read three times and answered once.
--
-- ------------------------------------------------------------- what is NOT here
--
-- No score, no rating, no reviewer assignment. The advisory board is one person
-- today and the process described on the public pages is four steps ending in a
-- decision, so a decision is what this stores. Anything more would be schema
-- written against a committee that does not exist yet.

create type public.application_track as enum ('instructor', 'judge');

-- Six states, and the two at the end are separate on purpose. `withdrawn` is the
-- applicant's word and `declined` is the board's; collapsing them into one
-- 'closed' would make "how many did we turn down" unanswerable, which is the one
-- number a selective process has to be able to state about itself.
create type public.application_status as enum (
  'draft', 'submitted', 'in_review', 'accepted', 'declined', 'withdrawn'
);

create table public.applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  track      public.application_track  not null,
  status     public.application_status not null default 'draft',

  -- ------------------------------------------------------------ who they are
  --
  -- Copied onto the application rather than joined from `profiles`, and that
  -- duplication is deliberate. An application is a document submitted on a date,
  -- and the board has to be able to read what was submitted. A join renders
  -- whatever the person's profile says today, so somebody could be accepted
  -- against one employer and appear in the queue under another.
  full_name  text not null default '',
  headline   text,
  org        text,
  location   text,
  linkedin_url text,
  site_url     text,
  -- The portrait, as a public URL into the `avatars` bucket. The form writes the
  -- profile avatar and copies the URL here, so a person has one photograph
  -- rather than two that can disagree.
  photo_url  text,

  -- ------------------------------------------------------- how to reach them
  --
  -- Nullable while the row is a draft and required at submit time, which is
  -- enforced by the guard below rather than by NOT NULL: a half-finished draft
  -- has to be storable or the save-as-you-go the form promises is a lie.
  phone      text,
  whatsapp   text,

  -- ------------------------------------------------------------ the substance
  --
  -- `course_id` is the path an instructor would record, or the course a judge
  -- would read. ON DELETE SET NULL rather than CASCADE: retiring a course must
  -- not delete somebody's application to teach it.
  course_id  text references public.courses (id) on delete set null,
  focus      text,
  evidence   text,
  sample_url text,

  -- --------------------------------------------------------------- the extras
  --
  -- Both of these are questions Roan asked for by name, and both are stored as
  -- booleans with a free-text qualifier rather than as prose, because "can you
  -- come in person" is a question the board filters on when it is putting a
  -- panel together and prose cannot be filtered.
  in_person       boolean not null default false,
  in_person_city  text,
  reviews_curriculum boolean not null default false,
  notes      text,

  -- --------------------------------------------------------------- the record
  submitted_at  timestamptz,
  decided_at    timestamptz,
  decided_by    uuid references auth.users (id) on delete set null,
  decision_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, track)
);

-- Ceilings on every free-text field. Not validation -- the form does that and
-- says so in English -- but a bound on what one authenticated account can push
-- into the table. Without it, `notes` is an unbounded write endpoint.
alter table public.applications add constraint applications_lengths check (
  length(full_name)      <= 160
  and length(coalesce(headline, ''))       <= 200
  and length(coalesce(org, ''))            <= 160
  and length(coalesce(location, ''))       <= 160
  and length(coalesce(linkedin_url, ''))   <= 300
  and length(coalesce(site_url, ''))       <= 300
  and length(coalesce(photo_url, ''))      <= 500
  and length(coalesce(phone, ''))          <= 40
  and length(coalesce(whatsapp, ''))       <= 40
  and length(coalesce(focus, ''))          <= 400
  and length(coalesce(evidence, ''))       <= 4000
  and length(coalesce(sample_url, ''))     <= 300
  and length(coalesce(in_person_city, '')) <= 120
  and length(coalesce(notes, ''))          <= 4000
  and length(coalesce(decision_note, ''))  <= 4000
);

-- Both links are stored as typed, so they are checked as typed. A profile URL
-- that is not a URL is the single most common thing to get wrong in this form
-- and the most annoying to discover from the reviewing end.
alter table public.applications add constraint applications_urls check (
  (linkedin_url is null or linkedin_url ~ '^https://([a-z]{2,3}\.)?linkedin\.com/')
  and (site_url is null or site_url ~ '^https?://')
  and (sample_url is null or sample_url ~ '^https?://')
);

-- The admin queue reads by status and then by when it arrived, which is the only
-- order a queue can be read in without somebody being skipped.
create index applications_queue_idx on public.applications (status, submitted_at desc nulls last);

create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

/* --------------------------------------------------------------- the guard

   Written in the shape of `sheets_guard`, which solves the same problem: a row
   the owner may edit freely up to a point, and not at all after it.

   The transitions the applicant may make are the three that are theirs to make.
   Everything past 'submitted' is the board's word about them, and a person who
   can set their own status to 'accepted' is a person who is on the instructor
   roster by Tuesday. */
create or replace function public.applications_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.track is distinct from old.track then
    raise exception 'applications.user_id and track are immutable';
  end if;

  if public.is_admin() then
    /* The board. The application itself is not theirs to edit -- a reviewer who
       can rewrite the answers is a reviewer whose decision means nothing -- so
       every field the applicant filled in is pinned to what was submitted. */
    new.full_name    := old.full_name;
    new.headline     := old.headline;
    new.org          := old.org;
    new.location     := old.location;
    new.linkedin_url := old.linkedin_url;
    new.site_url     := old.site_url;
    new.photo_url    := old.photo_url;
    new.phone        := old.phone;
    new.whatsapp     := old.whatsapp;
    new.course_id    := old.course_id;
    new.focus        := old.focus;
    new.evidence     := old.evidence;
    new.sample_url   := old.sample_url;
    new.in_person    := old.in_person;
    new.in_person_city := old.in_person_city;
    new.reviews_curriculum := old.reviews_curriculum;
    new.notes        := old.notes;
    new.submitted_at := old.submitted_at;

    /* A decision stamps itself. Taking the decider from auth.uid() rather than
       from the payload means the audit line cannot be written by hand, which is
       the same reasoning artifacts_guard uses for feedback_by. */
    if new.status in ('accepted'::public.application_status,
                      'declined'::public.application_status)
       and old.status is distinct from new.status then
      new.decided_at := now();
      new.decided_by := (select auth.uid());
    end if;

    return new;
  end if;

  /* ---------------------------------------------------------- the applicant */

  new.decided_at    := old.decided_at;
  new.decided_by    := old.decided_by;
  new.decision_note := old.decision_note;

  if new.status in ('in_review'::public.application_status,
                    'accepted'::public.application_status,
                    'declined'::public.application_status) then
    raise exception 'only the advisory board may set an application to %', new.status;
  end if;

  /* Editable in draft, and in draft only. Reopening a withdrawn application
     puts it back in draft first, which is one extra press and the reason the
     board never sees a row change under it. */
  if old.status <> 'draft'::public.application_status then
    if new.status = old.status then
      raise exception 'application % has been submitted and can no longer be edited', old.id;
    end if;

    if old.status = 'submitted'::public.application_status
       and new.status <> 'withdrawn'::public.application_status then
      raise exception 'a submitted application may only be withdrawn';
    end if;

    if old.status in ('accepted'::public.application_status,
                      'declined'::public.application_status) then
      raise exception 'application % has been decided', old.id;
    end if;

    /* Withdrawn back to draft is the one reopening allowed, and it clears the
       submission stamp so the queue's ordering cannot be gamed by withdrawing
       and resubmitting to keep an old timestamp. */
    if old.status = 'withdrawn'::public.application_status then
      if new.status <> 'draft'::public.application_status then
        raise exception 'a withdrawn application may only be reopened as a draft';
      end if;
      new.submitted_at := null;
    end if;

    return new;
  end if;

  /* Draft. Submitting is the applicant's to do, and it is the one moment the
     required fields are actually required: a draft is allowed to be empty
     because the form saves as it goes. */
  if new.status = 'submitted'::public.application_status then
    if coalesce(btrim(new.full_name), '') = ''
       or coalesce(btrim(new.phone), '') = ''
       or coalesce(btrim(new.evidence), '') = '' then
      raise exception 'an application needs a name, a phone number and your evidence before it can be submitted';
    end if;
    new.submitted_at := now();
  end if;

  return new;
end
$$;

create trigger applications_guard
  before update on public.applications
  for each row execute function public.applications_guard();

/* An insert always starts as a draft belonging to the caller. The WITH CHECK on
   the policy already pins user_id; this pins the status, so a row cannot be
   created already accepted. */
create or replace function public.applications_insert_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.status       := 'draft'::public.application_status;
    new.submitted_at := null;
    new.decided_at   := null;
    new.decided_by   := null;
    new.decision_note := null;
  end if;
  return new;
end
$$;

create trigger applications_insert_guard
  before insert on public.applications
  for each row execute function public.applications_insert_guard();

/* ------------------------------------------------------------------ policies */

alter table public.applications enable row level security;

-- An applicant owns their own application, reads it, and edits it within
-- whatever the guard above allows.
create policy applications_own on public.applications
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The board reads every application. Nobody else reads anybody else's, which is
-- the whole reason this is not a public form: these rows carry a phone number.
create policy applications_read_as_admin on public.applications
  for select to authenticated
  using (public.is_admin());

create policy applications_decide_as_admin on public.applications
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/* -------------------------------------------------------------------- grants

   ALTER DEFAULT PRIVILEGES on this project grants everything, DELETE included,
   to `anon` on every new table in public. Verified against pg_default_acl rather
   than assumed, and it is the reason every table added since carries this
   block: without it, RLS is the only thing standing between an anonymous holder
   of the publishable key and this table.

   `anon` gets nothing at all here. There is no signed-out view of an
   application, not even a count. */
revoke all on public.applications from anon;

/* DELETE is revoked from the applicant as well, and withdrawing is the
   replacement. An application that can be deleted is a queue entry that can
   vanish between the board reading it and answering it; withdrawal says the same
   thing to the applicant and leaves the board something to answer. Deleting the
   account still removes the row, through the cascade on user_id. */
revoke delete on public.applications from authenticated;

/* Verification. A GRANT or REVOKE returning success is not evidence. */
select
  has_table_privilege('anon', 'public.applications', 'SELECT')          as anon_select_must_be_false,
  has_table_privilege('anon', 'public.applications', 'INSERT')          as anon_insert_must_be_false,
  has_table_privilege('anon', 'public.applications', 'DELETE')          as anon_delete_must_be_false,
  has_table_privilege('authenticated', 'public.applications', 'DELETE') as auth_delete_must_be_false,
  has_table_privilege('authenticated', 'public.applications', 'SELECT') as auth_select_must_be_true,
  has_table_privilege('authenticated', 'public.applications', 'INSERT') as auth_insert_must_be_true,
  has_table_privilege('authenticated', 'public.applications', 'UPDATE') as auth_update_must_be_true;

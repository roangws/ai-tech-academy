-- Judging opportunities: an event an administrator issues, and the notification
-- every judge gets from it.
--
-- ------------------------------------------------------------------ the gap
--
-- The board copy has promised this since content.ts was written: judges "sit on
-- the panel that judges the events where learners present the workflows they
-- deployed". The judge console said so too, in a [FILL: events.] note at the top
-- of the file, and there was no event anywhere in the schema. So the one thing
-- the site tells a prospective judge they will be asked to do was the one thing
-- the product could not ask them to do.
--
-- This is that feature, at the smallest size that is honestly useful: an event
-- exists, an administrator issues it, and every judge is notified.
--
-- ------------------------------------------------------- two tables, not one
--
-- `judge_events` is the opportunity. `judge_event_invitations` is one judge's
-- copy of it — the notification, and the place their answer goes.
--
-- A single table with an array of judge ids would make "has this judge answered"
-- unindexable, would make row-level security impossible to write (a judge must
-- read their own row and not a colleague's answer), and would lose the one fact
-- worth keeping most: WHEN somebody was told. An invitation row is that fact.
--
-- The fan-out is deliberately a snapshot rather than a view over `user_roles`.
-- Somebody granted the judge role next month was not notified about an event
-- issued today, and a view would silently claim they were. Re-issuing an event
-- fans out again and picks up the new judges, which is an act with a timestamp
-- on it rather than a definition quietly changing meaning.
--
-- -------------------------------------------------------------- the timezone
--
-- Stored on the event, not assumed. `REFERENCE_ZONE` is right for a course start
-- date because the school has one; a hackathon in Berlin does not. The column
-- holds an IANA name and both the admin form and the judge's screen render the
-- instant through it, so the time a judge reads is the time the event happens
-- where it happens. See the note in src/lib/lms/time.ts for why entering a wall
-- clock and storing an instant needs a conversion at all.
--
-- ------------------------------------------------------------ no seat needed
--
-- Nothing here touches `judge_seats`. A seat says which course's curriculum
-- somebody reads each term; being on a hackathon panel is not that, and gating
-- events on a seat would mean six people can ever be invited to anything. The
-- role is the whole condition.

/* ------------------------------------------------------------------ events */

create table public.judge_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  /* Who is running it. Null for one the school runs itself. */
  host text,
  /* One or two sentences: what the event is. */
  summary text,
  /* What the judge is actually being asked to do, and what they need to bring. */
  brief text,
  location text,
  format text not null default 'online',
  /* IANA name. Every instant on this row is rendered through it. */
  timezone text not null default 'America/Los_Angeles',
  starts_at timestamptz not null,
  ends_at timestamptz,
  /* When an answer stops being useful. Null means no deadline stated. */
  respond_by timestamptz,
  judges_needed integer,
  status text not null default 'draft',
  issued_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint judge_events_format_check check (format in ('online', 'in_person', 'hybrid')),
  constraint judge_events_status_check check (status in ('draft', 'issued', 'closed')),
  constraint judge_events_ends_after_start check (ends_at is null or ends_at >= starts_at),
  constraint judge_events_needed_positive check (judges_needed is null or judges_needed > 0),
  /* A draft has never been issued; anything else has. The column is written by
     `issue_judge_event` and by nothing else, and this is what says so. */
  constraint judge_events_issued_has_a_time check (status = 'draft' or issued_at is not null)
);

create index judge_events_starts_at_idx on public.judge_events (starts_at desc);

create trigger judge_events_touch
  before update on public.judge_events
  for each row execute function public.touch_updated_at();

/* ------------------------------------------------------------- invitations */

create table public.judge_event_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.judge_events (id) on delete cascade,
  judge_id uuid not null references auth.users (id) on delete cascade,
  /* The notification itself: this person was told, at this moment. */
  notified_at timestamptz not null default now(),
  response text,
  responded_at timestamptz,
  note text,

  constraint judge_event_invitations_one_per_judge unique (event_id, judge_id),
  constraint judge_event_invitations_response_check
    check (response is null or response in ('available', 'unavailable'))
);

create index judge_event_invitations_judge_idx
  on public.judge_event_invitations (judge_id);

/*
  Only the answer is the judge's to write.

  Same shape and same reason as `artifacts_guard`: the update policy below has to
  let a judge write their own row, and a permissive policy on `judge_id =
  auth.uid()` lets them write EVERY column of it — including `notified_at`, which
  is the record of when they were told, and `event_id`, which would move their
  answer onto somebody else's event. A check in the server action would protect
  the button. This protects the table.
*/
create or replace function public.judge_event_invitations_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.event_id := old.event_id;
  new.judge_id := old.judge_id;
  new.notified_at := old.notified_at;

  /* The timestamp comes from the clock, never from the caller. */
  if new.response is distinct from old.response or new.note is distinct from old.note then
    new.responded_at := now();
  else
    new.responded_at := old.responded_at;
  end if;

  return new;
end
$$;

revoke execute on function public.judge_event_invitations_guard() from public;

create trigger judge_event_invitations_guard
  before update on public.judge_event_invitations
  for each row execute function public.judge_event_invitations_guard();

/* ------------------------------------------------------------------- issue */

/*
  Issue an event, and notify every judge.

  SECURITY DEFINER for one reason: `authenticated` has no INSERT on
  `judge_event_invitations` at all — a judge must not be able to invite
  themselves, or anybody else, to anything. The authorisation check is inside the
  function, per the house rule, and EXECUTE is revoked from PUBLIC.

  Idempotent, and re-issuable on purpose. `on conflict do nothing` means pressing
  twice notifies nobody twice, and issuing again after a new judge is appointed
  notifies exactly the people who were not told the first time. The return value
  is how many were newly notified, so the console can say so rather than claiming
  a fan-out that reached nobody.
*/
create or replace function public.issue_judge_event(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  notified integer;
begin
  if not public.is_admin() then
    raise exception 'only an admin may issue a judging event';
  end if;

  update public.judge_events
     set status = 'issued',
         issued_at = coalesce(issued_at, now())
   where id = p_event_id;

  if not found then
    raise exception 'no such event';
  end if;

  with fresh as (
    insert into public.judge_event_invitations (event_id, judge_id)
    select p_event_id, ur.user_id
      from public.user_roles ur
     where ur.role = 'judge'::public.app_role
    on conflict (event_id, judge_id) do nothing
    returning 1
  )
  select count(*) into notified from fresh;

  return notified;
end
$$;

revoke execute on function public.issue_judge_event(uuid) from public;
grant execute on function public.issue_judge_event(uuid) to authenticated;

/* ---------------------------------------------------------------------- rls */

alter table public.judge_events enable row level security;
alter table public.judge_event_invitations enable row level security;

/* Everything an administrator does to an event, in one policy. Issuing is not
   among them — that is the RPC above, because it writes the invitations too. */
create policy judge_events_admin_all on public.judge_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/* A judge reads issued and closed events. A draft is an administrator thinking
   out loud and is nobody else's business until it is issued. */
create policy judge_events_read_as_judge on public.judge_events
  for select to authenticated
  using (
    status <> 'draft'
    and public.has_role((select auth.uid()), 'judge'::public.app_role)
  );

create policy judge_event_invitations_admin_read on public.judge_event_invitations
  for select to authenticated
  using (public.is_admin());

/* Their own notification, and nobody else's answer. */
create policy judge_event_invitations_own_read on public.judge_event_invitations
  for select to authenticated
  using (judge_id = (select auth.uid()));

create policy judge_event_invitations_own_answer on public.judge_event_invitations
  for update to authenticated
  using (judge_id = (select auth.uid()))
  with check (judge_id = (select auth.uid()));

/* -------------------------------------------------------------- privileges */

/*
  `pg_default_acl` grants ALL on every new table in `public` to `anon`, so both
  of these are readable by an anonymous holder of the publishable key until this
  runs. Neither is public: an unissued event is internal, and an invitation names
  a person.
*/
revoke all on public.judge_events from anon;
revoke all on public.judge_event_invitations from anon;

grant select, insert, update, delete on public.judge_events to authenticated;
/* No INSERT and no DELETE. Rows arrive through `issue_judge_event` and leave
   when the event does. */
grant select, update on public.judge_event_invitations to authenticated;

/* ------------------------------------------------------------ verification */

/*
  A GRANT or a REVOKE returning success is not evidence it applied — this schema
  has been bitten by that three times. Expect: f, t, t, f, t.
*/
select
  has_table_privilege('anon', 'public.judge_events', 'SELECT')                as anon_reads_events,
  has_table_privilege('authenticated', 'public.judge_events', 'INSERT')       as admin_can_write_events,
  has_table_privilege('authenticated', 'public.judge_event_invitations', 'UPDATE') as judge_can_answer,
  has_table_privilege('authenticated', 'public.judge_event_invitations', 'INSERT') as judge_can_invite,
  has_function_privilege('authenticated', 'public.issue_judge_event(uuid)', 'EXECUTE') as auth_may_issue;

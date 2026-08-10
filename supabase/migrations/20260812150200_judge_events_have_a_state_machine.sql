-- An event has states, and until now only the screens knew about them.
--
-- Everything this file adds was found by review, and all three findings are the
-- same shape: an invariant that the console renders correctly and the database
-- would happily let anybody violate by hand. The buttons were the enforcement.
--
--   1. Answering had no window. `judge_event_invitations_own_answer` is
--      `judge_id = auth.uid()` and nothing else, so a judge could flip
--      "unavailable" to "available" on a hackathon that finished last month —
--      through a kept-open tab, or a PATCH straight at PostgREST with their own
--      token. The guard trigger then stamped a fresh `responded_at` on it. The
--      whole argument for storing an invitation row is that it records who was
--      told and what they said; that record was rewritable by the person it
--      describes.
--
--   2. `issue_judge_event` had no status guard, and the console rendered the
--      issue form on every card including closed ones. So "Notify anyone new" on
--      a closed event silently reopened it and reported that everybody had
--      already been told.
--
--   3. The header badge counted invitations with no answer on an issued event,
--      with no date filter, while /judge only offers the answer form for events
--      still ahead. An event nobody closed after the fact left a permanent "1"
--      on the Judge tab that the judge had no way to clear.
--
-- The first two are closed here rather than in the actions, because an action
-- protects a button and a trigger protects the table. The third is closed with
-- an RPC, because the condition is `coalesce(ends_at, starts_at) >= now()` and
-- PostgREST cannot express a coalesce across an embed.

/* ------------------------------------------------ 1. answering has a window */

/*
  Same trigger, one more job. It already pinned every column that is not the
  judge's to write; now it also decides WHEN they may write the ones that are.

  `is distinct from` rather than `<>`, so a no-op update — the same answer sent
  twice — is not an error. What is refused is changing an answer once the event
  is closed or over.

  The event is read with a plain select inside a SECURITY DEFINER function, so
  it does not depend on the judge being able to read the event row themselves.
*/
create or replace function public.judge_event_invitations_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev public.judge_events%rowtype;
begin
  new.event_id := old.event_id;
  new.judge_id := old.judge_id;
  new.notified_at := old.notified_at;
  /* `id` too. It was left out of the first version, so a judge could rewrite
     their own primary key — harmless today, and the comment above this function
     claimed it pinned every column a judge must not write. */
  new.id := old.id;

  if new.response is distinct from old.response or new.note is distinct from old.note then
    select * into ev from public.judge_events e where e.id = old.event_id;

    if ev.status <> 'issued' then
      raise exception 'this event is no longer taking answers';
    end if;

    if coalesce(ev.ends_at, ev.starts_at) < now() then
      raise exception 'this event has already happened';
    end if;

    /* The timestamp comes from the clock, never from the caller. */
    new.responded_at := now();
  else
    new.responded_at := old.responded_at;
  end if;

  return new;
end
$$;

revoke execute on function public.judge_event_invitations_guard() from public, anon, authenticated;

/* --------------------------------------------- 2. a closed event stays closed */

/*
  Reopening is a deliberate act with its own control, and it goes through this
  function so that it fans out as well — which is the whole reason issuing is an
  RPC rather than an UPDATE. What is refused is reaching `issued` from `closed`
  by accident, through the button whose name says it only notifies.
*/
create or replace function public.issue_judge_event(p_event_id uuid, p_reopen boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  notified integer;
  current_status text;
begin
  if not public.is_admin() then
    raise exception 'only an admin may issue a judging event';
  end if;

  select status into current_status from public.judge_events where id = p_event_id;

  if current_status is null then
    raise exception 'no such event';
  end if;

  if current_status = 'closed' and not p_reopen then
    raise exception 'this event is closed; reopen it before notifying anybody';
  end if;

  update public.judge_events
     set status = 'issued',
         issued_at = coalesce(issued_at, now())
   where id = p_event_id;

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

/* The one-argument signature is gone, replaced rather than overloaded: two
   functions differing only in a defaulted argument are ambiguous to call. */
drop function if exists public.issue_judge_event(uuid);

revoke execute on function public.issue_judge_event(uuid, boolean) from public, anon;
grant execute on function public.issue_judge_event(uuid, boolean) to authenticated;

/* ------------------------------------------- 3. a badge the judge can clear */

/*
  SECURITY INVOKER, deliberately: row-level security still applies, so this
  returns the caller's own unanswered invitations and nothing else. It exists
  only because the condition spans a coalesce over an embedded table, which the
  REST filter grammar has no way to say.

  It is the same condition `listInvitations` uses to decide what goes in
  "Upcoming", which is the point — the number on the tab and the list of things
  you can act on now have one definition instead of two that drift.
*/
create or replace function public.my_open_invitations()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
    from public.judge_event_invitations i
    join public.judge_events e on e.id = i.event_id
   where i.judge_id = (select auth.uid())
     and i.response is null
     and e.status = 'issued'
     and coalesce(e.ends_at, e.starts_at) >= now();
$$;

revoke execute on function public.my_open_invitations() from public, anon;
grant execute on function public.my_open_invitations() to authenticated;

/* ------------------------------------------------------------ verification */

/* Expect: f, t, f, t, f — anon reaches neither function, authenticated reaches
   both, and the one-argument issue signature is gone. */
select
  has_function_privilege('anon', 'public.issue_judge_event(uuid, boolean)', 'EXECUTE')          as anon_may_issue,
  has_function_privilege('authenticated', 'public.issue_judge_event(uuid, boolean)', 'EXECUTE') as auth_may_issue,
  has_function_privilege('anon', 'public.my_open_invitations()', 'EXECUTE')                     as anon_may_count,
  has_function_privilege('authenticated', 'public.my_open_invitations()', 'EXECUTE')            as auth_may_count,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'issue_judge_event' and p.pronargs = 1
  ) as old_signature_survives;

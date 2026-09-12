create table public.team_training_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 160),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  company text not null check (char_length(company) between 1 and 160),
  team_size integer not null check (team_size between 1 and 100000),
  courses text[] not null check (cardinality(courses) between 1 and 30),
  goals text not null default '' check (char_length(goals) <= 2000),
  created_at timestamptz not null default now()
);
create index team_training_email_created on public.team_training_requests(email, created_at);
alter table public.team_training_requests enable row level security;
revoke all on public.team_training_requests from anon, authenticated;
grant select on public.team_training_requests to authenticated;
create policy team_training_admin_read on public.team_training_requests for select to authenticated using (public.is_admin());

create function public.request_team_training(p_name text, p_email text, p_company text, p_size integer, p_courses text[], p_goals text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email));
begin
  if p_courses is null or cardinality(p_courses) not between 1 and 30 or exists (
    select 1 from unnest(p_courses) s where s is null or not exists (select 1 from public.courses c where c.slug = s and c.status = 'published')
  ) then raise exception 'Choose at least one available course.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_email, 2100));
  if (select count(*) from public.team_training_requests where email = v_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Please wait an hour before sending another request.';
  end if;
  insert into public.team_training_requests(full_name, email, company, team_size, courses, goals)
  values (trim(p_name), v_email, trim(p_company), p_size, p_courses, coalesce(trim(p_goals), ''));
end;
$$;
revoke all on function public.request_team_training(text,text,text,integer,text[],text) from public;
grant execute on function public.request_team_training(text,text,text,integer,text[],text) to anon, authenticated;

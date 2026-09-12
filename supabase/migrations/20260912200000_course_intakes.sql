-- Only the RPCs may write intake decisions. Learners can read their own status.
create table public.course_intakes (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  status text not null check (status in ('waitlisted', 'applied', 'approved')),
  company text,
  job_title text,
  projects text,
  goals text,
  referral_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id),
  check (company is null or char_length(company) <= 160),
  check (job_title is null or char_length(job_title) <= 160),
  check (projects is null or char_length(projects) <= 4000),
  check (goals is null or char_length(goals) <= 4000),
  check (referral_code is null or char_length(referral_code) <= 80)
);
alter table public.course_intakes enable row level security;
revoke all on public.course_intakes from anon, authenticated;
grant select on public.course_intakes to authenticated;
create policy intakes_read on public.course_intakes for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Preserve access for people who had already enrolled in the filmmaking course.
insert into public.course_intakes (user_id, course_id, status)
select e.user_id, e.course_id, 'approved'
from public.enrollments e join public.courses c on c.id = e.course_id
where c.slug = 'hybrid-filmmaking' and e.status <> 'withdrawn'
on conflict do nothing;

create function public.set_course_waitlist(course_slug text, joining boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid text;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select id into cid from public.courses where slug = course_slug and status = 'published' and slug <> 'hybrid-filmmaking';
  if cid is null or joining is null then raise exception 'Waitlist unavailable'; end if;
  if joining then
    insert into public.course_intakes(user_id, course_id, status) values(uid, cid, 'waitlisted') on conflict do nothing;
    return (select status from public.course_intakes where user_id = uid and course_id = cid);
  end if;
  delete from public.course_intakes where user_id = uid and course_id = cid and status = 'waitlisted';
  return null;
end;
$$;

create function public.apply_to_filmmaking(company_value text, job_title_value text, projects_value text, goals_value text, referral_value text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid text; decision text; code text := upper(btrim(coalesce(referral_value, '')));
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select id into cid from public.courses where slug = 'hybrid-filmmaking' and status = 'published';
  if cid is null then raise exception 'Application unavailable'; end if;
  if nullif(btrim(company_value), '') is null or char_length(company_value) > 160
    or nullif(btrim(job_title_value), '') is null or char_length(job_title_value) > 160
    or nullif(btrim(projects_value), '') is null or char_length(projects_value) > 4000
    or nullif(btrim(goals_value), '') is null or char_length(goals_value) > 4000 then
    raise exception 'Complete all required questions';
  end if;
  if code <> '' and code <> 'MASTERCLASS' then raise exception 'Invalid referral code'; end if;
  decision := case when code = 'MASTERCLASS' then 'approved' else 'applied' end;
  insert into public.course_intakes as existing(user_id, course_id, status, company, job_title, projects, goals, referral_code)
    values(uid, cid, decision, btrim(company_value), btrim(job_title_value), btrim(projects_value), btrim(goals_value), nullif(code, ''))
    on conflict(user_id, course_id) do update set
      status = case when existing.status = 'approved' then 'approved' else excluded.status end,
      company = excluded.company, job_title = excluded.job_title, projects = excluded.projects, goals = excluded.goals,
      referral_code = coalesce(excluded.referral_code, existing.referral_code), updated_at = now()
    returning status into decision;
  if decision = 'approved' then
    insert into public.enrollments(user_id, course_id) values(uid, cid) on conflict(user_id, course_id) do nothing;
  end if;
  return decision;
end;
$$;

create function public.course_has_access(cid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    public.is_admin()
    or public.teaches_course(auth.uid(), cid)
    or exists (select 1 from public.course_intakes i join public.courses c on c.id = i.course_id
      where i.user_id = auth.uid() and i.course_id = cid and i.status = 'approved' and c.status = 'published')
  );
$$;

create function public.intake_lesson_access(lid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.lessons l join public.modules m on m.id = l.module_id
    where l.id = lid and public.course_has_access(m.course_id));
$$;

revoke all on function public.set_course_waitlist(text, boolean) from public, anon;
revoke all on function public.apply_to_filmmaking(text, text, text, text, text) from public, anon;
revoke all on function public.course_has_access(text) from public;
revoke all on function public.intake_lesson_access(uuid) from public;
grant execute on function public.set_course_waitlist(text, boolean) to authenticated;
grant execute on function public.apply_to_filmmaking(text, text, text, text, text) to authenticated;
grant execute on function public.course_has_access(text) to anon, authenticated;
grant execute on function public.intake_lesson_access(uuid) to anon, authenticated;

-- Restrictive policies also constrain any existing permissive read policies.
create policy intake_blocks_gate on public.lesson_blocks as restrictive for select to anon, authenticated
  using (public.intake_lesson_access(lesson_id));
create policy intake_enrollment_gate on public.enrollments as restrictive for insert to authenticated
  with check (public.course_has_access(course_id));

create function public.approve_course_application(applicant uuid, cid text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin required'; end if;
  update public.course_intakes set status = 'approved', updated_at = now()
    where user_id = applicant and course_id = cid and status = 'applied';
  if not found then raise exception 'Pending application not found'; end if;
  insert into public.enrollments(user_id, course_id) values(applicant, cid)
    on conflict(user_id, course_id) do nothing;
end;
$$;
revoke all on function public.approve_course_application(uuid, text) from public, anon;
grant execute on function public.approve_course_application(uuid, text) to authenticated;

-- Run against the migrated database. Every fixture and mutation is rolled back.
begin;
insert into auth.users(id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-000000001001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intake-sql-qa@example.invalid', '{}', '{}', now(), now());
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000001001', true);
do $$
declare cid text; s text;
begin
  select id into cid from public.courses where slug = 'hybrid-filmmaking';
  assert not public.course_has_access(cid), 'Unapproved access';
  assert not exists(select 1 from public.lesson_blocks), 'Content leaked';
  s := public.set_course_waitlist('applied-ai-for-go-to-market', true);
  assert s = 'waitlisted', 'Join failed';
  perform public.set_course_waitlist('applied-ai-for-go-to-market', true);
  assert (select count(*) from public.course_intakes) = 1, 'Duplicate waitlist';
  perform public.set_course_waitlist('applied-ai-for-go-to-market', false);
  perform public.set_course_waitlist('applied-ai-for-go-to-market', false);
  assert not exists(select 1 from public.course_intakes), 'Leave failed';
  begin
    perform public.apply_to_filmmaking(' ', 'Editor', 'A film', 'A short', 'MASTERCLASS');
    raise exception 'Blank company accepted';
  exception when others then
    if sqlerrm <> 'Complete all required questions' then raise; end if;
  end;
  begin
    perform public.apply_to_filmmaking('Studio', 'Editor', 'A film', 'A short', 'BADCODE');
    raise exception 'Invalid code accepted';
  exception when others then
    if sqlerrm <> 'Invalid referral code' then raise; end if;
  end;
  assert not exists(select 1 from public.course_intakes), 'Invalid application wrote a row';
  s := public.apply_to_filmmaking('Studio', 'Editor', 'A film', 'A short', '');
  assert s = 'applied', 'Application failed';
  assert not public.course_has_access(cid), 'Pending application grants access';
  begin
    insert into public.course_intakes(user_id, course_id, status) values(auth.uid(), cid, 'approved');
    raise exception 'Direct approval allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.approve_course_application(auth.uid(), cid);
    raise exception 'Non-admin approval allowed';
  exception when others then
    if sqlerrm <> 'Admin required' then raise; end if;
  end;
  s := public.apply_to_filmmaking('Studio', 'Editor', 'A film', 'A short', ' masterclass ');
  assert s = 'approved', 'Case-insensitive referral code failed';
  assert public.course_has_access(cid), 'Approved access missing';
  assert exists(select 1 from public.enrollments where user_id = auth.uid() and course_id = cid), 'Enrollment missing';
  s := public.apply_to_filmmaking('Studio', 'Editor', 'A film', 'A short', '');
  assert s = 'approved', 'Application downgraded';
  assert (select count(*) from public.course_intakes) = 1, 'Duplicate application';
  assert exists(select 1 from public.lesson_blocks), 'Approved content empty';
  perform public.set_course_waitlist('applied-ai-for-go-to-market', true);
  perform public.set_course_waitlist('ai-education-ethics-and-data-compliance', true);
  perform public.set_course_waitlist('applied-ai-for-go-to-market', false);
  assert exists(select 1 from public.course_intakes i join public.courses c on c.id = i.course_id where c.slug = 'ai-education-ethics-and-data-compliance' and i.status = 'waitlisted'), 'Leaving one course changed another';
  begin
    perform public.set_course_waitlist('hybrid-filmmaking', true);
    raise exception 'Filmmaking incorrectly accepts waitlist';
  exception when others then
    if sqlerrm <> 'Waitlist unavailable' then raise; end if;
  end;
  begin
    perform public.apply_to_filmmaking('Studio', 'Editor', repeat('x', 4001), 'A short', 'MASTERCLASS');
    raise exception 'Oversized answer accepted';
  exception when others then
    if sqlerrm <> 'Complete all required questions' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000001002', true);
do $$ begin assert not exists(select 1 from public.course_intakes), 'Cross-user read'; end $$;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert not has_function_privilege('anon', 'public.apply_to_filmmaking(text,text,text,text,text)', 'execute'), 'Anonymous application allowed';
  assert not exists(select 1 from public.lesson_blocks), 'Anonymous content leaked';
end $$;
reset role;
-- Exercise approval as an existing administrator, changing only the QA fixture.
update public.course_intakes set status = 'applied'
  where user_id = '00000000-0000-4000-8000-000000001001'
    and course_id = (select id from public.courses where slug = 'hybrid-filmmaking');
select set_config('request.jwt.claim.sub', (select user_id::text from public.user_roles where role = 'admin' limit 1), true);
set local role authenticated;
select public.approve_course_application('00000000-0000-4000-8000-000000001001', (select id from public.courses where slug = 'hybrid-filmmaking'));
reset role;
do $$ begin
  assert exists(select 1 from public.course_intakes where user_id = '00000000-0000-4000-8000-000000001001' and status = 'approved'), 'Admin approval failed';
end $$;
rollback;
select 'PASS: course intake regression tests' as result;

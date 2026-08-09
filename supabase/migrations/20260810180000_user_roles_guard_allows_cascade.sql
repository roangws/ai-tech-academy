-- The guard was blocking its own cascade.
--
-- `user_roles_guard` refuses to delete a student role, which is right when a
-- human is stripping somebody's role and wrong when Postgres is unwinding a
-- deleted account: `user_roles.user_id` is `on delete cascade` from auth.users,
-- so deleting a user fires this trigger once per role and the first one raises.
-- Account deletion stopped working the moment the guard shipped, and was caught
-- by tearing down the QA accounts rather than by review.
--
-- Third time this schema has hit the same shape. docs/LMS-QA.md records
-- `artifacts_feedback_ck` blocking instructor deletion, and `outcome_rows_guard`
-- blocking its own cascade. The fix is the one used there: ask whether the
-- parent still exists. If the user is gone, this DELETE is the cascade tidying
-- up, not a revocation, and it must be allowed.
--
-- The general rule, written down so there is no fourth time: a BEFORE DELETE
-- guard on a table with `on delete cascade` must always let the cascade through,
-- and "is the parent still there" is how it tells the two apart.

create or replace function public.user_roles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The account is being deleted; this is the cascade, not a revocation.
  if not exists (select 1 from auth.users where id = old.user_id) then
    return old;
  end if;

  if old.role = 'student'::public.app_role then
    raise exception 'the student role is granted on sign-up and is not revocable';
  end if;

  if old.role = 'admin'::public.app_role then
    if old.user_id = (select auth.uid()) then
      raise exception 'an admin cannot revoke their own admin role';
    end if;
    if (select count(*) from public.user_roles where role = 'admin'::public.app_role) <= 1 then
      raise exception 'the last admin cannot be removed';
    end if;
  end if;

  return old;
end
$$;

-- Fix sign-up: the local variable "email" clashed with profiles.email and
-- workspace_invites.email, so Postgres raised "column reference email is
-- ambiguous" on every new account. Same rules as 0007, variable renamed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_email text := lower(btrim(coalesce(new.email, '')));
  local_part text := split_part(new_email, '@', 1);
  domain_part text := split_part(new_email, '@', 2);
  chosen text := upper(coalesce(new.raw_user_meta_data ->> 'currency', 'USD'));
  next_role text := 'team';
  workspace uuid := '11111111-1111-4111-8111-111111111111';
begin
  if split_part(new_email, '@', 3) <> ''
     or domain_part <> 'gmail.com'
     or local_part !~ '^[a-z0-9]{6,30}$'
  then
    raise exception 'Use a Gmail address. Temporary email is not accepted.';
  end if;
  if chosen not in ('USD', 'EUR', 'GBP', 'CAD', 'INR') then
    chosen := 'USD';
  end if;

  if (select count(*) from public.profiles) = 0 then
    next_role := 'admin';
  elsif exists (select 1 from public.profiles p where lower(p.email) = new_email) then
    raise exception 'That email already has an account.';
  elsif not exists (
    select 1 from public.workspace_invites i
    where i.workspace_id = workspace and lower(i.email) = new_email
  ) then
    raise exception 'Ask an admin to invite this email first.';
  else
    delete from public.workspace_invites i
    where i.workspace_id = workspace and lower(i.email) = new_email;
  end if;

  insert into public.profiles (
    id, workspace_id, display_name, email, currency, role,
    can_ask, can_propose, can_approve, can_sync, approve_cap_cents
  )
  values (
    new.id,
    workspace,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'member'), '@', 1)),
    coalesce(new.email, ''),
    chosen,
    next_role,
    true,
    next_role = 'admin',
    next_role = 'admin',
    next_role = 'admin',
    case when next_role = 'admin' then 10000000 else 10000 end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Open sign-up. Every new person gets their own private desk.
-- No invites and no admin or team split for new people: each person owns
-- their desk, so the profile is saved as the desk owner with full rights.
-- Allowed email: Gmail, plus Microsoft (outlook.com, hotmail.com, live.com, msn.com).
-- Works for email and password sign-up and for Continue with Google.

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
  gmail_base text := replace(split_part(split_part(new_email, '@', 1), '+', 1), '.', '');
  chosen text := upper(coalesce(new.raw_user_meta_data ->> 'currency', 'USD'));
  person text := btrim(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'member'), '@', 1)
  ));
  desk uuid := gen_random_uuid();
begin
  if split_part(new_email, '@', 3) <> '' or local_part = '' then
    raise exception 'Use a Gmail or Outlook address. Temporary email is not accepted.';
  end if;

  if domain_part = 'gmail.com' then
    if gmail_base !~ '^[a-z0-9]{6,30}$' then
      raise exception 'Use a Gmail or Outlook address. Temporary email is not accepted.';
    end if;
  elsif domain_part in ('outlook.com', 'hotmail.com', 'live.com', 'msn.com') then
    if local_part !~ '^[a-z0-9][a-z0-9._+-]{0,63}$' then
      raise exception 'Use a Gmail or Outlook address. Temporary email is not accepted.';
    end if;
  else
    raise exception 'Use a Gmail or Outlook address. Temporary email is not accepted.';
  end if;

  if chosen not in ('USD', 'EUR', 'GBP', 'CAD', 'INR') then
    chosen := 'USD';
  end if;

  insert into public.workspaces (id, name)
  values (desk, left(person, 40) || '''s desk');

  insert into public.profiles (
    id, workspace_id, display_name, email, currency, role,
    can_ask, can_propose, can_approve, can_sync, approve_cap_cents
  )
  values (
    new.id,
    desk,
    left(person, 40),
    coalesce(new.email, ''),
    chosen,
    'admin',
    true,
    true,
    true,
    true,
    10000000
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

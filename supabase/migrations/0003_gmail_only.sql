-- New accounts must use a real Gmail address, with dots and plus tags already removed.
-- googlemail.com and temporary inboxes are rejected before a profile row is written.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email text := lower(btrim(coalesce(new.email, '')));
  local_part text := split_part(email, '@', 1);
  domain_part text := split_part(email, '@', 2);
begin
  if split_part(email, '@', 3) <> ''
     or domain_part <> 'gmail.com'
     or local_part !~ '^[a-z0-9]{6,30}$'
  then
    raise exception 'Use a Gmail address. Temporary email is not accepted.';
  end if;

  insert into public.profiles (id, workspace_id, display_name, email)
  values (
    new.id,
    '11111111-1111-4111-8111-111111111111',
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'member'), '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Profile fields chosen at sign-up. Email changes only after the inbox confirmation
-- sets app.profile_sync. Audit rows stay when an account is deleted.

alter table public.profiles
  add column if not exists currency text not null default 'USD',
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_currency_check;

alter table public.profiles
  add constraint profiles_currency_check
  check (currency in ('USD', 'EUR', 'GBP', 'CAD', 'INR'));

alter table public.profiles
  drop constraint if exists profiles_avatar_path_check;

alter table public.profiles
  add constraint profiles_avatar_path_check
  check (avatar_path is null or avatar_path ~ '^[0-9a-f-]{36}/photo$');

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
  chosen text := upper(coalesce(new.raw_user_meta_data ->> 'currency', 'USD'));
begin
  if split_part(email, '@', 3) <> ''
     or domain_part <> 'gmail.com'
     or local_part !~ '^[a-z0-9]{6,30}$'
  then
    raise exception 'Use a Gmail address. Temporary email is not accepted.';
  end if;
  if chosen not in ('USD', 'EUR', 'GBP', 'CAD', 'INR') then
    chosen := 'USD';
  end if;

  insert into public.profiles (id, workspace_id, display_name, email, currency)
  values (
    new.id,
    '11111111-1111-4111-8111-111111111111',
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'member'), '@', 1)),
    coalesce(new.email, ''),
    chosen
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.workspace_id is distinct from old.workspace_id then
    raise exception 'This profile cannot be moved.';
  end if;
  if new.email is distinct from old.email
     and current_setting('app.profile_sync', true) is distinct from 'email' then
    raise exception 'Confirm the new email from your inbox. The desk updates it after that.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.profile_sync', 'email', true);
  update public.profiles
  set email = coalesce(new.email, '')
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.sync_profile_email();

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

grant update on public.profiles to authenticated;

alter table public.copilot_messages drop constraint if exists copilot_messages_thread_id_fkey;
alter table public.copilot_messages
  add constraint copilot_messages_thread_id_fkey
  foreign key (thread_id) references public.copilot_threads (id) on delete cascade;

alter table public.copilot_threads drop constraint if exists copilot_threads_user_id_fkey;
alter table public.copilot_threads
  add constraint copilot_threads_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.proposed_actions drop constraint if exists proposed_actions_user_id_fkey;
alter table public.proposed_actions
  add constraint proposed_actions_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.audit_log drop constraint if exists audit_log_user_id_fkey;
alter table public.audit_log alter column user_id drop not null;
alter table public.audit_log
  add constraint audit_log_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Sign in before deleting the account.';
  end if;
  delete from storage.objects
  where bucket_id = 'avatars'
    and name like actor::text || '/%';
  delete from auth.users where id = actor;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1000000, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 1000000,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin and team. An admin invites by email, sets what a team member may do,
-- and can remove a duplicate person. The signed-in user is still the database role.

alter table public.profiles
  add column if not exists role text not null default 'team',
  add column if not exists can_ask boolean not null default true,
  add column if not exists can_propose boolean not null default false,
  add column if not exists can_approve boolean not null default false,
  add column if not exists can_sync boolean not null default false,
  add column if not exists approve_cap_cents integer not null default 10000;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'team'));

alter table public.profiles drop constraint if exists profiles_approve_cap_check;
alter table public.profiles
  add constraint profiles_approve_cap_check
  check (approve_cap_cents between 100 and 10000000);

-- People already on the desk keep full control. New accounts become team members.
update public.profiles
set role = 'admin',
    can_ask = true,
    can_propose = true,
    can_approve = true,
    can_sync = true,
    approve_cap_cents = 10000000;

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  email text not null,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

alter table public.workspace_invites enable row level security;

create or replace function public.is_workspace_admin(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and workspace_id = target
      and role = 'admin'
  );
$$;

revoke all on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_workspace_admin(workspace_id));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_workspace_admin(workspace_id))
  with check (id = auth.uid() or public.is_workspace_admin(workspace_id));

drop policy if exists invites_select on public.workspace_invites;
create policy invites_select on public.workspace_invites
  for select to authenticated
  using (public.is_workspace_admin(workspace_id));

drop policy if exists invites_insert on public.workspace_invites;
create policy invites_insert on public.workspace_invites
  for insert to authenticated
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists invites_delete on public.workspace_invites;
create policy invites_delete on public.workspace_invites
  for delete to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select, insert, delete on public.workspace_invites to authenticated;

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
  if new.role is distinct from old.role
     or new.can_ask is distinct from old.can_ask
     or new.can_propose is distinct from old.can_propose
     or new.can_approve is distinct from old.can_approve
     or new.can_sync is distinct from old.can_sync
     or new.approve_cap_cents is distinct from old.approve_cap_cents
  then
    if not public.is_workspace_admin(old.workspace_id) then
      raise exception 'Only an admin can change what a person is allowed to do.';
    end if;
    if old.role = 'admin' and new.role is distinct from 'admin' then
      if (
        select count(*)
        from public.profiles
        where workspace_id = old.workspace_id
          and role = 'admin'
          and id <> old.id
      ) = 0 then
        raise exception 'The desk needs one admin.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

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
  next_role text := 'team';
  workspace uuid := '11111111-1111-4111-8111-111111111111';
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

  if (select count(*) from public.profiles) = 0 then
    next_role := 'admin';
  elsif exists (select 1 from public.profiles where lower(email) = email) then
    raise exception 'That email already has an account.';
  elsif not exists (
    select 1 from public.workspace_invites
    where workspace_id = workspace and lower(email) = email
  ) then
    raise exception 'Ask an admin to invite this email first.';
  else
    delete from public.workspace_invites
    where workspace_id = workspace and lower(email) = email;
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

create or replace function public.actor_may_apply(act public.proposed_actions)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_role text;
  actor_can boolean;
  actor_cap integer;
  needed integer;
begin
  select role, can_approve, approve_cap_cents
    into actor_role, actor_can, actor_cap
  from public.profiles
  where id = auth.uid();

  if actor_role = 'admin' then
    return null;
  end if;
  if actor_can is not true then
    return 'An admin has not allowed you to approve changes.';
  end if;

  select greatest(
    coalesce((act.create_snapshot ->> 'dailyBudgetCents')::integer, 0),
    coalesce((
      select max((item ->> 'afterBudgetCents')::integer)
      from jsonb_array_elements(coalesce(act.targets, '[]'::jsonb)) item
    ), 0)
  )
  into needed;

  if needed > coalesce(actor_cap, 0) then
    return 'That change is above the budget an admin allowed you to approve.';
  end if;
  return null;
end;
$$;

revoke all on function public.actor_may_apply(public.proposed_actions) from public;
grant execute on function public.actor_may_apply(public.proposed_actions) to authenticated;

create or replace function public.apply_campaign_action(target_action uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  act public.proposed_actions%rowtype;
  target jsonb;
  camp public.campaigns%rowtype;
  after_status text;
  after_budget integer;
  create_budget integer;
  slot integer;
  denied text;
begin
  perform set_config('app.action_caller', 'apply', true);
  perform set_config('app.action_id', target_action::text, true);

  select * into act
  from public.proposed_actions
  where id = target_action
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'That preview does not exist.');
  end if;

  if act.user_id is distinct from auth.uid() or not public.is_workspace_member(act.workspace_id) then
    return jsonb_build_object('ok', false, 'message', 'You can only approve your own preview.');
  end if;

  denied := public.actor_may_apply(act);
  if denied is not null then
    return jsonb_build_object('ok', false, 'message', denied);
  end if;

  if act.status = 'approved' then
    return jsonb_build_object('ok', true, 'message', coalesce(act.result_message, 'Already approved.'));
  end if;

  if act.status <> 'pending' then
    return jsonb_build_object('ok', false, 'message', 'This preview is already done.');
  end if;

  perform set_config('app.action_caller', 'apply', true);

  if act.expires_at <= now() then
    perform public.finish_action(act.id, 'expired', 'This preview expired. Ask again.');
    return jsonb_build_object('ok', false, 'message', 'This preview expired. Ask again.');
  end if;

  if act.kind = 'create_campaign' then
    create_budget := (act.create_snapshot ->> 'dailyBudgetCents')::integer;
    if act.create_snapshot is null
      or char_length(coalesce(act.create_snapshot ->> 'name', '')) < 1
      or char_length(coalesce(act.create_snapshot ->> 'name', '')) > 120
      or coalesce(act.create_snapshot ->> 'status', '') <> 'active'
      or create_budget is null
      or create_budget < 100
      or create_budget > 10000000 then
      perform public.finish_action(act.id, 'failed', 'A new campaign needs a name and a daily budget from $1 to $100,000.');
      return jsonb_build_object('ok', false, 'message', 'A new campaign needs a name and a daily budget from $1 to $100,000.');
    end if;
  end if;

  for slot in 0 .. coalesce(jsonb_array_length(act.targets), 0) - 1 loop
    target := act.targets -> slot;
    if coalesce(target ->> 'campaignId', '') !~* '^[0-9a-f-]{36}$' then
      perform public.finish_action(act.id, 'failed', 'That preview pointed at a campaign id the desk does not use.');
      return jsonb_build_object('ok', false, 'message', 'That preview pointed at a campaign id the desk does not use.');
    end if;

    select * into camp
    from public.campaigns
    where id = (target ->> 'campaignId')::uuid
    for update;

    if not found or camp.version is distinct from (target ->> 'version')::integer then
      perform public.finish_action(act.id, 'failed', 'A campaign changed since this preview. Ask again so the list is fresh.');
      return jsonb_build_object('ok', false, 'message', 'A campaign changed since this preview. Ask again so the list is fresh.');
    end if;

    after_status := target ->> 'afterStatus';
    after_budget := (target ->> 'afterBudgetCents')::integer;
    if after_status not in ('draft', 'active', 'paused', 'ended')
      or after_budget is null
      or after_budget < 100
      or after_budget > 10000000 then
      perform public.finish_action(act.id, 'failed', 'That preview had a change the desk cannot apply.');
      return jsonb_build_object('ok', false, 'message', 'That preview had a change the desk cannot apply.');
    end if;

    if camp.status = 'ended' and (after_status is distinct from camp.status or after_budget is distinct from camp.daily_budget_cents) then
      perform public.finish_action(act.id, 'failed', 'An ended campaign cannot be changed from chat.');
      return jsonb_build_object('ok', false, 'message', 'An ended campaign cannot be changed from chat.');
    end if;
  end loop;

  perform set_config('app.action_id', act.id::text, true);

  for slot in 0 .. coalesce(jsonb_array_length(act.targets), 0) - 1 loop
    target := act.targets -> slot;
    update public.campaigns
    set status = target ->> 'afterStatus',
        daily_budget_cents = (target ->> 'afterBudgetCents')::integer,
        version = version + 1,
        updated_at = now()
    where id = (target ->> 'campaignId')::uuid
      and (
        status is distinct from (target ->> 'afterStatus')
        or daily_budget_cents is distinct from (target ->> 'afterBudgetCents')::integer
      );
  end loop;

  if act.kind = 'create_campaign' then
    insert into public.campaigns (workspace_id, name, status, daily_budget_cents, version)
    values (
      act.workspace_id,
      act.create_snapshot ->> 'name',
      'active',
      (act.create_snapshot ->> 'dailyBudgetCents')::integer,
      1
    );
  end if;

  perform public.finish_action(act.id, 'approved', act.summary);
  return jsonb_build_object('ok', true, 'message', act.summary);
end;
$$;

revoke all on function public.apply_campaign_action(uuid) from public;
grant execute on function public.apply_campaign_action(uuid) to authenticated;

create or replace function public.remove_team_member(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  actor uuid := auth.uid();
  member public.profiles%rowtype;
  admins integer;
begin
  if actor is null then
    raise exception 'Sign in before removing a person.';
  end if;
  if target = actor then
    raise exception 'Use Delete account to remove yourself.';
  end if;

  select * into member from public.profiles where id = target;
  if not found then
    raise exception 'That person is not on the desk.';
  end if;
  if not public.is_workspace_admin(member.workspace_id) then
    raise exception 'Only an admin can remove a person.';
  end if;

  select count(*) into admins
  from public.profiles
  where workspace_id = member.workspace_id and role = 'admin';

  if member.role = 'admin' and admins < 2 then
    raise exception 'The desk needs one admin.';
  end if;

  delete from public.workspace_invites
  where workspace_id = member.workspace_id and lower(email) = lower(member.email);

  delete from storage.objects
  where bucket_id = 'avatars'
    and name like target::text || '/%';

  delete from auth.users where id = target;
end;
$$;

revoke all on function public.remove_team_member(uuid) from public;
grant execute on function public.remove_team_member(uuid) to authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  actor uuid := auth.uid();
  member public.profiles%rowtype;
  admins integer;
begin
  if actor is null then
    raise exception 'Sign in before deleting the account.';
  end if;

  select * into member from public.profiles where id = actor;
  if found and member.role = 'admin' then
    select count(*) into admins
    from public.profiles
    where workspace_id = member.workspace_id and role = 'admin';
    if admins < 2 then
      raise exception 'The desk needs one admin.';
    end if;
  end if;

  delete from storage.objects
  where bucket_id = 'avatars'
    and name like actor::text || '/%';
  delete from auth.users where id = actor;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

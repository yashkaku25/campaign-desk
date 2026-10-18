-- Campaign desk schema. One workspace in v1. workspace_id is on every table
-- so a later multi-workspace version does not rewrite the tables.
-- pgvector is enabled and unused. Mutations do not retrieve embeddings.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id),
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  name text not null check (char_length(name) between 1 and 120),
  status text not null check (status in ('draft', 'active', 'paused', 'ended')),
  daily_budget_cents integer not null check (daily_budget_cents >= 0),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_metrics_daily (
  campaign_id uuid not null references public.campaigns (id),
  day date not null,
  impressions integer not null check (impressions >= 0),
  clicks integer not null check (clicks >= 0),
  spend_cents integer not null check (spend_cents >= 0),
  conversions integer not null check (conversions >= 0),
  primary key (campaign_id, day)
);

create table public.copilot_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.copilot_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.copilot_threads (id),
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  action_id uuid,
  created_at timestamptz not null default now()
);

create table public.proposed_actions (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces (id),
  user_id uuid not null references public.profiles (id),
  kind text not null check (kind in ('pause', 'resume', 'set_daily_budget', 'create_campaign')),
  payload_hash text not null,
  targets jsonb not null default '[]'::jsonb,
  create_snapshot jsonb,
  summary text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'failed')),
  expires_at timestamptz not null,
  result_message text,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  user_id uuid not null references public.profiles (id),
  actor_name text not null,
  action_id uuid references public.proposed_actions (id),
  what text not null,
  outcome text not null check (outcome in ('approved', 'rejected', 'failed', 'expired')),
  created_at timestamptz not null default now()
);

create index campaigns_workspace_idx on public.campaigns (workspace_id);
create index audit_workspace_idx on public.audit_log (workspace_id, created_at desc);

-- Reads profiles without row security so other policies do not recurse.
create or replace function public.is_workspace_member(target uuid)
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
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

-- A person cannot insert their own profile before they have one.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.finish_action(
  act_id uuid,
  next_status text,
  message text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_name text;
  actor_workspace uuid;
begin
  if current_setting('app.action_caller', true) not in ('apply', 'reject') then
    raise exception 'This helper only runs inside apply or reject.';
  end if;
  perform set_config('app.action_id', act_id::text, true);
  select display_name, workspace_id into actor_name, actor_workspace
  from public.profiles
  where id = auth.uid();

  update public.proposed_actions
  set status = next_status,
      result_message = message
  where id = act_id;

  insert into public.audit_log (workspace_id, user_id, actor_name, action_id, what, outcome)
  values (actor_workspace, auth.uid(), coalesce(actor_name, 'Member'), act_id, message, next_status);
end;
$$;

revoke all on function public.finish_action(uuid, text, text) from public;
grant execute on function public.finish_action(uuid, text, text) to authenticated;

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
begin
  -- Set the action id before locking the row. The update policy hides the
  -- row until this value matches, so a lock without it looks like a missing preview.
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

create or replace function public.reject_campaign_action(target_action uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  act public.proposed_actions%rowtype;
begin
  perform set_config('app.action_caller', 'reject', true);
  perform set_config('app.action_id', target_action::text, true);

  select * into act
  from public.proposed_actions
  where id = target_action
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'That preview does not exist.');
  end if;

  if act.user_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'message', 'You can only reject your own preview.');
  end if;

  if act.status = 'rejected' then
    return jsonb_build_object('ok', true, 'message', 'Already rejected. Campaigns were left as they were.');
  end if;

  if act.status <> 'pending' then
    return jsonb_build_object('ok', false, 'message', 'This preview is already done.');
  end if;

  perform set_config('app.action_caller', 'reject', true);
  perform public.finish_action(act.id, 'rejected', 'Rejected. Campaigns were left as they were.');
  return jsonb_build_object('ok', true, 'message', 'Rejected. Campaigns were left as they were.');
end;
$$;

revoke all on function public.reject_campaign_action(uuid) from public;
grant execute on function public.reject_campaign_action(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_metrics_daily enable row level security;
alter table public.copilot_threads enable row level security;
alter table public.copilot_messages enable row level security;
alter table public.proposed_actions enable row level security;
alter table public.audit_log enable row level security;

create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy campaigns_select on public.campaigns
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy campaigns_update on public.campaigns
  for update to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and id is not null
    and nullif(current_setting('app.action_id', true), '') is not null
  )
  with check (public.is_workspace_member(workspace_id));

create policy campaigns_insert on public.campaigns
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and nullif(current_setting('app.action_id', true), '') is not null
  );

create policy metrics_select on public.campaign_metrics_daily
  for select to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = campaign_metrics_daily.campaign_id
        and public.is_workspace_member(campaigns.workspace_id)
    )
  );

create policy threads_select on public.copilot_threads
  for select to authenticated
  using (user_id = auth.uid());

create policy threads_insert on public.copilot_threads
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

create policy messages_select on public.copilot_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.copilot_threads
      where copilot_threads.id = copilot_messages.thread_id
        and copilot_threads.user_id = auth.uid()
    )
  );

create policy messages_insert on public.copilot_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.copilot_threads
      where copilot_threads.id = copilot_messages.thread_id
        and copilot_threads.user_id = auth.uid()
    )
  );

create policy actions_select on public.proposed_actions
  for select to authenticated
  using (user_id = auth.uid());

create policy actions_insert on public.proposed_actions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and public.is_workspace_member(workspace_id)
  );

create policy actions_update on public.proposed_actions
  for update to authenticated
  using (
    user_id = auth.uid()
    and id::text = nullif(current_setting('app.action_id', true), '')
  )
  with check (user_id = auth.uid());

create policy audit_select on public.audit_log
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy audit_insert on public.audit_log
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
    and nullif(current_setting('app.action_id', true), '') is not null
  );

grant usage on schema public to anon, authenticated;
grant select on public.workspaces, public.profiles, public.campaigns, public.campaign_metrics_daily to authenticated;
grant select, insert on public.copilot_threads, public.copilot_messages, public.proposed_actions, public.audit_log to authenticated;
grant update on public.campaigns, public.proposed_actions to authenticated;
grant insert on public.campaigns to authenticated;

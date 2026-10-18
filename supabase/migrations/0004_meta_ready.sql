-- Meta-shaped columns and child tables. Campaign status stays the desk's
-- lowercase words. Sheet and future imports map ACTIVE/PAUSED before they arrive.
-- campaign_metrics_daily.day is the date. It stays unique per campaign and day.

alter table public.campaigns
  add column if not exists meta_campaign_id text,
  add column if not exists objective text,
  add column if not exists lifetime_budget_cents integer;

alter table public.campaigns
  drop constraint if exists campaigns_lifetime_budget_check;

alter table public.campaigns
  add constraint campaigns_lifetime_budget_check
  check (lifetime_budget_cents is null or (lifetime_budget_cents >= 0 and lifetime_budget_cents <= 1000000000));

alter table public.campaigns
  drop constraint if exists campaigns_objective_check;

alter table public.campaigns
  add constraint campaigns_objective_check
  check (objective is null or char_length(objective) between 1 and 80);

create unique index if not exists campaigns_meta_id_uidx
  on public.campaigns (meta_campaign_id)
  where meta_campaign_id is not null;

alter table public.proposed_actions
  drop constraint if exists proposed_actions_kind_check;

alter table public.proposed_actions
  add constraint proposed_actions_kind_check
  check (kind in ('pause', 'resume', 'set_daily_budget', 'create_campaign', 'reallocate_budget'));

create table if not exists public.ad_sets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  campaign_id uuid not null references public.campaigns (id),
  meta_ad_set_id text,
  name text not null check (char_length(name) between 1 and 120),
  status text not null check (status in ('draft', 'active', 'paused', 'ended')),
  targeting_specs jsonb not null default '{}'::jsonb,
  bid_amount_cents integer check (bid_amount_cents is null or (bid_amount_cents >= 0 and bid_amount_cents <= 1000000000)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ad_sets_meta_id_uidx
  on public.ad_sets (meta_ad_set_id)
  where meta_ad_set_id is not null;

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id),
  ad_set_id uuid not null references public.ad_sets (id),
  meta_ad_id text,
  name text not null check (char_length(name) between 1 and 120),
  status text not null check (status in ('draft', 'active', 'paused', 'ended')),
  creative_type text check (creative_type is null or creative_type in ('image', 'video', 'carousel', 'collection')),
  headlines text[] not null default '{}',
  primary_texts text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ads_meta_id_uidx
  on public.ads (meta_ad_id)
  where meta_ad_id is not null;

alter table public.ad_sets enable row level security;
alter table public.ads enable row level security;

drop policy if exists ad_sets_select on public.ad_sets;
create policy ad_sets_select on public.ad_sets
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists ads_select on public.ads;
create policy ads_select on public.ads
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

grant select on public.ad_sets, public.ads to authenticated;

-- Metric rows are not campaign edits. The caller flag is set inside this
-- function, so a browser request cannot insert metrics on its own.
create or replace function public.upsert_campaign_metric(
  target_campaign uuid,
  metric_day date,
  impressions integer,
  clicks integer,
  spend_cents integer,
  conversions integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner uuid;
begin
  if impressions < 0 or clicks < 0 or spend_cents < 0 or conversions < 0
     or impressions > 1000000000 or clicks > 1000000000
     or conversions > 1000000000 or spend_cents > 1000000000 then
    raise exception 'That metric row is outside the range the desk accepts.';
  end if;

  select workspace_id into owner
  from public.campaigns
  where id = target_campaign;

  if owner is null or not public.is_workspace_member(owner) then
    raise exception 'That campaign is not in your workspace.';
  end if;

  perform set_config('app.action_caller', 'metrics', true);

  insert into public.campaign_metrics_daily (campaign_id, day, impressions, clicks, spend_cents, conversions)
  values (target_campaign, metric_day, impressions, clicks, spend_cents, conversions)
  on conflict (campaign_id, day) do update
    set impressions = excluded.impressions,
        clicks = excluded.clicks,
        spend_cents = excluded.spend_cents,
        conversions = excluded.conversions;
end;
$$;

revoke all on function public.upsert_campaign_metric(uuid, date, integer, integer, integer, integer) from public;
grant execute on function public.upsert_campaign_metric(uuid, date, integer, integer, integer, integer) to authenticated;

drop policy if exists metrics_write on public.campaign_metrics_daily;
create policy metrics_write on public.campaign_metrics_daily
  for insert to authenticated
  with check (
    current_setting('app.action_caller', true) = 'metrics'
    and exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_metrics_daily.campaign_id
        and public.is_workspace_member(campaigns.workspace_id)
    )
  );

drop policy if exists metrics_update on public.campaign_metrics_daily;
create policy metrics_update on public.campaign_metrics_daily
  for update to authenticated
  using (
    current_setting('app.action_caller', true) = 'metrics'
    and exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_metrics_daily.campaign_id
        and public.is_workspace_member(campaigns.workspace_id)
    )
  )
  with check (
    current_setting('app.action_caller', true) = 'metrics'
    and exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_metrics_daily.campaign_id
        and public.is_workspace_member(campaigns.workspace_id)
    )
  );

grant insert, update on public.campaign_metrics_daily to authenticated;

-- Sheet URL and metric upserts must honor can_sync, same as the TypeScript deny() gate.
-- Without this, a team member could call the RPCs with the anon client and bypass RBAC.

create or replace function public.actor_may_sync()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_role text;
  actor_can boolean;
begin
  if auth.uid() is null then
    return 'Sign in before changing the sheet.';
  end if;

  select role, can_sync
    into actor_role, actor_can
  from public.profiles
  where id = auth.uid();

  if actor_role is null then
    return 'Sign in before changing the sheet.';
  end if;
  if actor_role = 'admin' then
    return null;
  end if;
  if actor_can is not true then
    return 'An admin has not allowed you to change the sheet.';
  end if;
  return null;
end;
$$;

revoke all on function public.actor_may_sync() from public;
grant execute on function public.actor_may_sync() to authenticated;

create or replace function public.set_workspace_sheet(next_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  cleaned text := nullif(btrim(coalesce(next_url, '')), '');
  denied text;
begin
  if actor is null then
    raise exception 'Sign in before saving a sheet.';
  end if;

  denied := public.actor_may_sync();
  if denied is not null then
    raise exception '%', denied;
  end if;

  if cleaned is not null and (
    char_length(cleaned) > 500
    or cleaned !~ '^https://docs\.google\.com/spreadsheets/d/[a-zA-Z0-9_-]+'
  ) then
    raise exception 'Paste a Google Sheet link.';
  end if;

  update public.workspaces
  set sheet_url = cleaned
  where id = (
    select workspace_id from public.profiles where id = actor
  );
end;
$$;

revoke all on function public.set_workspace_sheet(text) from public;
grant execute on function public.set_workspace_sheet(text) to authenticated;

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
  denied text;
begin
  denied := public.actor_may_sync();
  if denied is not null then
    raise exception '%', denied;
  end if;

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

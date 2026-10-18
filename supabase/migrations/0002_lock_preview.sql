-- Let apply and reject lock the preview after the action id is set.
-- The update policy hides the row until that id is set, so the old order looked like a missing preview.

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


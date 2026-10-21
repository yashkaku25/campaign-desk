-- Deleting an account no longer needs a second admin. When the person was the
-- only one on their desk, the desk and everything in it is removed too.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  actor uuid := auth.uid();
  desk uuid;
  others integer;
begin
  if actor is null then
    raise exception 'Sign in before deleting the account.';
  end if;

  select workspace_id into desk from public.profiles where id = actor;
  select count(*) into others from public.profiles where workspace_id = desk and id <> actor;

  if desk is not null and others = 0 then
    delete from public.ads where workspace_id = desk;
    delete from public.ad_sets where workspace_id = desk;
    delete from public.campaign_metrics_daily
      where campaign_id in (select id from public.campaigns where workspace_id = desk);
    delete from public.audit_log where workspace_id = desk;
    delete from public.proposed_actions where workspace_id = desk;
    delete from public.copilot_threads where workspace_id = desk;
    delete from public.campaigns where workspace_id = desk;
    delete from public.workspace_invites where workspace_id = desk;
  end if;

  delete from storage.objects
  where bucket_id = 'avatars'
    and name like actor::text || '/%';
  delete from auth.users where id = actor;

  if desk is not null and others = 0 then
    delete from public.workspaces where id = desk;
  end if;
end;
$$;

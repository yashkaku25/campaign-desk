-- Demo campaigns and 30 days of metrics.
-- The numbers match src/lib/data/seed.ts. Change both together.
-- Profiles are created by the auth trigger when a person signs up.

insert into public.workspaces (id, name)
values ('11111111-1111-4111-8111-111111111111', 'Studio workspace')
on conflict (id) do nothing;

insert into public.campaigns (id, workspace_id, name, status, daily_budget_cents, version, created_at, updated_at)
values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', 'Spring Launch', 'active', 12000, 1, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', 'Retargeting Warm', 'active', 8000, 1, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111111', 'Prospecting Cold', 'active', 15000, 1, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'),
  ('33333333-3333-4333-8333-333333333304', '11111111-1111-4111-8111-111111111111', 'Brand Video', 'paused', 6000, 1, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'),
  ('33333333-3333-4333-8333-333333333305', '11111111-1111-4111-8111-111111111111', 'Holdout Creative', 'active', 5000, 1, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'),
  ('33333333-3333-4333-8333-333333333306', '11111111-1111-4111-8111-111111111111', 'Holiday Push', 'ended', 4000, 1, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z')
on conflict (id) do nothing;

do $$
declare
  spec record;
  day_index integer;
  impressions integer;
  clicks integer;
  spend_cents integer;
  conversions integer;
  metric_day date;
begin
  for spec in
    select *
    from (
      values
        ('33333333-3333-4333-8333-333333333301'::uuid, 0, 0.041::numeric, 8000, 40, 0.08::numeric),
        ('33333333-3333-4333-8333-333333333302'::uuid, 1, 0.012::numeric, 12000, 55, 0.03::numeric),
        ('33333333-3333-4333-8333-333333333303'::uuid, 2, 0.008::numeric, 15000, 70, 0.02::numeric),
        ('33333333-3333-4333-8333-333333333304'::uuid, 3, 0.033::numeric, 4000, 30, 0.05::numeric),
        ('33333333-3333-4333-8333-333333333305'::uuid, 4, 0::numeric, 0, 0, 0::numeric),
        ('33333333-3333-4333-8333-333333333306'::uuid, 5, 0.02::numeric, 2000, 25, 0.04::numeric)
    ) as t(id, idx, ctr, base_impressions, cents_per_click, conversion_rate)
  loop
    for day_index in 0..29 loop
      metric_day := date '2026-10-16' - (29 - day_index);
      if spec.base_impressions = 0 then
        impressions := 0;
        clicks := 0;
        spend_cents := 0;
        conversions := 0;
      else
        impressions := spec.base_impressions + ((day_index * 37 + spec.idx * 13) % 500);
        clicks := round(impressions * spec.ctr)::integer;
        spend_cents := clicks * spec.cents_per_click;
        conversions := round(clicks * spec.conversion_rate)::integer;
      end if;

      insert into public.campaign_metrics_daily (campaign_id, day, impressions, clicks, spend_cents, conversions)
      values (spec.id, metric_day, impressions, clicks, spend_cents, conversions)
      on conflict (campaign_id, day) do nothing;
    end loop;
  end loop;
end $$;

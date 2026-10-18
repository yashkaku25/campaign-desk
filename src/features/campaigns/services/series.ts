import type { CampaignSummary, DailyMetric } from "@/lib/domain";
import { formatDay } from "@/lib/money";

export interface DailyPoint {
  day: string;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
}

export function buildSeries(metrics: DailyMetric[], campaignId?: string): DailyPoint[] {
  const rows = campaignId ? metrics.filter((metric) => metric.campaignId === campaignId) : metrics;
  const byDay = new Map<string, DailyPoint>();
  for (const row of rows) {
    const current = byDay.get(row.day) ?? {
      day: row.day,
      label: formatDay(row.day),
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: null,
    };
    current.spend += row.spendCents / 100;
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    current.conversions += row.conversions;
    byDay.set(row.day, current);
  }
  return [...byDay.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((point) => ({
      ...point,
      ctr: point.impressions === 0 ? null : point.clicks / point.impressions,
    }));
}

export interface PeriodDelta {
  direction: "up" | "down" | "flat" | "unavailable";
  text: string;
}

export function compareRecent(points: DailyPoint[]): {
  spend: PeriodDelta;
  conversions: PeriodDelta;
  ctr: PeriodDelta;
  cpa: PeriodDelta;
} {
  if (points.length < 14) {
    const unavailable = { direction: "unavailable" as const, text: "Need 14 days" };
    return { spend: unavailable, conversions: unavailable, ctr: unavailable, cpa: unavailable };
  }
  const prior = points.slice(-14, -7);
  const recent = points.slice(-7);
  const priorBox = box(prior);
  const recentBox = box(recent);
  return {
    spend: changeRatio(recentBox.spend, priorBox.spend),
    conversions: changeRatio(recentBox.conversions, priorBox.conversions),
    ctr: changeRatio(recentBox.ctr, priorBox.ctr),
    cpa: changeRatio(recentBox.cpa, priorBox.cpa),
  };
}

function box(points: DailyPoint[]) {
  const spend = points.reduce((sum, point) => sum + point.spend, 0);
  const impressions = points.reduce((sum, point) => sum + point.impressions, 0);
  const clicks = points.reduce((sum, point) => sum + point.clicks, 0);
  const conversions = points.reduce((sum, point) => sum + point.conversions, 0);
  return {
    spend,
    conversions,
    ctr: impressions === 0 ? null : clicks / impressions,
    cpa: conversions === 0 ? null : spend / conversions,
  };
}

function changeRatio(recent: number | null, prior: number | null): PeriodDelta {
  if (recent === null || prior === null || prior === 0) {
    return { direction: "unavailable", text: "No baseline" };
  }
  const ratio = (recent - prior) / Math.abs(prior);
  if (Math.abs(ratio) < 0.005) return { direction: "flat", text: "Flat vs prior 7 days" };
  const percent = `${Math.abs(ratio * 100).toFixed(0)}%`;
  if (ratio > 0) return { direction: "up", text: `Up ${percent} vs prior 7 days` };
  return { direction: "down", text: `Down ${percent} vs prior 7 days` };
}

export function workspaceTotals(campaigns: CampaignSummary[]) {
  const impressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const clicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const spendCents = campaigns.reduce((sum, campaign) => sum + campaign.spendCents, 0);
  const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  return {
    impressions,
    clicks,
    spendCents,
    conversions,
    ctr: impressions === 0 ? null : clicks / impressions,
  };
}

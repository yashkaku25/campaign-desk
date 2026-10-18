import type { CampaignSummary, DailyMetric } from "@/lib/domain";

export interface Anomaly {
  name: string;
  text: string;
  command: string;
}

export function findAnomalies(campaigns: CampaignSummary[], metrics: DailyMetric[]): Anomaly[] {
  const alerts: Anomaly[] = [];
  for (const campaign of campaigns) {
    if (campaign.status !== "active") continue;
    const days = metrics
      .filter((metric) => metric.campaignId === campaign.id)
      .sort((a, b) => a.day.localeCompare(b.day));
    if (days.length < 9) continue;
    const recent = days.slice(-2);
    const baseline = days.slice(-9, -2);
    const recentBox = box(recent);
    const baselineBox = box(baseline);
    const recentDailySpend = recentBox.spendCents / recent.length;
    const baselineDailySpend = baselineBox.spendCents / baseline.length;
    const command = `Pause "${campaign.name.replaceAll('"', "")}"`;
    if (
      recentBox.ctr !== null &&
      baselineBox.ctr !== null &&
      recentBox.ctr < 0.02 &&
      baselineBox.ctr >= 0.02
    ) {
      alerts.push({ name: campaign.name, text: "CTR fell under 2% in the last 2 days.", command });
    } else if (baselineDailySpend > 0 && recentDailySpend > baselineDailySpend * 1.8) {
      alerts.push({ name: campaign.name, text: "Spend jumped against the previous week.", command });
    }
    if (alerts.length === 3) break;
  }
  return alerts;
}

function box(rows: DailyMetric[]) {
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const spendCents = rows.reduce((sum, row) => sum + row.spendCents, 0);
  return {
    spendCents,
    ctr: impressions === 0 ? null : clicks / impressions,
  };
}

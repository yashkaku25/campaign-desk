import type { Campaign, CampaignSummary, DailyMetric } from "@/lib/domain";

export function summarizeCampaign(campaign: Campaign, metrics: DailyMetric[]): CampaignSummary {
  const rows = metrics.filter((metric) => metric.campaignId === campaign.id);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const spendCents = rows.reduce((sum, row) => sum + row.spendCents, 0);
  const conversions = rows.reduce((sum, row) => sum + row.conversions, 0);
  return {
    ...campaign,
    impressions,
    clicks,
    spendCents,
    conversions,
    ctr: impressions === 0 ? null : clicks / impressions,
  };
}

export function summarizeAll(campaigns: Campaign[], metrics: DailyMetric[]): CampaignSummary[] {
  return campaigns.map((campaign) => summarizeCampaign(campaign, metrics));
}

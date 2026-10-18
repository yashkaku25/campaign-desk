import type { CampaignSummary } from "@/lib/domain";
import { formatCount, formatCtr, formatDollars } from "@/lib/money";

export function buildMetricContext(campaigns: CampaignSummary[]): string {
  const impressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const clicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const spendCents = campaigns.reduce((sum, campaign) => sum + campaign.spendCents, 0);
  const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const ctr = impressions === 0 ? null : clicks / impressions;
  const lines = campaigns.map(
    (campaign) =>
      `${campaign.name}: ${campaign.status}, CTR ${formatCtr(campaign.ctr)}, spend ${formatDollars(campaign.spendCents)}, ${formatCount(campaign.conversions)} conversions`,
  );
  return [
    `Last 30 days. Spend ${formatDollars(spendCents)}. Impressions ${formatCount(impressions)}. CTR ${formatCtr(ctr)}. Conversions ${formatCount(conversions)}.`,
    ...lines,
  ].join("\n");
}

export function offlineAnswer(campaigns: CampaignSummary[]): string {
  return `This local run has no Gemini key, so this is a totals readout, not a model explanation.\n\n${buildMetricContext(campaigns)}`;
}

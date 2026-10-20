import { AdsManager } from "@/features/practice/components/ads-manager/ads-manager";
import { listCampaigns } from "@/features/campaigns/services/list-campaigns";
import { listSheetCreativeHints } from "@/features/practice/services/sheet-creative-hints";

export default async function SimulationPage() {
  const campaigns = await listCampaigns();
  let hints: Awaited<ReturnType<typeof listSheetCreativeHints>> = [];
  try {
    hints = await listSheetCreativeHints();
  } catch {
    hints = [];
  }
  const hintByName = new Map(
    hints.map((hint) => [hint.campaignName.trim().toLowerCase(), hint] as const),
  );

  return (
    <AdsManager
      seeds={campaigns.map((campaign) => {
        const hint = hintByName.get(campaign.name.trim().toLowerCase());
        return {
          id: campaign.id,
          name: campaign.name,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          spendCents: campaign.spendCents,
          conversions: campaign.conversions,
          dailyBudgetCents: campaign.dailyBudgetCents,
          status: campaign.status,
          headline: hint?.headline ?? null,
          primaryText: hint?.primaryText ?? null,
          product: hint?.product ?? null,
        };
      })}
    />
  );
}

import "server-only";

import { readWorkspace } from "@/lib/data/workspace-store";
import type { CampaignSummary, DailyMetric } from "@/lib/domain";
import { requireUser } from "@/features/auth/services/require-user";
import { summarizeCampaign } from "@/features/campaigns/services/summarize";

export async function getCampaign(
  campaignId: string,
): Promise<{ campaign: CampaignSummary; metrics: DailyMetric[] } | null> {
  const user = await requireUser();
  const state = await readWorkspace(user.id);
  const campaign = state.campaigns.find(
    (item) => item.id === campaignId && item.workspaceId === user.workspaceId,
  );
  if (!campaign) return null;
  const metrics = state.metrics.filter((metric) => metric.campaignId === campaign.id);
  return { campaign: summarizeCampaign(campaign, metrics), metrics };
}

import "server-only";

import { readWorkspace } from "@/lib/data/workspace-store";
import type { CampaignSummary } from "@/lib/domain";
import { requireUser } from "@/features/auth/services/require-user";
import { summarizeAll } from "@/features/campaigns/services/summarize";

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const user = await requireUser();
  const state = await readWorkspace(user.id);
  return summarizeAll(
    state.campaigns.filter((campaign) => campaign.workspaceId === user.workspaceId),
    state.metrics,
  ).sort((a, b) => a.name.localeCompare(b.name));
}

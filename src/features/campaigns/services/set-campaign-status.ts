"use server";

import { approveAction } from "@/features/copilot/services/approve-action";
import { PREVIEW_TTL_MS } from "@/features/campaigns/services/caps";
import { requireUser } from "@/features/auth/services/require-user";
import { readWorkspace, runTransaction } from "@/lib/data/workspace-store";
import { newRecordId } from "@/lib/data/seed";
import type { ProposedAction } from "@/lib/domain";
import { logError } from "@/lib/errors/log-error";
import { payloadHash } from "@/lib/hash";

export async function setCampaignStatus(
  campaignId: string,
  next: "active" | "paused",
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  if (next !== "active" && next !== "paused") {
    return { ok: false, message: "Choose active or paused." };
  }

  try {
    const state = await readWorkspace(user.id);
    const campaign = state.campaigns.find((item) => item.id === campaignId);
    if (!campaign || campaign.workspaceId !== user.workspaceId) {
      return { ok: false, message: "That campaign is not in this workspace." };
    }
    if (campaign.status === "ended") {
      return { ok: false, message: "An ended campaign stays ended." };
    }
    if (campaign.status === next) {
      return { ok: true, message: next === "paused" ? "Already paused." : "Already active." };
    }

    const kind = next === "paused" ? "pause" : "resume";
    const targets = [
      {
        campaignId: campaign.id,
        name: campaign.name,
        version: campaign.version,
        beforeStatus: campaign.status,
        afterStatus: next,
        beforeBudgetCents: campaign.dailyBudgetCents,
        afterBudgetCents: campaign.dailyBudgetCents,
        note: "Changed from the campaign list.",
      },
    ];
    const now = new Date();
    const action: ProposedAction = {
      id: newRecordId(),
      workspaceId: user.workspaceId,
      userId: user.id,
      kind,
      payloadHash: payloadHash({ kind, targets, create: null }),
      targets,
      create: null,
      summary: next === "paused" ? `Paused ${campaign.name}.` : `Started ${campaign.name}.`,
      status: "pending",
      expiresAt: new Date(now.getTime() + PREVIEW_TTL_MS).toISOString(),
      resultMessage: null,
      createdAt: now.toISOString(),
    };

    await runTransaction(user.id, (current) => ({
      state: { ...current, actions: [...current.actions, action] },
      result: action.id,
    }));
    return approveAction(action.id);
  } catch (error) {
    logError({
      what: "Could not change the campaign status.",
      why: "The status write did not finish.",
      file: "src/features/campaigns/services/set-campaign-status.ts",
      connectedTo: "apply_campaign_action",
      fix: "Click the status again.",
      cause: error,
    });
    return { ok: false, message: "Could not change the status. Click it again." };
  }
}

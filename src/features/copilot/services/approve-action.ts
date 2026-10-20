import "server-only";

import { revalidatePath } from "next/cache";

import { callApplyRpc, runTransaction } from "@/lib/data/workspace-store";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { deny } from "@/features/auth/services/access";
import { requireUser } from "@/features/auth/services/require-user";
import { applyCampaignAction } from "@/features/campaigns/services/apply-campaign-action";
import { writeApprovedChangeToSheet } from "@/features/ingestion/services/sync-sheet";

export async function approveAction(actionId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const blocked = deny(user, "approve");
  if (blocked) return { ok: false, message: blocked };
  try {
    const result =
      env.dataBackend === "supabase"
        ? await callApplyRpc(actionId)
        : await runTransaction(user.id, (state) => {
            const applied = applyCampaignAction(state, { userId: user.id, actionId, now: new Date() });
            return { state: applied.state, result: { ok: applied.ok, message: applied.message } };
          });
    const sheetNote = result.ok ? await writeApprovedChangeToSheet(actionId, user.id) : null;
    revalidatePath("/", "layout");
    return sheetNote ? { ...result, message: `${result.message} ${sheetNote}` } : result;
  } catch (error) {
    logError({
      what: "Could not approve the preview.",
      why: error instanceof AppError ? error.why : "The write did not finish.",
      file: "src/features/copilot/services/approve-action.ts",
      connectedTo: "apply_campaign_action",
      fix: "Refresh the preview and approve again.",
      cause: error,
    });
    return { ok: false, message: "Could not approve the preview. Refresh and try again." };
  }
}

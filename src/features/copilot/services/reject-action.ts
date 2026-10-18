import "server-only";

import { revalidatePath } from "next/cache";

import { callRejectRpc, runTransaction } from "@/lib/data/workspace-store";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { requireUser } from "@/features/auth/services/require-user";
import { rejectCampaignAction } from "@/features/campaigns/services/apply-campaign-action";

export async function rejectAction(actionId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  try {
    const result =
      env.dataBackend === "supabase"
        ? await callRejectRpc(actionId)
        : await runTransaction(user.id, (state) => {
            const rejected = rejectCampaignAction(state, { userId: user.id, actionId, now: new Date() });
            return { state: rejected.state, result: { ok: rejected.ok, message: rejected.message } };
          });
    revalidatePath("/", "layout");
    return result;
  } catch (error) {
    logError({
      what: "Could not reject the preview.",
      why: error instanceof AppError ? error.why : "The rejection did not finish.",
      file: "src/features/copilot/services/reject-action.ts",
      connectedTo: "reject_campaign_action",
      fix: "Refresh and reject the preview again.",
      cause: error,
    });
    return { ok: false, message: "Could not reject the preview. Refresh and try again." };
  }
}

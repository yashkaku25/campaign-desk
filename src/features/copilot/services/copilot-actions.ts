"use server";

import { approveAction } from "@/features/copilot/services/approve-action";
import { proposeAction } from "@/features/copilot/services/propose-action";
import { rejectAction } from "@/features/copilot/services/reject-action";

export async function sendCommand(text: string): Promise<{ ok: boolean; message: string; decided?: boolean }> {
  return proposeAction(text);
}

export async function approvePreview(actionId: string): Promise<{ ok: boolean; message: string }> {
  return approveAction(actionId);
}

export async function rejectPreview(actionId: string): Promise<{ ok: boolean; message: string }> {
  return rejectAction(actionId);
}

export async function decidePreviews(
  actionIds: string[],
  decision: "approve" | "reject",
): Promise<{ ok: boolean; message: string }> {
  const ids = [...new Set(actionIds)].slice(0, 25);
  if (ids.length === 0) return { ok: false, message: "Choose at least one campaign." };
  let done = 0;
  let failed = 0;
  for (const id of ids) {
    const result = decision === "approve" ? await approveAction(id) : await rejectAction(id);
    if (result.ok) done += 1;
    else failed += 1;
  }
  if (decision === "approve") {
    return failed === 0
      ? { ok: true, message: `Saved ${done} campaigns.` }
      : { ok: false, message: `Saved ${done}. ${failed} could not be saved.` };
  }
  return failed === 0
    ? { ok: true, message: `Left ${done} unchanged.` }
    : { ok: false, message: `Left ${done} unchanged. ${failed} could not be updated.` };
}

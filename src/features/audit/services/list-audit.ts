import "server-only";

import { readWorkspace } from "@/lib/data/workspace-store";
import type { AuditEntry } from "@/lib/domain";
import { requireUser } from "@/features/auth/services/require-user";

export async function listAudit(): Promise<AuditEntry[]> {
  const user = await requireUser();
  const state = await readWorkspace(user.id);
  return state.audit
    .filter((entry) => entry.workspaceId === user.workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

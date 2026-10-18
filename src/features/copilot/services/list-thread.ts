import "server-only";

import { readWorkspace } from "@/lib/data/workspace-store";
import type { ChatMessage, PreviewModel } from "@/lib/domain";
import { requireUser } from "@/features/auth/services/require-user";
import { getQuote } from "@/features/currency/services/currency-actions";
import { formatQuote } from "@/lib/currency/convert";
import { toPreview } from "@/features/copilot/services/preview-model";

export async function listCopilotThread(): Promise<{ messages: ChatMessage[]; previews: PreviewModel[] }> {
  const user = await requireUser();
  const quote = await getQuote();
  const money = (cents: number) => formatQuote(cents, quote);
  const state = await readWorkspace(user.id);
  const thread = state.threads.find((item) => item.userId === user.id);
  const now = new Date();
  return {
    messages: state.messages
      .filter((message) => message.threadId === thread?.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    previews: state.actions
      .filter((action) => action.userId === user.id)
      .map((action) => toPreview(action, now, money)),
  };
}

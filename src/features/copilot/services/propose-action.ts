import "server-only";

import { revalidatePath } from "next/cache";

import { buildMetricContext, offlineAnswer } from "@/lib/ai/context";
import { askGeminiForAnswer } from "@/lib/ai/gemini";
import { parseCommand } from "@/lib/ai/parse-command";
import { parseDecision } from "@/lib/ai/parse-decision";
import type { CampaignAction } from "@/lib/ai/schemas";
import { readWorkspace, runTransaction } from "@/lib/data/workspace-store";
import { newRecordId } from "@/lib/data/seed";
import type { CampaignSummary, ChatMessage, ProposedAction } from "@/lib/domain";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { payloadHash } from "@/lib/hash";
import { allowParse } from "@/lib/rate-limit";
import { requireUser } from "@/features/auth/services/require-user";
import { approveAction } from "@/features/copilot/services/approve-action";
import { rejectAction } from "@/features/copilot/services/reject-action";
import { PREVIEW_TTL_MS } from "@/features/campaigns/services/caps";
import { planMutation } from "@/features/campaigns/services/plan-action";
import { getQuote } from "@/features/currency/services/currency-actions";
import { formatQuote } from "@/lib/currency/convert";
import { summarizeAll } from "@/features/campaigns/services/summarize";

export async function proposeAction(text: string): Promise<{ ok: boolean; message: string; decided?: boolean }> {
  const user = await requireUser();
  const decision = parseDecision(text);
  if (decision) return applySpokenDecision(user.id, text.trim(), decision);

  if (!(await allowParse(user.id))) {
    return { ok: false, message: "Too many tries. Wait an hour and send that again." };
  }

  let actions: CampaignAction[];
  try {
    actions = await parseCommand(text);
  } catch (error) {
    return fail(error, "src/lib/ai/parse-command.ts");
  }

  const preparedAnswers = new Map<number, string>();
  try {
    const snapshot = await readWorkspace(user.id);
    const summaries = summarizeAll(snapshot.campaigns, snapshot.metrics);
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      if (action?.type === "answer") {
        preparedAnswers.set(index, await answerQuestion(action.message, summaries));
      }
    }
  } catch (error) {
    return fail(error, "src/lib/ai/gemini.ts");
  }

  const quote = await getQuote();
  const money = (cents: number) => formatQuote(cents, quote);

  try {
    const result = await runTransaction<{ ok: boolean; message: string }>(user.id, (state) => {
      const thread = state.threads.find((item) => item.userId === user.id);
      if (!thread) {
        return {
          state,
          result: { ok: false as const, message: "Chat is not ready. Refresh the page." },
        };
      }
      const summaries = summarizeAll(state.campaigns, state.metrics);
      const now = new Date();
      const drafts = actions.map((action, index) =>
        buildDraft(action, summaries, preparedAnswers.get(index) ?? null, user.id, user.workspaceId, now, money),
      );
      const userMessage: ChatMessage = {
        id: newRecordId(),
        threadId: thread.id,
        role: "user",
        content: text.trim(),
        actionId: null,
        createdAt: now.toISOString(),
      };
      const replies: ChatMessage[] = drafts.map((draft, index) => ({
        id: newRecordId(),
        threadId: thread.id,
        role: "assistant",
        content: draft.content,
        actionId: draft.action?.id ?? null,
        createdAt: new Date(now.getTime() + index + 1).toISOString(),
      }));
      return {
        state: {
          ...state,
          messages: [...state.messages, userMessage, ...replies],
          actions: [...state.actions, ...drafts.flatMap((draft) => (draft.action ? [draft.action] : []))],
        },
        result: { ok: true as const, message: drafts.map((draft) => draft.content).join(" ") },
      };
    });
    revalidatePath("/", "layout");
    return result;
  } catch (error) {
    return fail(error, "src/lib/data/workspace-store.ts");
  }
}

function buildDraft(
  action: CampaignAction,
  summaries: CampaignSummary[],
  preparedAnswer: string | null,
  userId: string,
  workspaceId: string,
  now: Date,
  money: (cents: number) => string,
): { content: string; action: ProposedAction | null } {
  if (action.type === "answer") {
    return { content: preparedAnswer ?? offlineAnswer(summaries), action: null };
  }
  const planned = planMutation(summaries, action, money);
  if (!planned.ok) return { content: planned.reason, action: null };
  return {
    content: planned.plan.summary,
    action: {
      id: newRecordId(),
      workspaceId,
      userId,
      kind: action.type,
      payloadHash: payloadHash({
        kind: action.type,
        targets: planned.plan.targets,
        create: planned.plan.create,
      }),
      targets: planned.plan.targets,
      create: planned.plan.create,
      summary: planned.plan.summary,
      status: "pending",
      expiresAt: new Date(now.getTime() + PREVIEW_TTL_MS).toISOString(),
      resultMessage: null,
      createdAt: now.toISOString(),
    },
  };
}

async function answerQuestion(question: string, summaries: CampaignSummary[]): Promise<string> {
  if (!env.geminiApiKey) return offlineAnswer(summaries);
  return askGeminiForAnswer(question, buildMetricContext(summaries));
}

function fail(error: unknown, connectedTo: string): { ok: false; message: string } {
  const message = error instanceof AppError ? error.what : "Could not save that command.";
  logError({
    what: message,
    why: error instanceof AppError ? error.why : "The command stopped before a preview was saved.",
    file: "src/features/copilot/services/propose-action.ts",
    connectedTo,
    fix: error instanceof AppError ? error.fix : "Refresh and try again.",
    cause: error,
  });
  return { ok: false, message };
}

async function applySpokenDecision(
  userId: string,
  text: string,
  decision: NonNullable<ReturnType<typeof parseDecision>>,
): Promise<{ ok: boolean; message: string; decided: true }> {
  const state = await readWorkspace(userId);
  const now = Date.now();
  const waiting = state.actions.filter(
    (action) => action.status === "pending" && new Date(action.expiresAt).getTime() > now,
  );
  const chosen =
    decision.scope === "all" ? waiting : matchNamed(waiting, decision.phrase).slice(0, 25);
  const limited = decision.scope === "all" ? waiting.slice(0, 25) : chosen;
  if (limited.length === 0) {
    const message =
      decision.scope === "all" ? "Nothing is waiting." : "Nothing waiting matches that name.";
    return { ok: false, message, decided: true };
  }

  let done = 0;
  let failed = 0;
  for (const action of limited) {
    const result = decision.decision === "approve" ? await approveAction(action.id) : await rejectAction(action.id);
    if (result.ok) done += 1;
    else failed += 1;
  }
  const verb = decision.decision === "approve" ? "Saved" : "Left";
  const tail = decision.decision === "approve" ? "campaigns" : "unchanged";
  let message = failed === 0 ? `${verb} ${done} ${tail}.` : `${verb} ${done} ${tail}. ${failed} could not be updated.`;
  if (decision.scope === "all" && waiting.length > limited.length) {
    message = `${message} 25 is the most at once. The rest are still waiting.`;
  }
  await rememberDecision(userId, text, message);
  return { ok: failed === 0, message, decided: true };
}

async function rememberDecision(userId: string, text: string, message: string): Promise<void> {
  const now = new Date().toISOString();
  await runTransaction(userId, (state) => {
    const thread = state.threads.find((item) => item.userId === userId);
    if (!thread) return { state, result: null };
    const messages: ChatMessage[] = [
      { id: newRecordId(), threadId: thread.id, role: "user", content: text, actionId: null, createdAt: now },
      {
        id: newRecordId(),
        threadId: thread.id,
        role: "assistant",
        content: message,
        actionId: null,
        createdAt: now,
      },
    ];
    return { state: { ...state, messages: [...state.messages, ...messages] }, result: null };
  });
}

function matchNamed(waiting: ProposedAction[], phrase: string): ProposedAction[] {
  const whole = waiting.filter((action) => mentions(action, phrase));
  const parts = phrase
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) return whole;
  const found = parts.flatMap((part) => waiting.filter((action) => mentions(action, part)));
  const unique = [...new Map(found.map((action) => [action.id, action])).values()];
  return unique.length > 0 ? unique : whole;
}

function mentions(action: ProposedAction, phrase: string): boolean {
  const query = phrase.trim().toLowerCase();
  if (!query) return false;
  const names = [...action.targets.map((target) => target.name), action.create?.name ?? ""];
  return names.some((name) => {
    const value = name.toLowerCase();
    if (value === query) return true;
    return query.length >= 3 && value.includes(query);
  });
}

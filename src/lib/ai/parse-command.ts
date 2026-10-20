import "server-only";

import { askGeminiForActions } from "@/lib/ai/gemini";
import { parseOffline } from "@/lib/ai/parse-offline";
import { MAX_COMMAND_LENGTH, parseActions, type CampaignAction } from "@/lib/ai/schemas";
import {
  asksForStrategy,
  asksToCreateCampaign,
  suggestCampaignStrategyActions,
  type SheetHintLine,
} from "@/lib/ai/suggest-campaign-strategy";
import { asksToManagePerformance, suggestPerformanceActions } from "@/lib/ai/suggest-performance";
import type { CampaignSummary } from "@/lib/domain";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";

export async function parseCommand(
  text: string,
  metricContext: string,
  campaigns: CampaignSummary[] = [],
  sheetHints: SheetHintLine[] = [],
): Promise<CampaignAction[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new AppError({
      what: "Type a command first.",
      why: "The message was empty.",
      file: "src/lib/ai/parse-command.ts",
      fix: 'Try "Pause campaigns with CTR under 2%" or "Optimize my campaigns".',
    });
  }
  if (trimmed.length > MAX_COMMAND_LENGTH) {
    throw new AppError({
      what: "That message is too long.",
      why: `Commands stop at ${MAX_COMMAND_LENGTH} characters.`,
      file: "src/lib/ai/parse-command.ts",
      fix: "Shorten it to one or two changes.",
    });
  }
  if (!env.geminiApiKey) {
    return offlineParse(trimmed, campaigns, sheetHints);
  }

  try {
    const raw = await askGeminiForActions(trimmed, metricContext);
    const parsed = parseActions(raw);
    if (!parsed.ok || modelGaveUp(parsed.ok ? parsed.actions : [])) {
      try {
        return offlineParse(trimmed, campaigns, sheetHints);
      } catch (offline) {
        if (offline instanceof AppError && offline.what !== "I couldn't turn that into a change.") throw offline;
      }
    }
    if (!parsed.ok) {
      throw new AppError({
        what: "I couldn't turn that into a change.",
        why: parsed.reason,
        file: "src/lib/ai/parse-command.ts",
        connectedTo: "src/lib/ai/schemas.ts",
        fix: "Ask for a pause, a resume, a budget, a new campaign, optimize, or a question.",
      });
    }
    return enrichCreateStrategy(parsed.actions, trimmed, campaigns, sheetHints);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logError({
      what: "I couldn't turn that into a change.",
      why: "Parsing the model reply failed.",
      file: "src/lib/ai/parse-command.ts",
      connectedTo: "src/lib/ai/gemini.ts",
      fix: "Send the command again.",
      cause: error,
    });
    throw new AppError({
      what: "I couldn't turn that into a change.",
      why: "The model reply could not be read.",
      file: "src/lib/ai/parse-command.ts",
      fix: "Send the command again.",
      logged: true,
    });
  }
}

function modelGaveUp(actions: CampaignAction[]): boolean {
  return (
    actions.length === 1 &&
    actions[0]?.type === "answer" &&
    actions[0].message.toLowerCase().includes("couldn't turn that into a change")
  );
}

function offlineParse(
  text: string,
  campaigns: CampaignSummary[],
  sheetHints: SheetHintLine[],
): CampaignAction[] {
  if (asksForStrategy(text) && !asksToCreateCampaign(text)) {
    return suggestCampaignStrategyActions(text, campaigns, sheetHints);
  }
  if (asksToCreateCampaign(text)) {
    try {
      return enrichCreateStrategy(parseOffline(text), text, campaigns, sheetHints);
    } catch {
      return suggestCampaignStrategyActions(text, campaigns, sheetHints);
    }
  }
  if (asksToManagePerformance(text)) return suggestPerformanceActions(campaigns);
  return parseOffline(text);
}

/** If the model created a campaign without a strategy trail, attach a rotating desk/sheet strategy. */
function enrichCreateStrategy(
  actions: CampaignAction[],
  text: string,
  campaigns: CampaignSummary[],
  sheetHints: SheetHintLine[],
): CampaignAction[] {
  if (!asksToCreateCampaign(text)) return actions;
  const create = actions.find((action) => action.type === "create_campaign");
  if (!create || create.type !== "create_campaign") {
    return suggestCampaignStrategyActions(text, campaigns, sheetHints);
  }
  if (create.strategyNote && create.expectedOutcome) return actions;
  const seeded = suggestCampaignStrategyActions(text, campaigns, sheetHints).find(
    (action) => action.type === "create_campaign",
  );
  if (!seeded || seeded.type !== "create_campaign") return actions;
  return actions.map((action) => {
    if (action.type !== "create_campaign") return action;
    return {
      ...action,
      strategyNote: action.strategyNote ?? seeded.strategyNote,
      expectedOutcome: action.expectedOutcome ?? seeded.expectedOutcome,
    };
  });
}

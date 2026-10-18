import "server-only";

import { askGeminiForActions } from "@/lib/ai/gemini";
import { parseOffline } from "@/lib/ai/parse-offline";
import { MAX_COMMAND_LENGTH, parseActions, type CampaignAction } from "@/lib/ai/schemas";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";

export async function parseCommand(text: string): Promise<CampaignAction[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new AppError({
      what: "Type a command first.",
      why: "The message was empty.",
      file: "src/lib/ai/parse-command.ts",
      fix: 'Try "Pause campaigns with CTR under 2%".',
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
  if (!env.geminiApiKey) return parseOffline(trimmed);

  try {
    const raw = await askGeminiForActions(trimmed);
    const parsed = parseActions(raw);
    if (!parsed.ok || modelGaveUp(parsed.ok ? parsed.actions : [])) {
      try {
        return parseOffline(trimmed);
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
        fix: "Ask for a pause, a resume, a budget, a new campaign, or a question.",
      });
    }
    return parsed.actions;
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

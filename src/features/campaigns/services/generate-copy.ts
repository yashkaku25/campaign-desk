"use server";

import { z } from "zod";

import { requireUser } from "@/features/auth/services/require-user";
import { getCampaign } from "@/features/campaigns/services/get-campaign";
import { askGeminiForCopy } from "@/lib/ai/gemini";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { getQuote } from "@/features/currency/services/currency-actions";
import { formatQuote } from "@/lib/currency/convert";
import { allowCopy } from "@/lib/rate-limit";
import { formatCount, formatCtr } from "@/lib/money";

const copySchema = z.object({
  lines: z.array(z.string().trim().min(1).max(180)).min(1).max(3),
});

export async function generateCopy(campaignId: string): Promise<{ ok: true; lines: string[] } | { ok: false; message: string }> {
  const user = await requireUser();
  if (!(await allowCopy(user.id))) {
    return { ok: false, message: "Too many copy tries. Wait an hour and ask again." };
  }
  const found = await getCampaign(campaignId);
  if (!found || found.campaign.workspaceId !== user.workspaceId) {
    return { ok: false, message: "That campaign is not in this workspace." };
  }
  const { campaign } = found;
  const quote = await getQuote();
  const spend = formatQuote(campaign.spendCents, quote);
  const budget = formatQuote(campaign.dailyBudgetCents, quote);
  if (!env.geminiApiKey) {
    return {
      ok: true,
      lines: [
        "People skip an offer that looks like every other offer.",
        `${campaign.name} has ${campaign.impressions === 0 ? "no CTR yet" : formatCtr(campaign.ctr)} and ${formatCount(campaign.conversions)} conversions.`,
        `Daily budget ${budget}.`,
      ],
    };
  }
  try {
    const raw = await askGeminiForCopy(
      [
        "Write three lines: a problem, a proof line using only these numbers, and a short close. Keep each money amount exactly as written, mark after the number.",
        `Name: ${campaign.name}`,
        `Status: ${campaign.status}`,
        `CTR: ${campaign.impressions === 0 ? "unavailable" : formatCtr(campaign.ctr)}`,
        `Spend: ${spend}`,
        `Conversions: ${formatCount(campaign.conversions)}`,
        `Daily budget: ${budget}`,
      ].join("\n"),
    );
    const parsed = copySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false, message: "The copy reply was not usable. Try again." };
    return { ok: true, lines: parsed.data.lines };
  } catch (error) {
    const message = error instanceof AppError ? error.what : "Could not write copy.";
    logError({
      what: message,
      why: error instanceof AppError ? error.why : "The copy call failed.",
      file: "src/features/campaigns/services/generate-copy.ts",
      connectedTo: "src/lib/ai/gemini.ts",
      fix: "Try again in a moment.",
      cause: error,
    });
    return { ok: false, message };
  }
}

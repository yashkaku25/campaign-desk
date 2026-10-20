"use server";

import { revalidatePath } from "next/cache";

import { deny } from "@/features/auth/services/access";
import { requireUser } from "@/features/auth/services/require-user";
import { PREVIEW_TTL_MS } from "@/features/campaigns/services/caps";
import { readConnectedSheet, writeSheetCells, writeTemplateHeaders } from "@/features/ingestion/services/google-sheets";
import { googleAccessToken } from "@/features/ingestion/services/google-auth";
import { planSheetUpdates, type SheetArrival } from "@/features/ingestion/services/sheet-plan";
import { describeImport, type ImportKind } from "@/features/ingestion/services/sheet-report";
import { parseCsv, sheetIdFromUrl } from "@/features/ingestion/services/sheet-url";
import { mergeSheetGrids, parseSheetValues } from "@/features/ingestion/services/sheet-rows";
import { askGeminiToReadTable } from "@/lib/ai/gemini";
import { readWorkspace, runTransaction, saveDailyMetric } from "@/lib/data/workspace-store";
import { newRecordId } from "@/lib/data/seed";
import type { ChatMessage, CreateSnapshot, ProposedAction, TargetSnapshot } from "@/lib/domain";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors/log-error";
import { payloadHash } from "@/lib/hash";
import { loadRateTable } from "@/lib/currency/rates";

export async function syncSheet(): Promise<{ ok: boolean; message: string; openChat?: boolean }> {
  const user = await requireUser();
  const blocked = deny(user, "sync");
  if (blocked) return { ok: false, message: blocked };
  const state = await readWorkspace(user.id);
  const access = await googleAccessToken();
  const token = "token" in access ? access.token : null;
  const sheet = await readConnectedSheet(state.workspace.sheetUrl, token);
  if ("problem" in sheet) return { ok: false, message: sheet.problem };
  const rates = await loadRateTable();
  const parsed = parseSheetValues(sheet.values, rates.rates);
  if (parsed.state === "blank") {
    const wrote = await writeTemplateHeaders(state.workspace.sheetUrl, token);
    return wrote.ok
      ? { ok: true, message: "The sheet was empty. Column names are in the first row. Add campaigns, then sync again." }
      : { ok: false, message: wrote.problem };
  }
  if (parsed.state === "awaiting") {
    return { ok: true, message: "Waiting for sheet data. Add rows to your Google Sheet and sync again." };
  }
  return importSheetValues(sheet.values, "sheet");
}

export async function importCsv(text: string): Promise<{ ok: boolean; message: string; openChat?: boolean }> {
  const user = await requireUser();
  const blocked = deny(user, "sync");
  if (blocked) return { ok: false, message: blocked };
  if (text.length > 400_000) return { ok: false, message: "That file is too big. Keep it to a few hundred rows." };
  return importSheetValues(parseCsv(text), "file");
}

export async function importScreenshot(
  base64: string,
  mimeType: string,
): Promise<{ ok: boolean; message: string; openChat?: boolean }> {
  return importPictures([{ base64, mimeType }]);
}

export async function importPictures(
  images: { base64: string; mimeType: string }[],
): Promise<{ ok: boolean; message: string; openChat?: boolean }> {
  const user = await requireUser();
  const blocked = deny(user, "sync");
  if (blocked) return { ok: false, message: blocked };
  if (images.length === 0) return { ok: false, message: "Add a picture first." };
  if (images.length > 8) return { ok: false, message: "8 pictures is the most at one time." };
  const total = images.reduce((sum, image) => sum + image.base64.length, 0);
  if (total > 3_500_000) return { ok: false, message: "Those pictures together are too big. Send fewer or smaller ones." };
  for (const image of images) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(image.mimeType)) {
      return { ok: false, message: "Use PNG, JPG, or WebP pictures." };
    }
    if (image.base64.length > 2_800_000) return { ok: false, message: "One picture is too big. Try a smaller one." };
  }
  if (!env.geminiApiKey) {
    return { ok: false, message: "A picture needs Gemini to read the numbers. Upload a CSV instead." };
  }
  const grids: string[][][] = [];
  let missed = 0;
  for (const image of images) {
    try {
      const csv = await askGeminiToReadTable(image.base64, image.mimeType);
      const values = parseCsv(csv);
      if (values.length > 1) grids.push(values);
      else missed += 1;
    } catch (error) {
      missed += 1;
      logError({
        what: "Could not read one picture.",
        why: "Gemini did not return a table for that picture.",
        file: "src/features/ingestion/services/sync-sheet.ts",
        connectedTo: "src/lib/ai/gemini.ts",
        fix: "Paste the picture again, or upload a CSV.",
        cause: error,
      });
    }
  }
  if (grids.length === 0) return { ok: false, message: "Could not read a campaign table in those pictures." };
  const result = await importSheetValues(mergeSheetGrids(grids), "picture");
  if (missed === 0) return result;
  return { ...result, message: `${result.message} ${missed} ${missed === 1 ? "picture had" : "pictures had"} no table.` };
}

async function importSheetValues(
  values: string[][],
  kind: ImportKind,
): Promise<{ ok: boolean; message: string; openChat?: boolean }> {
  const user = await requireUser();
  const state = await readWorkspace(user.id);
  const rates = await loadRateTable();
  const parsed = parseSheetValues(values, rates.rates);
  if (parsed.state === "blank") {
    return { ok: false, message: kind === "picture" ? "That picture has no campaign table." : "That file has no rows." };
  }
  if (parsed.state === "awaiting") {
    return {
      ok: true,
      message: kind === "picture" ? "The picture has column names only. Include the campaign rows." : "Headers are there. Add campaign rows, then try again.",
    };
  }
  if (parsed.problem) return { ok: false, message: parsed.problem };
  if (parsed.rows.length === 0) {
    return { ok: false, message: `Skipped ${parsed.skipped} incomplete rows. Nothing was imported.` };
  }

  const plan = planSheetUpdates(state.campaigns, parsed.rows, user.workspaceId);
  if (plan.ambiguous.length > 0) {
    return {
      ok: false,
      message: `Two campaigns are named ${plan.ambiguous.join(", ")}. Rename one, then sync again.`,
    };
  }
  if (plan.targets.length > 25) {
    return { ok: false, message: "The sheet changes more than 25 campaigns. Split the sheet and sync again." };
  }

  let metricCount = 0;
  for (const metric of plan.metrics) {
    const problem = await saveDailyMetric(metric);
    if (problem) {
      const stopped = metricCount === 0 ? problem : `Saved ${metricCount} metric rows, then stopped. ${problem}`;
      return { ok: false, message: stopped };
    }
    metricCount += 1;
  }

  const thread = state.threads.find((item) => item.userId === user.id);
  const pendingNames = new Set(
    state.actions.filter((action) => action.status === "pending" && action.create).map((action) => action.create?.name.toLowerCase()),
  );
  const room = Math.max(0, 25 - state.campaigns.length);
  const fresh = plan.arrivals.filter((arrival) => !pendingNames.has(arrival.name.toLowerCase()));
  const arrivals = fresh.slice(0, room);
  const queued: ProposedAction[] = [];
  if (plan.targets.length > 0) queued.push(buildAction(user.id, user.workspaceId, plan.targets));
  for (const arrival of arrivals) queued.push(buildCreate(user.id, user.workspaceId, arrival));

  if (queued.length > 0) {
    if (!thread) return { ok: false, message: "Chat is not ready. Refresh the page." };
    const now = new Date().toISOString();
    const replies: ChatMessage[] = queued.map((action) => ({
      id: newRecordId(),
      threadId: thread.id,
      role: "assistant",
      content: action.summary,
      actionId: action.id,
      createdAt: now,
    }));
    await runTransaction(user.id, (current) => ({
      state: { ...current, actions: [...current.actions, ...queued], messages: [...current.messages, ...replies] },
      result: queued.length,
    }));
  }

  revalidatePath("/", "layout");
  const report = describeImport({
    kind,
    metricCount,
    extraColumns: parsed.extraColumns,
    skipped: parsed.skipped,
    queued: queued.length,
    needsBudget: plan.needsBudget,
    outOfRange: plan.outOfRange,
    alreadyWaiting: plan.arrivals.length > fresh.length,
    leftOut: fresh.length > arrivals.length,
  });
  return { ...report, openChat: queued.length > 0 };
}

export async function writeApprovedChangeToSheet(actionId: string, userId: string): Promise<string | null> {
  const state = await readWorkspace(userId);
  const sheetId = sheetIdFromUrl(state.workspace.sheetUrl ?? "");
  if (!sheetId) return null;
  const access = await googleAccessToken();
  const token = "token" in access ? access.token : null;
  if (!token) return null;
  const action = state.actions.find((item) => item.id === actionId);
  if (!action || action.targets.length === 0) return null;
  const sheet = await readConnectedSheet(state.workspace.sheetUrl, token);
  if ("problem" in sheet || sheet.values.length === 0) return null;
  const header = sheet.values[0]?.map((cell) => cell.trim().toLowerCase().replaceAll(" ", "_")) ?? [];
  const nameIndex = header.indexOf("campaign_name");
  const statusIndex = header.indexOf("status");
  const budgetIndex = header.indexOf("daily_budget");
  if (nameIndex < 0) return null;
  const updates: { range: string; values: string[][] }[] = [];
  for (const target of action.targets) {
    const rowIndex = sheet.values.findIndex((row, index) => index > 0 && (row[nameIndex] ?? "").trim().toLowerCase() === target.name.toLowerCase());
    if (rowIndex < 0) continue;
    const sheetRow = rowIndex + 1;
    if (statusIndex >= 0) {
      updates.push({ range: cellRange(sheetRow, statusIndex), values: [[target.afterStatus]] });
    }
    if (budgetIndex >= 0) {
      updates.push({
        range: cellRange(sheetRow, budgetIndex),
        values: [[(target.afterBudgetCents / 100).toFixed(2)]],
      });
    }
  }
  return writeSheetCells(updates, { sheetId, accessToken: token });
}

function buildCreate(userId: string, workspaceId: string, arrival: SheetArrival): ProposedAction {
  const create: CreateSnapshot = {
    name: arrival.name,
    dailyBudgetCents: arrival.dailyBudgetCents,
    status: "active",
  };
  const now = new Date();
  const summary = arrival.pausedInSheet
    ? `Add ${arrival.name} from your sheet. It starts active. Sync again after you approve to pause it.`
    : `Add ${arrival.name} from your sheet. Sync again after you approve to bring its numbers.`;
  return {
    id: newRecordId(),
    workspaceId,
    userId,
    kind: "create_campaign",
    payloadHash: payloadHash({ kind: "create_campaign", targets: [], create }),
    targets: [],
    create,
    summary,
    status: "pending",
    expiresAt: new Date(now.getTime() + PREVIEW_TTL_MS).toISOString(),
    resultMessage: null,
    createdAt: now.toISOString(),
  };
}

function buildAction(userId: string, workspaceId: string, targets: TargetSnapshot[]): ProposedAction {
  const kind = targets.every((target) => target.afterStatus === "paused" && target.afterBudgetCents === target.beforeBudgetCents)
    ? "pause"
    : targets.every((target) => target.afterStatus === "active" && target.afterBudgetCents === target.beforeBudgetCents)
      ? "resume"
      : "set_daily_budget";
  const now = new Date();
  return {
    id: newRecordId(),
    workspaceId,
    userId,
    kind,
    payloadHash: payloadHash({ kind, targets, create: null }),
    targets,
    create: null,
    summary: `Sync ${targets.map((target) => target.name).join(", ")} from the Google Sheet.`,
    status: "pending",
    expiresAt: new Date(now.getTime() + PREVIEW_TTL_MS).toISOString(),
    resultMessage: null,
    createdAt: now.toISOString(),
  };
}

function cellRange(row: number, column: number): string {
  const letters = columnToLetters(column);
  const sheet = env.googleSheetsRange.split("!")[0] || "Sheet1";
  return `${sheet}!${letters}${row}`;
}

function columnToLetters(index: number): string {
  let current = index + 1;
  let letters = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    current = Math.floor((current - 1) / 26);
  }
  return letters;
}

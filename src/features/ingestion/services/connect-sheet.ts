"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/services/require-user";
import { googleAccessToken, googleConnectReady, googleConnectStartUrl, readGoogleRefreshToken } from "@/features/ingestion/services/google-auth";
import { createCampaignSheet, readConnectedSheet, writeTemplateHeaders } from "@/features/ingestion/services/google-sheets";
import { parseSheetValues } from "@/features/ingestion/services/sheet-rows";
import { sheetIdFromUrl } from "@/features/ingestion/services/sheet-url";
import { syncSheet } from "@/features/ingestion/services/sync-sheet";
import { withLocalState } from "@/lib/data/local-store";
import { readWorkspace } from "@/lib/data/workspace-store";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function currentSheetConnection(): Promise<{ url: string; connected: boolean; ready: boolean; startUrl: string }> {
  const user = await requireUser();
  const state = await readWorkspace(user.id);
  const token = await readGoogleRefreshToken();
  return {
    url: state.workspace.sheetUrl ?? "",
    connected: Boolean(token),
    ready: googleConnectReady(),
    startUrl: googleConnectStartUrl() ?? "",
  };
}

export async function createDeskSheet(): Promise<{ ok: boolean; message: string }> {
  await requireUser();
  const access = await googleAccessToken();
  if ("problem" in access) return { ok: false, message: access.problem };
  const created = await createCampaignSheet(access.token);
  if ("problem" in created) return { ok: false, message: created.problem };
  const stored = await storeSheetUrl(created.url);
  if (!stored.ok) return stored;
  revalidatePath("/campaigns");
  return { ok: true, message: "Made a sheet named Campaign desk. The column names are in the first row." };
}

export async function saveSheetUrl(raw: string): Promise<{ ok: boolean; message: string; openChat?: boolean }> {
  await requireUser();
  const trimmed = raw.trim();
  if (trimmed.length > 500) return { ok: false, message: "That sheet link is too long." };
  if (trimmed && !sheetIdFromUrl(trimmed)) return { ok: false, message: "Paste a Google Sheet link." };

  const stored = await storeSheetUrl(trimmed);
  if (!stored.ok) return stored;

  revalidatePath("/campaigns");
  if (!trimmed) return { ok: true, message: "Sheet removed." };

  const access = await googleAccessToken();
  const token = "token" in access ? access.token : null;
  const sheet = await readConnectedSheet(trimmed, token);
  if ("problem" in sheet) return { ok: true, message: `Sheet saved. ${sheet.problem}` };
  const parsed = parseSheetValues(sheet.values);
  if (parsed.state === "blank") {
    const wrote = await writeTemplateHeaders(trimmed, token);
    return wrote.ok
      ? { ok: true, message: "Sheet saved. Column names are in the first row. Add campaigns, then sync." }
      : { ok: true, message: `Sheet saved. ${wrote.problem}` };
  }
  if (parsed.state === "awaiting") {
    return { ok: true, message: "Sheet saved. Column names are already there. Add campaigns, then sync." };
  }
  return syncSheet();
}

async function storeSheetUrl(trimmed: string): Promise<{ ok: boolean; message: string }> {
  if (env.dataBackend === "local") {
    await withLocalState((state) => ({
      state: { ...state, workspace: { ...state.workspace, sheetUrl: trimmed || null } },
      result: undefined,
    }));
    return { ok: true, message: "Sheet saved." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_workspace_sheet", { next_url: trimmed });
  if (error) {
    logError({
      what: "Could not save the Google Sheet link.",
      why: "Supabase rejected the sheet link.",
      file: "src/features/ingestion/services/connect-sheet.ts",
      connectedTo: "public.set_workspace_sheet in supabase/migrations/0006_sheet_url.sql",
      fix: "Apply supabase/migrations/0006_sheet_url.sql, then save the link again.",
      cause: error,
    });
    return { ok: false, message: "Could not save the sheet link. The workspace is not ready for a sheet yet." };
  }
  return { ok: true, message: "Sheet saved." };
}

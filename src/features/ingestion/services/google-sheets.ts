import "server-only";

import { parseCsv, sheetIdFromUrl } from "@/features/ingestion/services/sheet-url";
import { sheetHeaderRow } from "@/features/ingestion/services/sheet-rows";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors/log-error";

export async function readConnectedSheet(
  sheetUrl: string | null,
  accessToken?: string | null,
): Promise<{ values: string[][] } | { problem: string }> {
  const sheetId = sheetIdFromUrl(sheetUrl ?? "") || env.googleSheetsId || "";
  if (!sheetId) return { problem: "Paste a Google Sheet link, then sync." };
  if (accessToken) return readWithToken(sheetId, accessToken);
  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv`, {
      cache: "no-store",
      redirect: "follow",
    });
    const text = await response.text();
    if (!response.ok || text.trimStart().startsWith("<")) {
      return { problem: "Share the sheet so anyone with the link can view, then sync again." };
    }
    return { values: parseCsv(text) };
  } catch (error) {
    logError({
      what: "Could not read the Google Sheet.",
      why: "The sheet call did not finish.",
      file: "src/features/ingestion/services/google-sheets.ts",
      connectedTo: "Google Sheets",
      fix: "Connect Google, then sync again.",
      cause: scrub(error),
    });
    return { problem: "Could not read the Google Sheet." };
  }
}

export async function createCampaignSheet(accessToken: string): Promise<{ url: string } | { problem: string }> {
  try {
    const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        properties: { title: "Campaign desk" },
        sheets: [
          {
            properties: { title: "Sheet1" },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: sheetHeaderRow().map((header) => ({ userEnteredValue: { stringValue: header } })),
                  },
                ],
              },
            ],
          },
        ],
      }),
      cache: "no-store",
    });
    const body = (await response.json()) as { spreadsheetId?: unknown };
    if (!response.ok || typeof body.spreadsheetId !== "string") {
      return { problem: "Google did not create the sheet." };
    }
    return { url: `https://docs.google.com/spreadsheets/d/${body.spreadsheetId}/edit` };
  } catch (error) {
    logError({
      what: "Could not create the Google Sheet.",
      why: "The create call did not finish.",
      file: "src/features/ingestion/services/google-sheets.ts",
      connectedTo: "Google Sheets API",
      fix: "Connect Google, then try again.",
      cause: scrub(error),
    });
    return { problem: "Could not create the Google Sheet." };
  }
}

async function readWithToken(sheetId: string, accessToken: string): Promise<{ values: string[][] } | { problem: string }> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/Sheet1!A1:Z500`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );
    if (!response.ok) return { problem: "Google did not allow the desk to read that sheet. Connect again." };
    const body = (await response.json()) as { values?: unknown };
    if (!Array.isArray(body.values)) return { values: [] };
    return {
      values: body.values.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [])),
    };
  } catch (error) {
    logError({
      what: "Could not read the Google Sheet.",
      why: "The signed-in sheet call did not finish.",
      file: "src/features/ingestion/services/google-sheets.ts",
      connectedTo: "Google Sheets API",
      fix: "Connect Google, then sync again.",
      cause: scrub(error),
    });
    return { problem: "Could not read the Google Sheet." };
  }
}

export async function writeTemplateHeaders(
  sheetUrl: string | null,
  accessToken?: string | null,
): Promise<{ ok: true } | { ok: false; problem: string }> {
  const sheetId = sheetIdFromUrl(sheetUrl ?? "") || env.googleSheetsId;
  if (!sheetId) return { ok: false, problem: "That link is not a Google Sheet." };
  if (!accessToken && !env.googleSheetsApiKey) return { ok: false, problem: "Connect Google so the desk can edit the sheet." };
  try {
    const response = await fetch(headerUrl(sheetId, accessToken), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ values: [sheetHeaderRow()] }),
      cache: "no-store",
    });
    if (!response.ok) {
      logError({
        what: "Could not write the header row to the Google Sheet.",
        why: "Google refused the column names.",
        file: "src/features/ingestion/services/google-sheets.ts",
        connectedTo: "Google Sheets API",
        fix: "Share the sheet so the desk can edit it.",
        cause: `status-${response.status}`,
      });
      return { ok: false, problem: "Google did not accept the column names. Share the sheet so the desk can edit it." };
    }
    return { ok: true };
  } catch (error) {
    logError({
      what: "Could not write the header row to the Google Sheet.",
      why: "The sheet update did not finish.",
      file: "src/features/ingestion/services/google-sheets.ts",
      connectedTo: "Google Sheets API",
      fix: "Add the header row by hand, then sync again.",
      cause: scrub(error),
    });
    return { ok: false, problem: "Could not write the column names." };
  }
}

export async function writeSheetCells(
  updates: { range: string; values: string[][] }[],
  target?: { sheetId: string; accessToken: string },
): Promise<string | null> {
  if (updates.length === 0) return null;
  const sheetId = target?.sheetId || env.googleSheetsId;
  const accessToken = target?.accessToken ?? "";
  if (!sheetId || (!accessToken && !env.googleSheetsApiKey)) return null;
  try {
    const url = accessToken
      ? `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values:batchUpdate`
      : `${sheetOrigin()}/values:batchUpdate?key=${encodeURIComponent(env.googleSheetsApiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates }),
      cache: "no-store",
    });
    if (!response.ok) return "The desk saved the change. The Google Sheet did not accept the write-back.";
    return null;
  } catch (error) {
    logError({
      what: "Could not write the change back to the Google Sheet.",
      why: "The sheet update did not finish.",
      file: "src/features/ingestion/services/google-sheets.ts",
      connectedTo: "Google Sheets API",
      fix: "Connect Google again, then change the campaign once more.",
      cause: scrub(error),
    });
    return "The desk saved the change. The Google Sheet could not be updated.";
  }
}

function headerUrl(sheetId: string, accessToken?: string | null): string {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/Sheet1!A1?valueInputOption=RAW`;
  if (accessToken) return base;
  return `${base}&key=${encodeURIComponent(env.googleSheetsApiKey)}`;
}

function sheetOrigin(): string {
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.googleSheetsId)}`;
}

function scrub(error: unknown): string {
  const message = error instanceof Error ? error.message : "The sheet call failed.";
  return message.replace(/key=[^&\s]+/gi, "key=[key]").replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [token]").slice(0, 180);
}

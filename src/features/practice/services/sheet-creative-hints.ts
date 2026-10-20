import "server-only";

import { requireUser } from "@/features/auth/services/require-user";
import { googleAccessToken } from "@/features/ingestion/services/google-auth";
import { readConnectedSheet } from "@/features/ingestion/services/google-sheets";
import { parseSheetValues } from "@/features/ingestion/services/sheet-rows";
import { readWorkspace } from "@/lib/data/workspace-store";

export interface SheetCreativeHint {
  campaignName: string;
  headline: string | null;
  primaryText: string | null;
  product: string | null;
}

const HEADLINE_KEYS = ["headline", "ad_headline", "ad_name", "creative_name", "title"];
const COPY_KEYS = ["primary_text", "primarytext", "copy", "body", "ad_copy", "description", "text"];
const PRODUCT_KEYS = ["product", "sku", "item", "offer"];

/** Reads optional creative columns from the connected sheet so Simulation can open on your ad. */
export async function listSheetCreativeHints(): Promise<SheetCreativeHint[]> {
  const user = await requireUser();
  const state = await readWorkspace(user.id);
  const access = await googleAccessToken();
  const token = "token" in access ? access.token : null;
  const sheet = await readConnectedSheet(state.workspace.sheetUrl, token);
  if ("problem" in sheet) return [];

  const parsed = parseSheetValues(sheet.values);
  if (parsed.state !== "ready") return [];

  const byName = new Map<string, SheetCreativeHint>();
  for (const row of parsed.rows) {
    const key = row.name.trim().toLowerCase();
    if (!key) continue;
    const headline = pickExtra(row.extra, HEADLINE_KEYS);
    const primaryText = pickExtra(row.extra, COPY_KEYS);
    const product = pickExtra(row.extra, PRODUCT_KEYS);
    if (!headline && !primaryText && !product) continue;
    const prior = byName.get(key);
    byName.set(key, {
      campaignName: row.name,
      headline: headline ?? prior?.headline ?? null,
      primaryText: primaryText ?? prior?.primaryText ?? null,
      product: product ?? prior?.product ?? null,
    });
  }
  return [...byName.values()];
}

function pickExtra(extra: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = extra[key]?.trim();
    if (value) return value.slice(0, 280);
  }
  return null;
}

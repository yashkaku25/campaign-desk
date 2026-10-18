import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { logError } from "@/lib/errors/log-error";

const filePath = path.join(process.cwd(), "data", "google-refresh.json");

async function readAll(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const entries = Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string");
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export async function storeGoogleRefresh(userId: string, token: string): Promise<void> {
  try {
    const all = await readAll();
    all[userId] = token;
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(all), "utf8");
  } catch (error) {
    logError({
      what: "Could not keep the Google permission.",
      why: "The server could not save it.",
      file: "src/features/ingestion/services/google-refresh-store.ts",
      fix: "Connect Google again.",
      cause: error,
    });
  }
}

export async function loadGoogleRefresh(userId: string): Promise<string | null> {
  const token = (await readAll())[userId]?.trim() ?? "";
  return token || null;
}

import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { healLocalState } from "@/lib/data/heal-local-state";
import type { AppState } from "@/lib/domain";
import { createDemoState } from "@/lib/data/seed";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { env } from "@/lib/env";

const filePath = path.join(process.cwd(), "data", "local-store.json");

let queue: Promise<void> = Promise.resolve();

export function withLocalState<T>(
  update: (state: AppState) => { state: AppState; result: T },
): Promise<T> {
  const run = queue.then(async () => {
    const state = await readLocalState();
    const outcome = update(state);
    await writeLocalState(outcome.state);
    return outcome.result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function readLocalState(): Promise<AppState> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.workspace || !Array.isArray(parsed.campaigns) || !Array.isArray(parsed.actions)) {
      throw new Error("missing-tables");
    }
    const healed = healLocalState(
      {
        ...parsed,
        workspace: { ...parsed.workspace, sheetUrl: parsed.workspace.sheetUrl ?? null },
        invites: parsed.invites ?? [],
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      },
      env.demoEmail,
    );
    if (healed.dirty) {
      await writeLocalState(healed.state);
    }
    return healed.state;
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    if (missing) {
      const seeded = createDemoState();
      await writeLocalState(seeded);
      return seeded;
    }
    logError({
      what: "Could not read the local campaign file.",
      why: "The file is missing fields or is not valid JSON.",
      file: "src/lib/data/local-store.ts",
      connectedTo: "data/local-store.json",
      fix: "Delete data/local-store.json and refresh. The demo campaigns will be created again.",
      cause: error,
    });
    throw new AppError({
      what: "Could not read the local campaign file.",
      why: "The saved file is damaged.",
      file: "src/lib/data/local-store.ts",
      fix: "Delete data/local-store.json and refresh.",
      status: 500,
      logged: true,
    });
  }
}

async function writeLocalState(state: AppState): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
}

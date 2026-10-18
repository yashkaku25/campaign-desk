import "server-only";

import { logError } from "@/lib/errors/log-error";

const HOUR_MS = 60 * 60 * 1000;
const SOURCE = "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,INR";

export interface RateTable {
  date: string;
  rates: { EUR: number; GBP: number; CAD: number; INR: number };
  fresh: boolean;
}

let memory: (RateTable & { fetchedAt: number }) | null = null;

/**
 * Latest European Central Bank reference, via Frankfurter.
 * The table is reused for an hour. A failed refresh keeps the last good table.
 * Campaign rows are never rewritten when this table changes.
 */
export async function loadRateTable(): Promise<RateTable> {
  if (memory && Date.now() - memory.fetchedAt < HOUR_MS) {
    return { date: memory.date, rates: memory.rates, fresh: memory.fresh };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const response = await fetch(SOURCE, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`status-${response.status}`);
    const body = (await response.json()) as { date?: unknown; rates?: unknown };
    const rates = readRates(body.rates);
    if (!rates || typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      throw new Error("unexpected-rate-shape");
    }
    memory = { date: body.date, rates, fresh: true, fetchedAt: Date.now() };
    return { date: memory.date, rates: memory.rates, fresh: true };
  } catch (error) {
    logError({
      what: "Could not refresh exchange rates.",
      why: "The rate source did not return a usable table.",
      file: "src/lib/currency/rates.ts",
      connectedTo: "https://api.frankfurter.app",
      fix: "The desk keeps the last good rates. Amounts stay saved in US dollars.",
      cause: error,
    });
    if (memory) return { date: memory.date, rates: memory.rates, fresh: false };
    return {
      date: "2026-10-16",
      rates: { EUR: 0.88865, GBP: 0.74989, CAD: 1.4161, INR: 94.96 },
      fresh: false,
    };
  }
}

function readRates(value: unknown): RateTable["rates"] | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const rates = {
    EUR: row.EUR,
    GBP: row.GBP,
    CAD: row.CAD,
    INR: row.INR,
  };
  if (!Object.values(rates).every((rate) => typeof rate === "number" && Number.isFinite(rate) && rate > 0)) {
    return null;
  }
  return rates as RateTable["rates"];
}

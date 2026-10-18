import type { CampaignStatus } from "@/lib/domain";

export interface SheetRow {
  name: string;
  status: CampaignStatus | null;
  dailyBudgetCents: number | null;
  day: string | null;
  impressions: number | null;
  clicks: number | null;
  spendCents: number | null;
  conversions: number | null;
  extra: Record<string, string>;
}

export interface SheetParse {
  rows: SheetRow[];
  problem: string | null;
  state: "blank" | "awaiting" | "ready" | "invalid";
  skipped: number;
  extraColumns: string[];
}

const HEADER_ROW = [
  "campaign_name",
  "status",
  "daily_budget",
  "currency",
  "spend",
  "impressions",
  "clicks",
  "conversions",
  "roas",
  "reach",
  "cpm",
];

const CORE = new Set([
  "campaign_name",
  "status",
  "daily_budget",
  "currency",
  "spend",
  "impressions",
  "clicks",
  "conversions",
  "date",
]);

const ALIASES: Record<string, string> = {
  campaign: "campaign_name",
  amount_spent: "spend",
  amount_spent_usd: "spend",
  cost: "spend",
  budget: "daily_budget",
  day: "date",
};

const STATUSES = new Set<CampaignStatus>(["draft", "active", "paused", "ended"]);
const KNOWN_MONEY = new Set(["USD", "EUR", "GBP", "CAD", "INR"]);

export type UsdRates = { EUR: number; GBP: number; CAD: number; INR: number };

export function sheetHeaderRow(): string[] {
  return [...HEADER_ROW];
}

export function parseSheetValues(values: string[][], rates?: UsdRates): SheetParse {
  if (isBlank(values)) return empty("blank");

  const [header, ...body] = values;
  if (!header || header.every((cell) => cell.trim() === "")) return empty("blank");

  const columns = header.map((cell) => canonical(cell));
  if (!columns.includes("campaign_name")) {
    return { rows: [], problem: "The sheet needs a campaign_name column.", state: "invalid", skipped: 0, extraColumns: [] };
  }

  const rows: SheetRow[] = [];
  const extraColumns = new Set<string>();
  let skipped = 0;
  for (const line of body) {
    if (line.every((cell) => cell.trim() === "")) continue;
    const parsed = readRow(line, columns, rates);
    if (!parsed) skipped += 1;
    else {
      rows.push(parsed);
      for (const key of Object.keys(parsed.extra)) extraColumns.add(key);
    }
  }

  if (rows.length === 0 && skipped === 0) return empty("awaiting");
  return { rows, problem: null, state: "ready", skipped, extraColumns: [...extraColumns] };
}

function empty(state: "blank" | "awaiting"): SheetParse {
  return { rows: [], problem: null, state, skipped: 0, extraColumns: [] };
}

function canonical(header: string): string {
  const key = header
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replace(/[^a-z0-9_]/g, "");
  return ALIASES[key] ?? key;
}

function isBlank(values: string[][]): boolean {
  return values.length === 0 || values.every((row) => row.every((cell) => cell.trim() === ""));
}

function readRow(line: string[], columns: string[], rates: UsdRates | undefined): SheetRow | null {
  const name = cell(line, columns, "campaign_name").slice(0, 120);
  if (!name) return null;

  const currency = cell(line, columns, "currency").toUpperCase();
  if (currency && !KNOWN_MONEY.has(currency)) return null;
  const moneyCode = currency || "USD";

  const statusRaw = cell(line, columns, "status");
  const status = readStatus(statusRaw);
  if (statusRaw && !status) return null;

  const budget = readMoney(cell(line, columns, "daily_budget"), moneyCode, rates);
  const spend = readMoney(cell(line, columns, "spend"), moneyCode, rates);
  const impressions = readCount(cell(line, columns, "impressions"));
  const clicks = readCount(cell(line, columns, "clicks"));
  const conversions = readCount(cell(line, columns, "conversions"));
  const day = readDay(cell(line, columns, "date"));

  if (budget === "bad" || spend === "bad" || impressions === "bad" || clicks === "bad" || conversions === "bad" || day === "bad") {
    return null;
  }

  return {
    name,
    status,
    dailyBudgetCents: budget,
    day,
    impressions,
    clicks,
    spendCents: spend,
    conversions,
    extra: readExtra(line, columns),
  };
}

function readExtra(line: string[], columns: string[]): Record<string, string> {
  const extra: Record<string, string> = {};
  columns.forEach((column, index) => {
    if (!column || CORE.has(column) || extra[column]) return;
    const value = (line[index] ?? "").trim();
    if (!value) return;
    extra[column] = value.slice(0, 500);
  });
  return extra;
}

function cell(line: string[], columns: string[], name: string): string {
  const index = columns.indexOf(name);
  return index < 0 ? "" : (line[index] ?? "").trim();
}

function readStatus(value: string): CampaignStatus | null {
  const normalized = value.toLowerCase();
  return STATUSES.has(normalized as CampaignStatus) ? (normalized as CampaignStatus) : null;
}

function readDay(value: string): string | "bad" | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "bad";
}

function readCount(value: string): number | "bad" | null {
  if (!value) return null;
  const number = Number(value.replaceAll(",", ""));
  if (!Number.isInteger(number) || number < 0 || number > 1_000_000_000) return "bad";
  return number;
}

function readMoney(value: string, currency: string, rates: UsdRates | undefined): number | "bad" | null {
  if (!value) return null;
  const number = Number(value.replaceAll(",", "").replace(/[$€£]/g, ""));
  if (!Number.isFinite(number) || number < 0) return "bad";
  const cents = Math.round(number * 100);
  if (cents > 1_000_000_000) return "bad";
  if (currency === "USD") return cents;
  const rate = rates?.[currency as keyof UsdRates];
  if (!rate) return "bad";
  return Math.round(cents / rate);
}

export function mergeSheetGrids(grids: string[][][]): string[][] {
  const tables = grids.filter((grid) => grid.length > 1 && grid[0]?.some((cell) => cell.trim() !== ""));
  if (tables.length === 0) return grids[0] ?? [];
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const table of tables) {
    for (const cell of table[0] ?? []) {
      const key = canonical(cell);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      headers.push(cell.trim());
    }
  }
  const headerKeys = headers.map((cell) => canonical(cell));
  const rows = [headers];
  for (const table of tables) {
    const index = new Map((table[0] ?? []).map((cell, position) => [canonical(cell), position]));
    for (const line of table.slice(1)) {
      if (line.every((cell) => cell.trim() === "")) continue;
      rows.push(headerKeys.map((key) => line[index.get(key) ?? -1] ?? ""));
    }
  }
  return rows;
}

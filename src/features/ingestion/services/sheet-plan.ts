import { MAX_DAILY_BUDGET_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/features/campaigns/services/caps";
import type { Campaign, DailyMetric, TargetSnapshot } from "@/lib/domain";
import type { SheetRow } from "@/features/ingestion/services/sheet-rows";

export interface SheetArrival {
  name: string;
  dailyBudgetCents: number;
  pausedInSheet: boolean;
}

export interface SheetPlan {
  ambiguous: string[];
  arrivals: SheetArrival[];
  needsBudget: string[];
  metrics: DailyMetric[];
  targets: TargetSnapshot[];
  outOfRange: string[];
}

export function planSheetUpdates(campaigns: Campaign[], rows: SheetRow[], workspaceId: string): SheetPlan {
  const ambiguous = new Set<string>();
  const outOfRange = new Set<string>();
  const needsBudget = new Set<string>();
  const arrivals = new Map<string, SheetArrival>();
  const targets = new Map<string, TargetSnapshot>();
  const metrics: DailyMetric[] = [];

  for (const row of rows) {
    const matches = campaigns.filter(
      (campaign) => campaign.workspaceId === workspaceId && campaign.name.toLowerCase() === row.name.toLowerCase(),
    );
    if (matches.length > 1) {
      ambiguous.add(row.name);
      continue;
    }
    const campaign = matches[0];
    if (!campaign) {
      const arrival = nextArrival(row);
      if (arrival === "budget") needsBudget.add(row.name);
      else if (arrival === "range") outOfRange.add(row.name);
      else arrivals.set(row.name.toLowerCase(), arrival);
      continue;
    }
    if (row.day && row.impressions !== null && row.clicks !== null && row.spendCents !== null && row.conversions !== null) {
      metrics.push({
        campaignId: campaign.id,
        day: row.day,
        impressions: row.impressions,
        clicks: row.clicks,
        spendCents: row.spendCents,
        conversions: row.conversions,
      });
    }
    const change = nextTarget(campaign, row);
    if (change === "range") outOfRange.add(campaign.name);
    else if (change) targets.set(campaign.id, change);
  }

  return {
    ambiguous: [...ambiguous],
    arrivals: [...arrivals.values()],
    needsBudget: [...needsBudget],
    metrics,
    targets: [...targets.values()],
    outOfRange: [...outOfRange],
  };
}

function nextArrival(row: SheetRow): SheetArrival | "budget" | "range" {
  if (row.dailyBudgetCents === null) return "budget";
  if (row.dailyBudgetCents < MIN_DAILY_BUDGET_CENTS || row.dailyBudgetCents > MAX_DAILY_BUDGET_CENTS) return "range";
  return {
    name: row.name,
    dailyBudgetCents: row.dailyBudgetCents,
    pausedInSheet: row.status === "paused",
  };
}

function extraNote(row: SheetRow): string {
  const keys = Object.keys(row.extra);
  if (keys.length === 0) return "From the Google Sheet";
  return `From the Google Sheet. Also has ${keys.slice(0, 6).join(", ")}.`;
}

function nextTarget(campaign: Campaign, row: SheetRow): TargetSnapshot | "range" | null {
  const afterStatus = row.status ?? campaign.status;
  const afterBudgetCents = row.dailyBudgetCents ?? campaign.dailyBudgetCents;
  if (afterStatus === campaign.status && afterBudgetCents === campaign.dailyBudgetCents) return null;
  if (campaign.status === "ended") return null;
  if (afterBudgetCents < MIN_DAILY_BUDGET_CENTS || afterBudgetCents > MAX_DAILY_BUDGET_CENTS) return "range";
  return {
    campaignId: campaign.id,
    name: campaign.name,
    version: campaign.version,
    beforeStatus: campaign.status,
    afterStatus,
    beforeBudgetCents: campaign.dailyBudgetCents,
    afterBudgetCents,
    note: extraNote(row),
  };
}

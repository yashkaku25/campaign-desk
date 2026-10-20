/**
 * Turns desk campaigns and one live simulation into Ads Manager table rows.
 * Pure data — no writes, no Gemini.
 */

import type { SimMetricStrip } from "@/features/practice/services/sim-metrics";
import type { MomentCounts } from "@/features/practice/services/moments";

export type AdsLevel = "campaigns" | "ad_sets" | "ads";

export type DeliveryFilter = "all" | "active" | "had_delivery";

export interface DeskCampaignForAds {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  dailyBudgetCents: number;
}

export interface SimulationRowSeed {
  /** Stable id for the simulated campaign tree. */
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  on: boolean;
  attribution: string;
  dailyBudgetCents: number;
  /** Desk campaign used for sheet numbers, when any. */
  deskCampaignId: string | null;
}

export interface AdsManagerRow {
  id: string;
  level: AdsLevel;
  parentId: string | null;
  name: string;
  on: boolean;
  delivery: string;
  attribution: string;
  results: number | null;
  costPerResultCents: number | null;
  budgetCents: number | null;
  budgetKind: "daily" | "lifetime" | "none";
  spendCents: number | null;
  objectiveName: string | null;
  source: "desk" | "simulation";
  deskCampaignId: string | null;
  hasDelivery: boolean;
  isSimulating: boolean;
}

export interface BuildAdsRowsInput {
  campaigns: DeskCampaignForAds[];
  simulation: SimulationRowSeed | null;
  /** Live strip while a week is playing. */
  strip: SimMetricStrip | null;
  counts: MomentCounts | null;
  playing: boolean;
}

/** Builds Campaign / Ad set / Ad rows for the three Ads Manager tabs. */
export function buildAdsManagerRows(input: BuildAdsRowsInput): AdsManagerRow[] {
  const rows: AdsManagerRow[] = [];

  for (const campaign of input.campaigns) {
    const hasDelivery = campaign.impressions > 0 || campaign.spendCents > 0;
    const cpr =
      campaign.conversions > 0 ? Math.round(campaign.spendCents / campaign.conversions) : null;
    const delivery = deliveryLabelForDesk(campaign);
    const campaignId = `desk-c-${campaign.id}`;
    const adSetId = `desk-as-${campaign.id}`;
    const adId = `desk-ad-${campaign.id}`;

    rows.push({
      id: campaignId,
      level: "campaigns",
      parentId: null,
      name: campaign.name,
      on: campaign.impressions > 0 || campaign.spendCents > 0,
      delivery,
      attribution: "7-day click, 1-day view",
      results: campaign.conversions > 0 ? campaign.conversions : hasDelivery ? 0 : null,
      costPerResultCents: cpr,
      budgetCents: campaign.dailyBudgetCents,
      budgetKind: "daily",
      spendCents: hasDelivery ? campaign.spendCents : null,
      objectiveName: null,
      source: "desk",
      deskCampaignId: campaign.id,
      hasDelivery,
      isSimulating: false,
    });

    rows.push({
      id: adSetId,
      level: "ad_sets",
      parentId: campaignId,
      name: `${campaign.name} — ad set`,
      on: campaign.impressions > 0 || campaign.spendCents > 0,
      delivery,
      attribution: "7-day click, 1-day view",
      results: campaign.conversions > 0 ? campaign.conversions : hasDelivery ? 0 : null,
      costPerResultCents: cpr,
      budgetCents: campaign.dailyBudgetCents,
      budgetKind: "daily",
      spendCents: hasDelivery ? campaign.spendCents : null,
      objectiveName: null,
      source: "desk",
      deskCampaignId: campaign.id,
      hasDelivery,
      isSimulating: false,
    });

    rows.push({
      id: adId,
      level: "ads",
      parentId: adSetId,
      name: `${campaign.name} — ad`,
      on: campaign.impressions > 0 || campaign.spendCents > 0,
      delivery,
      attribution: "7-day click, 1-day view",
      results: campaign.conversions > 0 ? campaign.conversions : hasDelivery ? 0 : null,
      costPerResultCents: cpr,
      budgetCents: null,
      budgetKind: "none",
      spendCents: hasDelivery ? campaign.spendCents : null,
      objectiveName: null,
      source: "desk",
      deskCampaignId: campaign.id,
      hasDelivery,
      isSimulating: false,
    });
  }

  if (input.simulation) {
    rows.push(...simulationTree(input.simulation, input.strip, input.counts, input.playing));
  }

  return rows;
}

function simulationTree(
  seed: SimulationRowSeed,
  strip: SimMetricStrip | null,
  counts: MomentCounts | null,
  playing: boolean,
): AdsManagerRow[] {
  const campaignId = `${seed.id}-c`;
  const adSetId = `${seed.id}-as`;
  const adId = `${seed.id}-ad`;
  const delivery = deliveryLabelForSim(strip, counts, playing, seed.on);
  const hasDelivery =
    Boolean(strip?.impressions && strip.impressions > 0) ||
    Boolean(counts && (counts.stopped > 0 || counts.clicked > 0 || counts.bought > 0));
  const results = strip?.results ?? null;
  const cpr = strip?.costPerResultCents ?? null;

  const spendCents =
    strip && strip.impressions !== null
      ? estimateSimSpend(seed.dailyBudgetCents, counts, playing)
      : null;

  const base = {
    on: seed.on,
    delivery,
    attribution: seed.attribution,
    results,
    costPerResultCents: cpr,
    spendCents,
    objectiveName: seed.objectiveName,
    source: "simulation" as const,
    deskCampaignId: seed.deskCampaignId,
    hasDelivery,
    isSimulating: playing || hasDelivery,
  };

  return [
    {
      ...base,
      id: campaignId,
      level: "campaigns",
      parentId: null,
      name: seed.name,
      budgetCents: seed.dailyBudgetCents,
      budgetKind: "daily",
    },
    {
      ...base,
      id: adSetId,
      level: "ad_sets",
      parentId: campaignId,
      name: `${seed.name} — ad set`,
      budgetCents: seed.dailyBudgetCents,
      budgetKind: "daily",
    },
    {
      ...base,
      id: adId,
      level: "ads",
      parentId: adSetId,
      name: `${seed.name} — ad`,
      budgetCents: null,
      budgetKind: "none",
    },
  ];
}

function estimateSimSpend(
  dailyBudgetCents: number,
  counts: MomentCounts | null,
  playing: boolean,
): number {
  if (!counts) return playing ? Math.round(dailyBudgetCents * 0.08) : 0;
  const weight =
    counts.stopped * 0.4 +
    counts.scrolled * 0.2 +
    counts.clicked * 1.2 +
    counts.bought * 2 +
    counts.hid * 0.3 +
    counts.bounced * 0.5;
  const fraction = Math.min(0.95, 0.06 + weight / 40);
  return Math.round(dailyBudgetCents * 7 * fraction);
}

function deliveryLabelForDesk(campaign: DeskCampaignForAds): string {
  if (campaign.impressions === 0 && campaign.spendCents === 0) return "Not delivering";
  if (campaign.conversions > 0 && campaign.conversions < 50) return "Learning";
  if (campaign.impressions > 0) return "Active";
  return "Not delivering";
}

function deliveryLabelForSim(
  strip: SimMetricStrip | null,
  counts: MomentCounts | null,
  playing: boolean,
  on: boolean,
): string {
  if (!on) return "Off";
  if (playing) {
    if (strip?.learning === "learning_limited") return "Learning limited";
    if (strip?.learning === "learning" || (counts && counts.bought < 3)) return "Learning";
    return "Active";
  }
  if (!strip || strip.impressions === null) return "Scheduled";
  if (strip.learning === "learning_limited") return "Learning limited";
  if (strip.learning === "learning") return "Learning";
  if (strip.learning === "stable") return "Active";
  return "Active";
}

/** Filters rows for the active tab and chip. */
export function filterAdsManagerRows(
  rows: AdsManagerRow[],
  level: AdsLevel,
  filter: DeliveryFilter,
  query: string,
): AdsManagerRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (row.level !== level) return false;
    if (filter === "active" && !(row.on && row.delivery !== "Not delivering" && row.delivery !== "Off")) {
      return false;
    }
    if (filter === "had_delivery" && !row.hasDelivery) return false;
    if (!needle) return true;
    const hay = [
      row.name,
      row.delivery,
      row.attribution,
      row.objectiveName ?? "",
      row.deskCampaignId ?? "",
      row.id,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

/** Last 30 days label in Ads Manager style, using a fixed “today”. */
export function last30DaysLabel(today: Date = new Date()): string {
  const end = startOfUtcDay(today);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return `Last 30 days: ${formatShortDay(start)} - ${formatShortDay(end)}`;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatShortDay(date: Date): string {
  const day = date.getUTCDate();
  const month = SHORT_MONTHS[date.getUTCMonth()] ?? "Jan";
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

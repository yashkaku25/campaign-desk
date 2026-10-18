import type { CampaignSummary, TargetSnapshot } from "@/lib/domain";
import type { CampaignFilter } from "@/lib/ai/schemas";
import { MAX_DAILY_BUDGET_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/features/campaigns/services/caps";
import { formatDollars } from "@/lib/money";

/**
 * Turns a model filter into exact campaigns.
 * The model never supplies ids. Zero impressions never match a CTR filter.
 */
export function resolveTargets(
  campaigns: CampaignSummary[],
  filter: CampaignFilter,
): CampaignSummary[] {
  return campaigns.filter((campaign) => matches(campaign, filter));
}

export function planReallocation(
  campaigns: CampaignSummary[],
  from: CampaignFilter,
  to: CampaignFilter,
  shiftCents: number,
  money: (cents: number) => string = formatDollars,
): { ok: true; targets: TargetSnapshot[]; summary: string } | { ok: false; reason: string } {
  if (!Number.isInteger(shiftCents) || shiftCents < MIN_DAILY_BUDGET_CENTS) {
    return { ok: false, reason: `Move at least ${money(MIN_DAILY_BUDGET_CENTS)} of daily budget.` };
  }
  if (shiftCents > MAX_DAILY_BUDGET_CENTS) {
    return { ok: false, reason: `One move can shift at most ${money(MAX_DAILY_BUDGET_CENTS)} a day.` };
  }

  const sources = resolveTargets(campaigns, from).filter((campaign) => campaign.status === "active");
  const sourceIds = new Set(sources.map((campaign) => campaign.id));
  const destinations = resolveTargets(campaigns, to).filter(
    (campaign) => campaign.status === "active" && !sourceIds.has(campaign.id),
  );

  if (sources.length === 0) {
    return { ok: false, reason: "No active campaign can give budget. Paused and ended campaigns stay as they are." };
  }
  if (destinations.length === 0) {
    return { ok: false, reason: "No active campaign can receive that budget." };
  }
  if (sources.length + destinations.length > 25) {
    return { ok: false, reason: "That move touches more than 25 campaigns. Narrow the two groups." };
  }

  const spare = sources
    .map((campaign) => ({ campaign, room: campaign.dailyBudgetCents - MIN_DAILY_BUDGET_CENTS }))
    .filter((item) => item.room > 0);
  const totalRoom = spare.reduce((sum, item) => sum + item.room, 0);
  if (spare.length === 0 || totalRoom < shiftCents) {
    return { ok: false, reason: `Those campaigns do not have enough daily budget above ${money(MIN_DAILY_BUDGET_CENTS)} to move that amount.` };
  }

  const takes = spare.map((item) => ({
    ...item,
    take: Math.floor((shiftCents * item.room) / totalRoom),
  }));
  let leftover = shiftCents - takes.reduce((sum, item) => sum + item.take, 0);
  for (const item of [...takes].sort((left, right) => right.room - left.room)) {
    if (leftover === 0) break;
    const room = item.room - item.take;
    const add = Math.min(room, leftover);
    item.take += add;
    leftover -= add;
  }

  const orderedDestinations = [...destinations].sort((left, right) => left.name.localeCompare(right.name));
  const base = Math.floor(shiftCents / orderedDestinations.length);
  let remainder = shiftCents % orderedDestinations.length;
  const adds = orderedDestinations.map((campaign) => {
    const add = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return { campaign, add };
  });
  if (adds.some((item) => item.campaign.dailyBudgetCents + item.add > MAX_DAILY_BUDGET_CENTS)) {
    return { ok: false, reason: `A receiving campaign would go over the ${money(MAX_DAILY_BUDGET_CENTS)} daily cap.` };
  }

  const targets: TargetSnapshot[] = [
    ...takes
      .filter((item) => item.take > 0)
      .map((item) => snapshot(item.campaign, item.campaign.dailyBudgetCents - item.take, `Gives ${money(item.take)}`)),
    ...adds.map((item) => snapshot(item.campaign, item.campaign.dailyBudgetCents + item.add, `Receives ${money(item.add)}`)),
  ];
  const fromNames = takes.filter((item) => item.take > 0).map((item) => item.campaign.name).join(", ");
  const toNames = adds.map((item) => item.campaign.name).join(", ");
  return {
    ok: true,
    targets,
    summary: `Move ${money(shiftCents)} a day from ${fromNames} to ${toNames}. Confirm this set.`,
  };
}

function snapshot(campaign: CampaignSummary, afterBudgetCents: number, note: string): TargetSnapshot {
  return {
    campaignId: campaign.id,
    name: campaign.name,
    version: campaign.version,
    beforeStatus: campaign.status,
    afterStatus: campaign.status,
    beforeBudgetCents: campaign.dailyBudgetCents,
    afterBudgetCents,
    note,
  };
}

function matches(campaign: CampaignSummary, filter: CampaignFilter): boolean {
  if (filter.ctrBelow !== undefined) {
    if (campaign.ctr === null || campaign.ctr >= filter.ctrBelow) return false;
  }
  if (filter.ctrAbove !== undefined) {
    if (campaign.ctr === null || campaign.ctr <= filter.ctrAbove) return false;
  }
  if (filter.status !== undefined && campaign.status !== filter.status) return false;
  if (filter.nameContains) {
    if (!campaign.name.toLowerCase().includes(filter.nameContains.toLowerCase())) return false;
  }
  if (filter.names && filter.names.length > 0) {
    const wanted = filter.names.map((name) => name.toLowerCase());
    if (!wanted.includes(campaign.name.toLowerCase())) return false;
  }
  return true;
}

import type { CampaignSummary, CreateSnapshot, TargetSnapshot } from "@/lib/domain";
import { filterIsEmpty, type MutationAction } from "@/lib/ai/schemas";
import { formatDollars } from "@/lib/money";
import { explainCap } from "@/features/campaigns/services/caps";
import { planReallocation, resolveTargets } from "@/features/campaigns/services/resolve-targets";

export interface ActionPlan {
  targets: TargetSnapshot[];
  create: CreateSnapshot | null;
  summary: string;
}

export function planMutation(
  campaigns: CampaignSummary[],
  action: MutationAction,
  money: (cents: number) => string = formatDollars,
): { ok: true; plan: ActionPlan } | { ok: false; reason: string } {
  if (action.type === "create_campaign") {
    const cap = explainCap({ targetCount: 1, budgetCents: action.dailyBudgetCents });
    if (cap) return { ok: false, reason: cap };
    const name = action.name.trim();
    if (!name) return { ok: false, reason: "A new campaign needs a name." };
    const strategyNote = action.strategyNote?.trim() || null;
    const expectedOutcome = action.expectedOutcome?.trim() || null;
    const extras = [
      strategyNote ? `Strategy: ${strategyNote}` : null,
      expectedOutcome ? `Expect: ${expectedOutcome}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return {
      ok: true,
      plan: {
        targets: [],
        create: {
          name,
          dailyBudgetCents: action.dailyBudgetCents,
          status: "active",
          strategyNote,
          expectedOutcome,
        },
        summary: extras
          ? `Create ${name} with a daily budget of ${money(action.dailyBudgetCents)}. ${extras}`
          : `Create ${name} with a daily budget of ${money(action.dailyBudgetCents)}.`,
      },
    };
  }

  if (action.type === "reallocate_budget") {
    const moved = planReallocation(campaigns, action.from, action.to, action.shiftCents, money);
    if (!moved.ok) return moved;
    return { ok: true, plan: { targets: moved.targets, create: null, summary: moved.summary } };
  }

  if (filterIsEmpty(action.filter)) {
    return {
      ok: false,
      reason: "Say which campaigns. Try a CTR limit or a campaign name.",
    };
  }

  const matched = resolveTargets(campaigns, action.filter);
  const ended = matched.filter((campaign) => campaign.status === "ended");
  const open = matched.filter((campaign) => campaign.status !== "ended");

  if (open.length === 0) {
    if (ended.length > 0) {
      return {
        ok: false,
        reason: "Those campaigns have ended, so this change would not touch them.",
      };
    }
    return { ok: false, reason: "No campaign matches that. Nothing was queued." };
  }

  const cap = explainCap({
    targetCount: open.length,
    budgetCents: action.type === "set_daily_budget" ? action.dailyBudgetCents : undefined,
  });
  if (cap) return { ok: false, reason: cap };

  const targets = open.map((campaign) => toSnapshot(campaign, action));
  const endedNote =
    ended.length > 0 ? ` Skipped ${ended.map((campaign) => campaign.name).join(", ")} because they have ended.` : "";

  return {
    ok: true,
    plan: {
      targets,
      create: null,
      summary: `${summaryFor(action, targets, money)}${targets.length > 1 ? ". Confirm this set" : ""}.${endedNote}`,
    },
  };
}

function toSnapshot(campaign: CampaignSummary, action: MutationAction): TargetSnapshot {
  const beforeStatus = campaign.status;
  const beforeBudgetCents = campaign.dailyBudgetCents;
  let afterStatus = beforeStatus;
  let afterBudgetCents = beforeBudgetCents;
  let note: string | null = null;

  if (action.type === "pause") {
    afterStatus = "paused";
    if (beforeStatus === "paused") note = "Already paused";
  } else if (action.type === "resume") {
    afterStatus = "active";
    if (beforeStatus === "active") note = "Already running";
    if (beforeStatus === "draft") note = "Draft stays a draft until you launch it by hand";
    if (beforeStatus === "draft") afterStatus = "draft";
  } else if (action.type === "set_daily_budget") {
    afterBudgetCents = action.dailyBudgetCents;
    if (beforeBudgetCents === afterBudgetCents) note = "Budget already matches";
  }

  return {
    campaignId: campaign.id,
    name: campaign.name,
    version: campaign.version,
    beforeStatus,
    afterStatus,
    beforeBudgetCents,
    afterBudgetCents,
    note,
  };
}

function summaryFor(action: MutationAction, targets: TargetSnapshot[], money: (cents: number) => string): string {
  const names = targets.map((target) => target.name).join(", ");
  if (action.type === "pause") return `Pause ${names}`;
  if (action.type === "resume") return `Resume ${names}`;
  if (action.type === "set_daily_budget") {
    return `Set the daily budget for ${names} to ${money(action.dailyBudgetCents)}`;
  }
  return `Update ${names}`;
}

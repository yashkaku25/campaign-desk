import { isStrong, isWeak } from "@/lib/ai/context";
import type { CampaignAction } from "@/lib/ai/schemas";
import type { CampaignSummary } from "@/lib/domain";

/** Same ceiling as caps.ts, keep in sync. */
const MAX_DAILY_BUDGET_CENTS = 10_000_000;

const OPTIMIZE =
  /\b(optimize|optimise|fix|improve|manage|clean\s*up|take\s+over|do\s+what\s+you\s+would|what\s+would\s+you\s+do|run\s+the\s+account|make\s+it\s+better)\b/i;

/** True when the person asks the marketer to run performance without naming one verb. */
export function asksToManagePerformance(text: string): boolean {
  return OPTIMIZE.test(text);
}

/**
 * Rule-based performance moves when Gemini is offline.
 * Same allowlist as the model: filters only, never campaign ids.
 */
export function suggestPerformanceActions(campaigns: CampaignSummary[]): CampaignAction[] {
  const weak = campaigns.filter((campaign) => isWeak(campaign));
  const strong = campaigns.filter((campaign) => isStrong(campaign));
  const active = campaigns.filter((campaign) => campaign.status === "active");

  if (weak.length > 0 && strong.length > 0) {
    return [
      {
        type: "reallocate_budget",
        from: { ctrBelow: 0.02, status: "active" },
        to: { ctrAbove: 0.03, status: "active" },
        shiftCents: 2000,
      },
    ];
  }

  if (weak.length > 0) {
    const named = weak.slice(0, 5).map((campaign) => campaign.name);
    return [
      {
        type: "pause",
        filter: named.length === 1 ? { names: named } : { ctrBelow: 0.02, status: "active" },
      },
    ];
  }

  if (strong.length === 1 && strong[0]) {
    const nextBudget = Math.min(MAX_DAILY_BUDGET_CENTS, Math.round(strong[0].dailyBudgetCents * 1.2));
    if (nextBudget > strong[0].dailyBudgetCents) {
      return [
        {
          type: "set_daily_budget",
          filter: { names: [strong[0].name] },
          dailyBudgetCents: nextBudget,
        },
      ];
    }
  }

  if (active.length === 0) {
    return [
      {
        type: "answer",
        message:
          "No active campaigns are delivering. Resume a paused set or create a campaign with a daily budget, then Approve.",
      },
    ];
  }

  return [
    {
      type: "answer",
      message:
        "Nothing looks weak enough for a hard pause. Ask why spend moved, or name a budget change on one campaign.",
    },
  ];
}

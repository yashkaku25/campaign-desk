import { describe, expect, it } from "vitest";

import { asksToManagePerformance, suggestPerformanceActions } from "@/lib/ai/suggest-performance";
import type { CampaignSummary } from "@/lib/domain";
import { WORKSPACE_ID } from "@/lib/domain";

function campaign(partial: Partial<CampaignSummary> & { name: string }): CampaignSummary {
  return {
    id: partial.id ?? "33333333-3333-4333-8333-333333333301",
    workspaceId: WORKSPACE_ID,
    name: partial.name,
    status: partial.status ?? "active",
    dailyBudgetCents: partial.dailyBudgetCents ?? 5000,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    impressions: partial.impressions ?? 10_000,
    clicks: partial.clicks ?? 50,
    spendCents: partial.spendCents ?? 4000,
    conversions: partial.conversions ?? 0,
    ctr: partial.ctr ?? (partial.impressions === 0 ? null : (partial.clicks ?? 50) / (partial.impressions ?? 10_000)),
  };
}

describe("suggestPerformanceActions", () => {
  it("hears optimize language", () => {
    expect(asksToManagePerformance("Optimize my campaigns")).toBe(true);
    expect(asksToManagePerformance("Pause Spring Launch")).toBe(false);
  });

  it("moves budget from weak to strong when both exist", () => {
    const actions = suggestPerformanceActions([
      campaign({ name: "Weak Set", impressions: 12_000, clicks: 24, spendCents: 5000, conversions: 0, ctr: 0.002 }),
      campaign({ name: "Strong Set", impressions: 8_000, clicks: 320, spendCents: 4000, conversions: 12, ctr: 0.04 }),
    ]);
    expect(actions[0]?.type).toBe("reallocate_budget");
  });

  it("pauses when only weak sets exist", () => {
    const actions = suggestPerformanceActions([
      campaign({ name: "Tired", impressions: 12_000, clicks: 24, spendCents: 5000, conversions: 0, ctr: 0.002 }),
    ]);
    expect(actions[0]?.type).toBe("pause");
  });
});

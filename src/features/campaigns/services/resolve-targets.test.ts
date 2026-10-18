import { describe, expect, it } from "vitest";

import type { CampaignSummary } from "@/lib/domain";
import { resolveTargets } from "@/features/campaigns/services/resolve-targets";

function campaign(overrides: Partial<CampaignSummary>): CampaignSummary {
  return {
    id: overrides.id ?? "1",
    workspaceId: "workspace",
    name: overrides.name ?? "Spring Launch",
    status: overrides.status ?? "active",
    dailyBudgetCents: 12_000,
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    impressions: overrides.impressions ?? 1000,
    clicks: overrides.clicks ?? 10,
    spendCents: 1000,
    conversions: 2,
    ctr: overrides.ctr === undefined ? 0.01 : overrides.ctr,
  };
}

describe("resolveTargets", () => {
  const rows = [
    campaign({ id: "warm", name: "Retargeting Warm", ctr: 0.012 }),
    campaign({ id: "cold", name: "Prospecting Cold", ctr: 0.008 }),
    campaign({ id: "spring", name: "Spring Launch", ctr: 0.041 }),
    campaign({ id: "holdout", name: "Holdout Creative", impressions: 0, clicks: 0, ctr: null }),
    campaign({ id: "twin-a", name: "Brand Video", ctr: 0.03 }),
    campaign({ id: "twin-b", name: "Brand Video", ctr: 0.01 }),
  ];

  it("skips campaigns with no impressions when filtering by CTR", () => {
    const matches = resolveTargets(rows, { ctrBelow: 0.02 });
    expect(matches.map((item) => item.id)).toEqual(["warm", "cold", "twin-b"]);
  });

  it("does not treat an exact CTR as under the limit", () => {
    const matches = resolveTargets([campaign({ id: "edge", ctr: 0.02 })], { ctrBelow: 0.02 });
    expect(matches).toHaveLength(0);
  });

  it("returns every campaign that shares a name", () => {
    const matches = resolveTargets(rows, { names: ["Brand Video"] });
    expect(matches.map((item) => item.id)).toEqual(["twin-a", "twin-b"]);
  });
});

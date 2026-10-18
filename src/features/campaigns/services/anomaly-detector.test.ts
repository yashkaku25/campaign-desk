import { describe, expect, it } from "vitest";

import { findAnomalies } from "@/features/campaigns/services/anomaly-detector";
import type { CampaignSummary, DailyMetric } from "@/lib/domain";

const campaign = {
  id: "c1",
  workspaceId: "w",
  name: "Spring Launch",
  status: "active",
  dailyBudgetCents: 12000,
  version: 1,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  impressions: 0,
  clicks: 0,
  spendCents: 0,
  conversions: 0,
  ctr: null,
} satisfies CampaignSummary;

function day(offset: number, clicks: number, spendCents: number): DailyMetric {
  return {
    campaignId: "c1",
    day: `2026-10-${String(offset).padStart(2, "0")}`,
    impressions: 1000,
    clicks,
    spendCents,
    conversions: 1,
  };
}

describe("findAnomalies", () => {
  it("asks to pause a campaign whose CTR just fell under 2%", () => {
    const metrics = [
      ...[1, 2, 3, 4, 5, 6, 7].map((offset) => day(offset, 40, 1000)),
      day(8, 10, 1000),
      day(9, 10, 1000),
    ];
    const alerts = findAnomalies([campaign], metrics);
    expect(alerts[0]?.command).toBe('Pause "Spring Launch"');
    expect(alerts[0]?.text).toMatch(/under 2%/);
  });

  it("flags spend that jumps against the daily rate of the previous week", () => {
    const metrics = [
      ...[1, 2, 3, 4, 5, 6, 7].map((offset) => day(offset, 40, 1000)),
      day(8, 40, 2000),
      day(9, 40, 2000),
    ];
    const alerts = findAnomalies([campaign], metrics);
    expect(alerts[0]?.text).toMatch(/Spend jumped/);
  });

  it("stays quiet when the last two days are only a little higher", () => {
    const metrics = [
      ...[1, 2, 3, 4, 5, 6, 7].map((offset) => day(offset, 40, 1000)),
      day(8, 40, 1500),
      day(9, 40, 1500),
    ];
    expect(findAnomalies([campaign], metrics)).toEqual([]);
  });

  it("stays quiet when the last two days match the week", () => {
    const metrics = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((offset) => day(offset, 40, 1000));
    expect(findAnomalies([campaign], metrics)).toEqual([]);
  });
});

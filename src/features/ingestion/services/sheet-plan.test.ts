import { describe, expect, it } from "vitest";

import { planSheetUpdates } from "@/features/ingestion/services/sheet-plan";
import type { Campaign } from "@/lib/domain";
import type { SheetRow } from "@/features/ingestion/services/sheet-rows";

const spring: Campaign = {
  id: "c1",
  workspaceId: "w",
  name: "Spring Launch",
  status: "active",
  dailyBudgetCents: 12000,
  version: 1,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const twin: Campaign = { ...spring, id: "c2" };

function row(patch: Partial<SheetRow> = {}): SheetRow {
  return {
    name: "Spring Launch",
    status: null,
    dailyBudgetCents: null,
    day: "2026-10-16",
    impressions: 1000,
    clicks: 40,
    spendCents: 4050,
    conversions: 8,
    extra: {},
    ...patch,
  };
}

describe("planSheetUpdates", () => {
  it("does not pick one campaign when two share a name", () => {
    const plan = planSheetUpdates([spring, twin], [row({ status: "paused" })], "w");
    expect(plan.ambiguous).toEqual(["Spring Launch"]);
    expect(plan.targets).toEqual([]);
  });

  it("queues a status change and keeps the metric", () => {
    const plan = planSheetUpdates([spring], [row({ status: "paused" })], "w");
    expect(plan.targets[0]?.afterStatus).toBe("paused");
    expect(plan.metrics).toHaveLength(1);
  });

  it("queues a new sheet name when it has a daily budget", () => {
    const plan = planSheetUpdates([], [row({ name: "Holiday Push", dailyBudgetCents: 8000, status: "paused" })], "w");
    expect(plan.arrivals).toEqual([{ name: "Holiday Push", dailyBudgetCents: 8000, pausedInSheet: true }]);
    expect(plan.metrics).toEqual([]);
  });

  it("asks for a daily budget before adding a new name", () => {
    const plan = planSheetUpdates([], [row({ name: "Holiday Push", dailyBudgetCents: null })], "w");
    expect(plan.needsBudget).toEqual(["Holiday Push"]);
    expect(plan.arrivals).toEqual([]);
  });

  it("skips a budget outside the daily range", () => {
    const plan = planSheetUpdates([spring], [row({ dailyBudgetCents: 50 })], "w");
    expect(plan.outOfRange).toEqual(["Spring Launch"]);
    expect(plan.targets).toEqual([]);
  });
});

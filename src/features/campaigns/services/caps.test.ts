import { describe, expect, it } from "vitest";

import { explainCap, MAX_DAILY_BUDGET_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/features/campaigns/services/caps";

describe("explainCap", () => {
  it("refuses more than 25 campaigns", () => {
    expect(explainCap({ targetCount: 26 })).toMatch(/25/);
  });

  it("allows a budget from $1 to $100,000", () => {
    expect(explainCap({ targetCount: 1, budgetCents: MIN_DAILY_BUDGET_CENTS })).toBeNull();
    expect(explainCap({ targetCount: 1, budgetCents: MAX_DAILY_BUDGET_CENTS })).toBeNull();
  });

  it("refuses a budget outside that range", () => {
    expect(explainCap({ targetCount: 1, budgetCents: MIN_DAILY_BUDGET_CENTS - 1 })).toMatch(/1\.00 \$/);
    expect(explainCap({ targetCount: 1, budgetCents: MAX_DAILY_BUDGET_CENTS + 1 })).toMatch(/100,000\.00 \$/);
  });
});

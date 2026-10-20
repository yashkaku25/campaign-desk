import { describe, expect, it } from "vitest";

import { seedAccountFromDesk } from "@/features/practice/meta/seed-from-desk";

describe("seedAccountFromDesk", () => {
  it("builds campaigns, ad sets, and ads from desk rows", () => {
    const account = seedAccountFromDesk([
      {
        id: "33333333-3333-4333-8333-333333333301",
        name: "Spring Launch",
        impressions: 8000,
        clicks: 200,
        spendCents: 5000,
        conversions: 10,
        dailyBudgetCents: 12000,
        status: "active",
        headline: "Quiet dryer",
        primaryText: "No roar.",
        product: "hair dryer",
      },
    ]);
    expect(account.campaigns).toHaveLength(1);
    expect(account.adSets).toHaveLength(1);
    expect(account.ads).toHaveLength(1);
    expect(account.ads[0]?.creatives).toHaveLength(2);
    expect(account.campaigns[0]?.name).toBe("Spring Launch");
    expect(account.ads[0]?.creatives[0]?.headline).toBe("Quiet dryer");
  });
});

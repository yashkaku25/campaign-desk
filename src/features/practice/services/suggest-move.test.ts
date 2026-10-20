import { describe, expect, it } from "vitest";

import { runPractice } from "@/features/practice/services/run-practice";
import { suggestMove } from "@/features/practice/services/suggest-move";

describe("suggestMove", () => {
  it("waits while results are still thin", () => {
    const run = runPractice(
      {
        headline: "Quiet hair dryer",
        primaryText: "It dries hair without the roar.",
        hasImage: true,
        hasVideo: false,
        videoHasWords: false,
        product: "hair dryer",
      },
      {
        impressions: 5000,
        clicks: 100,
        spendCents: 4000,
        conversions: 12,
        dailyBudgetCents: 2000,
      },
    );
    const move = suggestMove(run.days, {
      impressions: 5000,
      clicks: 100,
      spendCents: 4000,
      conversions: 12,
      dailyBudgetCents: 2000,
    }, run.prediction, "cold", 7);
    expect(move.what).toBe("Wait.");
  });

  it("shortens a long cart window", () => {
    const run = runPractice(
      {
        headline: "Quiet hair dryer",
        primaryText: "It dries hair without the roar.",
        hasImage: true,
        hasVideo: false,
        videoHasWords: false,
        product: "hair dryer",
      },
      {
        impressions: 20000,
        clicks: 400,
        spendCents: 10000,
        conversions: 80,
        dailyBudgetCents: 2000,
      },
    );
    const move = suggestMove(run.days, {
      impressions: 20000,
      clicks: 400,
      spendCents: 10000,
      conversions: 80,
      dailyBudgetCents: 2000,
    }, run.prediction, "site_cart", 30);
    expect(move.what).toMatch(/Shorten the cart window/);
  });
});

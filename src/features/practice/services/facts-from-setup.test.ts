import { describe, expect, it } from "vitest";

import { factsFromSetup } from "@/features/practice/services/facts-from-setup";
import { DEFAULT_OFFER, type SimulationSetup } from "@/features/practice/services/setup";

function baseSetup(overrides: Partial<SimulationSetup> = {}): SimulationSetup {
  return {
    creative: {
      headline: "Quiet hair dryer",
      primaryText: "It dries hair without the roar.",
      hasImage: true,
      hasVideo: false,
      videoHasWords: false,
      product: "hair dryer",
    },
    offer: { ...DEFAULT_OFFER },
    audience: {
      mode: "advantage",
      audienceKind: "site_cart",
      windowDays: 7,
      interest: "shopping",
      placement: "feed",
      optimizeFor: "purchase",
    },
    numbers: {
      impressions: 10000,
      clicks: 200,
      spendCents: 5000,
      conversions: 10,
      dailyBudgetCents: 2000,
    },
    ...overrides,
  };
}

describe("factsFromSetup", () => {
  it("fires price and proof facts from the offer", () => {
    const facts = factsFromSetup(
      baseSetup({
        offer: {
          ...DEFAULT_OFFER,
          priceCents: 20000,
          compareAtCents: 15000,
          socialProof: "complaint",
          pageQuality: "slow",
        },
      }),
    );
    expect(facts).toEqual(
      expect.arrayContaining(["price_above_normal", "complaint", "slow_page", "clear_picture"]),
    );
  });

  it("fires human context facts", () => {
    const facts = factsFromSetup(
      baseSetup({
        offer: {
          ...DEFAULT_OFFER,
          scrollSpeed: "fast",
          moneyMood: "tight",
          withOthers: true,
          timeOfDay: "late",
        },
      }),
    );
    expect(facts).toEqual(
      expect.arrayContaining(["no_need", "tight_money", "others_can_see", "needs_comfort"]),
    );
  });

  it("tires a long cart window", () => {
    const facts = factsFromSetup(
      baseSetup({
        audience: {
          mode: "original",
          audienceKind: "site_cart",
          windowDays: 30,
          interest: "shopping",
          placement: "feed",
          optimizeFor: "purchase",
        },
      }),
    );
    expect(facts).toContain("seen_too_often");
  });
});

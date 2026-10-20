import { describe, expect, it } from "vitest";

import { DEFAULT_TARGETING } from "@/features/practice/meta/detailed-targeting";
import { factsFromSetup } from "@/features/practice/services/facts-from-setup";
import { runPractice } from "@/features/practice/services/run-practice";
import { DEFAULT_OFFER, type SimulationSetup } from "@/features/practice/services/setup";

function base(partial: Partial<SimulationSetup> = {}): SimulationSetup {
  return {
    creative: {
      headline: "Quiet dryer",
      primaryText: "No roar at home.",
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
      conversions: 8,
      dailyBudgetCents: 4000,
    },
    objective: "sales",
    targeting: { ...DEFAULT_TARGETING },
    ...partial,
  };
}

describe("objective and targeting shape the week", () => {
  it("awareness adds playful / light-intent facts", () => {
    const facts = factsFromSetup(base({ objective: "awareness" }));
    expect(facts).toEqual(expect.arrayContaining(["playful_ad", "looks_like_me"]));
  });

  it("parents demographics push gift-style facts", () => {
    const facts = factsFromSetup(
      base({
        targeting: {
          ...DEFAULT_TARGETING,
          demographics: ["parents_toddlers"],
          interests: ["family"],
        },
      }),
    );
    expect(facts).toEqual(expect.arrayContaining(["buying_for_someone", "shields_someone"]));
  });

  it("sales band sits higher than awareness on results", () => {
    const sales = runPractice(base({ objective: "sales" }));
    const awareness = runPractice(base({ objective: "awareness" }));
    expect(sales.prediction).not.toBeNull();
    expect(awareness.prediction).not.toBeNull();
    expect(sales.prediction!.resultsHigh).toBeGreaterThan(awareness.prediction!.resultsHigh);
  });
});

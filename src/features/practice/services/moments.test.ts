import { describe, expect, it } from "vitest";

import { buildMoments, countActs } from "@/features/practice/services/moments";
import { runPractice } from "@/features/practice/services/run-practice";
import { DEFAULT_OFFER, type SimulationSetup } from "@/features/practice/services/setup";

describe("buildMoments", () => {
  it("streams shopper thoughts across seven days", () => {
    const setup: SimulationSetup = {
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
        audienceKind: "cold",
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
    };
    const run = runPractice(setup);
    const moments = buildMoments(run, "hair dryer");
    expect(moments.some((moment) => moment.kind === "day")).toBe(true);
    expect(moments.filter((moment) => moment.kind === "shopper").length).toBeGreaterThan(20);
    expect(moments.every((moment) => moment.tMs >= 0)).toBe(true);
    const counts = countActs(moments);
    expect(counts.stopped + counts.scrolled + counts.clicked + counts.hid).toBeGreaterThan(0);
  });
});

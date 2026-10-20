import { describe, expect, it } from "vitest";

import { DEFAULT_TARGETING } from "@/features/practice/meta/detailed-targeting";
import { buildMoments, countActs } from "@/features/practice/services/moments";
import { readDestination } from "@/features/practice/services/research-journey";
import { runPractice } from "@/features/practice/services/run-practice";
import { DEFAULT_OFFER, type SimulationSetup } from "@/features/practice/services/setup";

const setup: SimulationSetup = {
  creative: {
    headline: "Free trial for quiet dryer",
    primaryText: "Dry hair without the roar.",
    hasImage: true,
    hasVideo: false,
    videoHasWords: false,
    product: "hair dryer",
    destinationUrl: "https://example.com/test-lead",
  },
  offer: { ...DEFAULT_OFFER },
  audience: {
    mode: "advantage",
    audienceKind: "site_cart",
    windowDays: 7,
    interest: "shopping",
    placement: "feed",
    optimizeFor: "lead",
  },
  numbers: {
    impressions: 4000,
    clicks: 80,
    spendCents: 2800,
    conversions: 0,
    dailyBudgetCents: 4000,
  },
  objective: "leads",
  targeting: { ...DEFAULT_TARGETING, customAudiences: ["site_cart"] },
};

describe("research journey", () => {
  it("flags test URLs that people would distrust", () => {
    const read = readDestination("https://example.com/test-lead");
    expect(read.looksLikeTest).toBe(true);
    expect(read.host).toBe("example.com");
  });

  it("streams see → URL → scroll research, not one-line feelings only", () => {
    const run = runPractice(setup);
    const moments = buildMoments(run, "hair dryer", setup.creative.destinationUrl);
    expect(moments.some((moment) => moment.step === "saw_ad")).toBe(true);
    expect(moments.some((moment) => moment.step === "read_url")).toBe(true);
    expect(moments.some((moment) => moment.kind === "why")).toBe(true);
    expect(moments.some((moment) => moment.thought.toLowerCase().includes("example.com"))).toBe(true);
  });

  it("moves the funnel when people research", () => {
    const run = runPractice(setup);
    const moments = buildMoments(run, "hair dryer", setup.creative.destinationUrl);
    const counts = countActs(moments);
    expect(counts.stopped + counts.scrolled + counts.hid).toBeGreaterThan(0);
    expect(counts.landing + counts.clicked + counts.bounced).toBeGreaterThan(0);
  });
});

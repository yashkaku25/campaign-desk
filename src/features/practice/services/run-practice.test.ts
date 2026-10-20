import { describe, expect, it } from "vitest";

import { runPractice } from "@/features/practice/services/run-practice";

const creative = {
  headline: "Quiet hair dryer",
  primaryText: "It dries hair without the roar.",
  hasImage: true,
  hasVideo: false,
  videoHasWords: false,
  product: "hair dryer",
};

describe("runPractice", () => {
  it("names what is missing and does not invent a band", () => {
    const run = runPractice(
      { headline: "", primaryText: "", hasImage: false, hasVideo: false, videoHasWords: false, product: "" },
      null,
    );
    expect(run.missing.map((gap) => gap.what)).toEqual(
      expect.arrayContaining(["Ad headline", "Ad copy", "Picture or video", "Product", "Real numbers"]),
    );
    expect(run.prediction).toBeNull();
    expect(run.days).toHaveLength(7);
  });

  it("uses saved campaign numbers for a 7 day band", () => {
    const run = runPractice(creative, {
      impressions: 10000,
      clicks: 200,
      spendCents: 5000,
      conversions: 10,
      dailyBudgetCents: 2000,
    });
    expect(run.prediction).not.toBeNull();
    expect(run.prediction?.clicksHigh).toBeGreaterThan(run.prediction?.clicksLow ?? 0);
    expect(run.prediction?.note).toMatch(/does not spend/);
    expect(run.missing.map((gap) => gap.what)).not.toContain("Real numbers");
  });

  it("keeps the result band at zero when clicks never become results", () => {
    const run = runPractice(creative, {
      impressions: 8000,
      clicks: 80,
      spendCents: 4000,
      conversions: 0,
      dailyBudgetCents: 2000,
    });
    expect(run.prediction?.resultsLow).toBe(0);
    expect(run.prediction?.resultsHigh).toBe(0);
    expect(run.days[0]?.resolution.carryToNextDay).toContain("disappointment");
  });

  it("asks for words on a silent video", () => {
    const run = runPractice({ ...creative, hasVideo: true, videoHasWords: false }, null);
    expect(run.missing.map((gap) => gap.what)).toContain("Words on the video");
  });
});

import type { MomentCounts } from "@/features/practice/services/moments";
import type { PracticePrediction } from "@/features/practice/services/run-practice";
import { learningState } from "@/features/practice/services/facts-from-setup";
import type { SimulationSetup } from "@/features/practice/services/setup";

export interface SimMetricStrip {
  impressions: number | null;
  reach: number | null;
  frequency: number | null;
  linkCtr: number | null;
  cpcCents: number | null;
  cpmCents: number | null;
  results: number | null;
  costPerResultCents: number | null;
  learning: "learning" | "learning_limited" | "stable" | "unknown";
  learningLabel: string;
  note: string;
}

export function buildMetricStrip(
  setup: SimulationSetup,
  prediction: PracticePrediction | null,
  counts: MomentCounts,
): SimMetricStrip {
  const numbers = setup.numbers;
  const learning = prediction?.learning ?? learningState(setup);
  const learningLabel =
    learning === "stable"
      ? "Stable — about 50 results in a week"
      : learning === "learning"
        ? "Learning — still under about 50 results"
        : learning === "learning_limited"
          ? "Learning limited — budget or audience is thin"
          : "No sheet numbers yet";

  if (!numbers || numbers.impressions === 0) {
    return {
      impressions: null,
      reach: null,
      frequency: null,
      linkCtr: null,
      cpcCents: null,
      cpmCents: null,
      results: null,
      costPerResultCents: null,
      learning,
      learningLabel,
      note: "Simulation. This can be wrong. It does not spend. Sync a sheet to ground the band.",
    };
  }

  const ctr = numbers.clicks / numbers.impressions;
  const frequency = prediction?.frequency ?? 1.5;
  const reach = prediction
    ? Math.round((prediction.reachLow + prediction.reachHigh) / 2)
    : Math.max(1, Math.round(numbers.impressions / frequency));
  const cpc = numbers.clicks > 0 ? Math.round(numbers.spendCents / numbers.clicks) : null;
  const cpm = Math.round((numbers.spendCents / numbers.impressions) * 1000);
  const results = numbers.conversions;
  const cpr = results > 0 ? Math.round(numbers.spendCents / results) : null;

  let note =
    prediction?.note ??
    "Simulation. This can be wrong. It does not spend. The band uses sheet numbers when they exist.";
  if (counts.hid >= 3) note += " Several people hid the ad in this week.";
  if (counts.bounced >= 3) note += " Several people left at the page or checkout.";

  return {
    impressions: numbers.impressions,
    reach,
    frequency,
    linkCtr: Math.round(ctr * 10000) / 100,
    cpcCents: cpc,
    cpmCents: cpm,
    results,
    costPerResultCents: cpr,
    learning,
    learningLabel,
    note,
  };
}

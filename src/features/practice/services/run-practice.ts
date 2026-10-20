import { marketerNote, resolveShopper } from "@/features/practice/emotions/resolve";
import type { ShopperResolution } from "@/features/practice/emotions/types";
import { factsFromSetup, learningState } from "@/features/practice/services/facts-from-setup";
import type { SimulationCreative, SimulationNumbers, SimulationSetup } from "@/features/practice/services/setup";
import { DEFAULT_OFFER } from "@/features/practice/services/setup";

/** @deprecated Use SimulationCreative — kept for existing tests. */
export type PracticeCreative = SimulationCreative;
/** @deprecated Use SimulationNumbers */
export type PracticeNumbers = SimulationNumbers;

export interface PracticeGap {
  what: string;
  why: string;
}

export interface PracticeDay {
  day: number;
  facts: string[];
  resolution: ShopperResolution;
  marketer: string | null;
  /** How many people this day leans toward stop / hide / buy. */
  mood: "open" | "tired" | "wary" | "ready";
}

export interface PracticePrediction {
  days: number;
  clicksLow: number;
  clicksHigh: number;
  resultsLow: number;
  resultsHigh: number;
  /** Estimated people who saw the ad at least once. */
  reachLow: number;
  reachHigh: number;
  frequency: number;
  learning: "learning" | "learning_limited" | "stable" | "unknown";
  note: string;
}

export interface PracticeRun {
  missing: PracticeGap[];
  days: PracticeDay[];
  prediction: PracticePrediction | null;
  facts: string[];
  setup: SimulationSetup;
}

const RUN_DAYS = 7;

/** Walks shoppers through a week. Sheet numbers ground the band. Missing inputs stay missing. */
export function runPractice(
  creativeOrSetup: PracticeCreative | SimulationSetup,
  numbers?: PracticeNumbers | null,
): PracticeRun {
  const setup = normalizeSetup(creativeOrSetup, numbers);
  const base = factsFromSetup(setup);
  const missing = findGaps(setup);
  const days: PracticeDay[] = [];
  let carried: string[] = [];

  for (let day = 1; day <= RUN_DAYS; day += 1) {
    const dayFacts = applyHumanDayInfluences(base, day, setup);
    const resolution = resolveShopper({ present: dayFacts, carried });
    days.push({
      day,
      facts: dayFacts,
      resolution,
      marketer: marketerNote(resolution),
      mood: moodOf(resolution),
    });
    carried = resolution.carryToNextDay;
  }

  return {
    missing,
    days,
    prediction: predict(setup, days),
    facts: base,
    setup,
  };
}

function normalizeSetup(
  creativeOrSetup: PracticeCreative | SimulationSetup,
  numbers?: PracticeNumbers | null,
): SimulationSetup {
  if ("creative" in creativeOrSetup && "offer" in creativeOrSetup) {
    return creativeOrSetup;
  }
  return {
    creative: creativeOrSetup,
    offer: { ...DEFAULT_OFFER },
    audience: {
      mode: "advantage",
      audienceKind: "cold",
      windowDays: 7,
      interest: "shopping",
      placement: "feed",
      optimizeFor: "purchase",
    },
    numbers: numbers ?? null,
  };
}

/**
 * Real people do not feel the same every day.
 * Weekend scroll is faster, mid-week checkout is calmer, late week fatigue rises on warm audiences.
 */
function applyHumanDayInfluences(base: string[], day: number, setup: SimulationSetup): string[] {
  const facts = new Set(base);
  const warm =
    setup.audience.audienceKind !== "cold" && !setup.audience.audienceKind.startsWith("lal_");

  // Days 1–2: fresh attention
  if (day <= 2) {
    facts.add("wants_result");
    if (setup.offer.socialProof === "reviews") facts.add("public_agrees");
  }
  // Days 3–4: decision pressure
  if (day === 3 || day === 4) {
    if (warm) {
      facts.add("stopped_undecided");
      facts.add("checkout_worry");
    }
    if (setup.offer.pageQuality !== "fast") facts.add("slow_page");
  }
  // Days 5–7: fatigue and social context (weekend-like)
  if (day >= 5) {
    if (warm || setup.audience.windowDays > 14) facts.add("seen_too_often");
    if (day >= 6) {
      facts.add("others_can_see");
      facts.add("decided_not_to_spend");
    }
    if (setup.audience.placement === "reels") {
      facts.add("playful_ad");
      facts.add("embarrassment");
    }
  }
  // Payday rhythm mid-week for self spend
  if (day === 3 && setup.offer.offerKind === "self") {
    facts.add("payday");
    facts.add("can_afford");
  }
  // Gift intent rises late week
  if (day >= 5 && setup.offer.offerKind === "gift") {
    facts.add("buying_for_someone");
    facts.add("future_payoff");
  }

  return [...facts];
}

function moodOf(resolution: ShopperResolution): PracticeDay["mood"] {
  const acts = resolution.stages.map((stage) => stage.act);
  if (acts.includes("hide") || acts.includes("bounce")) return "wary";
  if (acts.includes("buy") || acts.includes("checkout") || acts.includes("cart")) return "ready";
  if (acts.includes("scroll") && !acts.includes("click")) return "tired";
  return "open";
}

function findGaps(setup: SimulationSetup): PracticeGap[] {
  const { creative, numbers } = setup;
  const gaps: PracticeGap[] = [];
  if (creative.headline.trim().length === 0) {
    gaps.push({
      what: "Ad headline",
      why: "People decide from the first line. Without it, the shopper cannot read an offer.",
    });
  }
  if (creative.primaryText.trim().length === 0) {
    gaps.push({
      what: "Ad copy",
      why: "The words under the picture are part of the ad. They are missing.",
    });
  }
  if (!creative.hasImage && !creative.hasVideo) {
    gaps.push({
      what: "Picture or video",
      why: "A shopper cannot stop on an ad that has no picture.",
    });
  }
  if (creative.hasVideo && !creative.videoHasWords) {
    gaps.push({
      what: "Words on the video",
      why: "Most people watch with the sound off. A silent video with no words is easy to scroll past.",
    });
  }
  if (creative.product.trim().length === 0) {
    gaps.push({
      what: "Product",
      why: "The shopper needs to know what is being sold.",
    });
  }
  if (!numbers || numbers.impressions === 0) {
    gaps.push({
      what: "Real numbers",
      why: "The sheet is still how spend, clicks, and results get onto the desk. Sync it, and the band can use those numbers.",
    });
  }
  return gaps;
}

function predict(setup: SimulationSetup, days: PracticeDay[]): PracticePrediction | null {
  const numbers = setup.numbers;
  if (!numbers || numbers.impressions === 0 || numbers.spendCents === 0 || numbers.dailyBudgetCents <= 0) {
    return null;
  }

  const ctr = numbers.clicks / numbers.impressions;
  const dailyImpressions = (numbers.impressions / numbers.spendCents) * numbers.dailyBudgetCents;
  let dailyClicks = dailyImpressions * ctr;
  let clickToResult = numbers.clicks === 0 ? 0 : numbers.conversions / numbers.clicks;

  // Human mood across the week pulls the band.
  const moods = days.map((day) => day.mood);
  const wary = moods.filter((mood) => mood === "wary").length;
  const tired = moods.filter((mood) => mood === "tired").length;
  const ready = moods.filter((mood) => mood === "ready").length;
  if (wary >= 2) dailyClicks *= 0.82;
  if (tired >= 3) dailyClicks *= 0.9;
  if (ready >= 2) {
    dailyClicks *= 1.08;
    clickToResult *= 1.1;
  }

  // Audience and placement influence.
  if (setup.audience.audienceKind === "cold") dailyClicks *= 0.92;
  if (setup.audience.audienceKind.includes("cart") && setup.audience.windowDays > 14) {
    dailyClicks *= 0.88;
    clickToResult *= 0.85;
  }
  if (setup.audience.placement === "reels" && setup.creative.hasVideo) dailyClicks *= 1.12;
  if (setup.offer.pageQuality !== "fast") clickToResult *= 0.75;
  if (setup.offer.socialProof === "complaint") {
    dailyClicks *= 0.7;
    clickToResult *= 0.5;
  }
  if (setup.offer.priceCents >= 15000) clickToResult *= 0.8;

  const objective = setup.objective ?? "sales";
  if (objective === "awareness") {
    dailyClicks *= 1.15;
    clickToResult *= 0.35;
  }
  if (objective === "traffic") {
    dailyClicks *= 1.2;
    clickToResult *= 0.55;
  }
  if (objective === "engagement") {
    dailyClicks *= 1.25;
    clickToResult *= 0.4;
  }
  if (objective === "leads") {
    dailyClicks *= 0.95;
    clickToResult *= 0.7;
  }
  if (objective === "app") {
    dailyClicks *= 1.05;
    clickToResult *= 0.6;
  }

  const targeting = setup.targeting;
  if (targeting) {
    if (targeting.customAudiences.some((id) => id.includes("cart") || id.includes("checkout"))) {
      clickToResult *= 1.15;
    }
    if (targeting.behaviors.includes("engaged_shoppers")) dailyClicks *= 1.08;
    if (targeting.ageMax - targeting.ageMin <= 10 && setup.audience.mode !== "advantage") {
      dailyClicks *= 0.92;
    }
    if (targeting.interests.includes("luxury") && setup.offer.priceCents < 5000) {
      clickToResult *= 0.7;
    }
  }

  const last = days[days.length - 1];
  const hideOrBounce = last?.resolution.stages.some(
    (stage) => stage.act === "hide" || stage.act === "bounce",
  );
  let moved = "";
  if (hideOrBounce) {
    dailyClicks *= 0.88;
    const name = last?.resolution.stages.find(
      (stage) => stage.act === "hide" || stage.act === "bounce",
    )?.winner?.name;
    moved = name ? ` ${name} pulled the band down.` : " A hide or a leave pulled the band down.";
  }

  const weekClicks = dailyClicks * RUN_DAYS;
  const weekResults = dailyClicks * clickToResult * RUN_DAYS;
  const warm = setup.audience.audienceKind !== "cold" && !setup.audience.audienceKind.startsWith("lal_");
  const frequency = warm ? (setup.audience.windowDays > 14 ? 3.2 : 2.1) : 1.45;
  const weekImpressions = dailyImpressions * RUN_DAYS;
  const reachMid = weekImpressions / frequency;
  const learning = learningState(setup);
  const thin = numbers.conversions === 0 ? " Clicks have not turned into results yet, so the result band stays at 0." : "";

  return {
    days: RUN_DAYS,
    clicksLow: Math.max(0, Math.round(weekClicks * 0.7)),
    clicksHigh: Math.max(0, Math.round(weekClicks * 1.3)),
    resultsLow: Math.max(0, Math.round(weekResults * 0.7)),
    resultsHigh: Math.max(0, Math.round(weekResults * 1.3)),
    reachLow: Math.max(1, Math.round(reachMid * 0.75)),
    reachHigh: Math.max(1, Math.round(reachMid * 1.25)),
    frequency: Math.round(frequency * 10) / 10,
    learning,
    note: `Simulation. This can be wrong. It does not spend. The band uses sheet numbers, the offer, the audience, and how people acted in the week.${moved}${thin}`,
  };
}

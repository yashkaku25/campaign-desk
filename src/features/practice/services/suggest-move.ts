import type { MomentCounts } from "@/features/practice/services/moments";
import type { PracticeDay, PracticeNumbers, PracticePrediction } from "@/features/practice/services/run-practice";
import type { SimulationSetup } from "@/features/practice/services/setup";

export interface MarketerMove {
  what: string;
  why: string;
}

/** One next change inside the simulation. Does not write a campaign. */
export function suggestMove(
  days: PracticeDay[],
  numbers: PracticeNumbers | null,
  prediction: PracticePrediction | null,
  audienceKind: string,
  windowDays: number,
  counts?: MomentCounts,
  setup?: SimulationSetup,
): MarketerMove {
  const last = days[days.length - 1];
  const winnerNames = last?.resolution.stages
    .flatMap((stage) => [stage.winner?.name, stage.runnerUp?.name])
    .filter((name): name is string => Boolean(name)) ?? [];

  const hid = counts?.hid ?? 0;
  const bounced = counts?.bounced ?? 0;
  const clicked = counts?.clicked ?? 0;
  const bought = counts?.bought ?? 0;

  if (winnerNames.includes("Disgust") || winnerNames.includes("Betrayal") || hid >= 4) {
    return {
      what: "Turn off this ad.",
      why: "People are hiding it because of disgust, betrayal, or fatigue. That is not a bidding problem.",
    };
  }
  if (winnerNames.includes("Anxiety") || winnerNames.includes("Sting of paying") || bounced >= 4) {
    return {
      what: "Fix the offer and the page before you raise the budget.",
      why: "People leave at checkout or the page. Anxiety, price sting, or a slow page is not a creative bidding fix.",
    };
  }
  if (setup?.offer.pageQuality !== "fast" && bounced + clicked > 0 && bought === 0) {
    return {
      what: "Speed up the page and clarify the form.",
      why: "People who clicked are not finishing. A slow or confusing page kills the week.",
    };
  }
  if (setup?.offer.socialProof === "complaint") {
    return {
      what: "Pause until the public complaint is answered.",
      why: "Shoppers see the complaint. Trust drops before the auction can help.",
    };
  }
  if (prediction?.learning === "learning_limited" || prediction?.learning === "learning") {
    if (numbers && numbers.conversions > 0 && numbers.conversions < 50) {
      return {
        what: "Wait.",
        why: "Results are still under about 50. Learning is thin. Do not judge the ad set yet.",
      };
    }
  }
  if (numbers && numbers.conversions > 0 && numbers.conversions < 50) {
    return {
      what: "Wait.",
      why: "Results are still under about 50. Learning is thin. Do not judge the ad set yet.",
    };
  }
  if (audienceKind.includes("cart") && windowDays > 14) {
    return {
      what: "Shorten the cart window to 7 days.",
      why: "Cart intent fades fast. A long window shows the ad to tired people and raises frequency.",
    };
  }
  if (audienceKind === "cold" || audienceKind === "lal_1" || audienceKind.startsWith("lal_")) {
    return {
      what: "Exclude purchasers from this set.",
      why: "A cold or lookalike set should not pay to reach people who already bought.",
    };
  }
  if (numbers && numbers.impressions >= 1000) {
    const ctr = numbers.clicks / numbers.impressions;
    if (ctr < 0.004 || (prediction && prediction.frequency >= 3)) {
      return {
        what: "Turn off the tired creative.",
        why: "Click-through is low or frequency is high. People have seen this ad too often.",
      };
    }
  }
  if (
    setup?.conversionLocation === "instant_form" &&
    numbers &&
    numbers.clicks >= 20 &&
    numbers.conversions === 0
  ) {
    return {
      what: "Shorten the Instant Form and fix the intro trust line.",
      why: "People open the form but do not submit. Fewer questions and a clear privacy link usually lift complete rate.",
    };
  }
  if (
    (setup?.conversionLocation === "whatsapp" ||
      setup?.conversionLocation === "messenger" ||
      setup?.conversionLocation === "instagram") &&
    numbers &&
    numbers.clicks >= 20 &&
    numbers.conversions === 0
  ) {
    return {
      what: "Reply faster in the first minutes, or tighten who sees the ad.",
      why: "Message starts are the result. Slow replies or the wrong audience look like zero conversions.",
    };
  }
  if (prediction && prediction.resultsHigh === 0 && numbers && numbers.clicks >= 30) {
    return {
      what: "Check the page and the tracking.",
      why: "Clicks are not becoming results. The band stays at zero until that changes.",
    };
  }
  if (setup?.offer.moneyMood === "tight" && setup.offer.priceCents >= 10000) {
    return {
      what: "Test a lower entry price or a clear return line.",
      why: "Money is tight for this crowd. A high price with weak returns language stops checkout.",
    };
  }
  return {
    what: "Keep the simulation running another week.",
    why: "Nothing in this week asks for a hard change yet.",
  };
}

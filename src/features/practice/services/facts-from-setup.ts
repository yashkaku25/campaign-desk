import type { DetailedTargeting } from "@/features/practice/meta/detailed-targeting";
import type { SimulationSetup } from "@/features/practice/services/setup";

/** Turns setup into shopper facts. A feeling never starts without its facts. */
export function factsFromSetup(setup: SimulationSetup): string[] {
  const facts = new Set<string>();
  for (const fact of factsFromCreative(setup)) facts.add(fact);
  for (const fact of factsFromOffer(setup)) facts.add(fact);
  for (const fact of factsFromAudience(setup)) facts.add(fact);
  for (const fact of factsFromObjective(setup)) facts.add(fact);
  for (const fact of factsFromTargeting(setup.targeting)) facts.add(fact);
  for (const fact of factsFromNumbers(setup)) facts.add(fact);
  return [...facts];
}

function factsFromObjective(setup: SimulationSetup): string[] {
  const objective = setup.objective ?? "sales";
  if (objective === "awareness") return ["looks_like_me", "no_need", "playful_ad"];
  if (objective === "traffic") return ["wants_result", "stopped_undecided"];
  if (objective === "engagement") return ["playful_ad", "looks_like_me", "wants_company"];
  if (objective === "leads") return ["wants_result", "checkout_worry", "stopped_undecided"];
  if (objective === "app") return ["wants_result", "playful_ad", "can_afford"];
  return ["wants_result", "can_afford", "people_like_me_bought"];
}

function factsFromTargeting(targeting: DetailedTargeting | undefined): string[] {
  if (!targeting) return [];
  const facts: string[] = [];
  const midAge = (targeting.ageMin + targeting.ageMax) / 2;

  if (midAge <= 26) {
    facts.push("playful_ad", "tight_money", "self_spend");
  } else if (midAge >= 50) {
    facts.push("checkout_worry", "known_brand", "self_control");
  } else {
    facts.push("can_afford", "wants_result");
  }

  if (targeting.gender === "women") facts.push("cares_about_rank");
  if (targeting.gender === "men") facts.push("product_is_a_tool");

  for (const interest of targeting.interests) {
    if (interest === "fitness" || interest === "yoga") facts.push("cares_about_rank", "wants_result");
    if (interest === "family" || interest === "parents_all") facts.push("buying_for_someone", "shields_someone");
    if (interest === "luxury") facts.push("price_above_normal", "cares_about_rank");
    if (interest === "fashion") facts.push("people_like_me_bought", "wants_result");
    // Store browsers vs online buyers, different research paths.
    if (
      interest === "shopping" ||
      interest === "shopping_centres" ||
      interest === "boutiques" ||
      interest === "discount_shops"
    ) {
      facts.push("people_like_me_bought", "needs_comfort");
    }
    if (interest === "online_shopping" || interest === "ecommerce") {
      facts.push("people_like_me_bought", "wants_result", "product_is_a_tool");
    }
    if (interest === "technology" || interest === "ai") facts.push("product_is_a_tool", "wants_result");
    if (interest === "travel_int") facts.push("future_payoff");
  }

  for (const behavior of targeting.behaviors) {
    if (behavior === "engaged_shoppers" || behavior === "online_buyers") {
      facts.push("already_likes_it", "wants_result");
    }
    if (behavior === "travel" || behavior === "commuters") facts.push("slower_than_they_tolerate");
    if (behavior === "anniversary" || behavior === "life_engaged") {
      facts.push("buying_for_someone", "future_payoff");
    }
  }

  for (const demo of targeting.demographics) {
    if (demo.startsWith("parents")) facts.push("buying_for_someone", "shields_someone");
    if (demo === "relationship_married") facts.push("buying_for_someone");
    if (demo === "life_new_job" || demo === "life_moved") facts.push("needs_comfort", "wants_result");
    if (demo === "education_college") facts.push("can_afford");
  }

  for (const custom of targeting.customAudiences) {
    if (custom.includes("cart") || custom.includes("checkout")) {
      facts.push("stopped_undecided", "checkout_worry", "already_likes_it");
    }
    if (custom.includes("purchase")) facts.push("previous_good_result", "purchased");
    if (custom.startsWith("video_")) facts.push("seen_too_often", "already_likes_it");
    if (custom.includes("lead")) facts.push("stopped_undecided", "wants_result");
    if (custom === "cold" || custom.startsWith("lal_")) facts.push("no_need");
  }

  if (targeting.ageMax - targeting.ageMin <= 10) {
    facts.push("looks_like_me");
  }

  return facts;
}

function factsFromCreative(setup: SimulationSetup): string[] {
  const { creative, audience } = setup;
  const facts: string[] = [];
  const headline = creative.headline.trim();
  const text = creative.primaryText.trim();
  const product = creative.product.trim();
  const picture = creative.hasImage || creative.hasVideo;

  if (headline.length > 0 && picture) facts.push("clear_picture");
  if (headline.length === 0 || text.length === 0) facts.push("cannot_parse");
  if ((headline.match(/!/g) ?? []).length + (text.match(/!/g) ?? []).length >= 3) {
    facts.push("too_many_claims");
  }
  const pushy = /last chance|ends today|you must|only today|hurry|don't miss/i;
  if (pushy.test(headline) || pushy.test(text)) {
    facts.push("real_deadline", "stacked_deadlines");
  }
  if (/free|guaranteed|miracle|#1/i.test(headline) || /free|guaranteed|miracle|#1/i.test(text)) {
    facts.push("feels_like_a_trick", "gross_claim");
  }
  if (product.length > 0) {
    const lower = `${headline} ${text}`.toLowerCase();
    if (lower.includes(product.toLowerCase())) facts.push("wants_result", "removes_a_problem", "problem_might_improve");
  }
  if (creative.hasVideo) {
    if (text.length > 40 || creative.videoHasWords) facts.push("playful_ad");
    if (!creative.videoHasWords) facts.push("cannot_parse");
  }
  if (audience.placement === "reels" || audience.placement === "stories") {
    facts.push("others_can_see");
    if (creative.hasVideo) facts.push("playful_ad");
  }
  if (/you look|your body|behind everyone|everyone else/i.test(headline) || /you look|your body|behind everyone/i.test(text)) {
    facts.push("told_they_are_behind", "names_their_body");
  }
  if (/laugh|joke on you|loser/i.test(text)) facts.push("ad_laughs_at_them");
  return facts;
}

function factsFromOffer(setup: SimulationSetup): string[] {
  const { offer } = setup;
  const facts: string[] = [];

  if (offer.brandKnown) facts.push("known_brand");
  if (offer.returnsClear) facts.push("has_returns");
  if (!offer.brandKnown && !offer.returnsClear) facts.push("checkout_worry");

  if (offer.priceCents > 0) {
    if (offer.compareAtCents > 0 && offer.priceCents < offer.compareAtCents) {
      facts.push("reference_price", "unexpected_price", "can_afford");
      if (offer.priceCents <= 2500) facts.push("cheap_product");
    } else if (offer.compareAtCents > 0 && offer.priceCents >= offer.compareAtCents) {
      facts.push("price_above_normal", "reference_price", "unexpected_price");
    } else if (offer.priceCents >= 15000) {
      facts.push("price_above_normal", "large_checkout", "checkout_worry", "tight_money");
    } else if (offer.priceCents <= 2500) {
      facts.push("cheap_product", "can_afford");
    } else {
      facts.push("can_afford");
    }
  }

  if (offer.offerKind === "gift") facts.push("buying_for_someone", "shields_someone", "reduces_a_risk");
  if (offer.offerKind === "tool") facts.push("product_is_a_tool", "removes_a_problem", "wants_result");
  if (offer.offerKind === "comfort") facts.push("needs_comfort", "wants_company");
  if (offer.offerKind === "self") facts.push("self_spend");

  if (offer.socialProof === "reviews") facts.push("people_like_me_bought", "public_agrees", "choice_treated_as_normal");
  if (offer.socialProof === "friend_bought") facts.push("someone_else_has_it", "people_like_me_bought", "respects_the_maker");
  if (offer.socialProof === "complaint") facts.push("complaint", "result_worse_than_ad", "broken_promise");
  if (offer.socialProof === "none") facts.push("no_need");

  if (offer.pageQuality === "slow") facts.push("slow_page", "slower_than_they_tolerate");
  if (offer.pageQuality === "confusing") facts.push("slow_page", "cannot_parse", "checkout_worry");

  // Real-life context: how a human meets the ad
  if (offer.device === "phone" && offer.scrollSpeed === "fast") {
    facts.push("cannot_parse");
    if (!offer.brandKnown) facts.push("no_need");
  }
  if (offer.scrollSpeed === "fast") facts.push("no_need");
  if (offer.scrollSpeed === "slow") {
    facts.push("wants_result");
    facts.push("stopped_undecided");
  }
  if (offer.timeOfDay === "commute") facts.push("slower_than_they_tolerate");
  if (offer.timeOfDay === "late") {
    facts.push("needs_comfort");
    facts.push("decided_not_to_spend");
  }
  if (offer.timeOfDay === "evening") {
    facts.push("can_afford");
    facts.push("wants_result");
  }
  if (offer.timeOfDay === "morning") {
    facts.push("self_control");
    facts.push("decided_not_to_spend");
  }
  if (offer.moneyMood === "tight") {
    facts.push("tight_money");
    facts.push("checkout_worry");
    facts.push("self_spend");
  }
  if (offer.moneyMood === "flush") {
    facts.push("payday");
    facts.push("can_afford");
  }
  if (offer.withOthers) {
    facts.push("others_can_see");
    facts.push("embarrassment");
  }

  return facts;
}

function factsFromAudience(setup: SimulationSetup): string[] {
  const { audience } = setup;
  const facts: string[] = [];
  const kind = audience.audienceKind;
  const warm =
    kind.startsWith("site_") ||
    kind.startsWith("video_") ||
    kind.startsWith("page_") ||
    kind.startsWith("instagram_") ||
    kind.startsWith("lead_") ||
    kind.startsWith("message_") ||
    kind === "customer_list" ||
    kind === "app_install";

  if (kind === "cold" || kind.startsWith("lal_")) {
    facts.push("no_need");
    if (kind.startsWith("lal_")) facts.push("looks_like_me", "wants_result");
  }
  if (warm) {
    facts.push("stopped_undecided", "already_likes_it", "wants_result");
    if (kind === "site_cart" || kind === "site_checkout") facts.push("checkout_worry");
    if (kind === "site_purchase") facts.push("previous_good_result", "inside_repurchase_cycle", "purchased");
    if (kind.startsWith("video_")) facts.push("seen_too_often");
  }
  if (audience.windowDays > 14 && (kind.includes("cart") || kind.includes("checkout"))) {
    facts.push("seen_too_often", "stopped_undecided");
  }
  if (audience.windowDays >= 60 && warm) facts.push("seen_too_often", "already_enough");
  if (audience.mode === "advantage") facts.push("wants_result");
  if (
    audience.interest === "shopping" ||
    audience.interest === "online_shopping" ||
    audience.interest === "fitness"
  ) {
    facts.push("cares_about_rank");
  }
  if (audience.interest === "family") facts.push("buying_for_someone", "shields_someone");
  if (audience.placement === "feed") facts.push("looks_like_me");
  return facts;
}

function factsFromNumbers(setup: SimulationSetup): string[] {
  const numbers = setup.numbers;
  if (!numbers || numbers.impressions < 500) return [];
  const facts: string[] = [];
  const ctr = numbers.impressions === 0 ? 0 : numbers.clicks / numbers.impressions;
  // Rough frequency from spend share: high impressions with low CTR means the same people see it often.
  const tiredCreative = numbers.impressions >= 5000 && ctr < 0.006;

  if (numbers.impressions >= 1000 && ctr < 0.004) facts.push("seen_too_often");
  if (ctr >= 0.01) facts.push("wants_result", "people_like_me_bought");
  if (numbers.conversions >= 5) facts.push("previous_good_result");
  if (numbers.conversions >= 20) facts.push("more_than_one_good_result");
  if (numbers.clicks >= 30 && numbers.conversions === 0) {
    facts.push("result_worse_than_ad", "checkout_worry", "broken_promise");
  }
  if (tiredCreative) facts.push("seen_too_often");

  const opt = setup.audience.optimizeFor;
  const results =
    opt === "link_click" || opt === "landing_page"
      ? numbers.clicks
      : opt === "add_to_cart"
        ? Math.max(1, Math.round(numbers.conversions * 2.5))
        : numbers.conversions;
  if (results > 0 && results < 50) facts.push("stopped_undecided");
  return facts;
}

export function learningState(setup: SimulationSetup): "learning" | "learning_limited" | "stable" | "unknown" {
  const numbers = setup.numbers;
  if (!numbers || numbers.impressions === 0) return "unknown";
  const opt = setup.audience.optimizeFor;
  const results =
    opt === "link_click" || opt === "landing_page"
      ? numbers.clicks
      : opt === "add_to_cart"
        ? Math.max(numbers.conversions * 2, Math.round(numbers.clicks * 0.15))
        : numbers.conversions;
  if (results >= 50) return "stable";
  if (results > 0 && numbers.dailyBudgetCents < 2000) return "learning_limited";
  if (results > 0) return "learning";
  return "learning_limited";
}

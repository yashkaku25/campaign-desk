import type { FeelingRecord } from "@/features/practice/emotions/types";

/**
 * Every feeling the shopper is allowed to have.
 * The first 16 were already named. The rest are the ones that still change an act.
 * A record cannot freestyle a second act. Two pushes means two records.
 */
export const FEELINGS: FeelingRecord[] = [
  feeling("curiosity", "Curiosity", "notice", "moment", ["clear_picture"], "stop", "scroll", "indifference", "next_sight"),
  feeling("desire", "Desire", "click", "need", ["wants_result"], "click", "scroll", "self_control", "end_of_day"),
  feeling("recognition", "Recognition", "notice", "person", ["looks_like_me"], "stop", "scroll", "confusion", "next_sight"),
  feeling("belonging", "Belonging", "click", "public_note", ["people_like_me_bought"], "click", "hide", "exclusion_laugh", "while_note"),
  feeling("fear_of_missing_out", "Fear of missing out", "click", "moment", ["real_deadline"], "click", "wait", "reactance", "while_note"),
  feeling("fear_of_being_fooled", "Fear of being fooled", "pay", "public_note", ["complaint"], "bounce", "buy", "trust", "while_note"),
  feeling("trust", "Trust", "pay", "moment", ["known_brand", "has_returns"], "buy", "bounce", "fear_of_being_fooled", "while_note"),
  feeling("sting_of_paying", "Sting of paying", "pay", "need", ["price_above_normal"], "bounce", "buy", "pride_in_thrift", "end_of_day"),
  feeling("guilt", "Guilt", "pay", "need", ["tight_money", "self_spend"], "bounce", "buy", "affection", "end_of_day"),
  feeling("status", "Status", "click", "person", ["cares_about_rank"], "click", "scroll", "sadness", "end_of_day"),
  feeling("relief", "Relief", "click", "need", ["removes_a_problem"], "click", "scroll", "overwhelm", "end_of_day"),
  feeling("frustration", "Frustration", "pay", "moment", ["slow_page"], "bounce", "checkout", "relief", "end_of_day"),
  feeling("anger", "Anger", "click", "public_note", ["feels_like_a_trick"], "hide", "click", "gratitude", "while_note"),
  feeling("fatigue", "Fatigue", "notice", "history", ["seen_too_often"], "scroll", "stop", "curiosity", "next_sight"),
  feeling("doubt", "Doubt after a buy", "after", "history", ["bought_and_unsure"], "scroll", "buy", "delight", "next_sight"),
  feeling("delight", "Delight after a buy", "after", "history", ["bought_and_happy"], "scroll", "click", "doubt", "after_purchase"),

  feeling("surprise", "Surprise", "notice", "moment", ["unexpected_price"], "stop", "scroll", "indifference", "next_sight"),
  feeling("anticipation", "Anticipation", "click", "moment", ["future_payoff"], "wait", "bounce", "impatience", "while_note"),
  feeling("amusement", "Amusement", "notice", "moment", ["playful_ad"], "share", "hide", "contempt", "next_sight"),
  feeling("confusion", "Confusion", "notice", "moment", ["cannot_parse"], "scroll", "click", "recognition", "next_sight"),
  feeling("indifference", "Indifference", "notice", "need", ["no_need"], "scroll", "click", "curiosity", "end_of_day"),
  feeling("overwhelm", "Overwhelm", "notice", "moment", ["too_many_claims"], "scroll", "click", "relief", "next_sight"),
  feeling("insecurity", "Insecurity", "click", "person", ["told_they_are_behind", "product_is_a_tool"], "click", "hide", "confidence", "end_of_day"),
  feeling("insecurity_hide", "Insecurity", "click", "moment", ["names_their_body"], "hide", "click", "confidence", "next_sight"),
  feeling("exclusion_in", "Exclusion", "click", "moment", ["left_out_of_the_picture", "product_is_the_way_in"], "click", "hide", "belonging", "end_of_day"),
  feeling("exclusion_laugh", "Exclusion", "click", "moment", ["ad_laughs_at_them"], "hide", "click", "belonging", "next_sight"),

  feeling("hope", "Hope", "click", "need", ["problem_might_improve"], "lead", "bounce", "disappointment", "end_of_day"),
  feeling("confidence", "Confidence", "pay", "person", ["can_afford"], "checkout", "wait", "insecurity", "end_of_day"),
  feeling("envy", "Envy", "click", "public_note", ["someone_else_has_it"], "click", "scroll", "shame", "while_note"),
  feeling("admiration", "Admiration", "click", "public_note", ["respects_the_maker"], "click", "hide", "contempt", "while_note"),
  feeling("awe", "Awe", "notice", "public_note", ["result_seems_unreachable", "public_agrees"], "stop", "buy", "confidence", "while_note"),
  feeling("nostalgia", "Nostalgia", "click", "person", ["matches_a_past"], "click", "scroll", "indifference", "end_of_day"),
  feeling("nostalgia_refill", "Nostalgia", "click", "person", ["matches_a_past", "refill_of_that_past"], "click", "scroll", "indifference", "after_purchase"),
  feeling("loneliness", "Loneliness", "click", "person", ["wants_company"], "click", "scroll", "contentment", "end_of_day"),
  feeling("affection", "Affection", "click", "need", ["buying_for_someone"], "cart", "bounce", "guilt", "end_of_day"),
  feeling("protectiveness", "Protectiveness", "click", "person", ["shields_someone", "reduces_a_risk"], "lead", "scroll", "fear_of_being_fooled", "end_of_day"),
  feeling("playfulness", "Playfulness", "click", "need", ["cheap_product"], "click", "checkout", "embarrassment", "end_of_day"),
  feeling("craving", "Craving", "pay", "history", ["already_likes_it", "inside_repurchase_cycle"], "buy", "scroll", "self_control", "end_of_day"),
  feeling("impatience", "Impatience", "pay", "moment", ["slower_than_they_tolerate"], "bounce", "wait", "anticipation", "end_of_day"),
  feeling("hesitation", "Hesitation", "click", "history", ["stopped_undecided"], "wait", "buy", "confidence", "next_sight"),

  feeling("anxiety", "Anxiety", "pay", "need", ["checkout_worry"], "wait", "buy", "safety", "end_of_day"),
  feeling("safety", "Safety", "pay", "moment", ["known_brand", "has_returns"], "buy", "wait", "anxiety", "while_note"),
  feeling("disgust", "Disgust", "click", "public_note", ["gross_claim"], "hide", "click", "admiration", "while_note"),
  feeling("contempt", "Contempt", "notice", "person", ["looks_down_on_ad"], "hide", "click", "admiration", "next_sight"),
  feeling("shame", "Shame", "pay", "person", ["paying_feels_small"], "bounce", "buy", "confidence", "end_of_day"),
  feeling("embarrassment", "Embarrassment", "click", "moment", ["others_can_see"], "save", "click", "playfulness", "next_sight"),
  feeling("pride_in_thrift", "Pride in thrift", "pay", "moment", ["reference_price", "price_above_normal"], "buy", "bounce", "sting_of_paying", "end_of_day"),
  feeling("unfairness", "Unfairness", "pay", "moment", ["feels_like_a_trick"], "bounce", "buy", "gratitude", "next_sight"),
  feeling("reactance", "Reactance", "click", "moment", ["stacked_deadlines"], "hide", "click", "curiosity", "next_sight"),
  feeling("moral_discomfort", "Moral discomfort", "click", "person", ["clashes_with_a_value"], "hide", "click", "compassion", "while_note", ["help_looks_real"]),
  feeling("self_control", "Self-control", "click", "person", ["decided_not_to_spend"], "scroll", "buy", "craving", "end_of_day", ["payday"]),
  feeling("sadness", "Sadness", "click", "public_note", ["needs_comfort"], "click", "scroll", "amusement", "end_of_day"),

  feeling("disappointment", "Disappointment", "after", "public_note", ["result_worse_than_ad"], "hide", "buy", "hope", "next_sight"),
  feeling("contentment", "Contentment", "after", "need", ["already_enough"], "scroll", "click", "envy", "after_purchase"),
  feeling("gratitude", "Gratitude", "after", "history", ["previous_good_result"], "buy", "hide", "betrayal", "after_purchase"),
  feeling("loyalty", "Loyalty", "after", "history", ["more_than_one_good_result"], "buy", "scroll", "betrayal", "after_purchase", ["broken_promise"]),
  feeling("betrayal", "Betrayal", "after", "public_note", ["broken_promise"], "hide", "buy", "loyalty", "while_note", ["promise_fixed"]),
  feeling("compassion", "Compassion", "click", "need", ["help_looks_real"], "lead", "hide", "moral_discomfort", "end_of_day", ["help_looks_fake"]),
  feeling("validation", "Validation", "pay", "public_note", ["choice_treated_as_normal"], "buy", "bounce", "exclusion_laugh", "while_note"),
];

function feeling(
  id: string,
  name: string,
  stage: FeelingRecord["stage"],
  source: FeelingRecord["source"],
  when: string[],
  pushes: FeelingRecord["pushes"],
  blocks: FeelingRecord["blocks"],
  opposedBy: string,
  fades: FeelingRecord["fades"],
  unless?: string[],
): FeelingRecord {
  return { id, name, stage, source, when, unless, pushes, blocks, opposedBy, fades };
}

const feelingIds = new Set(FEELINGS.map((item) => item.id));

export function feelingById(id: string): FeelingRecord | undefined {
  return FEELINGS.find((item) => item.id === id);
}

export function catalogProblems(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const item of FEELINGS) {
    if (seen.has(item.id)) problems.push(`${item.name} is listed twice.`);
    seen.add(item.id);
    if (item.when.length === 0) problems.push(`${item.name} has no start fact.`);
    if (!feelingIds.has(item.opposedBy)) problems.push(`${item.name} opposes a feeling that is not stored.`);
    if (item.opposedBy === item.id) problems.push(`${item.name} opposes itself.`);
  }
  return problems;
}

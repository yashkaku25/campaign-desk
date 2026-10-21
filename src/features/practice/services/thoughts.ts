import type { FeelingRecord, ShopperAct } from "@/features/practice/emotions/types";

const BY_FEELING: Record<string, string> = {
  curiosity: "Wait, what is that?",
  desire: "I want that result.",
  recognition: "That looks like someone like me.",
  belonging: "People like me already bought this.",
  fear_of_missing_out: "If I wait I might miss it.",
  fear_of_being_fooled: "This might be a trick.",
  trust: "I trust this enough to try.",
  sting_of_paying: "That price stings.",
  guilt: "I should not spend on myself right now.",
  status: "This would look good on me.",
  relief: "This would take a problem off my plate.",
  frustration: "This page is fighting me.",
  anger: "This feels like a trap. Hide it.",
  fatigue: "I have seen this too many times.",
  doubt: "I bought it and I am not sure.",
  delight: "That last buy was good.",
  surprise: "That price is not what I expected.",
  anticipation: "Maybe later when it lands.",
  amusement: "That is fun. I might share it.",
  confusion: "I cannot tell what they are selling.",
  indifference: "Not for me.",
  overwhelm: "Too many claims. Scrolling past.",
  insecurity: "They are telling me I am behind.",
  insecurity_hide: "Do not name my body. Hide.",
  exclusion_in: "I am left out of that picture.",
  exclusion_laugh: "The ad is laughing at me.",
  hope: "Maybe this could help.",
  confidence: "I can afford this.",
  envy: "Someone I know already has it.",
  admiration: "I respect how this looks.",
  awe: "That result looks out of reach.",
  nostalgia: "This reminds me of something.",
  nostalgia_refill: "I want that feeling again.",
  loneliness: "I want to feel less alone.",
  affection: "This would be good for someone I care about.",
  protectiveness: "This could protect someone I love.",
  playfulness: "Cheap enough to try.",
  craving: "I already like this. Time again.",
  impatience: "This is too slow.",
  hesitation: "I stopped here before. Still unsure.",
  anxiety: "Checkout makes me nervous.",
  safety: "Returns are clear. I feel safer.",
  disgust: "That claim feels wrong.",
  contempt: "I look down on this ad.",
  shame: "Paying would make me feel small.",
  embarrassment: "Other people can see this.",
  pride_in_thrift: "A fair deal. I can buy.",
  unfairness: "This feels unfair.",
  reactance: "Stop pushing me.",
  moral_discomfort: "This clashes with what I believe.",
  self_control: "I decided not to spend.",
  sadness: "I need comfort, not this.",
  disappointment: "The result was worse than the ad.",
  contentment: "I already have enough.",
  gratitude: "Last time worked. I might buy again.",
  loyalty: "I have had more than one good result.",
  betrayal: "They broke a promise.",
  compassion: "The help looks real.",
  validation: "This treats my choice as normal.",
};

const BY_ACT: Record<ShopperAct, string> = {
  stop: "I stop the scroll.",
  scroll: "I keep scrolling.",
  click: "I tap through.",
  view_page: "I look at the page.",
  lead: "I leave my details.",
  cart: "I add it to the cart.",
  checkout: "I start checkout.",
  buy: "I buy it.",
  hide: "I hide the ad.",
  bounce: "I leave.",
  wait: "I wait.",
  share: "I share it.",
  save: "I save it for later.",
};

export function thoughtFor(feeling: FeelingRecord | null, act: ShopperAct | null, product: string): string {
  if (feeling) {
    const base = BY_FEELING[feeling.id] ?? `I feel ${feeling.name.toLowerCase()}.`;
    if (product && (feeling.id === "desire" || feeling.id === "curiosity")) {
      return `${base} About the ${product}.`;
    }
    return base;
  }
  if (act) return BY_ACT[act];
  return "Nothing in the ad catches me.";
}

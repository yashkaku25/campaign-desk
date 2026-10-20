/**
 * Everything that shapes one simulation week.
 * Creative, offer, page, audience, placement, objective, targeting, and sheet numbers.
 */

import {
  DEFAULT_TARGETING,
  type DetailedTargeting,
  type MetaObjectiveId,
} from "@/features/practice/meta/detailed-targeting";

export type { DetailedTargeting, MetaObjectiveId };

export interface SimulationCreative {
  headline: string;
  primaryText: string;
  hasImage: boolean;
  hasVideo: boolean;
  videoHasWords: boolean;
  product: string;
  /** Where the click lands — people read this URL. */
  destinationUrl?: string;
}

export interface SimulationOffer {
  /** Price people would pay, in cents. 0 means unknown. */
  priceCents: number;
  /** Compare-at price on the ad, in cents. 0 means none. */
  compareAtCents: number;
  /** gift | tool | comfort | self */
  offerKind: "gift" | "tool" | "comfort" | "self";
  brandKnown: boolean;
  returnsClear: boolean;
  socialProof: "none" | "reviews" | "friend_bought" | "complaint";
  pageQuality: "fast" | "slow" | "confusing";
  /**
   * Extra human context that changes how people meet the ad.
   * These are not Meta settings — they are real-life influence.
   */
  device: "phone" | "desktop";
  scrollSpeed: "slow" | "normal" | "fast";
  timeOfDay: "morning" | "commute" | "evening" | "late";
  moneyMood: "tight" | "normal" | "flush";
  withOthers: boolean;
}

export interface SimulationAudience {
  mode: string;
  audienceKind: string;
  windowDays: number;
  interest: string;
  placement: "advantage" | "feed" | "reels" | "stories";
  optimizeFor:
    | "purchase"
    | "add_to_cart"
    | "landing_page"
    | "link_click"
    | "lead"
    | "messages"
    | "conversations";
}

export interface SimulationNumbers {
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  dailyBudgetCents: number;
}

export type ConversionLocationId =
  | "website"
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "instant_form"
  | "app"
  | "calls"
  | "other";

export interface SimulationSetup {
  creative: SimulationCreative;
  offer: SimulationOffer;
  audience: SimulationAudience;
  numbers: SimulationNumbers | null;
  /** Campaign objective — changes what a “result” means and how people behave. */
  objective?: MetaObjectiveId;
  /** Age, gender, location, interests, behaviors, custom audiences. */
  targeting?: DetailedTargeting;
  /** Where the result happens (website form, Messenger, WhatsApp…). */
  conversionLocation?: ConversionLocationId;
  conversionLocationOther?: string;
  /** Instant Form question count — longer forms raise abandon risk. */
  instantFormQuestionCount?: number;
  callPhoneNumber?: string;
  /** Marketer strategy tag for this run (e.g. feed_only, cut_budget). */
  strategyTag?: string;
}

export const DEFAULT_OFFER: SimulationOffer = {
  priceCents: 8900,
  compareAtCents: 12000,
  offerKind: "self",
  brandKnown: false,
  returnsClear: true,
  socialProof: "reviews",
  pageQuality: "fast",
  device: "phone",
  scrollSpeed: "normal",
  timeOfDay: "evening",
  moneyMood: "normal",
  withOthers: false,
};

export { DEFAULT_TARGETING };

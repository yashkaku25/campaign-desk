/**
 * In-memory Meta Ads Manager drafts for Simulation.
 * These do not write desk campaigns. Publish only runs the local week.
 */

import type { DetailedTargeting } from "@/features/practice/meta/detailed-targeting";
import type { InstantFormConfig } from "@/features/practice/meta/instant-form";
import type { DeviceId, PlacementSurfaceId } from "@/features/practice/meta/placements";

export type { InstantFormConfig, DeviceId, PlacementSurfaceId };

export type MetaObjective =
  | "awareness"
  | "traffic"
  | "engagement"
  | "leads"
  | "app"
  | "sales";

export type MetaDelivery =
  | "active"
  | "learning"
  | "learning_limited"
  | "creative_limited"
  | "creative_fatigue"
  | "off"
  | "scheduled"
  | "in_review"
  | "campaign_off";

export type MetaLevel = "campaigns" | "adsets" | "ads";

export type CreateStep =
  | "objective"
  | "campaign"
  | "setup_path"
  | "adset"
  | "ad"
  | "review";

export interface MetaAdCreative {
  id: string;
  label: "A" | "B";
  headline: string;
  primaryText: string;
  description: string;
  hasImage: boolean;
  hasVideo: boolean;
  videoHasWords: boolean;
  cta: string;
  destinationUrl: string;
  /** Local object URL or data URL for uploaded image/video preview. */
  mediaDataUrl: string | null;
  mediaKind: "none" | "image" | "video";
}

export interface MetaAd {
  id: string;
  adSetId: string;
  campaignId: string;
  name: string;
  on: boolean;
  delivery: MetaDelivery;
  pageName: string;
  format: "single_image" | "single_video" | "carousel";
  creatives: MetaAdCreative[];
  results: number;
  costPerResultCents: number | null;
  spendCents: number;
}

export type ConversionLocation =
  | "website"
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "instant_form"
  | "app"
  | "calls"
  | "other";

export interface MetaAdSet {
  id: string;
  campaignId: string;
  name: string;
  on: boolean;
  delivery: MetaDelivery;
  audienceKind: string;
  audienceMode: "advantage" | "manual";
  interest: string;
  /** Coarse placement for the sim engine. */
  placement: "advantage" | "feed" | "reels" | "stories";
  /** Advantage+ vs manual surface picks. */
  placementMode: "advantage" | "manual";
  /** Exact FB / IG / AN / Messenger / WhatsApp surfaces when manual. */
  placementSurfaces: PlacementSurfaceId[];
  optimizeFor: "purchase" | "add_to_cart" | "landing_page" | "link_click" | "lead" | "messages" | "conversations";
  windowDays: number;
  attribution: "7c1v" | "1c" | "7c";
  dailyBudgetCents: number;
  bidStrategy: "lowest_cost" | "cost_cap" | "bid_cap";
  scheduleStart: string;
  scheduleEnd: string;
  /** Where the result happens — website, Messenger, WhatsApp, form, etc. */
  conversionLocation: ConversionLocation;
  conversionLocationOther: string;
  /** Website people land on when conversion location is website. */
  websiteUrl: string;
  /** Click-to-call number when conversion location is calls. */
  callPhoneNumber: string;
  /** App store / deep link when conversion location is app. */
  appStoreUrl: string;
  /** Instant Form definition when conversion location is instant_form. */
  instantForm: InstantFormConfig | null;
  /** Empty = all devices. Otherwise Android / iOS / tablet / desktop. */
  devices: DeviceId[];
  dayParting: "all_day" | "business" | "evenings" | "custom";
  dayPartingNote: string;
  /** Free-text extras the marketer types when a list is not enough. */
  audienceNote: string;
  interestOther: string;
  results: number;
  costPerResultCents: number | null;
  spendCents: number;
  reach: number;
  frequency: number;
  targeting: DetailedTargeting;
}

export interface MetaCampaign {
  id: string;
  name: string;
  on: boolean;
  delivery: MetaDelivery;
  objective: MetaObjective;
  buyingType: "auction" | "reserved";
  specialCategory: string;
  budgetLevel: "campaign" | "ad_set";
  dailyBudgetCents: number;
  deskCampaignId: string | null;
  results: number;
  costPerResultCents: number | null;
  spendCents: number;
  attribution: string;
}

export interface DeskSeed {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  dailyBudgetCents: number;
  status?: string;
  headline?: string | null;
  primaryText?: string | null;
  product?: string | null;
}

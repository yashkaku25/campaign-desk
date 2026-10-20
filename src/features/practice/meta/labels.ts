import type { MetaDelivery, MetaObjective } from "@/features/practice/meta/draft-types";
import { last30DaysLabel } from "@/features/practice/services/ads-manager-rows";

export const OBJECTIVE_COPY: Record<
  MetaObjective,
  { name: string; blurb: string; icon: string }
> = {
  awareness: {
    name: "Awareness",
    blurb: "Show your ads to people most likely to remember them.",
    icon: "📢",
  },
  traffic: {
    name: "Traffic",
    blurb: "Send people to a destination such as your website or app.",
    icon: "↗",
  },
  engagement: {
    name: "Engagement",
    blurb: "Get more messages, video views, or post engagement.",
    icon: "💬",
  },
  leads: {
    name: "Leads",
    blurb: "Collect leads for your business or brand.",
    icon: "▽",
  },
  app: {
    name: "App promotion",
    blurb: "Get more installs or actions in your app.",
    icon: "👥",
  },
  sales: {
    name: "Sales",
    blurb: "Find people likely to purchase your product or service.",
    icon: "🛍",
  },
};

export const DELIVERY_LABEL: Record<MetaDelivery, string> = {
  active: "Active",
  learning: "Learning",
  learning_limited: "Learning limited",
  creative_limited: "Creative limited",
  creative_fatigue: "Creative fatigue",
  off: "Off",
  scheduled: "Scheduled",
  in_review: "In review",
  campaign_off: "Campaign off",
};

export const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7", label: "Last 7 days" },
  { id: "last_14", label: "Last 14 days" },
  { id: "last_28", label: "Last 28 days" },
  { id: "last_30", label: last30DaysLabel(new Date(Date.UTC(2026, 9, 19))) },
  { id: "this_month", label: "This month" },
  { id: "maximum", label: "Maximum" },
] as const;

export const FILTER_CHIPS = [
  { id: "all", label: "All" },
  { id: "active", label: "On" },
  { id: "delivery", label: "Spent" },
  { id: "actions", label: "Needs care" },
] as const;

/**
 * Meta-style audience controls for Simulation.
 * Custom audiences = your data. Detailed targeting = age, gender, demographics, interests, behaviors.
 * Sensitive categories removed in 2022; detailed exclusions removed in 2025.
 */

export interface DetailedTargeting {
  ageMin: number;
  ageMax: number;
  gender: "all" | "men" | "women";
  locations: string[];
  languages: string[];
  interests: string[];
  behaviors: string[];
  demographics: string[];
  customAudiences: string[];
  /** Free-text when a chip list is not enough. */
  locationOther?: string;
  interestOther?: string;
  behaviorOther?: string;
  demographicOther?: string;
  customOther?: string;
  excludeNote?: string;
}

export const DEFAULT_TARGETING: DetailedTargeting = {
  ageMin: 25,
  ageMax: 54,
  gender: "all",
  locations: ["us"],
  languages: ["en"],
  /** Default both store + online so the marketer sees they are separate picks. */
  interests: ["shopping", "online_shopping"],
  behaviors: ["engaged_shoppers"],
  demographics: [],
  customAudiences: ["site_cart"],
  locationOther: "",
  interestOther: "",
  behaviorOther: "",
  demographicOther: "",
  customOther: "",
  excludeNote: "",
};

export const AGE_PRESETS = [
  { id: "18-24", min: 18, max: 24, label: "18–24" },
  { id: "25-34", min: 25, max: 34, label: "25–34" },
  { id: "35-44", min: 35, max: 44, label: "35–44" },
  { id: "45-54", min: 45, max: 54, label: "45–54" },
  { id: "55-65", min: 55, max: 65, label: "55–65+" },
  { id: "18-65", min: 18, max: 65, label: "18–65+" },
] as const;

export const GENDERS = [
  { id: "all", label: "All genders" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
] as const;

export const LOCATIONS = [
  { id: "us", label: "United States", kind: "country" },
  { id: "in", label: "India", kind: "country" },
  { id: "gb", label: "United Kingdom", kind: "country" },
  { id: "ca", label: "Canada", kind: "country" },
  { id: "au", label: "Australia", kind: "country" },
  { id: "nyc", label: "New York, NY", kind: "city" },
  { id: "la", label: "Los Angeles, CA", kind: "city" },
  { id: "mumbai", label: "Mumbai, India", kind: "city" },
  { id: "london", label: "London, UK", kind: "city" },
] as const;

export const LANGUAGES = [
  { id: "en", label: "English (All)" },
  { id: "hi", label: "Hindi" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
] as const;

/**
 * Full Facebook interest catalog from The-Complete-List-of-Facebook-Interests.pdf.
 * Re-export so AudienceBuilder and facts keep using INTEREST_LEAVES.
 */
export {
  FACEBOOK_INTERESTS as INTEREST_LEAVES,
  FACEBOOK_INTEREST_GROUPS as INTEREST_GROUPS,
  type FacebookInterest,
} from "@/features/practice/meta/facebook-interests";

export const BEHAVIOR_LEAVES = [
  { id: "engaged_shoppers", label: "Engaged shoppers", group: "Purchase" },
  { id: "online_buyers", label: "Online shoppers", group: "Purchase" },
  { id: "mobile_device", label: "Mobile device users", group: "Digital activities" },
  { id: "iphone", label: "Facebook access (mobile): iPhones", group: "Device" },
  { id: "android", label: "Facebook access (mobile): Android", group: "Device" },
  { id: "travel", label: "Frequent travelers", group: "Travel" },
  { id: "commuters", label: "Commuters", group: "Travel" },
  { id: "anniversary", label: "Anniversary within 61–90 days", group: "Life events" },
  { id: "page_admins", label: "Facebook Page admins", group: "Digital activities" },
] as const;

export const DEMOGRAPHIC_LEAVES = [
  { id: "relationship_single", label: "Single", group: "Relationship" },
  { id: "relationship_married", label: "Married", group: "Relationship" },
  { id: "education_college", label: "College grad", group: "Education" },
  { id: "education_high", label: "High school grad", group: "Education" },
  { id: "work_business", label: "Business and finance", group: "Work" },
  { id: "life_new_job", label: "New job", group: "Life events" },
  { id: "life_moved", label: "Recently moved", group: "Life events" },
  { id: "life_engaged", label: "Newly engaged", group: "Life events" },
  { id: "parents_all", label: "Parents (All)", group: "Parents" },
  { id: "parents_toddlers", label: "Parents with toddlers", group: "Parents" },
  { id: "parents_teens", label: "Parents with teenagers", group: "Parents" },
] as const;

export type MetaObjectiveId =
  | "awareness"
  | "traffic"
  | "engagement"
  | "leads"
  | "app"
  | "sales";

/** Default optimization event for each campaign objective. */
export function optimizeForObjective(
  objective: MetaObjectiveId,
): "purchase" | "add_to_cart" | "landing_page" | "link_click" | "lead" | "messages" {
  if (objective === "sales") return "purchase";
  if (objective === "leads") return "lead";
  if (objective === "traffic") return "landing_page";
  if (objective === "engagement") return "messages";
  if (objective === "awareness" || objective === "app") return "link_click";
  return "purchase";
}

export function resultNoun(objective: MetaObjectiveId): string {
  if (objective === "sales") return "purchases";
  if (objective === "leads") return "leads";
  if (objective === "traffic") return "landing page views";
  if (objective === "engagement") return "messaging conversations";
  if (objective === "awareness") return "people reached";
  if (objective === "app") return "app events";
  return "results";
}

export function summarizeTargeting(targeting: DetailedTargeting): string {
  const ages = `${targeting.ageMin}–${targeting.ageMax}`;
  const gender = GENDERS.find((item) => item.id === targeting.gender)?.label ?? "All";
  const places = [
    ...targeting.locations.map((id) => LOCATIONS.find((item) => item.id === id)?.label ?? id),
    ...(targeting.locationOther?.trim() ? [targeting.locationOther.trim()] : []),
  ]
    .slice(0, 2)
    .join(", ");
  const interests =
    targeting.interests.length + (targeting.interestOther?.trim() ? 1 : 0);
  const customs =
    targeting.customAudiences.length + (targeting.customOther?.trim() ? 1 : 0);
  const extras = [
    targeting.behaviorOther?.trim() ? "custom behavior" : null,
    targeting.excludeNote?.trim() ? "exclusions" : null,
  ].filter(Boolean);
  return `${ages} · ${gender} · ${places || "No location"} · ${interests} interests · ${customs} custom${
    extras.length ? ` · ${extras.join(" · ")}` : ""
  }`;
}

/**
 * Audience choices for the simulation, matched to Meta Ads Manager in 2026.
 * Confirm a leaf in Ads Manager before treating a name as still live.
 */

export interface AudienceOption {
  id: string;
  name: string;
  group: string;
  note?: string;
}

export const AUDIENCE_MODES: AudienceOption[] = [
  { id: "advantage", name: "Advantage+ audience", group: "Mode", note: "Interests are a hint. Delivery can go outside them." },
  { id: "original", name: "Original audiences", group: "Mode", note: "The audience stays fixed." },
];

export const CUSTOM_AUDIENCES: AudienceOption[] = [
  { id: "customer_list", name: "Customer list", group: "Custom" },
  { id: "site_all", name: "All website visitors", group: "Custom" },
  { id: "site_product", name: "Product page viewers", group: "Custom" },
  { id: "site_cart", name: "Added to cart", group: "Custom" },
  { id: "site_checkout", name: "Started checkout", group: "Custom" },
  { id: "site_purchase", name: "Purchasers", group: "Custom" },
  { id: "site_lead", name: "Website leads", group: "Custom" },
  { id: "video_3s", name: "Watched 3 seconds", group: "Custom" },
  { id: "video_25", name: "Watched 25%", group: "Custom" },
  { id: "video_50", name: "Watched 50%", group: "Custom" },
  { id: "video_75", name: "Watched 75%", group: "Custom" },
  { id: "video_95", name: "Watched 95%", group: "Custom" },
  { id: "video_thruplay", name: "ThruPlay", group: "Custom" },
  { id: "page_engaged", name: "Page engagers", group: "Custom" },
  { id: "instagram_engaged", name: "Instagram engagers", group: "Custom" },
  { id: "lead_form_open", name: "Opened a lead form", group: "Custom" },
  { id: "lead_form_submit", name: "Submitted a lead form", group: "Custom" },
  { id: "message_open", name: "Opened a message", group: "Custom" },
  { id: "app_install", name: "App installs", group: "Custom" },
];

export const LOOKALIKE_SIZES: AudienceOption[] = [
  { id: "lal_1", name: "1% lookalike", group: "Lookalike", note: "Tightest match. Needs at least 100 people from one country." },
  { id: "lal_2", name: "2% lookalike", group: "Lookalike" },
  { id: "lal_3", name: "3% lookalike", group: "Lookalike" },
  { id: "lal_5", name: "5% lookalike", group: "Lookalike" },
  { id: "lal_10", name: "10% lookalike", group: "Lookalike", note: "Widest. Better for awareness than for a purchase." },
];

export const WINDOWS: AudienceOption[] = [
  { id: "d1", name: "1 day", group: "Window" },
  { id: "d3", name: "3 days", group: "Window" },
  { id: "d7", name: "7 days", group: "Window" },
  { id: "d14", name: "14 days", group: "Window" },
  { id: "d30", name: "30 days", group: "Window" },
  { id: "d60", name: "60 days", group: "Window" },
  { id: "d90", name: "90 days", group: "Window" },
  { id: "d180", name: "180 days", group: "Window" },
];

export const INTEREST_GROUPS: AudienceOption[] = [
  { id: "business", name: "Business and industry", group: "Interest" },
  { id: "entertainment", name: "Entertainment", group: "Interest" },
  { id: "family", name: "Family and relationships", group: "Interest" },
  { id: "fitness", name: "Fitness and wellness", group: "Interest" },
  { id: "food", name: "Food and drink", group: "Interest" },
  { id: "hobbies", name: "Hobbies and activities", group: "Interest" },
  { id: "shopping", name: "Shopping and fashion", group: "Interest" },
  { id: "sports", name: "Sports and outdoors", group: "Interest" },
  { id: "technology", name: "Technology", group: "Interest" },
];

export const BEHAVIORS: AudienceOption[] = [
  { id: "page_admins", name: "Facebook Page admins", group: "Behavior" },
  { id: "engaged_shoppers", name: "Engaged shoppers", group: "Behavior", note: "Tapped Shop now in the past week." },
  { id: "mobile_device", name: "Mobile device user", group: "Behavior" },
  { id: "travel", name: "Frequent travelers", group: "Behavior" },
  { id: "expats", name: "Expats", group: "Behavior" },
  { id: "anniversary", name: "Anniversary in 61 to 90 days", group: "Behavior" },
];

export const DEMOGRAPHICS: AudienceOption[] = [
  { id: "age", name: "Age", group: "Demographics" },
  { id: "gender", name: "Gender", group: "Demographics" },
  { id: "relationship", name: "Relationship status", group: "Demographics" },
  { id: "education", name: "Education", group: "Demographics" },
  { id: "work", name: "Work and job title", group: "Demographics" },
  { id: "life_events", name: "Life events", group: "Demographics" },
  { id: "parents", name: "Parents", group: "Demographics" },
  { id: "income_us", name: "US ZIP income bands", group: "Demographics", note: "United States only." },
];

export const REMOVED_TARGETING: AudienceOption[] = [
  { id: "health", name: "Health causes", group: "Removed", note: "Removed in 2022." },
  { id: "orientation", name: "Sexual orientation", group: "Removed", note: "Removed in 2022." },
  { id: "religion", name: "Religious practices", group: "Removed", note: "Removed in 2022." },
  { id: "politics", name: "Political beliefs", group: "Removed", note: "Removed in 2022." },
  { id: "detailed_exclusions", name: "Detailed targeting exclusions", group: "Removed", note: "Removed in 2025. Use a custom audience exclusion instead." },
  { id: "connections", name: "Page likes and friends of fans", group: "Removed", note: "Use a page engagement custom audience." },
];

export const SPECIAL_LIMITS =
  "Housing, employment, and financial ads cannot use age, gender, ZIP, lookalikes, or most detailed targeting. Location needs at least a 15 mile radius.";

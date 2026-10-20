/**
 * Meta campaign choices still offered in 2026.
 * Checked against public Ads Manager guides from 2026. This is not a live account browse.
 */

export interface NamedOption {
  id: string;
  name: string;
  note?: string;
}

export const OBJECTIVES: NamedOption[] = [
  { id: "awareness", name: "Awareness" },
  { id: "traffic", name: "Traffic" },
  { id: "engagement", name: "Engagement" },
  { id: "leads", name: "Leads" },
  { id: "app", name: "App promotion" },
  { id: "sales", name: "Sales" },
];

export const BUYING_TYPES: NamedOption[] = [
  { id: "auction", name: "Auction" },
  { id: "reserved", name: "Reservation", note: "Reach and frequency. Not the everyday auction." },
];

export const SPECIAL_CATEGORIES: NamedOption[] = [
  { id: "none", name: "None" },
  { id: "housing", name: "Housing" },
  { id: "employment", name: "Employment" },
  { id: "financial", name: "Financial products and services", note: "This replaced the old Credit category in 2024." },
  { id: "politics", name: "Social issues, elections, or politics" },
];

export const BUDGET_LEVELS: NamedOption[] = [
  { id: "campaign", name: "Advantage campaign budget" },
  { id: "ad_set", name: "Budget on each ad set" },
];

export const BUDGET_KINDS: NamedOption[] = [
  { id: "daily", name: "Daily budget" },
  { id: "lifetime", name: "Lifetime budget" },
];

export const BID_TYPES: NamedOption[] = [
  { id: "highest_volume", name: "Highest volume" },
  { id: "cost_goal", name: "Cost per result goal" },
  { id: "bid_cap", name: "Bid cap" },
  { id: "roas", name: "Return on ad spend goal" },
];

export const OPTIMIZATION_EVENTS: NamedOption[] = [
  { id: "reach", name: "Reach" },
  { id: "impressions", name: "Impressions" },
  { id: "thruplay", name: "ThruPlay" },
  { id: "link_click", name: "Link clicks" },
  { id: "landing_page", name: "Landing page views" },
  { id: "lead", name: "Leads" },
  { id: "conversation", name: "Conversations" },
  { id: "app_install", name: "App installs" },
  { id: "view_content", name: "View content" },
  { id: "add_to_cart", name: "Add to cart" },
  { id: "checkout", name: "Checkout started" },
  { id: "purchase", name: "Purchase" },
  { id: "value", name: "Purchase value" },
];

export const RESULT_PLACES: NamedOption[] = [
  { id: "website", name: "Website" },
  { id: "instant_form", name: "Instant form" },
  { id: "app", name: "App" },
  { id: "messenger", name: "Messenger" },
  { id: "instagram", name: "Instagram" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "calls", name: "Calls" },
];

export const ATTRIBUTION_WINDOWS: NamedOption[] = [
  { id: "click_1", name: "1-day click" },
  { id: "click_7", name: "7-day click" },
  { id: "click_2_to_7", name: "Clicks from day 2 through day 7" },
  { id: "engaged_1", name: "1-day engaged view" },
  { id: "view_1", name: "1-day view" },
];

export const PLACEMENTS: NamedOption[] = [
  { id: "advantage", name: "Advantage+ placements" },
  { id: "facebook_feed", name: "Facebook Feed" },
  { id: "instagram_feed", name: "Instagram Feed" },
  { id: "facebook_marketplace", name: "Facebook Marketplace" },
  { id: "facebook_video_feeds", name: "Facebook video feeds" },
  { id: "instagram_explore", name: "Instagram Explore" },
  { id: "threads_feed", name: "Threads feed" },
  { id: "facebook_stories", name: "Facebook Stories" },
  { id: "instagram_stories", name: "Instagram Stories" },
  { id: "facebook_reels", name: "Facebook Reels" },
  { id: "instagram_reels", name: "Instagram Reels" },
  { id: "whatsapp_status", name: "WhatsApp Status" },
  { id: "instream", name: "In-stream video" },
  { id: "facebook_search", name: "Facebook search" },
  { id: "marketplace_search", name: "Marketplace search" },
  { id: "messenger_inbox", name: "Messenger inbox" },
  { id: "messenger_stories", name: "Messenger Stories" },
  { id: "audience_network", name: "Audience Network" },
  { id: "audience_network_rewarded", name: "Audience Network rewarded video" },
];

export const AD_FORMATS: NamedOption[] = [
  { id: "image", name: "Single image" },
  { id: "video", name: "Video" },
  { id: "carousel", name: "Carousel" },
  { id: "collection", name: "Collection" },
  { id: "catalog", name: "Catalog card" },
  { id: "instant_experience", name: "Instant experience" },
];

export const CALL_TO_ACTIONS: NamedOption[] = [
  { id: "shop_now", name: "Shop now" },
  { id: "learn_more", name: "Learn more" },
  { id: "sign_up", name: "Sign up" },
  { id: "book_now", name: "Book now" },
  { id: "contact_us", name: "Contact us" },
  { id: "download", name: "Download" },
  { id: "get_offer", name: "Get offer" },
  { id: "get_quote", name: "Get quote" },
  { id: "subscribe", name: "Subscribe" },
  { id: "watch_more", name: "Watch more" },
  { id: "apply_now", name: "Apply now" },
  { id: "send_message", name: "Send message" },
  { id: "whatsapp_message", name: "WhatsApp message" },
  { id: "call_now", name: "Call now" },
];

export const DELIVERY_STATES: NamedOption[] = [
  { id: "in_review", name: "In review" },
  { id: "rejected", name: "Rejected" },
  { id: "learning", name: "Learning", note: "About 50 results in 7 days." },
  { id: "learning_limited", name: "Learning limited" },
  { id: "active", name: "Active" },
  { id: "not_delivering", name: "Not delivering" },
];

export const AUDIENCE_MODES: NamedOption[] = [
  { id: "advantage", name: "Advantage+ audience", note: "Interests are a suggestion. Delivery can go outside them." },
  { id: "original", name: "Original audiences", note: "The audience stays fixed. Use this when the test is the creative." },
];

export const LOCATION_TYPES: NamedOption[] = [
  { id: "living_in", name: "People living in this place" },
  { id: "recently_in", name: "People recently in this place" },
  { id: "traveling", name: "People traveling in this place" },
];

export const HARD_CONTROLS: NamedOption[] = [
  { id: "location", name: "Location" },
  { id: "minimum_age", name: "Minimum age" },
  { id: "language", name: "Language" },
  { id: "custom_exclusion", name: "Custom audience exclusion" },
  { id: "special_category", name: "Special ad category" },
];

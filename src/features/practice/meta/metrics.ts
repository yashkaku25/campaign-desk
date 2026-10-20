/**
 * Metric names Ads Manager can show. Counts come from delivery. Costs are spend divided by a count.
 * Grouped from a 2026 Meta metrics reference. A blank count stays blank.
 */

export interface MetricOption {
  id: string;
  name: string;
  group: string;
}

function metric(group: string, id: string, name: string): MetricOption {
  return { group, id, name };
}

export const METRICS: MetricOption[] = [
  metric("Delivery", "spend", "Amount spent"),
  metric("Delivery", "social_spend", "Spend from people who saw a friend engage"),
  metric("Delivery", "impressions", "Impressions"),
  metric("Delivery", "reach", "Reach"),
  metric("Delivery", "frequency", "Frequency"),
  metric("Delivery", "cpm", "Cost per 1,000 impressions"),
  metric("Delivery", "cost_per_1000_reached", "Cost per 1,000 people reached"),
  metric("Clicks", "clicks_all", "Clicks, all"),
  metric("Clicks", "unique_clicks", "Unique clicks"),
  metric("Clicks", "link_clicks", "Link clicks"),
  metric("Clicks", "unique_link_clicks", "Unique link clicks"),
  metric("Clicks", "outbound_clicks", "Outbound clicks"),
  metric("Clicks", "unique_outbound_clicks", "Unique outbound clicks"),
  metric("Clicks", "ctr_all", "Click-through rate, all"),
  metric("Clicks", "unique_ctr_all", "Unique click-through rate, all"),
  metric("Clicks", "ctr_link", "Link click-through rate"),
  metric("Clicks", "unique_ctr_link", "Unique link click-through rate"),
  metric("Clicks", "ctr_outbound", "Outbound click-through rate"),
  metric("Clicks", "cpc_all", "Cost per click, all"),
  metric("Clicks", "cpc_link", "Cost per link click"),
  metric("Clicks", "cpc_outbound", "Cost per outbound click"),
  metric("Funnel", "landing_page_views", "Landing page views"),
  metric("Funnel", "content_views", "Content views"),
  metric("Funnel", "adds_to_cart", "Adds to cart"),
  metric("Funnel", "adds_to_wishlist", "Adds to wishlist"),
  metric("Funnel", "checkouts", "Checkouts started"),
  metric("Funnel", "payment_info", "Payment info added"),
  metric("Funnel", "purchases", "Purchases"),
  metric("Funnel", "website_searches", "Searches on the site"),
  metric("Funnel", "registrations", "Registrations completed"),
  metric("Funnel", "website_leads", "Website leads"),
  metric("Funnel", "form_leads", "Instant form leads"),
  metric("Funnel", "subscriptions", "Subscriptions"),
  metric("Funnel", "trials", "Trials started"),
  metric("Funnel", "applications", "Applications submitted"),
  metric("Funnel", "contacts", "Contacts"),
  metric("Funnel", "schedules", "Appointments scheduled"),
  metric("Value", "purchase_value", "Purchase value"),
  metric("Value", "roas", "Return on ad spend"),
  metric("Value", "website_purchase_roas", "Website purchase return on ad spend"),
  metric("Value", "content_view_value", "Content view value"),
  metric("Value", "cart_value", "Add to cart value"),
  metric("Value", "checkout_value", "Checkout value"),
  metric("Value", "lead_value", "Lead value"),
  metric("On platform", "reactions", "Post reactions"),
  metric("On platform", "comments", "Comments"),
  metric("On platform", "shares", "Shares"),
  metric("On platform", "saves", "Saves"),
  metric("On platform", "page_likes", "Page likes"),
  metric("On platform", "photo_views", "Photo views"),
  metric("On platform", "messaging_conversations", "New messaging conversations"),
  metric("On platform", "messaging_7_day", "New conversations within 7 days"),
  metric("On platform", "messaging_blocked", "Blocked conversations"),
  metric("On platform", "on_facebook_purchases", "Purchases on Facebook"),
  metric("On platform", "on_facebook_leads", "Leads on Facebook"),
  metric("Video", "video_plays", "Video plays"),
  metric("Video", "video_3s", "3-second video views"),
  metric("Video", "video_30s", "30-second video views"),
  metric("Video", "thruplay", "ThruPlay"),
  metric("Video", "video_avg_time", "Average watch time"),
  metric("Video", "video_p25", "Watched 25%"),
  metric("Video", "video_p50", "Watched 50%"),
  metric("Video", "video_p75", "Watched 75%"),
  metric("Video", "video_p95", "Watched 95%"),
  metric("Video", "video_p100", "Watched 100%"),
  metric("Video", "hook_rate", "Hook rate"),
  metric("Video", "hold_rate", "Hold rate"),
  metric("Awareness", "estimated_recall_people", "Estimated people who would remember the ad"),
  metric("Awareness", "estimated_recall_rate", "Estimated recall rate"),
  metric("Awareness", "cost_per_recall", "Cost per remembered person"),
  metric("Quality", "quality_ranking", "Quality ranking"),
  metric("Quality", "engagement_ranking", "Engagement rate ranking"),
  metric("Quality", "conversion_ranking", "Conversion rate ranking"),
  metric("App", "app_installs", "App installs"),
  metric("App", "app_starts", "App starts"),
  metric("App", "app_purchases", "In-app purchases"),
  metric("App", "app_registrations", "In-app registrations"),
  metric("App", "app_content_views", "In-app content views"),
  metric("App", "app_adds_to_cart", "In-app adds to cart"),
  metric("App", "app_checkouts", "In-app checkouts"),
  metric("App", "app_tutorials", "Tutorials completed"),
  metric("App", "app_levels", "Levels completed"),
  metric("App", "app_achievements", "Achievements unlocked"),
  metric("Retargeting", "window_pool", "People in each window"),
  metric("Retargeting", "excluded_people", "People excluded"),
  metric("Retargeting", "warm_frequency", "Frequency in the warm set"),
  metric("Retargeting", "cost_cold_vs_warm", "Cost per result, cold versus warm"),
  metric("Retargeting", "audience_overlap", "Overlap between ad sets"),
];

export const BREAKDOWNS: NamedBreakdown[] = [
  { id: "age", name: "Age" },
  { id: "gender", name: "Gender" },
  { id: "country", name: "Country" },
  { id: "region", name: "Region" },
  { id: "placement", name: "Placement" },
  { id: "platform", name: "Platform" },
  { id: "device", name: "Device" },
  { id: "time_of_day", name: "Time of day" },
  { id: "product", name: "Product" },
  { id: "audience", name: "Cold versus each warm window" },
  { id: "attribution", name: "Attribution window" },
];

export interface NamedBreakdown {
  id: string;
  name: string;
}

export const QUALITY_RANKS = [
  "Above average",
  "Average",
  "Below average, bottom 35%",
  "Below average, bottom 20%",
  "Below average, bottom 10%",
  "Unknown",
] as const;

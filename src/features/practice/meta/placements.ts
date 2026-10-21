/**
 * Where the ad can show, Facebook, Instagram, Audience Network, Messenger, WhatsApp.
 * Advantage+ uses all eligible surfaces; manual lets the marketer pick.
 */

export type PlacementSurfaceId =
  | "fb_feed"
  | "fb_reels"
  | "fb_stories"
  | "fb_right_column"
  | "fb_marketplace"
  | "ig_feed"
  | "ig_stories"
  | "ig_reels"
  | "ig_explore"
  | "ig_search"
  | "an_native"
  | "an_banner"
  | "messenger_inbox"
  | "messenger_stories"
  | "whatsapp_status";

export interface PlacementSurface {
  id: PlacementSurfaceId;
  label: string;
  platform: "Facebook" | "Instagram" | "Audience Network" | "Messenger" | "WhatsApp";
  blurb: string;
}

export const PLACEMENT_SURFACES: readonly PlacementSurface[] = [
  { id: "fb_feed", label: "Facebook Feed", platform: "Facebook", blurb: "Main scrolling feed on phone and desktop" },
  { id: "fb_reels", label: "Facebook Reels", platform: "Facebook", blurb: "Short vertical video" },
  { id: "fb_stories", label: "Facebook Stories", platform: "Facebook", blurb: "Full-screen between friends’ stories" },
  { id: "fb_right_column", label: "Facebook Right column", platform: "Facebook", blurb: "Desktop sidebar next to Feed" },
  { id: "fb_marketplace", label: "Facebook Marketplace", platform: "Facebook", blurb: "Browse and sell surfaces" },
  { id: "ig_feed", label: "Instagram Feed", platform: "Instagram", blurb: "Home feed posts" },
  { id: "ig_stories", label: "Instagram Stories", platform: "Instagram", blurb: "Full-screen stories" },
  { id: "ig_reels", label: "Instagram Reels", platform: "Instagram", blurb: "Reels tab and feed embeds" },
  { id: "ig_explore", label: "Instagram Explore", platform: "Instagram", blurb: "Explore grid" },
  { id: "ig_search", label: "Instagram Search results", platform: "Instagram", blurb: "Suggested results while searching" },
  { id: "an_native", label: "Audience Network native", platform: "Audience Network", blurb: "In-app native units off Meta apps" },
  { id: "an_banner", label: "Audience Network banner", platform: "Audience Network", blurb: "Banner / interstitial off Meta apps" },
  { id: "messenger_inbox", label: "Messenger Inbox", platform: "Messenger", blurb: "Sponsored thread in inbox" },
  { id: "messenger_stories", label: "Messenger Stories", platform: "Messenger", blurb: "Stories inside Messenger" },
  { id: "whatsapp_status", label: "WhatsApp Status", platform: "WhatsApp", blurb: "Status updates people swipe through" },
] as const;

export const PLACEMENT_PLATFORMS = [
  "Facebook",
  "Instagram",
  "Audience Network",
  "Messenger",
  "WhatsApp",
] as const;

export type DeviceId = "android" | "ios" | "tablet" | "desktop";

export const DEVICE_OPTIONS: readonly { id: DeviceId; label: string; blurb: string }[] = [
  { id: "android", label: "Android phones", blurb: "Phones on Android" },
  { id: "ios", label: "iPhone (iOS)", blurb: "iPhones only, not iPad" },
  { id: "tablet", label: "Tablets", blurb: "iPad and Android tablets" },
  { id: "desktop", label: "Desktop", blurb: "Laptop and desktop browsers" },
] as const;

export const DEFAULT_SURFACES: PlacementSurfaceId[] = [
  "fb_feed",
  "fb_reels",
  "fb_stories",
  "ig_feed",
  "ig_stories",
  "ig_reels",
];

/** Collapse detailed surfaces into the sim engine’s coarse placement. */
export function coarsePlacement(
  mode: "advantage" | "manual",
  surfaces: PlacementSurfaceId[],
): "advantage" | "feed" | "reels" | "stories" {
  if (mode === "advantage" || surfaces.length === 0) return "advantage";
  const reels = surfaces.filter((id) => id.includes("reels")).length;
  const stories = surfaces.filter((id) => id.includes("stories") || id === "whatsapp_status").length;
  const feed = surfaces.filter((id) => id.includes("feed") || id.includes("explore") || id.includes("marketplace")).length;
  if (reels >= stories && reels >= feed) return "reels";
  if (stories >= feed) return "stories";
  return "feed";
}

export function summarizeSurfaces(mode: "advantage" | "manual", surfaces: PlacementSurfaceId[]): string {
  if (mode === "advantage") return "Advantage+ (Meta picks surfaces)";
  if (surfaces.length === 0) return "No surfaces selected";
  if (surfaces.length <= 2) {
    return surfaces
      .map((id) => PLACEMENT_SURFACES.find((item) => item.id === id)?.label ?? id)
      .join(", ");
  }
  return `${surfaces.length} surfaces`;
}

export function summarizeDevices(devices: DeviceId[]): string {
  if (devices.length === 0 || devices.length === DEVICE_OPTIONS.length) return "All devices";
  return devices
    .map((id) => DEVICE_OPTIONS.find((item) => item.id === id)?.label ?? id)
    .join(", ");
}

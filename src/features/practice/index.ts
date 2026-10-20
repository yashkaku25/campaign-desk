/**
 * Simulation. Meta Ads Manager shell plus shopper week.
 * It does not write campaigns and it does not call an ad account.
 * Real numbers still arrive through the sheet sync.
 */
export { AdsManager } from "@/features/practice/components/ads-manager/ads-manager";
export { FEELINGS } from "@/features/practice/emotions/catalog";
export { resolveShopper } from "@/features/practice/emotions/resolve";
export { factsFromSetup } from "@/features/practice/services/facts-from-setup";
export { buildMoments, countActs } from "@/features/practice/services/moments";
export { runPractice } from "@/features/practice/services/run-practice";
export { suggestMove } from "@/features/practice/services/suggest-move";
export { buildMetricStrip } from "@/features/practice/services/sim-metrics";
export {
  buildAdsManagerRows,
  filterAdsManagerRows,
  last30DaysLabel,
} from "@/features/practice/services/ads-manager-rows";
export { seedAccountFromDesk } from "@/features/practice/meta/seed-from-desk";

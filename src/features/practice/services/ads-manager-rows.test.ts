import { describe, expect, it } from "vitest";

import {
  buildAdsManagerRows,
  filterAdsManagerRows,
  last30DaysLabel,
  type DeskCampaignForAds,
} from "@/features/practice/services/ads-manager-rows";
import type { SimMetricStrip } from "@/features/practice/services/sim-metrics";

const campaign: DeskCampaignForAds = {
  id: "c1",
  name: "Quiet dryer",
  impressions: 1000,
  clicks: 40,
  spendCents: 5000,
  conversions: 3,
  dailyBudgetCents: 4000,
};

const emptyStrip: SimMetricStrip = {
  impressions: null,
  reach: null,
  frequency: null,
  linkCtr: null,
  cpcCents: null,
  cpmCents: null,
  results: null,
  costPerResultCents: null,
  learning: "unknown",
  learningLabel: "No sheet numbers yet",
  note: "Simulation.",
};

describe("buildAdsManagerRows", () => {
  it("builds campaign, ad set, and ad rows from a desk campaign", () => {
    const rows = buildAdsManagerRows({
      campaigns: [campaign],
      simulation: null,
      strip: null,
      counts: null,
      playing: false,
    });
    expect(rows.filter((row) => row.level === "campaigns")).toHaveLength(1);
    expect(rows.filter((row) => row.level === "ad_sets")).toHaveLength(1);
    expect(rows.filter((row) => row.level === "ads")).toHaveLength(1);
    expect(rows[0]?.delivery).toBe("Learning");
    expect(rows[0]?.hasDelivery).toBe(true);
  });

  it("marks a zero-impression desk campaign as not delivering", () => {
    const rows = buildAdsManagerRows({
      campaigns: [{ ...campaign, impressions: 0, spendCents: 0, conversions: 0 }],
      simulation: null,
      strip: null,
      counts: null,
      playing: false,
    });
    expect(rows[0]?.delivery).toBe("Not delivering");
    expect(rows[0]?.hasDelivery).toBe(false);
  });

  it("adds a simulation tree with Learning while playing", () => {
    const strip: SimMetricStrip = {
      ...emptyStrip,
      impressions: 800,
      results: 2,
      costPerResultCents: 1200,
      learning: "learning",
      learningLabel: "Learning",
    };
    const rows = buildAdsManagerRows({
      campaigns: [],
      simulation: {
        id: "sim1",
        name: "Sales · Quiet dryer",
        objectiveId: "sales",
        objectiveName: "Sales",
        on: true,
        attribution: "7-day click",
        dailyBudgetCents: 5000,
        deskCampaignId: null,
      },
      strip,
      counts: {
        stopped: 4,
        scrolled: 2,
        clicked: 3,
        hid: 0,
        bounced: 1,
        bought: 1,
        waited: 0,
        landing: 3,
        formOpen: 1,
        leads: 0,
        cart: 0,
        checkout: 0,
        purchases: 0,
        messages: 0,
        calls: 0,
        reported: 0,
      },
      playing: true,
    });
    const campaignRow = rows.find((row) => row.level === "campaigns");
    expect(campaignRow?.source).toBe("simulation");
    expect(campaignRow?.delivery).toBe("Learning");
    expect(campaignRow?.isSimulating).toBe(true);
    expect(rows).toHaveLength(3);
  });
});

describe("filterAdsManagerRows", () => {
  const rows = buildAdsManagerRows({
    campaigns: [
      campaign,
      { ...campaign, id: "c2", name: "Cold push", impressions: 0, spendCents: 0, conversions: 0 },
    ],
    simulation: null,
    strip: null,
    counts: null,
    playing: false,
  });

  it("keeps only the active tab level", () => {
    const ads = filterAdsManagerRows(rows, "ads", "all", "");
    expect(ads.every((row) => row.level === "ads")).toBe(true);
    expect(ads).toHaveLength(2);
  });

  it("filters Had delivery", () => {
    const delivered = filterAdsManagerRows(rows, "campaigns", "had_delivery", "");
    expect(delivered).toHaveLength(1);
    expect(delivered[0]?.name).toBe("Quiet dryer");
  });

  it("searches by name", () => {
    const found = filterAdsManagerRows(rows, "campaigns", "all", "cold");
    expect(found).toHaveLength(1);
    expect(found[0]?.name).toBe("Cold push");
  });
});

describe("last30DaysLabel", () => {
  it("formats Last 30 days with inclusive start", () => {
    const label = last30DaysLabel(new Date(Date.UTC(2026, 9, 19)));
    expect(label).toBe("Last 30 days: 20 Sep 2026 - 19 Oct 2026");
  });
});

import type { DeskSeed, MetaAd, MetaAdSet, MetaCampaign, MetaDelivery } from "@/features/practice/meta/draft-types";
import { DEFAULT_TARGETING } from "@/features/practice/meta/detailed-targeting";
import { prefillFromDesk } from "@/features/practice/services/desk-prefill";

export interface MetaAccountState {
  campaigns: MetaCampaign[];
  adSets: MetaAdSet[];
  ads: MetaAd[];
}

/** Turns desk campaigns into Ads Manager rows so the account is never a blank demo. */
export function seedAccountFromDesk(seeds: DeskSeed[]): MetaAccountState {
  const campaigns: MetaCampaign[] = [];
  const adSets: MetaAdSet[] = [];
  const ads: MetaAd[] = [];

  for (const seed of seeds) {
    const prefill = prefillFromDesk(seed);
    const on = seed.status !== "paused" && seed.status !== "ended";
    const delivery = deliveryFromNumbers(seed, on);
    const campaignId = `mc-${seed.id}`;
    const adSetId = `ms-${seed.id}`;
    const adId = `ma-${seed.id}`;
    const cpr =
      seed.conversions > 0 ? Math.round(seed.spendCents / seed.conversions) : null;

    campaigns.push({
      id: campaignId,
      name: seed.name,
      on,
      delivery,
      objective: "sales",
      buyingType: "auction",
      specialCategory: "none",
      budgetLevel: "ad_set",
      dailyBudgetCents: seed.dailyBudgetCents,
      deskCampaignId: seed.id,
      results: seed.conversions,
      costPerResultCents: cpr,
      spendCents: seed.spendCents,
      attribution: "7-day click, 1-day view",
    });

    adSets.push({
      id: adSetId,
      campaignId,
      name: `${seed.name} — Ad set`,
      on,
      delivery,
      audienceKind: "site_cart",
      audienceMode: "advantage",
      interest: "online_shopping",
      placement: "advantage",
      placementMode: "advantage",
      placementSurfaces: [],
      optimizeFor: "purchase",
      windowDays: 7,
      attribution: "7c1v",
      dailyBudgetCents: seed.dailyBudgetCents,
      bidStrategy: "lowest_cost",
      scheduleStart: "2026-10-13",
      scheduleEnd: "2026-10-20",
      conversionLocation: "website",
      conversionLocationOther: "",
      websiteUrl: "https://example.com",
      callPhoneNumber: "",
      appStoreUrl: "",
      instantForm: null,
      devices: [],
      dayParting: "all_day",
      dayPartingNote: "",
      audienceNote: "",
      interestOther: "",
      results: seed.conversions,
      costPerResultCents: cpr,
      spendCents: seed.spendCents,
      reach: Math.max(1, Math.round(seed.impressions / 1.8)),
      frequency: seed.impressions > 0 ? Math.round((seed.impressions / Math.max(1, seed.impressions / 1.8)) * 10) / 10 : 1,
      targeting: {
        ...DEFAULT_TARGETING,
        customAudiences: ["site_cart"],
        interests: ["shopping", "online_shopping"],
      },
    });

    ads.push({
      id: adId,
      adSetId,
      campaignId,
      name: `${seed.name} — Ad`,
      on,
      delivery,
      pageName: "Studio Page",
      format: "single_image",
      creatives: [
        {
          id: `${adId}-a`,
          label: "A",
          headline: prefill.headline || seed.name,
          primaryText: prefill.primaryText || seed.name,
          description: prefill.product || "",
          hasImage: true,
          hasVideo: false,
          videoHasWords: false,
          cta: "Shop now",
          destinationUrl: "https://example.com",
          mediaDataUrl: null,
          mediaKind: "none",
        },
        {
          id: `${adId}-b`,
          label: "B",
          headline: prefill.headlineB || `${seed.name} — B`,
          primaryText: prefill.primaryTextB || prefill.primaryText,
          description: prefill.product || "",
          hasImage: true,
          hasVideo: false,
          videoHasWords: false,
          cta: "Learn more",
          destinationUrl: "https://example.com",
          mediaDataUrl: null,
          mediaKind: "none",
        },
      ],
      results: seed.conversions,
      costPerResultCents: cpr,
      spendCents: seed.spendCents,
    });
  }

  return { campaigns, adSets, ads };
}

function deliveryFromNumbers(seed: DeskSeed, on: boolean): MetaDelivery {
  if (!on) return "off";
  if (seed.impressions === 0) return "scheduled";
  if (seed.conversions > 0 && seed.conversions < 50) return "learning";
  if (seed.conversions === 0 && seed.clicks >= 30) return "learning_limited";
  if (seed.impressions >= 5000 && seed.clicks / seed.impressions < 0.006) return "creative_fatigue";
  if (seed.impressions >= 2000 && seed.clicks / seed.impressions < 0.01) return "creative_limited";
  return "active";
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

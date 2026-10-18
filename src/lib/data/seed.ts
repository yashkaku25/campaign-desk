import { randomUUID } from "node:crypto";

import {
  CAMPAIGN_IDS,
  DEMO_END_DAY,
  DEMO_USER_ID,
  WORKSPACE_ID,
  type AppState,
  type Campaign,
  type CampaignStatus,
  type DailyMetric,
} from "@/lib/domain";

const DEMO_THREAD_ID = "44444444-4444-4444-8444-444444444444";

interface DemoSpec {
  id: string;
  index: number;
  name: string;
  status: CampaignStatus;
  dailyBudgetCents: number;
  ctr: number;
  baseImpressions: number;
  centsPerClick: number;
  conversionRate: number;
}

const SPECS: DemoSpec[] = [
  { id: CAMPAIGN_IDS.spring, index: 0, name: "Spring Launch", status: "active", dailyBudgetCents: 12_000, ctr: 0.041, baseImpressions: 8000, centsPerClick: 40, conversionRate: 0.08 },
  { id: CAMPAIGN_IDS.retarget, index: 1, name: "Retargeting Warm", status: "active", dailyBudgetCents: 8_000, ctr: 0.012, baseImpressions: 12000, centsPerClick: 55, conversionRate: 0.03 },
  { id: CAMPAIGN_IDS.prospect, index: 2, name: "Prospecting Cold", status: "active", dailyBudgetCents: 15_000, ctr: 0.008, baseImpressions: 15000, centsPerClick: 70, conversionRate: 0.02 },
  { id: CAMPAIGN_IDS.brand, index: 3, name: "Brand Video", status: "paused", dailyBudgetCents: 6_000, ctr: 0.033, baseImpressions: 4000, centsPerClick: 30, conversionRate: 0.05 },
  { id: CAMPAIGN_IDS.holdout, index: 4, name: "Holdout Creative", status: "active", dailyBudgetCents: 5_000, ctr: 0, baseImpressions: 0, centsPerClick: 0, conversionRate: 0 },
  { id: CAMPAIGN_IDS.holiday, index: 5, name: "Holiday Push", status: "ended", dailyBudgetCents: 4_000, ctr: 0.02, baseImpressions: 2000, centsPerClick: 25, conversionRate: 0.04 },
];

function shiftDay(isoDay: string, delta: number): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function createDemoMetrics(): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  for (const spec of SPECS) {
    for (let dayIndex = 0; dayIndex < 30; dayIndex += 1) {
      const day = shiftDay(DEMO_END_DAY, dayIndex - 29);
      if (spec.baseImpressions === 0) {
        metrics.push({ campaignId: spec.id, day, impressions: 0, clicks: 0, spendCents: 0, conversions: 0 });
        continue;
      }
      const impressions = spec.baseImpressions + ((dayIndex * 37 + spec.index * 13) % 500);
      const clicks = Math.round(impressions * spec.ctr);
      const spendCents = clicks * spec.centsPerClick;
      const conversions = Math.round(clicks * spec.conversionRate);
      metrics.push({ campaignId: spec.id, day, impressions, clicks, spendCents, conversions });
    }
  }
  return metrics;
}

export function createDemoState(): AppState {
  const createdAt = "2026-09-01T00:00:00.000Z";
  const campaigns: Campaign[] = SPECS.map((spec) => ({
    id: spec.id,
    workspaceId: WORKSPACE_ID,
    name: spec.name,
    status: spec.status,
    dailyBudgetCents: spec.dailyBudgetCents,
    version: 1,
    createdAt,
    updatedAt: createdAt,
  }));

  return {
    workspace: { id: WORKSPACE_ID, name: "Studio workspace", sheetUrl: null },
    profiles: [
      {
        id: DEMO_USER_ID,
        workspaceId: WORKSPACE_ID,
        displayName: "Yash",
        email: "yash@studio.test",
        currency: "USD",
        avatarUrl: null,
      },
    ],
    campaigns,
    metrics: createDemoMetrics(),
    threads: [
      {
        id: DEMO_THREAD_ID,
        workspaceId: WORKSPACE_ID,
        userId: DEMO_USER_ID,
        createdAt,
      },
    ],
    messages: [],
    actions: [],
    audit: [],
  };
}

export function newRecordId(): string {
  return randomUUID();
}

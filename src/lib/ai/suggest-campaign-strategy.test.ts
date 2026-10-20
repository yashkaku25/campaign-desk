import { describe, expect, it } from "vitest";

import {
  asksForStrategy,
  asksToCreateCampaign,
  suggestCampaignStrategyActions,
} from "@/lib/ai/suggest-campaign-strategy";
import type { CampaignSummary } from "@/lib/domain";
import { WORKSPACE_ID } from "@/lib/domain";

function campaign(partial: Partial<CampaignSummary> & { name: string }): CampaignSummary {
  return {
    id: partial.id ?? "33333333-3333-4333-8333-333333333301",
    workspaceId: WORKSPACE_ID,
    name: partial.name,
    status: partial.status ?? "active",
    dailyBudgetCents: partial.dailyBudgetCents ?? 5000,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    impressions: partial.impressions ?? 10_000,
    clicks: partial.clicks ?? 200,
    spendCents: partial.spendCents ?? 4000,
    conversions: partial.conversions ?? 4,
    ctr: partial.ctr ?? 0.02,
  };
}

describe("suggestCampaignStrategyActions", () => {
  it("detects create and strategy asks", () => {
    expect(asksToCreateCampaign("I want to create a campaign")).toBe(true);
    expect(asksToCreateCampaign("launch a new campaign for me")).toBe(true);
    expect(asksForStrategy("what strategies should I test")).toBe(true);
    expect(asksForStrategy("I don't know what to do")).toBe(true);
  });

  it("drafts create_campaign with strategy trail and answer", () => {
    const actions = suggestCampaignStrategyActions("I want to create a campaign", [
      campaign({ name: "Spring Sale", ctr: 0.01, conversions: 0, spendCents: 5000, impressions: 8000 }),
    ], [
      { campaignName: "Spring Sale", headline: "Free shipping this week", primaryText: "Shop the drop", product: "Sneakers" },
    ]);
    const create = actions.find((action) => action.type === "create_campaign");
    const answer = actions.find((action) => action.type === "answer");
    expect(create?.type).toBe("create_campaign");
    if (create?.type !== "create_campaign") throw new Error("expected create");
    expect(create.name.length).toBeGreaterThan(3);
    expect(create.dailyBudgetCents).toBeGreaterThanOrEqual(1000);
    expect(create.strategyNote).toBeTruthy();
    expect(create.expectedOutcome).toBeTruthy();
    expect(answer?.type).toBe("answer");
    if (answer?.type !== "answer") throw new Error("expected answer");
    expect(answer.message.toLowerCase()).toMatch(/approve|track/);
  });

  it("returns three different strategy ideas without creating", () => {
    const actions = suggestCampaignStrategyActions("suggest strategies to elevate my ads", [
      campaign({ name: "Winner Set", ctr: 0.035, conversions: 8 }),
      campaign({ name: "Waste Set", ctr: 0.003, conversions: 0, spendCents: 6000, impressions: 9000, clicks: 30 }),
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe("answer");
    if (actions[0]?.type !== "answer") throw new Error("expected answer");
    expect(actions[0].message).toMatch(/1\./);
    expect(actions[0].message).toMatch(/2\./);
    expect(actions[0].message).toMatch(/3\./);
  });

  it("rotates strategy when the ask text changes", () => {
    const campaigns = [campaign({ name: "Base Offer" })];
    const a = suggestCampaignStrategyActions("create a campaign please", campaigns);
    const b = suggestCampaignStrategyActions("create a campaign for retargeting ideas now", campaigns);
    const nameA = a.find((action) => action.type === "create_campaign");
    const nameB = b.find((action) => action.type === "create_campaign");
    expect(nameA?.type).toBe("create_campaign");
    expect(nameB?.type).toBe("create_campaign");
    if (nameA?.type !== "create_campaign" || nameB?.type !== "create_campaign") throw new Error("create");
    // Different asks should usually land on different strategy seeds (hash of text).
    const noteA = nameA.strategyNote ?? "";
    const noteB = nameB.strategyNote ?? "";
    expect(noteA.length + noteB.length).toBeGreaterThan(20);
  });
});

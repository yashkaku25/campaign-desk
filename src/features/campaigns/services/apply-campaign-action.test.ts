import { describe, expect, it } from "vitest";

import { CAMPAIGN_IDS, DEMO_USER_ID, type ProposedAction, type TargetSnapshot } from "@/lib/domain";
import { createDemoState } from "@/lib/data/seed";
import { payloadHash } from "@/lib/hash";
import { applyCampaignAction } from "@/features/campaigns/services/apply-campaign-action";

const NOW = new Date("2026-10-17T12:00:00.000Z");

function target(overrides: Partial<TargetSnapshot> = {}): TargetSnapshot {
  return {
    campaignId: CAMPAIGN_IDS.retarget,
    name: "Retargeting Warm",
    version: 1,
    beforeStatus: "active",
    afterStatus: "paused",
    beforeBudgetCents: 8_000,
    afterBudgetCents: 8_000,
    note: null,
    ...overrides,
  };
}

function withAction(targets: TargetSnapshot[], versionBump = false): ReturnType<typeof createDemoState> {
  const state = createDemoState();
  if (versionBump) {
    state.campaigns = state.campaigns.map((campaign) =>
      campaign.id === targets[0]?.campaignId ? { ...campaign, version: 2 } : campaign,
    );
  }
  const action: ProposedAction = {
    id: "55555555-5555-4555-8555-555555555555",
    workspaceId: state.workspace.id,
    userId: DEMO_USER_ID,
    kind: "pause",
    payloadHash: "",
    targets,
    create: null,
    summary: "Pause the set",
    status: "pending",
    expiresAt: "2026-10-17T12:10:00.000Z",
    resultMessage: null,
    createdAt: "2026-10-17T12:00:00.000Z",
  };
  action.payloadHash = payloadHash({ kind: action.kind, targets: action.targets, create: action.create });
  return { ...state, actions: [action] };
}

describe("applyCampaignAction", () => {
  it("fails closed when a campaign version changed and writes nothing", () => {
    const state = withAction([target()], true);
    const before = state.campaigns.map((campaign) => ({ id: campaign.id, version: campaign.version, status: campaign.status }));
    const result = applyCampaignAction(state, {
      userId: DEMO_USER_ID,
      actionId: "55555555-5555-4555-8555-555555555555",
      now: NOW,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/changed/i);
    expect(result.state.campaigns.map((campaign) => ({ id: campaign.id, version: campaign.version, status: campaign.status }))).toEqual(before);
    expect(result.state.actions[0]?.status).toBe("failed");
    expect(result.state.audit).toHaveLength(1);
  });

  it("pauses a batch together and a second approve does not add another audit row", () => {
    const state = withAction([
      target(),
      target({
        campaignId: CAMPAIGN_IDS.prospect,
        name: "Prospecting Cold",
        beforeBudgetCents: 15_000,
        afterBudgetCents: 15_000,
      }),
    ]);
    const first = applyCampaignAction(state, {
      userId: DEMO_USER_ID,
      actionId: "55555555-5555-4555-8555-555555555555",
      now: NOW,
    });
    const second = applyCampaignAction(first.state, {
      userId: DEMO_USER_ID,
      actionId: "55555555-5555-4555-8555-555555555555",
      now: NOW,
    });

    expect(first.ok).toBe(true);
    expect(first.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.retarget)?.status).toBe("paused");
    expect(first.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.prospect)?.status).toBe("paused");
    expect(first.state.audit).toHaveLength(1);
    expect(second.ok).toBe(true);
    expect(second.state.audit).toHaveLength(1);
  });

  it("treats an already paused campaign as success without a new version", () => {
    const state = withAction([
      target({
        campaignId: CAMPAIGN_IDS.brand,
        name: "Brand Video",
        beforeStatus: "paused",
        afterStatus: "paused",
        beforeBudgetCents: 6_000,
        afterBudgetCents: 6_000,
        note: "Already paused",
      }),
    ]);
    const result = applyCampaignAction(state, {
      userId: DEMO_USER_ID,
      actionId: "55555555-5555-4555-8555-555555555555",
      now: NOW,
    });
    const brand = result.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.brand);
    expect(result.ok).toBe(true);
    expect(brand?.status).toBe("paused");
    expect(brand?.version).toBe(1);
  });

  it("leaves every campaign unchanged when one version in the batch is stale", () => {
    const state = withAction([
      target(),
      target({
        campaignId: CAMPAIGN_IDS.prospect,
        name: "Prospecting Cold",
        version: 9,
        beforeBudgetCents: 15_000,
        afterBudgetCents: 15_000,
      }),
    ]);
    const result = applyCampaignAction(state, {
      userId: DEMO_USER_ID,
      actionId: "55555555-5555-4555-8555-555555555555",
      now: NOW,
    });
    expect(result.ok).toBe(false);
    expect(result.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.retarget)?.status).toBe("active");
    expect(result.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.retarget)?.version).toBe(1);
    expect(result.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.prospect)?.version).toBe(1);
  });

  it("refuses a team member who is not allowed to approve", () => {
    const state = withAction([target()]);
    state.profiles = state.profiles.map((profile) =>
      profile.id === DEMO_USER_ID ? { ...profile, role: "team", canApprove: false } : profile,
    );
    const result = applyCampaignAction(state, {
      userId: DEMO_USER_ID,
      actionId: "55555555-5555-4555-8555-555555555555",
      now: NOW,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/not allowed you to approve/);
    expect(result.state.campaigns.find((campaign) => campaign.id === CAMPAIGN_IDS.retarget)?.status).toBe("active");
  });
});

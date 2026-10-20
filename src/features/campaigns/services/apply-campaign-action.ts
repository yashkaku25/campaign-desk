import { randomUUID } from "node:crypto";

import { deny } from "@/features/auth/services/access";
import { explainCap, MAX_DAILY_BUDGET_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/features/campaigns/services/caps";
import type { AppState, AuditEntry, Campaign, CampaignStatus, ProposedAction } from "@/lib/domain";
import { payloadHash } from "@/lib/hash";

const STATUSES = new Set<CampaignStatus>(["draft", "active", "paused", "ended"]);

export interface ApplyInput {
  userId: string;
  actionId: string;
  now: Date;
}

export interface ApplyResult {
  state: AppState;
  ok: boolean;
  message: string;
}

/**
 * Local mirror of Postgres apply_campaign_action.
 * If a check changes, change the SQL function too.
 */
export function applyCampaignAction(state: AppState, input: ApplyInput): ApplyResult {
  const action = state.actions.find((item) => item.id === input.actionId);
  if (!action) {
    return { state, ok: false, message: "That preview does not exist." };
  }
  if (!isMember(state, input.userId, action.workspaceId) || action.userId !== input.userId) {
    return { state, ok: false, message: "You can only approve your own preview." };
  }
  const actor = state.profiles.find((profile) => profile.id === input.userId);
  const blocked = actor ? deny(actor, "approve", actionBudget(action)) : "An admin has not allowed you to approve changes.";
  if (blocked) return { state, ok: false, message: blocked };
  if (action.status === "approved") {
    return {
      state,
      ok: true,
      message: action.resultMessage ?? "Already approved.",
    };
  }
  if (action.status !== "pending") {
    return { state, ok: false, message: "This preview is already done." };
  }
  if (new Date(action.expiresAt).getTime() <= input.now.getTime()) {
    const message = "This preview expired. Ask again.";
    return {
      state: finish(state, action, "expired", message, input.now, input.userId),
      ok: false,
      message,
    };
  }

  const expectedHash = payloadHash({
    kind: action.kind,
    targets: action.targets,
    create: action.create,
  });
  if (expectedHash !== action.payloadHash) {
    const message = "This preview was changed. Ask again.";
    return {
      state: finish(state, action, "failed", message, input.now, input.userId),
      ok: false,
      message,
    };
  }

  const cap = explainCap({
    targetCount: Math.max(action.targets.length, action.create ? 1 : 0),
    budgetCents: action.create?.dailyBudgetCents,
  });
  if (cap) {
    return {
      state: finish(state, action, "failed", cap, input.now, input.userId),
      ok: false,
      message: cap,
    };
  }

  const current = new Map(state.campaigns.map((campaign) => [campaign.id, campaign]));
  for (const target of action.targets) {
    const campaign = current.get(target.campaignId);
    if (!campaign || campaign.version !== target.version) {
      const message = "A campaign changed since this preview. Ask again so the list is fresh.";
      return {
        state: finish(state, action, "failed", message, input.now, input.userId),
        ok: false,
        message,
      };
    }
    if (!STATUSES.has(target.afterStatus) || !budgetAllowed(target.afterBudgetCents)) {
      const message = "That preview had a change the desk cannot apply.";
      return {
        state: finish(state, action, "failed", message, input.now, input.userId),
        ok: false,
        message,
      };
    }
    if (campaign.status === "ended" && (target.afterStatus !== campaign.status || target.afterBudgetCents !== campaign.dailyBudgetCents)) {
      const message = "An ended campaign cannot be changed from chat.";
      return {
        state: finish(state, action, "failed", message, input.now, input.userId),
        ok: false,
        message,
      };
    }
  }

  const nextCampaigns = state.campaigns.map((campaign) => {
    const target = action.targets.find((item) => item.campaignId === campaign.id);
    if (!target) return campaign;
    const same =
      campaign.status === target.afterStatus && campaign.dailyBudgetCents === target.afterBudgetCents;
    if (same) return campaign;
    return {
      ...campaign,
      status: target.afterStatus,
      dailyBudgetCents: target.afterBudgetCents,
      version: campaign.version + 1,
      updatedAt: input.now.toISOString(),
    };
  });

  let campaigns = nextCampaigns;
  if (action.create) {
    const created: Campaign = {
      id: randomUUID(),
      workspaceId: action.workspaceId,
      name: action.create.name,
      status: "active",
      dailyBudgetCents: action.create.dailyBudgetCents,
      version: 1,
      createdAt: input.now.toISOString(),
      updatedAt: input.now.toISOString(),
    };
    campaigns = [...campaigns, created];
  }

  const message = action.summary;
  const withCampaigns = { ...state, campaigns };
  return {
    state: finish(withCampaigns, action, "approved", message, input.now, input.userId),
    ok: true,
    message,
  };
}

export function rejectCampaignAction(state: AppState, input: ApplyInput): ApplyResult {
  const action = state.actions.find((item) => item.id === input.actionId);
  if (!action) {
    return { state, ok: false, message: "That preview does not exist." };
  }
  if (!isMember(state, input.userId, action.workspaceId) || action.userId !== input.userId) {
    return { state, ok: false, message: "You can only reject your own preview." };
  }
  if (action.status === "rejected") {
    return { state, ok: true, message: "Already rejected. Campaigns were left as they were." };
  }
  if (action.status !== "pending") {
    return { state, ok: false, message: "This preview is already done." };
  }
  const message = "Rejected. Campaigns were left as they were.";
  return {
    state: finish(state, action, "rejected", message, input.now, input.userId),
    ok: true,
    message,
  };
}

function finish(
  state: AppState,
  action: ProposedAction,
  outcome: AuditEntry["outcome"],
  message: string,
  now: Date,
  userId: string,
): AppState {
  const profile = state.profiles.find((item) => item.id === userId);
  const audit: AuditEntry = {
    id: randomUUID(),
    workspaceId: action.workspaceId,
    userId,
    actorName: profile?.displayName ?? "Member",
    actionId: action.id,
    what: message,
    outcome,
    createdAt: now.toISOString(),
  };
  return {
    ...state,
    actions: state.actions.map((item) =>
      item.id === action.id
        ? { ...item, status: outcome, resultMessage: message }
        : item,
    ),
    audit: [audit, ...state.audit],
  };
}

function actionBudget(action: ProposedAction): number {
  return Math.max(
    action.create?.dailyBudgetCents ?? 0,
    ...action.targets.map((target) => target.afterBudgetCents),
    0,
  );
}

function isMember(state: AppState, userId: string, workspaceId: string): boolean {
  return state.profiles.some((profile) => profile.id === userId && profile.workspaceId === workspaceId);
}

function budgetAllowed(cents: number): boolean {
  return Number.isInteger(cents) && cents >= MIN_DAILY_BUDGET_CENTS && cents <= MAX_DAILY_BUDGET_CENTS;
}

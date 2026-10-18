export const WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_USER_ID = "22222222-2222-4222-8222-222222222222";
export const DEMO_END_DAY = "2026-10-16";

export const CAMPAIGN_IDS = {
  spring: "33333333-3333-4333-8333-333333333301",
  retarget: "33333333-3333-4333-8333-333333333302",
  prospect: "33333333-3333-4333-8333-333333333303",
  brand: "33333333-3333-4333-8333-333333333304",
  holdout: "33333333-3333-4333-8333-333333333305",
  holiday: "33333333-3333-4333-8333-333333333306",
} as const;

export type CampaignStatus = "draft" | "active" | "paused" | "ended";

export type ActionStatus = "pending" | "approved" | "rejected" | "expired" | "failed";

export interface Profile {
  id: string;
  workspaceId: string;
  displayName: string;
  email: string;
  currency: "USD" | "EUR" | "GBP" | "CAD" | "INR";
  avatarUrl: string | null;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  dailyBudgetCents: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMetric {
  campaignId: string;
  day: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
}

export interface CampaignSummary extends Campaign {
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  ctr: number | null;
}

export interface ChatThread {
  id: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  actionId: string | null;
  createdAt: string;
}

export interface TargetSnapshot {
  campaignId: string;
  name: string;
  version: number;
  beforeStatus: CampaignStatus;
  afterStatus: CampaignStatus;
  beforeBudgetCents: number;
  afterBudgetCents: number;
  note: string | null;
}

export interface CreateSnapshot {
  name: string;
  dailyBudgetCents: number;
  status: "active";
}

export interface ProposedAction {
  id: string;
  workspaceId: string;
  userId: string;
  kind: "pause" | "resume" | "set_daily_budget" | "create_campaign" | "reallocate_budget";
  payloadHash: string;
  targets: TargetSnapshot[];
  create: CreateSnapshot | null;
  summary: string;
  status: ActionStatus;
  expiresAt: string;
  resultMessage: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  workspaceId: string;
  userId: string;
  actorName: string;
  actionId: string | null;
  what: string;
  outcome: "approved" | "rejected" | "failed" | "expired";
  createdAt: string;
}

export interface AppState {
  workspace: { id: string; name: string; sheetUrl: string | null };
  profiles: Profile[];
  campaigns: Campaign[];
  metrics: DailyMetric[];
  threads: ChatThread[];
  messages: ChatMessage[];
  actions: ProposedAction[];
  audit: AuditEntry[];
}

export interface PreviewLine {
  name: string;
  before: string;
  after: string;
  note: string | null;
}

export interface PreviewModel {
  id: string;
  status: ActionStatus;
  summary: string;
  expiresAt: string;
  lines: PreviewLine[];
  canApprove: boolean;
}

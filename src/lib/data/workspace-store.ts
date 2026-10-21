import "server-only";

import type {
  ActionStatus,
  AppState,
  AuditEntry,
  Campaign,
  CampaignStatus,
  ChatMessage,
  ChatThread,
  CreateSnapshot,
  DailyMetric,
  Profile,
  ProposedAction,
  TargetSnapshot,
} from "@/lib/domain";
import { WORKSPACE_ID } from "@/lib/domain";
import { accessOf } from "@/features/auth/services/access";
import { avatarUrlFromPath } from "@/features/profile/services/avatar-url";
import { readLocalState, withLocalState } from "@/lib/data/local-store";
import { newRecordId } from "@/lib/data/seed";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function readWorkspace(userId: string): Promise<AppState> {
  if (env.dataBackend === "local") {
    const state = await readLocalState();
    if ((state.threads ?? []).some((thread) => thread.userId === userId)) return state;
    return withLocalState((current) => {
      const next = ensureThread(current, userId);
      return { state: next, result: next };
    });
  }
  return readSupabaseWorkspace(userId);
}

export async function runTransaction<T>(
  userId: string,
  update: (state: AppState) => { state: AppState; result: T },
): Promise<T> {
  if (env.dataBackend === "local") {
    return withLocalState((state) => update(ensureThread(state, userId)));
  }
  const before = await readSupabaseWorkspace(userId);
  const outcome = update(before);
  await persistSupabaseDiff(before, outcome.state);
  return outcome.result;
}

function ensureThread(state: AppState, userId: string): AppState {
  const threads = state.threads ?? [];
  if (threads.some((thread) => thread.userId === userId)) return state;
  const thread: ChatThread = {
    id: newRecordId(),
    workspaceId: state.workspace?.id ?? WORKSPACE_ID,
    userId,
    createdAt: new Date().toISOString(),
  };
  return { ...state, threads: [...threads, thread] };
}

async function readSupabaseWorkspace(userId: string): Promise<AppState> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, campaignResult, metricResult, threadResult, messageResult, actionResult, auditResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      // Row security returns only campaigns on this person's own desk.
      supabase.from("campaigns").select("*"),
      supabase.from("campaign_metrics_daily").select("*"),
      supabase.from("copilot_threads").select("*").eq("user_id", userId),
      supabase.from("copilot_messages").select("*"),
      supabase.from("proposed_actions").select("*").eq("user_id", userId),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }),
    ]);

  const failure = [profileResult, campaignResult, metricResult, threadResult, messageResult, actionResult, auditResult].find(
    (result) => result.error,
  );
  if (failure?.error || !profileResult.data) {
    logError({
      what: "Could not load the workspace.",
      why: failure?.error ? "Supabase refused to return the workspace rows." : "This account has no profile row.",
      file: "src/lib/data/workspace-store.ts",
      connectedTo: "Supabase tables profiles, campaigns, and audit_log",
      fix: "Apply supabase/migrations/0001_init.sql and sign in again.",
      cause: failure?.error ?? undefined,
    });
    throw new AppError({
      what: "Could not load the workspace.",
      why: "Supabase did not return this account's profile.",
      file: "src/lib/data/workspace-store.ts",
      fix: "Apply the migration, then sign in again.",
      status: 500,
      logged: true,
    });
  }

  const profile = profileResult.data;
  let threads = (threadResult.data ?? []).map(mapThread);
  if (threads.length === 0) {
    const created: ChatThread = {
      id: newRecordId(),
      workspaceId: profile.workspace_id,
      userId,
      createdAt: new Date().toISOString(),
    };
    const insert = await supabase.from("copilot_threads").insert({
      id: created.id,
      workspace_id: created.workspaceId,
      user_id: created.userId,
      created_at: created.createdAt,
    });
    if (insert.error) {
      throw new AppError({
        what: "Could not start a copilot thread.",
        why: "Supabase rejected the new thread.",
        file: "src/lib/data/workspace-store.ts",
        fix: "Refresh the page.",
        status: 500,
      });
    }
    threads = [created];
  }

  const threadIds = new Set(threads.map((thread) => thread.id));
  const sheetResult = await supabase.from("workspaces").select("sheet_url").eq("id", profile.workspace_id).maybeSingle();
  return {
    workspace: {
      id: profile.workspace_id,
      name: "Studio workspace",
      sheetUrl: sheetResult.error ? null : (sheetResult.data?.sheet_url ?? null),
    },
    profiles: [mapProfile(profile)],
    campaigns: (campaignResult.data ?? []).filter((row) => row.workspace_id === profile.workspace_id).map(mapCampaign),
    metrics: (metricResult.data ?? []).map(mapMetric),
    threads,
    messages: (messageResult.data ?? []).map(mapMessage).filter((message) => threadIds.has(message.threadId)),
    actions: (actionResult.data ?? []).map(mapAction),
    audit: (auditResult.data ?? []).map(mapAudit),
    invites: [],
  };
}

async function persistSupabaseDiff(before: AppState, after: AppState): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const knownMessages = new Set(before.messages.map((message) => message.id));
  const knownActions = new Set(before.actions.map((action) => action.id));
  const messages = after.messages.filter((message) => !knownMessages.has(message.id));
  const actions = after.actions.filter((action) => !knownActions.has(action.id));

  if (messages.length > 0) {
    const inserted = await supabase.from("copilot_messages").insert(
      messages.map((message) => ({
        id: message.id,
        thread_id: message.threadId,
        role: message.role,
        content: message.content,
        action_id: message.actionId,
        created_at: message.createdAt,
      })),
    );
    if (inserted.error) throw writeError("save the copilot reply", inserted.error.message);
  }

  if (actions.length > 0) {
    const inserted = await supabase.from("proposed_actions").insert(
      actions.map((action) => ({
        id: action.id,
        workspace_id: action.workspaceId,
        user_id: action.userId,
        kind: action.kind,
        payload_hash: action.payloadHash,
        targets: action.targets as unknown as Json,
        create_snapshot: action.create as unknown as Json | null,
        summary: action.summary,
        status: action.status,
        expires_at: action.expiresAt,
        result_message: action.resultMessage,
        created_at: action.createdAt,
      })),
    );
    if (inserted.error) throw writeError("save the preview", inserted.error.message);
  }
}

export async function callApplyRpc(actionId: string): Promise<{ ok: boolean; message: string }> {
  return callActionRpc("apply_campaign_action", actionId);
}

export async function callRejectRpc(actionId: string): Promise<{ ok: boolean; message: string }> {
  return callActionRpc("reject_campaign_action", actionId);
}

export async function saveDailyMetric(metric: DailyMetric): Promise<string | null> {
  if (
    metric.impressions < 0 ||
    metric.clicks < 0 ||
    metric.spendCents < 0 ||
    metric.conversions < 0 ||
    metric.impressions > 1_000_000_000 ||
    metric.clicks > 1_000_000_000 ||
    metric.spendCents > 1_000_000_000 ||
    metric.conversions > 1_000_000_000
  ) {
    return "That metric row is outside the range the desk accepts.";
  }
  if (env.dataBackend === "local") {
    await withLocalState((state) => ({
      state: {
        ...state,
        metrics: [
          ...state.metrics.filter((row) => !(row.campaignId === metric.campaignId && row.day === metric.day)),
          metric,
        ],
      },
      result: undefined,
    }));
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("upsert_campaign_metric", {
    target_campaign: metric.campaignId,
    metric_day: metric.day,
    impressions: metric.impressions,
    clicks: metric.clicks,
    spend_cents: metric.spendCents,
    conversions: metric.conversions,
  });
  if (error) {
    logError({
      what: "Could not save a metric row.",
      why: "Postgres refused the metric row.",
      file: "src/lib/data/workspace-store.ts",
      connectedTo: "upsert_campaign_metric",
      fix: "Run supabase/migrations/0004_meta_ready.sql, then sync again.",
      cause: error,
    });
    return "Could not save a metric row.";
  }
  return null;
}

async function callActionRpc(
  name: "apply_campaign_action" | "reject_campaign_action",
  actionId: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(name, { target_action: actionId });
  if (error) {
    logError({
      what: "Could not finish that preview.",
      why: "Postgres refused to finish the preview.",
      file: "src/lib/data/workspace-store.ts",
      connectedTo: `Postgres function ${name}`,
      fix: "Refresh the preview and try again.",
      cause: error,
    });
    return { ok: false, message: "Could not finish that preview. Refresh and try again." };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "The database sent back an unexpected result." };
  }
  const record = data as { ok?: unknown; message?: unknown };
  return {
    ok: record.ok === true,
    message: typeof record.message === "string" ? record.message : "The preview finished.",
  };
}

function writeError(what: string, why: string): AppError {
  logError({
    what: `Could not ${what}.`,
    why,
    file: "src/lib/data/workspace-store.ts",
    connectedTo: "Supabase",
    fix: "Refresh and send the command again.",
  });
  return new AppError({
    what: `Could not ${what}.`,
    why: "Supabase rejected the save.",
    file: "src/lib/data/workspace-store.ts",
    fix: "Refresh and try again.",
    status: 500,
    logged: true,
  });
}

function mapProfile(row: {
  id: string;
  workspace_id: string;
  display_name: string;
  email: string;
  currency?: Profile["currency"];
  avatar_path?: string | null;
  role?: Profile["role"] | null;
  can_ask?: boolean;
  can_propose?: boolean;
  can_approve?: boolean;
  can_sync?: boolean;
  approve_cap_cents?: number;
}): Profile {
  const access = accessOf({
    role: row.role,
    canAsk: row.can_ask,
    canPropose: row.can_propose,
    canApprove: row.can_approve,
    canSync: row.can_sync,
    approveCapCents: row.approve_cap_cents,
  });
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    displayName: row.display_name,
    email: row.email,
    currency: row.currency ?? "USD",
    avatarUrl: avatarUrlFromPath(row.avatar_path),
    ...access,
  };
}

function mapCampaign(row: {
  id: string;
  workspace_id: string;
  name: string;
  status: CampaignStatus;
  daily_budget_cents: number;
  version: number;
  created_at: string;
  updated_at: string;
}): Campaign {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    status: row.status,
    dailyBudgetCents: row.daily_budget_cents,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMetric(row: {
  campaign_id: string;
  day: string;
  impressions: number;
  clicks: number;
  spend_cents: number;
  conversions: number;
}): DailyMetric {
  return {
    campaignId: row.campaign_id,
    day: row.day,
    impressions: row.impressions,
    clicks: row.clicks,
    spendCents: row.spend_cents,
    conversions: row.conversions,
  };
}

function mapThread(row: { id: string; workspace_id: string; user_id: string; created_at: string }): ChatThread {
  return { id: row.id, workspaceId: row.workspace_id, userId: row.user_id, createdAt: row.created_at };
}

function mapMessage(row: {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  action_id: string | null;
  created_at: string;
}): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role,
    content: row.content,
    actionId: row.action_id,
    createdAt: row.created_at,
  };
}

function mapAction(row: {
  id: string;
  workspace_id: string;
  user_id: string;
  kind: ProposedAction["kind"];
  payload_hash: string;
  targets: Json;
  create_snapshot: Json | null;
  summary: string;
  status: ActionStatus;
  expires_at: string;
  result_message: string | null;
  created_at: string;
}): ProposedAction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    kind: row.kind,
    payloadHash: row.payload_hash,
    targets: Array.isArray(row.targets) ? (row.targets as unknown as TargetSnapshot[]) : [],
    create: readCreateSnapshot(row.create_snapshot),
    summary: row.summary,
    status: row.status,
    expiresAt: row.expires_at,
    resultMessage: row.result_message,
    createdAt: row.created_at,
  };
}

function mapAudit(row: {
  id: string;
  workspace_id: string;
  user_id: string;
  actor_name: string;
  action_id: string | null;
  what: string;
  outcome: AuditEntry["outcome"];
  created_at: string;
}): AuditEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    actorName: row.actor_name,
    actionId: row.action_id,
    what: row.what,
    outcome: row.outcome,
    createdAt: row.created_at,
  };
}

function readCreateSnapshot(value: Json | null): CreateSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.name !== "string" || typeof value.dailyBudgetCents !== "number" || value.status !== "active") {
    return null;
  }
  const strategyNote =
    typeof value.strategyNote === "string" && value.strategyNote.trim()
      ? value.strategyNote.trim().slice(0, 500)
      : null;
  const expectedOutcome =
    typeof value.expectedOutcome === "string" && value.expectedOutcome.trim()
      ? value.expectedOutcome.trim().slice(0, 500)
      : null;
  return {
    name: value.name,
    dailyBudgetCents: value.dailyBudgetCents,
    status: "active",
    strategyNote,
    expectedOutcome,
  };
}

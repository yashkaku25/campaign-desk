"use server";

import { rm } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { accessOf, markDuplicates, removalBlock } from "@/features/auth/services/access";
import { signInEmail, signupGmail } from "@/features/auth/services/gmail-address";
import { deleteLocalAccount } from "@/features/auth/services/local-accounts";
import { requireUser } from "@/features/auth/services/require-user";
import { MAX_DAILY_BUDGET_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/features/campaigns/services/caps";
import { readLocalState, withLocalState } from "@/lib/data/local-store";
import type { DeskInvite, DeskRole, Profile } from "@/lib/domain";
import { WORKSPACE_ID } from "@/lib/domain";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors/log-error";
import { takeAuthAttempt } from "@/lib/rate-limit";
import { trustedAppOrigin } from "@/lib/security/app-origin";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface TeamPerson {
  id: string;
  name: string;
  email: string;
  role: DeskRole;
  canAsk: boolean;
  canPropose: boolean;
  canApprove: boolean;
  canSync: boolean;
  approveCapCents: number;
  duplicate: boolean;
}

export interface TeamSnapshot {
  people: TeamPerson[];
  invites: string[];
  warning: string | null;
}

const NOT_READY = "The team list is not ready yet. The database update still needs to be applied.";

export async function loadTeam(): Promise<TeamSnapshot> {
  const user = await requireUser();
  if (accessOf(user).role !== "admin") return { people: [], invites: [], warning: null };
  if (env.dataBackend === "local") {
    const state = await readLocalState();
    return {
      people: markDuplicates(state.profiles.map(toPerson)),
      invites: state.invites.map((invite) => invite.email),
      warning: null,
    };
  }
  const supabase = await createSupabaseServerClient();
  const profiles = await supabase.from("profiles").select("*").eq("workspace_id", user.workspaceId);
  if (profiles.error) return { people: markDuplicates([toPerson(user)]), invites: [], warning: NOT_READY };
  const invites = await supabase.from("workspace_invites").select("email").eq("workspace_id", user.workspaceId);
  if (invites.error) {
    return { people: markDuplicates((profiles.data ?? []).map(rowToPerson)), invites: [], warning: NOT_READY };
  }
  return {
    people: markDuplicates((profiles.data ?? []).map(rowToPerson)),
    invites: (invites.data ?? []).map((row) => row.email),
    warning: null,
  };
}

export async function invitePerson(raw: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  if (accessOf(user).role !== "admin") return { ok: false, message: "Only an admin can invite a person." };
  const gmail = signupGmail(raw);
  if ("message" in gmail) return { ok: false, message: gmail.message };
  const limited = await takeAuthAttempt("sign-up", `invite:${user.id}`);
  if (!limited.ok) return limited;

  const team = await loadTeam();
  if (team.warning) return { ok: false, message: team.warning };
  if (team.people.some((person) => signInEmail(person.email) === gmail.email)) {
    return { ok: false, message: "That person is already on the desk." };
  }
  const waiting = team.invites.some((email) => signInEmail(email) === gmail.email);
  if (!waiting) {
    const saved = await rememberInvite(user.id, user.workspaceId, gmail.email);
    if (!saved.ok) return saved;
  }
  if (env.dataBackend === "local") {
    return { ok: true, message: "Invite saved. Ask them to create an account with this Gmail." };
  }
  const mailed = await sendInviteMail(gmail.email);
  if (!mailed.ok) {
    return { ok: true, message: "The invite is saved. The email could not be sent. Ask them to create an account with this Gmail." };
  }
  return {
    ok: true,
    message: waiting ? "That invite is already waiting. The email was sent again." : "Invite sent. They can open the email or create an account with this Gmail.",
  };
}

export async function cancelInvite(email: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  if (accessOf(user).role !== "admin") return { ok: false, message: "Only an admin can cancel an invite." };
  const key = signInEmail(email);
  if (env.dataBackend === "local") {
    await withLocalState((state) => ({
      state: { ...state, invites: state.invites.filter((invite) => signInEmail(invite.email) !== key) },
      result: undefined,
    }));
  } else {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("workspace_invites").delete().eq("workspace_id", user.workspaceId).eq("email", email);
    if (error) return { ok: false, message: NOT_READY };
  }
  revalidatePath("/settings");
  return { ok: true, message: "Invite cancelled." };
}

export async function savePersonLimits(input: {
  personId: string;
  role: DeskRole;
  canAsk: boolean;
  canPropose: boolean;
  canApprove: boolean;
  canSync: boolean;
  approveCapCents: number;
}): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  if (accessOf(user).role !== "admin") return { ok: false, message: "Only an admin can change what a person is allowed to do." };
  if (input.role !== "admin" && input.role !== "team") return { ok: false, message: "Choose Admin or Team." };
  if (!Number.isInteger(input.approveCapCents) || input.approveCapCents < MIN_DAILY_BUDGET_CENTS || input.approveCapCents > MAX_DAILY_BUDGET_CENTS) {
    return { ok: false, message: "The budget cap has to be from 1.00 $ to 100,000.00 $." };
  }
  const team = await loadTeam();
  const person = team.people.find((item) => item.id === input.personId);
  if (!person) return { ok: false, message: "That person is not on the desk." };
  if (person.role === "admin" && input.role !== "admin") {
    const admins = team.people.filter((item) => item.role === "admin").length;
    if (admins < 2) return { ok: false, message: "The desk needs one admin." };
  }
  const next = input.role === "admin"
    ? { role: "admin" as const, canAsk: true, canPropose: true, canApprove: true, canSync: true, approveCapCents: MAX_DAILY_BUDGET_CENTS }
    : input;
  if (env.dataBackend === "local") {
    await withLocalState((state) => ({
      state: {
        ...state,
        profiles: state.profiles.map((profile) =>
          profile.id === input.personId ? { ...profile, ...next } : profile,
        ),
      },
      result: undefined,
    }));
  } else {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        role: next.role,
        can_ask: next.canAsk,
        can_propose: next.canPropose,
        can_approve: next.canApprove,
        can_sync: next.canSync,
        approve_cap_cents: next.approveCapCents,
      })
      .eq("id", input.personId);
    if (error) {
      const message = error.message.includes("one admin")
        ? "The desk needs one admin."
        : "Only an admin can change what a person is allowed to do.";
      return { ok: false, message };
    }
  }
  revalidatePath("/settings");
  return { ok: true, message: "Saved what that person can do." };
}

export async function removePerson(targetId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  if (accessOf(user).role !== "admin") return { ok: false, message: "Only an admin can remove a person." };
  const team = await loadTeam();
  const person = team.people.find((item) => item.id === targetId);
  if (!person) return { ok: false, message: "That person is not on the desk." };
  const blocked = removalBlock({
    actorId: user.id,
    targetId,
    targetRole: person.role,
    adminCount: team.people.filter((item) => item.role === "admin").length,
  });
  if (blocked) return { ok: false, message: blocked };

  if (env.dataBackend === "local") {
    await withLocalState((state) => {
      const threadIds = new Set(state.threads.filter((thread) => thread.userId === targetId).map((thread) => thread.id));
      return {
        state: {
          ...state,
          profiles: state.profiles.filter((profile) => profile.id !== targetId),
          invites: state.invites.filter((invite) => signInEmail(invite.email) !== signInEmail(person.email)),
          threads: state.threads.filter((thread) => thread.userId !== targetId),
          messages: state.messages.filter((message) => !threadIds.has(message.threadId)),
          actions: state.actions.filter((action) => action.userId !== targetId),
        },
        result: undefined,
      };
    });
    await deleteLocalAccount(targetId);
    await rm(path.join(process.cwd(), "data", "avatars", targetId), { recursive: true, force: true });
  } else {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("remove_team_member", { target: targetId });
    if (error) {
      logError({
        what: "Could not remove that person.",
        why: "The database refused the removal.",
        file: "src/features/profile/services/team-actions.ts",
        connectedTo: "public.remove_team_member",
        fix: "Run supabase/migrations/0007_roles.sql, then try again.",
        cause: error,
      });
      if (error.message.includes("one admin")) return { ok: false, message: "The desk needs one admin." };
      if (error.message.includes("yourself")) return { ok: false, message: "Use Delete account to remove yourself." };
      if (error.message.includes("Only an admin")) return { ok: false, message: "Only an admin can remove a person." };
      return { ok: false, message: "Could not remove that person. Try again." };
    }
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Removed that person. Their campaigns stay." };
}

async function rememberInvite(userId: string, workspaceId: string, email: string): Promise<{ ok: boolean; message: string }> {
  if (env.dataBackend === "local") {
    await withLocalState((state) => {
      if (state.invites.some((invite) => signInEmail(invite.email) === email)) {
        return { state, result: undefined };
      }
      const invite: DeskInvite = { email, invitedBy: userId, createdAt: new Date().toISOString() };
      return { state: { ...state, invites: [...state.invites, invite] }, result: undefined };
    });
    return { ok: true, message: "" };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId || WORKSPACE_ID,
    email,
    invited_by: userId,
  });
  if (!error) return { ok: true, message: "" };
  if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
    return { ok: true, message: "" };
  }
  logError({
    what: "Could not save the invite.",
    why: "The invite table refused the row.",
    file: "src/features/profile/services/team-actions.ts",
    connectedTo: "public.workspace_invites",
    fix: "Run supabase/migrations/0007_roles.sql, then invite again.",
    cause: error,
  });
  return { ok: false, message: NOT_READY };
}

async function sendInviteMail(email: string): Promise<{ ok: boolean }> {
  try {
    const origin = trustedAppOrigin((await headers()).get("origin"), env.isProduction);
    const anon = createSupabaseAnonClient();
    const { error } = await anon.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/api/auth/callback`, shouldCreateUser: true },
    });
    return { ok: !error };
  } catch (error) {
    logError({
      what: "Could not send the invite email.",
      why: "The sign-in email did not go out.",
      file: "src/features/profile/services/team-actions.ts",
      connectedTo: "Supabase Auth signInWithOtp",
      fix: "Ask them to create an account with this Gmail.",
      cause: error,
    });
    return { ok: false };
  }
}

function toPerson(profile: Profile): Omit<TeamPerson, "duplicate"> {
  const access = accessOf(profile);
  return {
    id: profile.id,
    name: profile.displayName,
    email: profile.email,
    ...access,
  };
}

function rowToPerson(row: {
  id: string;
  display_name: string;
  email: string;
  role?: DeskRole | null;
  can_ask?: boolean;
  can_propose?: boolean;
  can_approve?: boolean;
  can_sync?: boolean;
  approve_cap_cents?: number;
}): Omit<TeamPerson, "duplicate"> {
  const access = accessOf({
    role: row.role,
    canAsk: row.can_ask,
    canPropose: row.can_propose,
    canApprove: row.can_approve,
    canSync: row.can_sync,
    approveCapCents: row.approve_cap_cents,
  });
  return { id: row.id, name: row.display_name, email: row.email, ...access };
}

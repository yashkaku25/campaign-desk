import "server-only";

import { redirect } from "next/navigation";

import { accessOf } from "@/features/auth/services/access";
import { avatarUrlFromPath } from "@/features/profile/services/avatar-url";
import { isCurrency } from "@/lib/currency/codes";
import type { Profile } from "@/lib/domain";
import { DEMO_USER_ID } from "@/lib/domain";
import { readLocalState } from "@/lib/data/local-store";
import { env } from "@/lib/env";
import { userIdFromCookie } from "@/features/auth/services/session-cookie";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<Profile | null> {
  if (env.dataBackend === "local") {
    const userId = await userIdFromCookie();
    if (!userId) return null;
    try {
      const state = await readLocalState();
      const profile = state.profiles.find((item) => item.id === userId);
      return profile ? normalizeProfile(profile) : null;
    } catch {
      return null;
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const profile = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  if (!profile.data) return null;
  const row = profile.data;
  return normalizeProfile({
    id: row.id,
    workspaceId: row.workspace_id,
    displayName: row.display_name,
    email: row.email,
    currency: row.currency,
    avatarUrl: avatarUrlFromPath(row.avatar_path),
    ...accessOf({
      role: row.role,
      canAsk: row.can_ask,
      canPropose: row.can_propose,
      canApprove: row.can_approve,
      canSync: row.can_sync,
      approveCapCents: row.approve_cap_cents,
    }),
  });
}

function normalizeProfile(profile: Profile): Profile {
  const currency = isCurrency(String(profile.currency)) ? profile.currency : "USD";
  return { ...profile, ...accessOf(profile), currency, avatarUrl: profile.avatarUrl ?? null };
}

export async function requireUser(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function demoUserId(): string {
  return DEMO_USER_ID;
}

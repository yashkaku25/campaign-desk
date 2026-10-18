import "server-only";

import { redirect } from "next/navigation";

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
  return normalizeProfile({
    id: profile.data.id,
    workspaceId: profile.data.workspace_id,
    displayName: profile.data.display_name,
    email: profile.data.email,
    currency: profile.data.currency,
    avatarUrl: avatarUrlFromPath(profile.data.avatar_path),
  });
}

function normalizeProfile(profile: Profile): Profile {
  const currency = isCurrency(String(profile.currency)) ? profile.currency : "USD";
  return { ...profile, currency, avatarUrl: profile.avatarUrl ?? null };
}

export async function requireUser(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function demoUserId(): string {
  return DEMO_USER_ID;
}

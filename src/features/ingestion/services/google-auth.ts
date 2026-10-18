import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { getCurrentUser } from "@/features/auth/services/require-user";
import { loadGoogleRefresh } from "@/features/ingestion/services/google-refresh-store";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors/log-error";

const STATE_COOKIE = "campaign_desk_google_state";
const REFRESH_COOKIE = "campaign_desk_google_refresh";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export function googleConnectReady(): boolean {
  return Boolean(env.googleOauthClientId && env.googleOauthClientSecret && env.googleOauthRedirectUri);
}

export function googleConnectStartUrl(): string | null {
  if (!googleConnectReady()) return null;
  try {
    return new URL("/api/google/start", env.googleOauthRedirectUri).toString();
  } catch {
    return null;
  }
}

export function buildGoogleConnect(): { ok: true; url: string; state: string } | { ok: false; message: string } {
  if (!googleConnectReady()) {
    return { ok: false, message: "Google sign-in is not set up on the server yet." };
  }
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.googleOauthClientId);
  url.searchParams.set("redirect_uri", env.googleOauthRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return { ok: true, url: url.toString(), state };
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProduction,
  path: "/",
};

export const googleStateCookie = {
  name: STATE_COOKIE,
  options: { ...cookieBase, maxAge: 10 * 60 },
};

export const googleRefreshCookie = {
  name: REFRESH_COOKIE,
  options: { ...cookieBase, maxAge: 180 * 24 * 60 * 60 },
};

export async function takeGoogleState(state: string | null): Promise<boolean> {
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  jar.set(STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: env.isProduction, path: "/", maxAge: 0 });
  return Boolean(state) && state === expected;
}

export async function readGoogleRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(REFRESH_COOKIE)?.value?.trim() ?? "";
  if (token) return token;
  const user = await getCurrentUser();
  if (!user) return null;
  return loadGoogleRefresh(user.id);
}

export async function exchangeGoogleCode(code: string): Promise<{ refreshToken: string } | { problem: string }> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleOauthClientId,
        client_secret: env.googleOauthClientSecret,
        redirect_uri: env.googleOauthRedirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const body = (await response.json()) as { refresh_token?: unknown };
    if (!response.ok || typeof body.refresh_token !== "string" || !body.refresh_token) {
      return { problem: "Google did not give the desk permission to edit. Connect again." };
    }
    return { refreshToken: body.refresh_token };
  } catch (error) {
    logError({
      what: "Could not finish Google sign-in.",
      why: "The permission call did not finish.",
      file: "src/features/ingestion/services/google-auth.ts",
      connectedTo: "https://oauth2.googleapis.com/token",
      fix: "Connect Google again.",
      cause: scrub(error),
    });
    return { problem: "Could not finish Google sign-in." };
  }
}

export async function googleAccessToken(): Promise<{ token: string } | { problem: string }> {
  const refreshToken = await readGoogleRefreshToken();
  if (!refreshToken) return { problem: "Connect Google, then try again." };
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.googleOauthClientId,
        client_secret: env.googleOauthClientSecret,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });
    const body = (await response.json()) as { access_token?: unknown };
    if (!response.ok || typeof body.access_token !== "string") {
      return { problem: "Google permission expired. Connect again." };
    }
    return { token: body.access_token };
  } catch (error) {
    logError({
      what: "Could not use the Google permission.",
      why: "The permission refresh did not finish.",
      file: "src/features/ingestion/services/google-auth.ts",
      connectedTo: "https://oauth2.googleapis.com/token",
      fix: "Connect Google again.",
      cause: scrub(error),
    });
    return { problem: "Could not use the Google permission." };
  }
}

function scrub(error: unknown): string {
  const message = error instanceof Error ? error.message : "The Google call failed.";
  return message.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [token]").slice(0, 180);
}

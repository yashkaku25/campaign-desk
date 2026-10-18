import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { readSessionToken, signSession } from "@/features/auth/services/session-token";

export const SESSION_COOKIE = "campaign_desk_session";

export async function writeSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(userId, env.sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: 0,
  });
}

export async function userIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token, env.sessionSecret);
}

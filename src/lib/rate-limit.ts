import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { decideSlidingWindow } from "@/lib/rate-limit-window";
import { env } from "@/lib/env";

export const PARSE_LIMIT_PER_HOUR = 20;
export const SIGN_UP_LIMIT_PER_HOUR = 5;
export const SIGN_IN_LIMIT_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

const hits = new Map<string, number[]>();
const copyHits = new Map<string, number[]>();
const authHits = new Map<string, number[]>();
let upstash: Ratelimit | null = null;
let copyUpstash: Ratelimit | null = null;

function remoteLimiter(): Ratelimit | null {
  if (!env.upstashUrl || !env.upstashToken) return null;
  if (!upstash) {
    upstash = new Ratelimit({
      redis: new Redis({ url: env.upstashUrl, token: env.upstashToken }),
      limiter: Ratelimit.slidingWindow(PARSE_LIMIT_PER_HOUR, "1 h"),
      prefix: "campaign-desk",
    });
  }
  return upstash;
}

export async function allowParse(userId: string): Promise<boolean> {
  const remote = remoteLimiter();
  if (remote) {
    const result = await remote.limit(userId);
    return result.success;
  }
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= PARSE_LIMIT_PER_HOUR) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

export async function allowCopy(userId: string): Promise<boolean> {
  const remote = copyLimiter();
  if (remote) {
    const result = await remote.limit(`copy:${userId}`);
    return result.success;
  }
  const now = Date.now();
  const recent = (copyHits.get(userId) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= PARSE_LIMIT_PER_HOUR) {
    copyHits.set(userId, recent);
    return false;
  }
  recent.push(now);
  copyHits.set(userId, recent);
  return true;
}

function copyLimiter(): Ratelimit | null {
  if (!env.upstashUrl || !env.upstashToken) return null;
  if (!copyUpstash) {
    copyUpstash = new Ratelimit({
      redis: new Redis({ url: env.upstashUrl, token: env.upstashToken }),
      limiter: Ratelimit.slidingWindow(PARSE_LIMIT_PER_HOUR, "1 h"),
      prefix: "campaign-desk-copy",
    });
  }
  return copyUpstash;
}

export async function takeAuthAttempt(
  kind: "sign-up" | "sign-in",
  bucket: string,
  now = Date.now(),
): Promise<{ ok: true } | { ok: false; message: string }> {
  const limit = kind === "sign-up" ? SIGN_UP_LIMIT_PER_HOUR : SIGN_IN_LIMIT_PER_HOUR;
  const key = `${kind}:${bucket}`;
  const decision = decideSlidingWindow(authHits.get(key) ?? [], now, limit, WINDOW_MS);
  authHits.set(key, decision.stamps);
  if (decision.allowed) return { ok: true };
  return {
    ok: false,
    message: `Too many tries. You can try again in ${decision.retryMinutes} minutes. Waiting a minute does not reset the count.`,
  };
}

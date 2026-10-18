const MINUTE_MS = 60 * 1000;

/**
 * Sliding hour window. A try stays in the count until it is an hour old.
 * Waiting half a minute does not clear the earlier tries, so the count cannot loop.
 */
export function decideSlidingWindow(
  stamps: number[],
  now: number,
  limit: number,
  windowMs: number,
): { allowed: boolean; stamps: number[]; retryMinutes: number } {
  const recent = stamps.filter((stamp) => now - stamp < windowMs).sort((left, right) => left - right);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    const retryMs = Math.max(0, windowMs - (now - oldest));
    return {
      allowed: false,
      stamps: recent,
      retryMinutes: Math.max(1, Math.ceil(retryMs / MINUTE_MS)),
    };
  }
  recent.push(now);
  return { allowed: true, stamps: recent, retryMinutes: 0 };
}

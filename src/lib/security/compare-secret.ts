import { timingSafeEqual } from "node:crypto";

/** Compare two secrets without leaking how much of the string matched. */
export function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

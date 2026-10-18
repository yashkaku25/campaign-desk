import { createHash } from "node:crypto";

function stableString(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableString(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableString(record[key])}`).join(",")}}`;
}

export function payloadHash(value: unknown): string {
  return createHash("sha256").update(stableString(value)).digest("hex");
}

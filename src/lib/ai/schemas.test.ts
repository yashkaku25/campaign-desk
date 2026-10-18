import { describe, expect, it } from "vitest";

import { parseActions } from "@/lib/ai/schemas";

describe("parseActions", () => {
  it("rejects an action that is not on the allowlist", () => {
    const result = parseActions({ actions: [{ type: "delete_all" }] });
    expect(result.ok).toBe(false);
  });

  it("turns a percent-style CTR into a fraction", () => {
    const result = parseActions({
      actions: [{ type: "pause", filter: { ctrBelow: 2 } }],
    });
    expect(result.ok).toBe(true);
    if (result.ok && result.actions[0]?.type === "pause") {
      expect(result.actions[0].filter.ctrBelow).toBe(0.02);
    }
  });

  it("rejects more than two actions", () => {
    const result = parseActions({
      actions: [
        { type: "answer", message: "one" },
        { type: "answer", message: "two" },
        { type: "answer", message: "three" },
      ],
    });
    expect(result.ok).toBe(false);
  });
});

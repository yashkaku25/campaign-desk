import { describe, expect, it } from "vitest";

import { parseDecision } from "@/lib/ai/parse-decision";

describe("parseDecision", () => {
  it("reads approve all in either word order", () => {
    expect(parseDecision("I want all approve")).toEqual({ decision: "approve", scope: "all" });
    expect(parseDecision("approve all")).toEqual({ decision: "approve", scope: "all" });
    expect(parseDecision("decline the rest")).toEqual({ decision: "reject", scope: "all" });
  });

  it("keeps a specific name", () => {
    expect(parseDecision("decline Spring Launch")).toEqual({
      decision: "reject",
      scope: "names",
      phrase: "Spring Launch",
    });
    expect(parseDecision("approve Spring Launch and Brand Video")).toEqual({
      decision: "approve",
      scope: "names",
      phrase: "Spring Launch and Brand Video",
    });
  });

  it("does not treat a bare approve as approve all", () => {
    expect(parseDecision("approve")).toBeNull();
    expect(parseDecision("decline")).toBeNull();
  });

  it("leaves a normal command alone", () => {
    expect(parseDecision("Pause campaigns with CTR under 2%")).toBeNull();
  });
});

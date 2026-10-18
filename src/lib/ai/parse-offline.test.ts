import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { parseOffline } from "@/lib/ai/parse-offline";

describe("parseOffline", () => {
  it("turns a CTR sentence into a pause filter", () => {
    const actions = parseOffline("Pause campaigns with CTR under 2%");
    expect(actions).toEqual([{ type: "pause", filter: { ctrBelow: 0.02 } }]);
  });

  it("moves a daily amount from one named campaign to another", () => {
    const actions = parseOffline("Move 10 dollars a day from Spring Launch to Holdout Creative");
    expect(actions).toEqual([
      {
        type: "reallocate_budget",
        from: { nameContains: "Spring Launch" },
        to: { nameContains: "Holdout Creative" },
        shiftCents: 1000,
      },
    ]);
  });

  it("refuses a sentence that is not a command", () => {
    expect(() => parseOffline("Hello desk")).toThrow(AppError);
  });
});

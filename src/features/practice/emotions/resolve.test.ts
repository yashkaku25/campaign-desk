import { describe, expect, it } from "vitest";

import { catalogProblems, FEELINGS } from "@/features/practice/emotions/catalog";
import { marketerNote, resolveShopper } from "@/features/practice/emotions/resolve";

describe("feeling catalog", () => {
  it("stores every feeling with a start fact and a real opposite", () => {
    expect(catalogProblems()).toEqual([]);
    expect(FEELINGS.map((item) => item.id)).toEqual(expect.arrayContaining([
      "curiosity",
      "desire",
      "surprise",
      "disgust",
      "shame",
      "self_control",
      "loyalty",
      "betrayal",
    ]));
  });
});

describe("resolveShopper", () => {
  it("starts nothing when the only fact is a feeling name", () => {
    const result = resolveShopper({ present: ["disgust"] });
    expect(result.stages.every((stage) => stage.winner === null)).toBe(true);
  });

  it("stops on a clear picture", () => {
    const notice = resolveShopper({ present: ["clear_picture"] }).stages[0];
    expect(notice?.winner?.name).toBe("Curiosity");
    expect(notice?.act).toBe("stop");
    expect(notice?.tie).toBe(false);
  });

  it("hides the ad when a public complaint feels wrong", () => {
    const click = resolveShopper({ present: ["gross_claim"] }).stages[1];
    expect(click?.winner?.name).toBe("Disgust");
    expect(click?.act).toBe("hide");
  });

  it("lets the feeling with more facts win, and keeps the other on screen", () => {
    const pay = resolveShopper({ present: ["checkout_worry", "known_brand", "has_returns"] }).stages[2];
    expect(pay?.winner?.name).toBe("Trust");
    expect(pay?.runnerUp?.name).toBe("Safety");
    expect(pay?.act).toBe("buy");
    expect(pay?.bothVisible.map((item) => item.name)).toContain("Anxiety");
  });

  it("calls a tie when two feelings of the same strength push different acts", () => {
    const notice = resolveShopper({ present: ["clear_picture", "no_need"] }).stages[0];
    expect(notice?.tie).toBe(true);
    expect(notice?.act).toBeNull();
    expect(notice?.winner?.name).toBeTruthy();
    expect(notice?.runnerUp?.name).toBeTruthy();
  });

  it("carries disappointment to the next day only", () => {
    const first = resolveShopper({ present: ["result_worse_than_ad"] });
    expect(first.carryToNextDay).toContain("disappointment");
    const second = resolveShopper({ present: ["result_worse_than_ad"], carried: first.carryToNextDay });
    expect(second.stages[3]?.winner?.name).toBe("Disappointment");
    expect(second.carryToNextDay).not.toContain("disappointment");
  });

  it("keeps betrayal while the broken promise is still a fact", () => {
    const first = resolveShopper({ present: ["broken_promise"] });
    expect(first.carryToNextDay).toContain("betrayal");
    const next = resolveShopper({ present: ["broken_promise"], carried: ["betrayal"] });
    expect(next.carryToNextDay).toContain("betrayal");
    const fixed = resolveShopper({ present: ["promise_fixed"], carried: ["betrayal"] });
    expect(fixed.carryToNextDay).not.toContain("betrayal");
  });

  it("tells the marketer when the problem is the feeling, not the bid", () => {
    const result = resolveShopper({ present: ["gross_claim"] });
    expect(marketerNote(result)).toMatch(/not a bidding problem/);
    const checkout = resolveShopper({ present: ["checkout_worry"] });
    expect(marketerNote(checkout)).toMatch(/not a creative problem/);
  });
});

import { describe, expect, it } from "vitest";

import { decideSlidingWindow } from "@/lib/rate-limit-window";

const HOUR_MS = 60 * 60 * 1000;

describe("decideSlidingWindow", () => {
  it("blocks a sixth signup half a minute after the fifth", () => {
    let stamps: number[] = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const decision = decideSlidingWindow(stamps, attempt * 1000, 5, HOUR_MS);
      expect(decision.allowed).toBe(true);
      stamps = decision.stamps;
    }

    const sixth = decideSlidingWindow(stamps, 30_000, 5, HOUR_MS);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryMinutes).toBe(60);
    expect(sixth.stamps).toHaveLength(5);
  });

  it("opens one slot only after the oldest try is an hour old", () => {
    let stamps: number[] = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      stamps = decideSlidingWindow(stamps, attempt * 1000, 5, HOUR_MS).stamps;
    }

    const stillBlocked = decideSlidingWindow(stamps, HOUR_MS - 1, 5, HOUR_MS);
    expect(stillBlocked.allowed).toBe(false);

    const opened = decideSlidingWindow(stamps, HOUR_MS + 1000, 5, HOUR_MS);
    expect(opened.allowed).toBe(true);
    expect(opened.stamps).toEqual([2000, 3000, 4000, HOUR_MS + 1000]);
  });
});

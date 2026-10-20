import { describe, expect, it } from "vitest";

import { accessOf, deny, markDuplicates, removalBlock } from "@/features/auth/services/access";

describe("access", () => {
  it("lets an admin approve any budget", () => {
    expect(deny({ role: "admin" }, "approve", 10_000_000)).toBeNull();
    expect(deny({ role: "admin" }, "sync")).toBeNull();
  });

  it("treats a missing role as a team member with no write steps", () => {
    expect(accessOf({}).role).toBe("team");
    expect(accessOf({}).canSync).toBe(false);
    expect(accessOf({}).canApprove).toBe(false);
    expect(deny({}, "sync")).toMatch(/not allowed you to change the sheet/);
    expect(deny({ role: null }, "approve")).toMatch(/not allowed you to approve/);
  });

  it("blocks a team member until an admin allows the step", () => {
    const team = { role: "team" as const, canApprove: false, canSync: false, canPropose: false };
    expect(deny(team, "approve")).toMatch(/not allowed you to approve/);
    expect(deny(team, "sync")).toMatch(/not allowed you to change the sheet/);
    expect(deny({ role: "team", canApprove: true, approveCapCents: 5_000 }, "approve", 8_000)).toMatch(/cap is 50.00 \$/);
  });

  it("keeps one admin and treats dotted Gmail addresses as the same person", () => {
    expect(removalBlock({ actorId: "a", targetId: "a", targetRole: "team", adminCount: 1 })).toMatch(/Delete account/);
    expect(removalBlock({ actorId: "a", targetId: "b", targetRole: "admin", adminCount: 1 })).toMatch(/one admin/);
    const marked = markDuplicates([
      { email: "yash.kaku@gmail.com" },
      { email: "yashkaku@gmail.com" },
      { email: "other@gmail.com" },
    ]);
    expect(marked[0]?.duplicate).toBe(true);
    expect(marked[1]?.duplicate).toBe(true);
    expect(marked[2]?.duplicate).toBe(false);
    expect(accessOf({ role: "team", canAsk: false }).canAsk).toBe(false);
  });
});

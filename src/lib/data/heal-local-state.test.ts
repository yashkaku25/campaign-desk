import { describe, expect, it } from "vitest";

import { healLocalState } from "@/lib/data/heal-local-state";
import { createDemoState } from "@/lib/data/seed";
import { DEMO_USER_ID, WORKSPACE_ID, type Profile } from "@/lib/domain";

const DEMO_EMAIL = "yash@studio.test";

describe("healLocalState", () => {
  it("keeps the demo admin and fills missing flags", () => {
    const state = createDemoState();
    const stripped = {
      ...state,
      profiles: state.profiles.map((profile) => bare(profile)),
    };
    const healed = healLocalState(stripped, DEMO_EMAIL);
    expect(healed.dirty).toBe(true);
    expect(healed.state.profiles[0]?.id).toBe(DEMO_USER_ID);
    expect(healed.state.profiles[0]?.role).toBe("admin");
    expect(healed.state.profiles[0]?.canSync).toBe(true);
  });

  it("treats an unknown second person as a locked-down team member", () => {
    const state = createDemoState();
    state.profiles.push({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      workspaceId: WORKSPACE_ID,
      displayName: "Guest",
      email: "guestperson@gmail.com",
      currency: "USD",
      avatarUrl: null,
      role: "team",
      canAsk: true,
      canPropose: false,
      canApprove: false,
      canSync: false,
      approveCapCents: 10_000,
    });
    const broken = {
      ...state,
      profiles: [state.profiles[0]!, bare(state.profiles[1]!)],
    };
    const healed = healLocalState(broken, DEMO_EMAIL);
    expect(healed.state.profiles[1]?.role).toBe("team");
    expect(healed.state.profiles[1]?.canSync).toBe(false);
    expect(healed.state.profiles[1]?.canApprove).toBe(false);
    expect(healed.state.profiles[0]?.role).toBe("admin");
  });
});

function bare(profile: Profile): Profile {
  return {
    id: profile.id,
    workspaceId: profile.workspaceId,
    displayName: profile.displayName,
    email: profile.email,
    currency: profile.currency,
    avatarUrl: profile.avatarUrl,
  } as Profile;
}

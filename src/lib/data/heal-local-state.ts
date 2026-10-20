import { accessOf } from "@/features/auth/services/access";
import type { AppState, DeskRole, Profile } from "@/lib/domain";
import { DEMO_USER_ID } from "@/lib/domain";

/**
 * Fill missing role flags on local profiles.
 * Unknown roles become team (least privilege), except the demo account or a sole profile.
 */
export function healLocalState(
  state: AppState,
  demoEmail: string,
): { state: AppState; dirty: boolean } {
  const profiles = state.profiles ?? [];
  let dirty = false;
  const nextProfiles = profiles.map((profile) => {
    const healed = healProfile(profile, profiles, demoEmail);
    if (
      healed.role !== profile.role ||
      healed.canAsk !== profile.canAsk ||
      healed.canPropose !== profile.canPropose ||
      healed.canApprove !== profile.canApprove ||
      healed.canSync !== profile.canSync ||
      healed.approveCapCents !== profile.approveCapCents
    ) {
      dirty = true;
    }
    return healed;
  });
  return {
    state: { ...state, profiles: nextProfiles, invites: state.invites ?? [] },
    dirty,
  };
}

function healProfile(profile: Profile, all: Profile[], demoEmail: string): Profile {
  const knownRole: DeskRole | null =
    profile.role === "admin" || profile.role === "team" ? profile.role : null;
  const role: DeskRole =
    knownRole ??
    (profile.id === DEMO_USER_ID ||
    profile.email.toLowerCase() === demoEmail.toLowerCase() ||
    all.length <= 1
      ? "admin"
      : "team");

  return {
    ...profile,
    ...accessOf({
      role,
      canAsk: profile.canAsk,
      canPropose: profile.canPropose,
      canApprove: profile.canApprove,
      canSync: profile.canSync,
      approveCapCents: profile.approveCapCents,
    }),
  };
}

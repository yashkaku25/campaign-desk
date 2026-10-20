import { MAX_DAILY_BUDGET_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/features/campaigns/services/caps";
import { signInEmail } from "@/features/auth/services/gmail-address";
import type { DeskRole } from "@/lib/domain";
import { formatDollars } from "@/lib/money";

export interface Access {
  role: DeskRole;
  canAsk: boolean;
  canPropose: boolean;
  canApprove: boolean;
  canSync: boolean;
  approveCapCents: number;
}

const ADMIN_ACCESS: Access = {
  role: "admin",
  canAsk: true,
  canPropose: true,
  canApprove: true,
  canSync: true,
  approveCapCents: MAX_DAILY_BUDGET_CENTS,
};

/** Least privilege when role is missing or unknown — never fail open to admin. */
const TEAM_DEFAULT: Access = {
  role: "team",
  canAsk: true,
  canPropose: false,
  canApprove: false,
  canSync: false,
  approveCapCents: MIN_DAILY_BUDGET_CENTS,
};

export function accessOf(profile: {
  role?: DeskRole | null;
  canAsk?: boolean;
  canPropose?: boolean;
  canApprove?: boolean;
  canSync?: boolean;
  approveCapCents?: number;
}): Access {
  if (profile.role === "admin") return ADMIN_ACCESS;
  if (profile.role !== "team") return { ...TEAM_DEFAULT };

  const cap = profile.approveCapCents;
  const approveCapCents =
    typeof cap === "number" && cap >= MIN_DAILY_BUDGET_CENTS && cap <= MAX_DAILY_BUDGET_CENTS
      ? cap
      : MIN_DAILY_BUDGET_CENTS;
  return {
    role: "team",
    canAsk: profile.canAsk !== false,
    canPropose: profile.canPropose === true,
    canApprove: profile.canApprove === true,
    canSync: profile.canSync === true,
    approveCapCents,
  };
}

export function deny(
  profile: Parameters<typeof accessOf>[0],
  kind: "ask" | "propose" | "approve" | "sync",
  budgetCents?: number,
): string | null {
  const access = accessOf(profile);
  if (access.role === "admin") return null;
  if (kind === "ask" && !access.canAsk) return "An admin has not allowed you to ask the desk.";
  if (kind === "propose" && !access.canPropose) return "An admin has not allowed you to suggest changes.";
  if (kind === "sync" && !access.canSync) return "An admin has not allowed you to change the sheet.";
  if (kind === "approve" && !access.canApprove) return "An admin has not allowed you to approve changes.";
  if (kind === "approve" && budgetCents !== undefined && budgetCents > access.approveCapCents) {
    return `That change is above the budget an admin allowed you to approve. The cap is ${formatDollars(access.approveCapCents)}.`;
  }
  return null;
}

export function removalBlock(input: {
  actorId: string;
  targetId: string;
  targetRole: DeskRole;
  adminCount: number;
}): string | null {
  if (input.actorId === input.targetId) return "Use Delete account to remove yourself.";
  if (input.targetRole === "admin" && input.adminCount < 2) return "The desk needs one admin.";
  return null;
}

export function markDuplicates<T extends { email: string }>(people: T[]): Array<T & { duplicate: boolean }> {
  const counts = new Map<string, number>();
  for (const person of people) {
    const key = signInEmail(person.email);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return people.map((person) => ({
    ...person,
    duplicate: (counts.get(signInEmail(person.email)) ?? 0) > 1,
  }));
}

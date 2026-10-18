import type { PreviewModel, ProposedAction } from "@/lib/domain";
import { formatDollars, statusLabel } from "@/lib/money";

type Money = (cents: number) => string;

export function toPreview(action: ProposedAction, now: Date, money: Money = formatDollars): PreviewModel {
  const lines = action.targets.map((target) => ({
    name: target.name,
    before: `${statusLabel(target.beforeStatus)} · ${money(target.beforeBudgetCents)} / day`,
    after: `${statusLabel(target.afterStatus)} · ${money(target.afterBudgetCents)} / day`,
    note: target.note,
  }));
  if (action.create) {
    lines.push({
      name: action.create.name,
      before: "Not created",
      after: `Active · ${money(action.create.dailyBudgetCents)} / day`,
      note: null,
    });
  }
  return {
    id: action.id,
    status: action.status,
    summary: action.summary,
    expiresAt: action.expiresAt,
    lines,
    canApprove: action.status === "pending" && new Date(action.expiresAt).getTime() > now.getTime(),
  };
}

/** The only place campaign limits live. */
export const MAX_CAMPAIGNS_PER_ACTION = 25;
export const MIN_DAILY_BUDGET_CENTS = 100;
export const MAX_DAILY_BUDGET_CENTS = 10_000_000;
export const PREVIEW_TTL_MS = 10 * 60 * 1000;

export function explainCap(input: { targetCount: number; budgetCents?: number }): string | null {
  if (input.targetCount > MAX_CAMPAIGNS_PER_ACTION) {
    return `That matches ${input.targetCount} campaigns. One preview can change at most ${MAX_CAMPAIGNS_PER_ACTION}. Narrow the command.`;
  }
  if (input.budgetCents === undefined) return null;
  if (input.budgetCents < MIN_DAILY_BUDGET_CENTS) {
    return "Daily budget has to be at least 1.00 $.";
  }
  if (input.budgetCents > MAX_DAILY_BUDGET_CENTS) {
    return "Daily budget has to be 100,000.00 $ or less.";
  }
  return null;
}

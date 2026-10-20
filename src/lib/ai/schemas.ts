import { z } from "zod";

const filterSchema = z.object({
  ctrBelow: z.number().min(0).max(100).optional(),
  ctrAbove: z.number().min(0).max(100).optional(),
  status: z.enum(["draft", "active", "paused", "ended"]).optional(),
  nameContains: z.string().trim().min(1).max(120).optional(),
  names: z.array(z.string().trim().min(1).max(120)).max(25).optional(),
});

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pause"), filter: filterSchema.default({}) }),
  z.object({ type: z.literal("resume"), filter: filterSchema.default({}) }),
  z.object({
    type: z.literal("set_daily_budget"),
    filter: filterSchema.default({}),
    dailyBudgetCents: z.number().int(),
  }),
  z.object({
    type: z.literal("create_campaign"),
    name: z.string().trim().min(1).max(120),
    dailyBudgetCents: z.number().int(),
    /** Marketer strategy for the create — shown on preview and kept for audit context. */
    strategyNote: z.string().trim().min(1).max(500).optional(),
    /** What the marketer expects after Approve — not a guarantee. */
    expectedOutcome: z.string().trim().min(1).max(500).optional(),
  }),
  z.object({
    type: z.literal("reallocate_budget"),
    from: filterSchema.default({}),
    to: filterSchema.default({}),
    shiftCents: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("answer"),
    message: z.string().trim().min(1).max(2000),
  }),
]);

const envelopeSchema = z.object({
  actions: z.array(actionSchema).min(1).max(2),
});

export type CampaignFilter = z.infer<typeof filterSchema>;
export type CampaignAction = z.infer<typeof actionSchema>;
export type MutationAction = Exclude<CampaignAction, { type: "answer" }>;

export const MAX_COMMAND_LENGTH = 2000;

function asFraction(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (value > 1) return Math.round((value / 100) * 10_000) / 10_000;
  return value;
}

function normalizeFilter(filter: CampaignFilter): CampaignFilter {
  return {
    ...filter,
    ctrBelow: asFraction(filter.ctrBelow),
    ctrAbove: asFraction(filter.ctrAbove),
  };
}

function normalize(action: CampaignAction): CampaignAction {
  if (action.type === "answer" || action.type === "create_campaign") return action;
  if (action.type === "reallocate_budget") {
    return { ...action, from: normalizeFilter(action.from), to: normalizeFilter(action.to) };
  }
  return { ...action, filter: normalizeFilter(action.filter) };
}

export function parseActions(
  raw: unknown,
): { ok: true; actions: CampaignAction[] } | { ok: false; reason: string } {
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "The reply was not one of the allowed changes: pause, resume, budget, move budget, create, or a question.",
    };
  }
  return { ok: true, actions: parsed.data.actions.map(normalize) };
}

export function filterIsEmpty(filter: CampaignFilter): boolean {
  return (
    filter.ctrBelow === undefined &&
    filter.ctrAbove === undefined &&
    filter.status === undefined &&
    !filter.nameContains &&
    (!filter.names || filter.names.length === 0)
  );
}

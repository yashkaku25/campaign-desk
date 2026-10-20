/**
 * When someone asks to create a campaign or wants strategies,
 * draft a full create preview plus a marketer brief from desk + sheet hints.
 * Strategies rotate so each ask is not the same playbook.
 */

import type { CampaignAction } from "@/lib/ai/schemas";
import type { CampaignSummary } from "@/lib/domain";
import { formatDollars } from "@/lib/money";
import { isStrong, isWeak } from "@/lib/ai/context";

export interface SheetHintLine {
  campaignName: string;
  headline: string | null;
  primaryText: string | null;
  product: string | null;
}

interface StrategySeed {
  id: string;
  /** Short marketer label. */
  label: string;
  name: (ctx: StrategyContext) => string;
  dailyBudgetCents: (ctx: StrategyContext) => number;
  strategyNote: (ctx: StrategyContext) => string;
  expectedOutcome: (ctx: StrategyContext) => string;
  brief: (ctx: StrategyContext) => string;
}

interface StrategyContext {
  campaigns: CampaignSummary[];
  hints: SheetHintLine[];
  weak: CampaignSummary[];
  strong: CampaignSummary[];
  product: string;
  round: number;
}

const ASK_CREATE =
  /\b(create|launch|start|build|set\s*up|spin\s*up)\b.{0,40}\b(campaign|ad\s*set|ads?)\b|\bi\s+want\s+(to\s+)?(create|launch|run)\b|\bnew\s+campaign\b/i;

const ASK_STRATEGY =
  /\b(strateg(y|ies)|what\s+should\s+i\s+(do|test|try)|suggest|recommend|idea|playbook|how\s+do\s+i\s+(fix|improve|test)|don'?t\s+know\s+what\s+to\s+do|elevate|next\s+test)\b/i;

export function asksToCreateCampaign(text: string): boolean {
  return ASK_CREATE.test(text);
}

export function asksForStrategy(text: string): boolean {
  return ASK_STRATEGY.test(text);
}

const STRATEGIES: StrategySeed[] = [
  {
    id: "prospect_feed",
    label: "Cold prospect · Feed",
    name: (ctx) => uniqueName(`${ctx.product} — Prospect Feed`, ctx),
    dailyBudgetCents: (ctx) => budgetNear(ctx, 4000),
    strategyNote: () =>
      "Cold / broad interest on Feed. New creative angle from the sheet offer. Exclude purchasers if you have a list.",
    expectedOutcome: () =>
      "Expect learning for ~50 link clicks or a few results. CTR should beat your weak sets; if not, kill creative in 3–4 days.",
    brief: (ctx) =>
      [
        `Strategy: Cold prospect on Feed for “${ctx.product}”.`,
        ctx.weak[0]
          ? `Your sheet shows “${ctx.weak[0].name}” is weak — do not copy that creative; use a fresher angle.`
          : "No weak set flagged — still keep the first week as a controlled test.",
        "What to expect: delivery into learning, watch CTR and cost per result vs your stronger campaigns.",
        "Tracked: Approve the create preview to save the campaign; the audit log keeps the decision.",
      ].join(" "),
  },
  {
    id: "retarget_cart",
    label: "Retarget cart · 7-day",
    name: (ctx) => uniqueName(`${ctx.product} — Cart 7d`, ctx),
    dailyBudgetCents: (ctx) => budgetNear(ctx, 3000),
    strategyNote: () =>
      "Site cart / add-to-cart window 7 days. Shorter window than 30d so you do not pay tired people.",
    expectedOutcome: () =>
      "Higher CTR and conversion rate than cold, lower reach. If frequency climbs past ~3 with no results, shorten further or refresh creative.",
    brief: (ctx) =>
      [
        "Strategy: Retarget recent cart abandoners (7-day window).",
        ctx.strong[0]
          ? `Lean budget toward the same offer that works on “${ctx.strong[0].name}”.`
          : "Use the sheet product/offer as the reminder creative.",
        "What to expect: fewer impressions, better efficiency if the page matches the ad.",
        "Tracked: Approve creates the campaign; later pause/budget moves stay in chat previews + audit.",
      ].join(" "),
  },
  {
    id: "lead_instant",
    label: "Leads · Instant Form",
    name: (ctx) => uniqueName(`${ctx.product} — Instant Form`, ctx),
    dailyBudgetCents: (ctx) => budgetNear(ctx, 3500),
    strategyNote: () =>
      "Leads on Instant Form (inside Meta). Keep questions short: name, email, one custom. Privacy link required.",
    expectedOutcome: () =>
      "Results = form submits, not website thank-you. If opens >> submits, cut questions or fix intro trust.",
    brief: () =>
      [
        "Strategy: Instant Form lead gen so people never leave Facebook/Instagram.",
        "What to expect: form opens mid-funnel; complete rate is the real score.",
        "Open Simulation after Approve to practice the Instant Form path with the same offer.",
        "Tracked: create preview + audit when you Approve.",
      ].join(" "),
  },
  {
    id: "message_wa",
    label: "Messages · WhatsApp",
    name: (ctx) => uniqueName(`${ctx.product} — WhatsApp`, ctx),
    dailyBudgetCents: (ctx) => budgetNear(ctx, 2500),
    strategyNote: () =>
      "Conversion location WhatsApp. Result = started conversation. Staff must reply fast in the first minutes.",
    expectedOutcome: () =>
      "Conversations, not purchases. Ghost rate rises if reply speed is slow — watch that before raising budget.",
    brief: () =>
      [
        "Strategy: Click-to-WhatsApp for high-intent shoppers.",
        "What to expect: chats open in WhatsApp; website URL is optional fallback only.",
        "Practice the message funnel in Simulation Delivery week after Approve.",
        "Tracked: Approve saves the campaign; chat keeps the strategy note on the preview.",
      ].join(" "),
  },
  {
    id: "asc_scale",
    label: "Scale winner · +20% budget",
    name: (ctx) => uniqueName(`${(ctx.strong[0]?.name ?? ctx.product).slice(0, 40)} — Scale`, ctx),
    dailyBudgetCents: (ctx) =>
      Math.min(
        10_000_000,
        Math.max(2000, Math.round((ctx.strong[0]?.dailyBudgetCents ?? 4000) * 1.2)),
      ),
    strategyNote: (ctx) =>
      ctx.strong[0]
        ? `Scale the sheet winner “${ctx.strong[0].name}” with a sibling campaign / higher daily budget — not a blind Advantage+ dump.`
        : "No clear winner yet — this is a controlled scale test at a modest daily budget.",
    expectedOutcome: () =>
      "Spend rises; CPR should stay near the winner. If CPR jumps >30%, pull back.",
    brief: (ctx) =>
      [
        ctx.strong[0]
          ? `Strategy: Scale what already works on “${ctx.strong[0].name}” (sheet read: strong).`
          : "Strategy: Controlled scale while learning is still thin.",
        "What to expect: more spend at similar efficiency if creative and audience stay the same.",
        "Tracked: Approve creates the scale vehicle; compare CPR to the parent in Overview.",
      ].join(" "),
  },
  {
    id: "creative_ab",
    label: "Creative A/B · same audience",
    name: (ctx) => uniqueName(`${ctx.product} — Creative A/B`, ctx),
    dailyBudgetCents: (ctx) => budgetNear(ctx, 4500),
    strategyNote: (ctx) => {
      const hint = ctx.hints[0];
      const line = hint?.headline ? `Sheet headline seed: “${hint.headline}”.` : "Write two clear angles.";
      return `Same audience, two creatives (A/B). ${line} Kill the loser after enough impressions.`;
    },
    expectedOutcome: () =>
      "One creative should win on CTR or results. Switch budget to the winner; do not average them forever.",
    brief: (ctx) =>
      [
        "Strategy: Creative A/B on one audience so the week teaches which ad people stop for.",
        ctx.hints[0]?.primaryText
          ? `Sheet copy seed available for “${ctx.hints[0].campaignName}”.`
          : "Use Simulation upload for A/B media after the desk campaign exists.",
        "What to expect: split delivery; pick a winner from CTR / results, not vanity reach.",
        "Tracked: Approve creates the campaign; Analyse in Simulation watches A vs B.",
      ].join(" "),
  },
  {
    id: "cut_waste",
    label: "Replace waste · new angle",
    name: (ctx) => uniqueName(`${ctx.product} — Fresh Angle`, ctx),
    dailyBudgetCents: (ctx) => budgetNear(ctx, 3500),
    strategyNote: (ctx) =>
      ctx.weak[0]
        ? `Replace waste from “${ctx.weak[0].name}” with a new named test — pause the weak set separately after Approve.`
        : "Fresh angle test while the account is stable.",
    expectedOutcome: () =>
      "If the new angle is healthier after a few days, pause the old weak set. Do not run both forever.",
    brief: (ctx) =>
      [
        ctx.weak[0]
          ? `Strategy: Your sheet flags “${ctx.weak[0].name}” as weak — launch a fresh-angle campaign instead of pouring budget into it.`
          : "Strategy: Fresh-angle test for learning.",
        "What to expect: early CTR signal within a few days; pair with a pause on the weak set if you Approve both moves over time.",
        "Tracked: this create preview is one decision; pause the weak set as a second Approve when ready.",
      ].join(" "),
  },
];

export function suggestCampaignStrategyActions(
  text: string,
  campaigns: CampaignSummary[],
  hints: SheetHintLine[] = [],
): CampaignAction[] {
  const ctx = buildContext(campaigns, hints, text);
  const createAsked = asksToCreateCampaign(text);
  const strategyAsked = asksForStrategy(text);

  if (!createAsked && strategyAsked) {
    const picks = pickStrategies(ctx, 3);
    return [
      {
        type: "answer",
        message: [
          "Here are three different tests from your desk numbers and sheet (when available). Say which to create, or ask “create a campaign” and I will draft one for Approve.",
          "",
          ...picks.map(
            (seed, index) =>
              `${index + 1}. ${seed.label} — ${seed.strategyNote(ctx)} Expect: ${seed.expectedOutcome(ctx)}`,
          ),
          "",
          "Nothing is saved until you Approve a create preview. Audit keeps every Approve/Reject.",
        ].join("\n"),
      },
    ];
  }

  const seed = pickStrategies(ctx, 1)[0] ?? STRATEGIES[0]!;
  const name = seed.name(ctx);
  const dailyBudgetCents = seed.dailyBudgetCents(ctx);
  const strategyNote = seed.strategyNote(ctx);
  const expectedOutcome = seed.expectedOutcome(ctx);

  return [
    {
      type: "create_campaign",
      name,
      dailyBudgetCents,
      strategyNote,
      expectedOutcome,
    },
    {
      type: "answer",
      message: [
        seed.brief(ctx),
        "",
        `Strategy note: ${strategyNote}`,
        `What to expect: ${expectedOutcome}`,
        `Daily budget proposed: ${formatDollars(dailyBudgetCents)}.`,
        "Approve the create preview to save it on the desk. Reject leaves campaigns unchanged. Ask again for a different strategy — I rotate tests.",
      ].join(" "),
    },
  ];
}

function buildContext(
  campaigns: CampaignSummary[],
  hints: SheetHintLine[],
  text: string,
): StrategyContext {
  const weak = campaigns.filter((campaign) => isWeak(campaign));
  const strong = campaigns.filter((campaign) => isStrong(campaign));
  const product =
    hints.find((hint) => hint.product)?.product?.trim() ||
    hints.find((hint) => hint.headline)?.headline?.trim() ||
    strong[0]?.name ||
    weak[0]?.name ||
    campaigns[0]?.name ||
    "Offer";
  // Rotate by ask text + desk names so the same vague line does not always pick the same play,
  // and a follow-up like "create a different campaign" lands on another seed.
  const round = Math.abs(
    hash(`${text.toLowerCase()}|${campaigns.map((c) => c.name).join(",")}|${hints.map((h) => h.product ?? h.headline ?? "").join(",")}`),
  );
  return { campaigns, hints, weak, strong, product: product.slice(0, 48), round };
}

function pickStrategies(ctx: StrategyContext, count: number): StrategySeed[] {
  const start = ctx.round % STRATEGIES.length;
  const ordered = [...STRATEGIES.slice(start), ...STRATEGIES.slice(0, start)];
  // Prefer cut_waste when weak exists, asc_scale when strong exists.
  const preferred: StrategySeed[] = [];
  if (ctx.weak.length > 0) {
    const cut = ordered.find((s) => s.id === "cut_waste");
    if (cut) preferred.push(cut);
  }
  if (ctx.strong.length > 0) {
    const scale = ordered.find((s) => s.id === "asc_scale");
    if (scale && !preferred.includes(scale)) preferred.push(scale);
  }
  for (const seed of ordered) {
    if (preferred.length >= count) break;
    if (!preferred.includes(seed)) preferred.push(seed);
  }
  return preferred.slice(0, count);
}

function uniqueName(base: string, ctx: StrategyContext): string {
  const names = new Set(ctx.campaigns.map((campaign) => campaign.name.toLowerCase()));
  let candidate = base.slice(0, 100);
  let n = 2;
  while (names.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 90)} ${n}`;
    n += 1;
  }
  return candidate;
}

function budgetNear(ctx: StrategyContext, fallback: number): number {
  const active = ctx.campaigns.filter((campaign) => campaign.status === "active");
  if (active.length === 0) return fallback;
  const avg = Math.round(
    active.reduce((sum, campaign) => sum + campaign.dailyBudgetCents, 0) / active.length,
  );
  return Math.min(10_000_000, Math.max(1000, Math.round(avg * 0.9) || fallback));
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return h;
}

import { FEELINGS } from "@/features/practice/emotions/catalog";
import type {
  FeelingRecord,
  FeelingStage,
  ShopperAct,
  ShopperFacts,
  ShopperResolution,
  StageResolution,
} from "@/features/practice/emotions/types";

const STAGES: FeelingStage[] = ["notice", "click", "pay", "after"];

export const ACT_LABEL: Record<ShopperAct, string> = {
  stop: "They stop",
  scroll: "They scroll on",
  click: "They click",
  view_page: "They view the page",
  lead: "They leave a lead",
  cart: "They add it to the cart",
  checkout: "They start checkout",
  buy: "They buy",
  hide: "They hide the ad",
  bounce: "They leave",
  wait: "They wait",
  share: "They share",
  save: "They save it for later",
};

export function resolveShopper(facts: ShopperFacts): ShopperResolution {
  const present = new Set(facts.present);
  const carried = new Set(facts.carried ?? []);
  const live = liveFeelings(present, carried);
  const stages = STAGES.map((stage) => resolveStage(stage, live));
  return {
    stages,
    carryToNextDay: feelingsToCarry(live, present, carried),
  };
}

export function marketerNote(resolution: ShopperResolution): string | null {
  const names = resolution.stages.flatMap((stage) =>
    [stage.winner, stage.runnerUp, ...stage.bothVisible].filter((item): item is FeelingRecord => item !== null).map((item) => item.name),
  );
  if (names.includes("Disgust") || names.includes("Betrayal")) {
    return "People are hiding the ad because of disgust or betrayal. That is not a bidding problem.";
  }
  if (names.includes("Anxiety") || names.includes("Sting of paying")) {
    return "People are leaving at checkout because of anxiety or the sting of paying. That is not a creative problem.";
  }
  return null;
}

function liveFeelings(present: Set<string>, carried: Set<string>): FeelingRecord[] {
  return FEELINGS.filter((feeling) => started(feeling, present) || carriedIsLive(feeling, present, carried));
}

function started(feeling: FeelingRecord, present: Set<string>): boolean {
  if (feeling.unless?.some((fact) => present.has(fact))) return false;
  return feeling.when.every((fact) => present.has(fact));
}

function carriedIsLive(feeling: FeelingRecord, present: Set<string>, carried: Set<string>): boolean {
  if (!carried.has(feeling.id)) return false;
  if (feeling.fades === "end_of_day") return false;
  if (feeling.fades === "while_note") return feeling.when.every((fact) => present.has(fact));
  if (feeling.fades === "after_purchase") return !present.has("repurchase_open");
  return true;
}

function resolveStage(stage: FeelingStage, live: FeelingRecord[]): StageResolution {
  const ranked = live
    .filter((feeling) => feeling.stage === stage)
    .sort((a, b) => b.when.length - a.when.length || catalogOrder(a) - catalogOrder(b));
  const winner = ranked[0] ?? null;
  const runnerUp = ranked[1] ?? null;
  if (!winner) {
    return { stage, winner: null, runnerUp: null, tie: false, bothVisible: [], act: null };
  }
  const tie =
    runnerUp !== null && runnerUp.when.length === winner.when.length && runnerUp.pushes !== winner.pushes;
  let act: ShopperAct | null = tie ? null : winner.pushes;
  const blocker = live.find(
    (feeling) => feeling.id !== winner.id && feeling.blocks === winner.pushes && feeling.when.length >= winner.when.length,
  );
  if (blocker && act !== null) act = null;
  const bothVisible = uniqueFeelings([winner, runnerUp, blocker ?? null, opposed(winner, live), opposed(runnerUp, live)]);
  return { stage, winner, runnerUp, tie, bothVisible, act };
}

function opposed(feeling: FeelingRecord | null, live: FeelingRecord[]): FeelingRecord | null {
  if (!feeling) return null;
  return live.find((item) => item.id === feeling.opposedBy) ?? null;
}

function feelingsToCarry(live: FeelingRecord[], present: Set<string>, carried: Set<string>): string[] {
  const ids: string[] = [];
  for (const feeling of live) {
    if (feeling.stage !== "after") continue;
    const wasCarried = carried.has(feeling.id);
    if (feeling.fades === "end_of_day") continue;
    if (feeling.fades === "next_sight") {
      if (!wasCarried) ids.push(feeling.id);
      continue;
    }
    if (feeling.fades === "while_note") {
      if (feeling.when.every((fact) => present.has(fact))) ids.push(feeling.id);
      continue;
    }
    if (!present.has("repurchase_open")) ids.push(feeling.id);
  }
  return ids;
}

function catalogOrder(feeling: FeelingRecord): number {
  return FEELINGS.findIndex((item) => item.id === feeling.id);
}

function uniqueFeelings(items: Array<FeelingRecord | null>): FeelingRecord[] {
  const seen = new Set<string>();
  const result: FeelingRecord[] = [];
  for (const item of items) {
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

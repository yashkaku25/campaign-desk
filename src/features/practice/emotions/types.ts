/**
 * One record per shopper feeling. The simulation reads these records.
 * It does not invent a mood that is not in the catalog.
 */

export type FeelingStage = "notice" | "click" | "pay" | "after";

export type ShopperAct =
  | "stop"
  | "scroll"
  | "click"
  | "view_page"
  | "lead"
  | "cart"
  | "checkout"
  | "buy"
  | "hide"
  | "bounce"
  | "wait"
  | "share"
  | "save";

/** Which pile the feeling is allowed to come from. */
export type FeelingSource = "person" | "need" | "moment" | "history" | "public_note";

export type FeelingFade = "next_sight" | "end_of_day" | "after_purchase" | "while_note";

export interface FeelingRecord {
  id: string;
  name: string;
  stage: FeelingStage;
  source: FeelingSource;
  /** Every one of these facts must be present or the feeling does not start. */
  when: string[];
  /** If any of these facts are present, the feeling does not start. */
  unless?: string[];
  pushes: ShopperAct;
  blocks: ShopperAct;
  opposedBy: string;
  fades: FeelingFade;
}

export interface ShopperFacts {
  /** Facts that are true right now. A feeling name is not a fact. */
  present: string[];
  /** Feeling ids written onto the person at the end of the previous simulated day. */
  carried?: string[];
}

export interface StageResolution {
  stage: FeelingStage;
  winner: FeelingRecord | null;
  runnerUp: FeelingRecord | null;
  tie: boolean;
  bothVisible: FeelingRecord[];
  act: ShopperAct | null;
}

export interface ShopperResolution {
  stages: StageResolution[];
  carryToNextDay: string[];
}

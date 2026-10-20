import type { FeelingStage, ShopperAct } from "@/features/practice/emotions/types";
import type { PracticeRun } from "@/features/practice/services/run-practice";
import {
  STEP_LABEL,
  buildPersonJourney,
  type JourneyStep,
} from "@/features/practice/services/research-journey";

export interface ShopperMoment {
  id: string;
  tMs: number;
  day: number;
  person: string;
  stage: FeelingStage;
  feelingName: string | null;
  feelingId: string | null;
  act: ShopperAct | null;
  thought: string;
  kind: "shopper" | "day" | "marketer" | "why";
  placement?: "advantage" | "feed" | "reels" | "stories";
  creativeLabel?: "A" | "B";
  /** Research step label for the feed. */
  step?: JourneyStep;
  /** Plain reason the marketer can act on. */
  why?: string;
}

const PEOPLE = [
  "Aarav",
  "Maya",
  "Leo",
  "Priya",
  "Noah",
  "Anika",
  "Sam",
  "Riya",
  "Jordan",
  "Elena",
  "Kai",
  "Sofia",
];

const PEOPLE_PER_DAY = 5;
const GAP_MS = 700;
const DAY_PAUSE_MS = 1200;

const PLACEMENTS: Array<"feed" | "reels" | "stories"> = ["feed", "reels", "stories"];

/** Turns a finished week into timed research journeys — not one-line feelings. */
export function buildMoments(run: PracticeRun, product: string, destinationUrl?: string): ShopperMoment[] {
  const moments: ShopperMoment[] = [];
  let t = 400;
  let personIndex = 0;
  const setupPlacement = run.setup.audience.placement;
  const url =
    destinationUrl?.trim() ||
    (run.setup.creative as { destinationUrl?: string }).destinationUrl ||
    "https://example.com";
  void product;

  for (const day of run.days) {
    const dayPlacement =
      setupPlacement === "advantage" ? (PLACEMENTS[(day.day - 1) % PLACEMENTS.length] ?? "feed") : setupPlacement;

    moments.push({
      id: `day-${day.day}`,
      tMs: t,
      day: day.day,
      person: "",
      stage: "notice",
      feelingName: null,
      feelingId: null,
      act: null,
      thought: `Day ${day.day} · people researching the ad`,
      kind: "day",
      placement: dayPlacement,
    });
    t += 450;

    for (let p = 0; p < PEOPLE_PER_DAY; p += 1) {
      const person = PEOPLE[personIndex % PEOPLE.length] ?? "Someone";
      personIndex += 1;
      const personPlacement =
        setupPlacement === "advantage" ? (PLACEMENTS[p % PLACEMENTS.length] ?? "feed") : setupPlacement;
      const creativeLabel: "A" | "B" = p % 2 === 1 ? "B" : "A";

      const journey = buildPersonJourney(
        day,
        run.setup,
        person,
        personIndex,
        creativeLabel,
        personPlacement,
        url,
      );

      for (const beat of journey) {
        moments.push({
          id: `${day.day}-${person}-${beat.step}-${moments.length}`,
          tMs: t,
          day: day.day,
          person,
          stage: beat.stage,
          feelingName: beat.feelingName,
          feelingId: null,
          act: beat.act,
          thought: beat.thought,
          kind: "shopper",
          placement: personPlacement,
          creativeLabel,
          step: beat.step,
          why: beat.why,
        });
        t += GAP_MS;

        // Surface a short why chip after important breaks.
        if (
          beat.step === "hid" ||
          beat.step === "mismatched" ||
          beat.step === "left" ||
          beat.step === "result" ||
          beat.step === "read_url"
        ) {
          moments.push({
            id: `why-${moments.length}`,
            tMs: t,
            day: day.day,
            person: "Why",
            stage: beat.stage,
            feelingName: null,
            feelingId: null,
            act: beat.act,
            thought: beat.why,
            kind: "why",
            placement: personPlacement,
            creativeLabel,
            step: beat.step,
            why: beat.why,
          });
          t += GAP_MS * 0.75;
        }
      }

      const last = journey[journey.length - 1];
      if (last && (last.step === "hid" || last.step === "left" || last.step === "mismatched")) {
        moments.push({
          id: `marketer-${moments.length}`,
          tMs: t,
          day: day.day,
          person: "Marketer",
          stage: last.stage,
          feelingName: last.feelingName,
          feelingId: null,
          act: last.act,
          thought: marketerLine(last.step, creativeLabel, personPlacement),
          kind: "marketer",
          placement: personPlacement,
          creativeLabel,
          step: last.step,
          why: last.why,
        });
        t += GAP_MS;
      }
    }
    t += DAY_PAUSE_MS;
  }

  return moments;
}

function marketerLine(step: JourneyStep, creative: "A" | "B", placement: string): string {
  if (step === "hid") return `Creative ${creative} is getting hidden on ${placement}. Change the ad, not the bid.`;
  if (step === "mismatched" || step === "left") {
    return "People opened the link, researched, then left. Fix the URL/page match before you raise budget.";
  }
  return "Watch the research path — stop → URL → scroll → result.";
}

export interface MomentCounts {
  stopped: number;
  scrolled: number;
  clicked: number;
  hid: number;
  bought: number;
  bounced: number;
  waited: number;
  landing: number;
  formOpen: number;
  leads: number;
  cart: number;
  checkout: number;
  purchases: number;
  /** Opened Messenger / IG / WhatsApp chat. */
  messages: number;
  /** Tapped click-to-call. */
  calls: number;
  reported: number;
}

export function countActs(moments: ShopperMoment[], untilMs?: number): MomentCounts {
  const counts: MomentCounts = {
    stopped: 0,
    scrolled: 0,
    clicked: 0,
    hid: 0,
    bought: 0,
    bounced: 0,
    waited: 0,
    landing: 0,
    formOpen: 0,
    leads: 0,
    cart: 0,
    checkout: 0,
    purchases: 0,
    messages: 0,
    calls: 0,
    reported: 0,
  };
  for (const moment of moments) {
    if (moment.kind !== "shopper") continue;
    if (untilMs !== undefined && moment.tMs > untilMs) continue;

    if (moment.step === "stopped" || moment.act === "stop") counts.stopped += 1;
    if (moment.step === "scrolled_past" || moment.act === "scroll") counts.scrolled += 1;
    if (moment.step === "opened_link" || moment.act === "click") counts.clicked += 1;
    if (moment.step === "on_page" || moment.step === "read_url" || moment.act === "view_page") {
      counts.landing += 1;
    }
    if (moment.step === "form") counts.formOpen += 1;
    if (moment.step === "messaged") counts.messages += 1;
    if (moment.step === "called") counts.calls += 1;
    if (moment.step === "result" && moment.act === "lead") counts.leads += 1;
    if (moment.step === "cart" || moment.act === "cart") counts.cart += 1;
    if (moment.step === "checkout" || moment.act === "checkout") counts.checkout += 1;
    if (moment.step === "result" && moment.act === "buy") counts.purchases += 1;
    if (moment.step === "cart" || moment.step === "checkout" || moment.act === "buy") counts.bought += 1;
    if (moment.step === "hid" || moment.act === "hide") counts.hid += 1;
    if (moment.step === "reported") counts.reported += 1;
    if (moment.step === "left" || moment.step === "mismatched" || moment.act === "bounce") {
      counts.bounced += 1;
    }
    if (moment.act === "wait") counts.waited += 1;
  }
  return counts;
}

export { STEP_LABEL };

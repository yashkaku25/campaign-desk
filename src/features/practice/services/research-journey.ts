/**
 * How a real person researches an ad: see it → decide → open the link →
 * read the URL and page → scroll → match the promise → leave a result or leave.
 */

import type { FeelingStage, ShopperAct } from "@/features/practice/emotions/types";
import type { MetaObjectiveId } from "@/features/practice/meta/detailed-targeting";
import type { PracticeDay } from "@/features/practice/services/run-practice";
import type { SimulationSetup } from "@/features/practice/services/setup";

export type JourneyStep =
  | "saw_ad"
  | "scrolled_past"
  | "stopped"
  | "opened_link"
  | "read_url"
  | "on_page"
  | "scrolling_site"
  | "matched"
  | "mismatched"
  | "form"
  | "cart"
  | "checkout"
  | "result"
  | "left"
  | "hid"
  | "reported"
  | "messaged"
  | "called";

export interface JourneyBeat {
  step: JourneyStep;
  stage: FeelingStage;
  act: ShopperAct | null;
  thought: string;
  why: string;
  feelingName: string | null;
}

export interface UrlRead {
  host: string;
  pathHint: string;
  looksLikeTest: boolean;
  looksTrusted: boolean;
}

export function readDestination(url: string): UrlRead {
  const raw = url.trim() || "https://example.com";
  let host = "the site";
  let path = "/";
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    host = parsed.hostname.replace(/^www\./, "");
    path = parsed.pathname + parsed.search;
  } catch {
    host = raw.slice(0, 40);
  }
  const lower = `${host}${path}`.toLowerCase();
  return {
    host,
    pathHint: path.length > 1 ? path.slice(0, 48) : "/",
    looksLikeTest: /test|demo|example|localhost|placeholder|staging/.test(lower),
    looksTrusted: /\.(com|io|co|shop|store)\b/.test(host) && !/example\.com|test/.test(lower),
  };
}

/** Build one person's research path from that day's feelings + the real setup. */
export function buildPersonJourney(
  day: PracticeDay,
  setup: SimulationSetup,
  person: string,
  personIndex: number,
  creativeLabel: "A" | "B",
  placement: "feed" | "reels" | "stories" | "advantage",
  destinationUrl: string,
): JourneyBeat[] {
  const headline = setup.creative.headline.trim() || "this ad";
  const product = setup.creative.product.trim() || "this offer";
  const copy = setup.creative.primaryText.trim();
  const objective = setup.objective ?? "sales";
  const pageQuality = setup.offer.pageQuality;
  const budget = setup.numbers?.dailyBudgetCents ?? setup.audience.windowDays;
  const thinTest = (setup.numbers?.dailyBudgetCents ?? 0) > 0 && (setup.numbers?.dailyBudgetCents ?? 0) < 5000;
  const url = readDestination(destinationUrl);
  const notice = day.resolution.stages.find((stage) => stage.stage === "notice");
  const clickStage = day.resolution.stages.find((stage) => stage.stage === "click");
  const payStage = day.resolution.stages.find((stage) => stage.stage === "pay");

  const noticeAct = notice?.act;
  const clickAct = clickStage?.act;
  const payAct = payStage?.act;
  const noticeFeeling = notice?.winner?.name ?? null;
  const clickFeeling = clickStage?.winner?.name ?? null;
  const payFeeling = payStage?.winner?.name ?? null;

  const stops =
    noticeAct === "stop" ||
    noticeAct === "click" ||
    (noticeAct !== "scroll" && noticeAct !== "hide" && personIndex % 3 !== 0);
  const hides = noticeAct === "hide" || noticeFeeling === "Disgust" || noticeFeeling === "Anger";
  const opens =
    stops &&
    !hides &&
    (clickAct === "click" ||
      clickAct === "view_page" ||
      clickAct === "lead" ||
      (clickFeeling !== null && personIndex % 2 === 0));

  const beats: JourneyBeat[] = [];

  beats.push({
    step: "saw_ad",
    stage: "notice",
    act: "stop",
    feelingName: noticeFeeling,
    thought: `On ${placementLabel(placement)} I see “${clip(headline, 42)}”${creativeLabel === "B" ? " (creative B)" : ""}.`,
    why: thinTest
      ? `This is a small ~$${((setup.numbers?.dailyBudgetCents ?? 4000) / 100).toFixed(0)}/day test — people skim fast.`
      : `Headline and picture have to earn a stop in a noisy ${placementLabel(placement)}.`,
  });

  // A minority abuse / report path — real Ads Manager noise.
  if (personIndex % 11 === 0) {
    beats.push({
      step: "reported",
      stage: "notice",
      act: "hide",
      feelingName: "Contempt",
      thought: `🚩 “Why am I seeing this?” I report “${clip(headline, 28)}” as irrelevant spam.`,
      why: "Reports and hides hurt delivery quality. Audience or creative is off for this person.",
    });
    return beats;
  }

  if (hides || personIndex % 9 === 0) {
    beats.push({
      step: "hid",
      stage: "notice",
      act: "hide",
      feelingName: noticeFeeling ?? "Anger",
      thought: `🚫 I hide it. ${noticeFeeling ? `${noticeFeeling} — ` : ""}${clip(headline, 36)} feels pushy or off.`,
      why: "Hide is a creative/trust problem, not a bid problem.",
    });
    return beats;
  }

  if (!stops) {
    beats.push({
      step: "scrolled_past",
      stage: "notice",
      act: "scroll",
      feelingName: noticeFeeling ?? "Indifference",
      thought: copy
        ? `I scroll past. “${clip(copy, 50)}” does not earn a second look.`
        : "Nothing in the first line catches me. I keep scrolling.",
      why: "No stop → no click → no lead. Fix the first line and the picture.",
    });
    return beats;
  }

  beats.push({
    step: "stopped",
    stage: "notice",
    act: "stop",
    feelingName: noticeFeeling,
    thought: noticeFeeling
      ? `${noticeFeeling}: I pause on ${product}. Is this worth a tap?`
      : `I pause. Is ${product} worth a tap?`,
    why: "A stop is attention. The next second decides click or scroll.",
  });

  if (!opens) {
    beats.push({
      step: "scrolled_past",
      stage: "click",
      act: "scroll",
      feelingName: clickFeeling,
      thought: "Interesting enough to glance — not enough to leave the feed.",
      why: "Stopped but did not click. Creative curiosity without a clear next step.",
    });
    return beats;
  }

  beats.push({
    step: "opened_link",
    stage: "click",
    act: "click",
    feelingName: clickFeeling,
    thought: `I tap through to check ${product} myself.`,
    why: "Click starts research. The landing page now has to keep the promise.",
  });

  beats.push({
    step: "read_url",
    stage: "click",
    act: "view_page",
    feelingName: null,
    thought: url.looksLikeTest
      ? `The link opens ${url.host}${url.pathHint === "/" ? "" : url.pathHint}. That looks like a test or placeholder URL — I get wary.`
      : `Browser shows ${url.host}${url.pathHint === "/" ? "" : " " + url.pathHint}. I read the address before I trust the page.`,
    why: url.looksLikeTest
      ? "People read the URL. example.com / test / demo paths kill trust on a leads campaign."
      : "URL hostname is part of the first trust check.",
  });

  beats.push({
    step: "on_page",
    stage: "click",
    act: "view_page",
    feelingName: clickFeeling,
    thought:
      pageQuality === "slow"
        ? "The page is slow. I am already deciding whether to leave."
        : pageQuality === "confusing"
          ? "I land and cannot tell what to do first. The ad was clearer than this page."
          : `Page loads. I look for the same promise as “${clip(headline, 36)}”.`,
    why:
      pageQuality !== "fast"
        ? "Slow or confusing pages burn the click you paid for."
        : "Landing page view — now they research.",
  });

  const scrollDepth = pageQuality === "fast" ? (personIndex % 3) + 1 : personIndex % 2;
  if (scrollDepth >= 1) {
    beats.push({
      step: "scrolling_site",
      stage: "click",
      act: "view_page",
      feelingName: null,
      thought:
        scrollDepth >= 2
          ? `I scroll further — looking for proof, price, and whether ${product} is real.`
          : "I skim the first screen only. If nothing clear, I am gone.",
      why: "Real research is scrolling. Depth drops when the page fights them.",
    });
  }

  const matches =
    !url.looksLikeTest &&
    pageQuality === "fast" &&
    (payAct === "buy" ||
      payAct === "cart" ||
      payAct === "checkout" ||
      payAct === "lead" ||
      clickAct === "lead" ||
      personIndex % 4 !== 0);

  if (!matches) {
    beats.push({
      step: "mismatched",
      stage: "pay",
      act: "bounce",
      feelingName: payFeeling ?? "Frustration",
      thought: url.looksLikeTest
        ? "Ad said one thing. The URL and page feel like a dry run. I leave."
        : pageQuality !== "fast"
          ? "I researched enough. The page does not deserve my details."
          : `The page does not match “${clip(headline, 32)}”. I bounce.`,
      why: "Ad–page mismatch or thin trust. Spend continues; results do not.",
    });
    beats.push({
      step: "left",
      stage: "pay",
      act: "bounce",
      feelingName: payFeeling,
      thought: "Back to the feed. That click was a waste of my time.",
      why: `${person} left after research. Count this as a bounce, not a quiet non-result.`,
    });
    return beats;
  }

  beats.push({
    step: "matched",
    stage: "pay",
    act: "view_page",
    feelingName: payFeeling ?? "Trust",
    thought: `The page lines up with the ad. I keep going on ${url.host}.`,
    why: "Match between ad and page is what turns research into a result.",
  });

  const location = setup.conversionLocation ?? "website";
  return [
    ...beats,
    ...outcomeBeats(
      objective,
      product,
      url.host,
      payFeeling,
      thinTest,
      location,
      setup.conversionLocationOther,
      setup.instantFormQuestionCount,
    ),
  ];
}

function outcomeBeats(
  objective: MetaObjectiveId,
  product: string,
  host: string,
  payFeeling: string | null,
  thinTest: boolean,
  location: string,
  locationOther?: string,
  formQuestions?: number,
): JourneyBeat[] {
  const where =
    location === "other" && locationOther?.trim()
      ? locationOther.trim()
      : location === "messenger"
        ? "Messenger"
        : location === "instagram"
          ? "Instagram inbox"
          : location === "whatsapp"
            ? "WhatsApp"
            : location === "instant_form"
              ? "an Instant Form"
              : location === "calls"
                ? "a call dialer"
                : location === "app"
                  ? "the app"
                  : host;

  if (location === "messenger" || location === "instagram" || location === "whatsapp") {
    return [
      {
        step: "messaged",
        stage: "pay",
        act: "lead",
        feelingName: payFeeling,
        thought: thinTest
          ? `💬 I open ${where}, type one line, then ghost — small test ads feel unfinished.`
          : `💬 I message on ${where} about ${product}. Waiting to see if a human replies.`,
        why: `Message campaigns resolve in ${where}, not on a website thank-you page. Watch reply speed and first-message quality.`,
      },
      {
        step: "result",
        stage: "pay",
        act: payFeeling === "Anxiety" || thinTest ? "bounce" : "lead",
        feelingName: payFeeling,
        thought:
          payFeeling === "Anxiety" || thinTest
            ? "I leave the chat. No one answered fast enough."
            : `Conversation started in ${where}. That is the result for this objective.`,
        why: "For messages, a started conversation is the result — not a purchase.",
      },
    ];
  }

  if (location === "calls") {
    return [
      {
        step: "called",
        stage: "pay",
        act: "lead",
        feelingName: payFeeling,
        thought: thinTest
          ? `📞 I tap Call, then hang up — a thin test ad does not earn my minutes.`
          : `📞 I tap Call about ${product}. The phone dialer opens.`,
        why: "Call campaigns finish on the phone dialer, not a website thank-you page.",
      },
      {
        step: "result",
        stage: "pay",
        act: payFeeling === "Anxiety" || thinTest ? "bounce" : "lead",
        feelingName: payFeeling,
        thought:
          payFeeling === "Anxiety" || thinTest
            ? "I cancel before it rings. Not ready to talk."
            : "Call connected / ringing. That counts as the result for Calls.",
        why: "For click-to-call, a started call is the result.",
      },
    ];
  }

  if (objective === "leads" || location === "instant_form") {
    const longForm = (formQuestions ?? 0) >= 6;
    return [
      {
        step: "form",
        stage: "pay",
        act: "lead",
        feelingName: payFeeling,
        thought: thinTest
          ? `📝 Instant Form opens for ${product}. It already feels like a dry run — I hesitate.`
          : longForm
            ? `📝 Instant Form asks a long list. I fill a few fields for ${product}, then stall.`
            : `📝 Instant Form on Facebook/Instagram — name and email for ${product} if this still feels honest.`,
        why: "Instant Forms stay inside Meta. No website load. Question count and privacy link drive complete rate.",
      },
      payFeeling === "Anxiety" || thinTest || longForm
        ? {
            step: "left" as const,
            stage: "pay" as const,
            act: "bounce" as const,
            feelingName: payFeeling,
            thought: longForm
              ? "Too many questions. I close the Instant Form."
              : "I close the Instant Form. Not ready to share details with a test-looking brand.",
            why: "Lead abandoned on the Instant Form. Shorten fields, clarify privacy, or improve creative match.",
          }
        : {
            step: "result" as const,
            stage: "pay" as const,
            act: "lead" as const,
            feelingName: payFeeling ?? "Trust",
            thought: `I submit the Instant Form. ${product} — they can follow up.`,
            why: "Lead captured inside Meta’s Instant Form.",
          },
    ];
  }

  if (objective === "traffic" || objective === "awareness") {
    return [
      {
        step: "result",
        stage: "pay",
        act: "view_page",
        feelingName: payFeeling,
        thought:
          objective === "awareness"
            ? `I remember ${product} from ${host}. I do not buy today.`
            : `I finish reading on ${host}. That was the visit.`,
        why:
          objective === "awareness"
            ? "Awareness success is memory, not checkout."
            : "Traffic success is a qualified landing-page visit.",
      },
    ];
  }

  if (objective === "engagement") {
    return [
      {
        step: "result",
        stage: "pay",
        act: "share",
        feelingName: payFeeling ?? "Amusement",
        thought: `I react / save — ${product} is worth a mark, not a purchase yet.`,
        why: "Engagement objective ends at social action, not cart.",
      },
    ];
  }

  // sales / app default to commerce-style research
  return [
    {
      step: "cart",
      stage: "pay",
      act: "cart",
      feelingName: payFeeling,
      thought: `I add ${product} to cart while I keep reading reviews.`,
      why: "Cart is research with intent — not yet a purchase.",
    },
    {
      step: "checkout",
      stage: "pay",
      act: "checkout",
      feelingName: payFeeling,
      thought:
        payFeeling === "Anxiety" || payFeeling === "Sting of paying"
          ? "Checkout opens. I freeze on price and trust."
          : "Checkout looks clear. I continue.",
      why: "Checkout is where money anxiety shows.",
    },
    {
      step: "result",
      stage: "pay",
      act: payFeeling === "Anxiety" || payFeeling === "Sting of paying" ? "bounce" : "buy",
      feelingName: payFeeling,
      thought:
        payFeeling === "Anxiety" || payFeeling === "Sting of paying"
          ? "I abandon checkout. Not tonight."
          : `I buy ${product}. Research done.`,
      why:
        payFeeling === "Anxiety" || payFeeling === "Sting of paying"
          ? "Purchase lost at payment — not a media problem."
          : "Purchase after full research path.",
    },
  ];
}

function placementLabel(placement: string): string {
  if (placement === "reels") return "Reels";
  if (placement === "stories") return "Stories";
  if (placement === "advantage") return "Advantage+";
  return "Feed";
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export const STEP_LABEL: Record<JourneyStep, string> = {
  saw_ad: "Saw ad",
  scrolled_past: "Scrolled past",
  stopped: "Stopped",
  opened_link: "Opened link",
  read_url: "Read URL",
  on_page: "On site",
  scrolling_site: "Scrolling site",
  matched: "Offer matched",
  mismatched: "Offer mismatch",
  form: "Form",
  cart: "Cart",
  checkout: "Checkout",
  result: "Result",
  left: "Left",
  hid: "Hid ad",
  reported: "Reported",
  messaged: "Messaged",
  called: "Called",
};

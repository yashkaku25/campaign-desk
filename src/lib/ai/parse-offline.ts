import { AppError } from "@/lib/errors/app-error";
import {
  filterIsEmpty,
  parseActions,
  type CampaignAction,
  type CampaignFilter,
} from "@/lib/ai/schemas";

const VERB = /\b(pause|resume|budget|create|set|move|reallocate|shift)\b/i;

export function parseOffline(text: string): CampaignAction[] {
  const parts = splitCommands(text);
  const actions = parts.map((part) => parsePart(part));
  const withSharedFilter = carryFilter(actions);
  const parsed = parseActions({ actions: withSharedFilter });
  if (!parsed.ok) throw unknown();
  return parsed.actions;
}

function splitCommands(text: string): string[] {
  const parts = text
    .split(/\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return [text.trim()];
  if (parts.every((part) => VERB.test(part))) return parts.slice(0, 2);
  return [text.trim()];
}

function parsePart(text: string): CampaignAction {
  const lower = text.toLowerCase();
  if (/\b(move|reallocate|shift)\b/.test(lower)) return parseMove(text);
  if (/\bcreate\b/.test(lower)) return parseCreate(text);
  if (/\bresume\b/.test(lower)) return { type: "resume", filter: filterFrom(text) };
  if (/\bpause\b/.test(lower)) return { type: "pause", filter: filterFrom(text) };
  if (/\b(budget|set)\b/.test(lower) && /\$?\d/.test(text)) {
    const amount = readDollars(text);
    if (amount === null) throw unknown();
    return {
      type: "set_daily_budget",
      filter: filterFrom(text),
      dailyBudgetCents: amount,
    };
  }
  if (/^(why|what|how|when|who)\b/i.test(text) || text.trim().endsWith("?")) {
    return { type: "answer", message: text.trim() };
  }
  throw unknown();
}

function carryFilter(actions: CampaignAction[]): CampaignAction[] {
  let last: CampaignFilter | null = null;
  return actions.map((action) => {
    if (action.type === "answer" || action.type === "create_campaign" || action.type === "reallocate_budget") {
      return action;
    }
    if (filterIsEmpty(action.filter) && last) {
      return { ...action, filter: last };
    }
    if (!filterIsEmpty(action.filter)) last = action.filter;
    return action;
  });
}

function filterFrom(text: string): CampaignFilter {
  const ctrUnder = text.match(/ctr\s+(?:under|below|less than)\s+(\d+(?:\.\d+)?)\s*%/i);
  if (ctrUnder?.[1]) return { ctrBelow: Number(ctrUnder[1]) };
  const ctrOver = text.match(/ctr\s+(?:over|above|more than)\s+(\d+(?:\.\d+)?)\s*%/i);
  if (ctrOver?.[1]) return { ctrAbove: Number(ctrOver[1]) };
  const quoted = text.match(/"([^"]+)"/);
  if (quoted?.[1]) return { nameContains: quoted[1].trim() };
  const named = text.match(/\bnamed\s+(.+?)(?:\s+with\b|$)/i);
  if (named?.[1]) return { nameContains: cleanName(named[1]) };
  const status = text.match(/\b(active|paused|draft|ended)\b/i);
  if (status?.[1] && /\b(all|every|campaigns)\b/i.test(text)) {
    return { status: status[1].toLowerCase() as CampaignFilter["status"] };
  }
  const stripped = text
    .replace(/\b(please|pause|resume|campaigns|campaign|set|the|daily|budget|for|to|at|their|them)\b/gi, " ")
    .replace(/\$?\d+(?:\.\d+)?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped && !/^(all|everything|these|those)$/i.test(stripped)) {
    return { nameContains: stripped };
  }
  return {};
}

function parseMove(text: string): CampaignAction {
  const amount = readDollars(text);
  const fromTo = text.match(/\bfrom\b\s+(.+?)\s+\bto\b\s+(.+)$/i);
  if (amount === null || !fromTo?.[1] || !fromTo[2]) {
    throw new AppError({
      what: "A budget move needs an amount, a source, and a destination.",
      why: "The sentence did not include all three.",
      file: "src/lib/ai/parse-offline.ts",
      fix: 'Try: Move $20 from CTR under 2% to CTR over 3%.',
    });
  }
  return {
    type: "reallocate_budget",
    from: filterFrom(fromTo[1]),
    to: filterFrom(fromTo[2]),
    shiftCents: amount,
  };
}

function parseCreate(text: string): CampaignAction {
  const named = text.match(/\bnamed\s+"([^"]+)"/i) ?? text.match(/\bnamed\s+(.+?)(?:\s+with\b|$)/i);
  const name = named?.[1] ? cleanName(named[1]) : "";
  const amount = readDollars(text);
  if (!name || amount === null) {
    throw new AppError({
      what: "A new campaign needs a name and a daily budget.",
      why: "The sentence did not include both.",
      file: "src/lib/ai/parse-offline.ts",
      fix: 'Try: Create a campaign named "Spring Sale" with a daily budget of $40.',
    });
  }
  return { type: "create_campaign", name, dailyBudgetCents: amount };
}

function readDollars(text: string): number | null {
  const match = text.match(/\$\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:dollars|usd)/i);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}

function cleanName(value: string): string {
  return value.replace(/^["']|["']$/g, "").trim();
}

function unknown(): AppError {
  return new AppError({
    what: "I couldn't turn that into a change.",
    why: "The sentence did not match pause, resume, budget, create, or a question.",
    file: "src/lib/ai/parse-offline.ts",
    connectedTo: "src/lib/ai/schemas.ts is the allowlist.",
    fix: 'Try "Pause campaigns with CTR under 2%".',
  });
}

export type DeskDecision =
  | { decision: "approve" | "reject"; scope: "all" }
  | { decision: "approve" | "reject"; scope: "names"; phrase: string };

const WORD = "(approve|accept|decline|reject)";
const LEAD = "(?:please\\s+|i want(?:\\s+to)?\\s+)?";
const ALL = new RegExp(`^${LEAD}(?:all\\s+)?${WORD}(?:\\s+(?:all|everything|the rest|remaining))?(?:\\s+(?:of them|these|campaigns))?$`, "i");
const NAMED = new RegExp(`^${LEAD}${WORD}\\s+(.+)$`, "i");

export function parseDecision(text: string): DeskDecision | null {
  const cleaned = text.trim().replace(/[.!]+$/g, "").replace(/\s+/g, " ");
  if (!cleaned) return null;
  const all = ALL.exec(cleaned);
  if (all?.[1] && /\b(all|everything|rest|remaining|them|these|campaigns)\b/i.test(cleaned)) {
    return { decision: kind(all[1]), scope: "all" };
  }
  const named = NAMED.exec(cleaned);
  if (!named?.[1] || !named[2]) return null;
  const phrase = named[2].trim();
  if (/^(all|everything|the rest|remaining|of them|these|campaigns)$/i.test(phrase)) {
    return { decision: kind(named[1]), scope: "all" };
  }
  return { decision: kind(named[1]), scope: "names", phrase };
}

function kind(word: string): "approve" | "reject" {
  return word.toLowerCase() === "decline" || word.toLowerCase() === "reject" ? "reject" : "approve";
}

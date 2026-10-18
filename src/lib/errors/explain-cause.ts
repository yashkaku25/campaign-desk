import { AppError } from "@/lib/errors/app-error";

const CODE_IN_WORDS: Record<number, string> = {
  400: "the request was not valid",
  401: "not signed in",
  403: "not allowed",
  404: "page not found",
  409: "already done",
  429: "too many tries",
  500: "something inside the service broke",
  502: "the service in the middle failed",
  503: "the service is busy",
};

/** One short sentence for the log. Vendor JSON and secrets stay out. */
export function explainCause(cause: unknown): string {
  if (!cause) return "";
  if (cause instanceof AppError) return cause.why;

  const status = readStatus(cause);
  const detail = knownDetail(scrub(readDetail(cause)));
  const words = status ? CODE_IN_WORDS[status] : undefined;
  if (detail && status && words) return `${detail} (${status}, ${words}.)`;
  if (detail && status) return `${detail} (${status}.)`;
  if (detail) return detail;
  if (status && words) return `${words.charAt(0).toUpperCase()}${words.slice(1)} (${status}.)`;
  return "The cause did not include a message.";
}

function readStatus(cause: unknown): number | null {
  if (typeof cause === "object" && cause !== null && "status" in cause) {
    const status = Number((cause as { status: unknown }).status);
    if (Number.isInteger(status) && status >= 400 && status <= 599) return status;
  }
  const detail = cause instanceof Error ? cause.message : "";
  const match = detail.match(/"code"\s*:\s*(\d{3})/);
  if (!match) return null;
  const status = Number(match[1]);
  return status >= 400 && status <= 599 ? status : null;
}

function readDetail(cause: unknown): string {
  if (!(cause instanceof Error)) return "";
  if (cause.name === "AbortError") return "The call took too long and was stopped.";
  if (cause.message === "empty-model-reply") return "Gemini replied with nothing.";
  const raw = cause.message.trim();
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as {
        error?: { message?: unknown };
        message?: unknown;
      };
      const message = parsed.error?.message ?? parsed.message;
      if (typeof message === "string" && message.trim()) return firstSentence(message);
    } catch {
      // The message is not JSON. Keep the plain text below.
    }
  }
  return firstSentence(raw);
}

function knownDetail(detail: string): string {
  const lower = detail.toLowerCase();
  if (lower.includes("invalid login credentials")) return "The email or password did not match.";
  if (lower.includes("email not confirmed")) return "The email is not confirmed yet.";
  if (lower.includes("high demand")) return "Gemini is busy right now.";
  return detail;
}

function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentence = clean.split(/(?<=\.)\s/)[0] ?? clean;
  return sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
}

function scrub(text: string): string {
  return text
    .replace(/AIza[\w-]{10,}/g, "[key]")
    .replace(/AQ\.[\w-]{10,}/g, "[key]")
    .replace(/Bearer\s+\S+/gi, "Bearer [token]")
    .replace(/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, "[token]");
}

import "server-only";

import { AppError } from "@/lib/errors/app-error";
import { explainCause } from "@/lib/errors/explain-cause";

export function logError(input: {
  what: string;
  why: string;
  file: string;
  connectedTo?: string;
  fix: string;
  cause?: unknown;
}): void {
  if (input.cause instanceof AppError && input.cause.logged) return;
  console.error(
    JSON.stringify({
      what: input.what,
      why: input.why,
      file: input.file,
      connectedTo: input.connectedTo ?? "",
      fix: input.fix,
      cause: explainCause(input.cause),
    }),
  );
}

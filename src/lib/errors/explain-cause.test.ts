import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { explainCause } from "@/lib/errors/explain-cause";

describe("explainCause", () => {
  it("turns a Gemini busy reply into one sentence", () => {
    const error = new Error(
      '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}',
    );
    Object.assign(error, { status: 503 });
    expect(explainCause(error)).toBe("Gemini is busy right now. (503, the service is busy.)");
  });

  it("says a wrong password in plain words", () => {
    const error = new Error("Invalid login credentials");
    Object.assign(error, { status: 400 });
    expect(explainCause(error)).toBe("The email or password did not match. (400, the request was not valid.)");
  });

  it("hides a key that leaked into the message", () => {
    const error = new Error("Request failed for key AIzaSyDUMMYKEY1234567890");
    expect(explainCause(error)).toBe("Request failed for key [key]");
  });

  it("uses the AppError reason instead of the class name", () => {
    const error = new AppError({
      what: "Gemini is busy right now.",
      why: "The model is under high demand.",
      file: "src/lib/ai/gemini.ts",
      fix: "Wait a moment and send the command again.",
    });
    expect(explainCause(error)).toBe("The model is under high demand.");
  });
});

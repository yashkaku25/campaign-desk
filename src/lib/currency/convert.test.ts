import { describe, expect, it } from "vitest";

import { convertCents, formatQuote } from "@/lib/currency/convert";

describe("convertCents", () => {
  it("turns stored US cents into another currency without rounding the saved number", () => {
    expect(convertCents(10_000, 94.96)).toBeCloseTo(9496, 5);
    expect(convertCents(10_000, 1)).toBe(100);
  });

  it("formats the converted amount in the chosen currency", () => {
    expect(formatQuote(10_000, { currency: "INR", unitsPerUsd: 94.96 })).toBe("9,496.00 ₹");
    expect(formatQuote(10_000, { currency: "USD", unitsPerUsd: 1 })).toBe("100.00 $");
  });
});

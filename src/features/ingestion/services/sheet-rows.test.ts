import { describe, expect, it } from "vitest";

import { mergeSheetGrids, parseSheetValues } from "@/features/ingestion/services/sheet-rows";

describe("parseSheetValues", () => {
  it("reads a campaign row into cents and a desk status", () => {
    const parsed = parseSheetValues([
      ["campaign_name", "status", "daily_budget", "spend", "impressions", "clicks", "conversions", "date"],
      ["Spring Launch", "ACTIVE", "120", "40.50", "1000", "40", "8", "2026-10-16"],
    ]);
    expect(parsed.problem).toBeNull();
    expect(parsed.rows[0]).toEqual({
      name: "Spring Launch",
      status: "active",
      dailyBudgetCents: 12000,
      spendCents: 4050,
      impressions: 1000,
      clicks: 40,
      conversions: 8,
      day: "2026-10-16",
      extra: {},
    });
  });

  it("reads Budget / day as the daily budget", () => {
    const parsed = parseSheetValues([
      ["campaign_name", "Budget / day"],
      ["Spring Launch", "120.00"],
    ]);
    expect(parsed.rows[0]?.dailyBudgetCents).toBe(12000);
  });

  it("refuses a sheet with no campaign name column", () => {
    expect(parseSheetValues([["status"], ["active"]]).problem).toMatch(/campaign_name/);
  });

  it("leaves a header-only sheet waiting for rows", () => {
    const parsed = parseSheetValues([["campaign_name", "status", "daily_budget"]]);
    expect(parsed.state).toBe("awaiting");
    expect(parsed.rows).toEqual([]);
  });

  it("treats an empty grid as a blank sheet", () => {
    expect(parseSheetValues([]).state).toBe("blank");
    expect(parseSheetValues([["", ""]]).state).toBe("blank");
  });

  it("skips a row with a broken number and keeps the valid one", () => {
    const parsed = parseSheetValues([
      ["campaign_name", "spend"],
      ["Spring Launch", "10"],
      ["Broken", "nope"],
    ]);
    expect(parsed.rows.map((row) => row.name)).toEqual(["Spring Launch"]);
    expect(parsed.skipped).toBe(1);
  });

  it("turns a euro amount into stored dollars", () => {
    const parsed = parseSheetValues(
      [
        ["campaign_name", "currency", "spend"],
        ["Spring Launch", "EUR", "10"],
      ],
      { EUR: 0.5, GBP: 1, CAD: 1, INR: 1 },
    );
    expect(parsed.rows[0]?.spendCents).toBe(2000);
  });

  it("keeps a new creative column and still reads spend under another name", () => {
    const parsed = parseSheetValues([
      ["Campaign", "Amount Spent", "headline", "roas"],
      ["Spring Launch", "40.50", "Free trial, no card", "3.4"],
    ]);
    expect(parsed.rows[0]?.spendCents).toBe(4050);
    expect(parsed.rows[0]?.extra).toEqual({ headline: "Free trial, no card", roas: "3.4" });
    expect(parsed.extraColumns).toEqual(["headline", "roas"]);
  });

  it("stacks two pictures into one table", () => {
    const merged = mergeSheetGrids([
      [
        ["campaign_name", "spend"],
        ["Spring Launch", "10"],
      ],
      [
        ["Campaign", "headline"],
        ["Brand Video", "Summer"],
      ],
    ]);
    expect(merged[0]).toEqual(["campaign_name", "spend", "headline"]);
    expect(merged[1]).toEqual(["Spring Launch", "10", ""]);
    expect(merged[2]).toEqual(["Brand Video", "", "Summer"]);
  });
});

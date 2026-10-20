import { describe, expect, it } from "vitest";

import { normalizeModelCsv, parseCsv, sheetIdFromUrl } from "@/features/ingestion/services/sheet-url";

describe("sheetIdFromUrl", () => {
  it("reads the id from a Google Sheet link", () => {
    expect(sheetIdFromUrl("https://docs.google.com/spreadsheets/d/abc_123-XY/edit?gid=0#gid=0")).toBe("abc_123-XY");
  });

  it("refuses a link that is not a Google Sheet", () => {
    expect(sheetIdFromUrl("https://example.com/spreadsheets/d/abc")).toBeNull();
  });
});

describe("normalizeModelCsv", () => {
  it("turns a one-line model reply into rows", () => {
    const csv = normalizeModelCsv("campaign_name,status\\nSpring Launch,active\\nBrand Video,paused");
    expect(parseCsv(csv)).toEqual([
      ["campaign_name", "status"],
      ["Spring Launch", "active"],
      ["Brand Video", "paused"],
    ]);
  });
});

describe("parseCsv", () => {
  it("keeps a comma that sits inside quotes", () => {
    expect(parseCsv('campaign_name,status\n"Spring, Launch",active\n')).toEqual([
      ["campaign_name", "status"],
      ["Spring, Launch", "active"],
    ]);
  });
});

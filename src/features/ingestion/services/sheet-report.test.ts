import { describe, expect, it } from "vitest";

import { describeImport } from "@/features/ingestion/services/sheet-report";

describe("describeImport", () => {
  it("tells a picture what happened without listing every column", () => {
    const report = describeImport({
      kind: "picture",
      metricCount: 0,
      extraColumns: ["cost_per_purchase", "purchases", "purchase_roas", "reach", "cpm"],
      skipped: 0,
      queued: 0,
      needsBudget: ["Best Sellers", "Gift Bundles", "Keychains"],
      outOfRange: [],
      alreadyWaiting: false,
      leftOut: false,
    });

    expect(report.ok).toBe(false);
    expect(report.message).toBe(
      "Read the picture. The picture has 5 other columns. Add a daily budget for 3 new campaigns, then try again.",
    );
    expect(report.message).not.toContain("write key");
  });
});

export type MetricKey = "spend" | "conversions" | "ctr" | "cpa";

export const METRIC_TONE: Record<MetricKey, { ink: string; wash: string; bar: string }> = {
  spend: { ink: "#0f766e", wash: "#f0fdfa", bar: "#14b8a6" },
  conversions: { ink: "#4338ca", wash: "#eef2ff", bar: "#6366f1" },
  ctr: { ink: "#c2410c", wash: "#fff7ed", bar: "#f97316" },
  cpa: { ink: "#be123c", wash: "#fff1f2", bar: "#fb7185" },
};

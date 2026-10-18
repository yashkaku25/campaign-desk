"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { METRIC_TONE, type MetricKey } from "@/features/campaigns/components/metric-tone";
import type { DailyPoint } from "@/features/campaigns/services/series";

const LABELS: Record<MetricKey, string> = {
  spend: "Spend",
  conversions: "Conversions",
  ctr: "CTR",
  cpa: "CPA",
};

export function SpendChart({
  points,
  metric = "spend",
  symbol = "$",
  unitsPerUsd = 1,
}: {
  points: DailyPoint[];
  metric?: MetricKey;
  symbol?: string;
  unitsPerUsd?: number;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-muted">No daily numbers for this view.</p>;
  }

  const tone = METRIC_TONE[metric];
  const data = points.map((point) => ({
    label: point.label,
    value: chartValue(point, metric, unitsPerUsd),
  }));
  const peak = data.reduce((highest, row) => (row.value === null ? highest : Math.max(highest, row.value)), 0);
  const yMax = axisCeiling(peak);
  const moneyAxis = metric === "spend" || metric === "cpa";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e7e0d4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5c6570", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fill: "#5c6570", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            tickMargin={6}
            width={moneyAxis ? 76 : 44}
            tickFormatter={(value) => axisLabel(Number(value), metric, symbol)}
          />
          <Tooltip
            offset={14}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ outline: "none", zIndex: 20 }}
            cursor={{ stroke: tone.ink, strokeOpacity: 0.35 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const raw = payload[0]?.value;
              const text = raw === null || raw === undefined ? "Unavailable" : axisLabel(Number(raw), metric, symbol);
              return (
                <div className="rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-sm">
                  <p className="text-muted">{label}</p>
                  <p className="font-semibold whitespace-nowrap tabular-nums" style={{ color: tone.ink }}>
                    {text}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={LABELS[metric]}
            stroke={tone.ink}
            fill={tone.bar}
            fillOpacity={0.28}
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function axisCeiling(peak: number): number {
  if (peak <= 0) return 1;
  const padded = peak * 1.1;
  const exponent = Math.floor(Math.log10(padded));
  const magnitude = 10 ** exponent;
  const fraction = padded / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * magnitude;
}

function axisLabel(value: number, metric: MetricKey, symbol: string): string {
  if (metric === "ctr") return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
  if (metric === "conversions") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  const whole = Math.abs(value - Math.round(value)) < 0.05;
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: whole ? 0 : 2 }).format(value);
  return `${number} ${symbol}`;
}

function chartValue(point: DailyPoint, metric: MetricKey, unitsPerUsd: number): number | null {
  if (metric === "spend") return Number((point.spend * unitsPerUsd).toFixed(2));
  if (metric === "conversions") return point.conversions;
  if (metric === "ctr") return point.ctr === null ? null : Number((point.ctr * 100).toFixed(2));
  if (point.conversions === 0) return null;
  return Number(((point.spend * unitsPerUsd) / point.conversions).toFixed(2));
}

"use client";

import { useState } from "react";

import { METRIC_TONE, type MetricKey } from "@/features/campaigns/components/metric-tone";
import { SpendChart } from "@/features/campaigns/components/spend-chart";
import type { DailyPoint, PeriodDelta } from "@/features/campaigns/services/series";

export type { MetricKey };

const DELTA_COLOR: Record<PeriodDelta["direction"], string> = {
  up: "#047857",
  down: "#7f1d1d",
  flat: "#5c6570",
  unavailable: "#5c6570",
};

function deltaColor(key: MetricKey, direction: PeriodDelta["direction"]): string {
  if (direction !== "up" && direction !== "down") return DELTA_COLOR[direction];
  const worse = key === "cpa" ? direction === "up" : direction === "down";
  return worse ? DELTA_COLOR.down : DELTA_COLOR.up;
}

export function PerformanceBoard({
  points,
  cards,
  symbol = "$",
  unitsPerUsd = 1,
  metric,
  onMetric,
}: {
  points: DailyPoint[];
  cards: { key: MetricKey; label: string; value: string; delta: PeriodDelta }[];
  symbol?: string;
  unitsPerUsd?: number;
  metric?: MetricKey;
  onMetric?: (metric: MetricKey) => void;
}) {
  const [ownMetric, setOwnMetric] = useState<MetricKey>("spend");
  const current = metric ?? ownMetric;
  function setMetric(next: MetricKey) {
    onMetric?.(next);
    if (metric === undefined) setOwnMetric(next);
  }
  const selected = cards.find((card) => card.key === current) ?? cards[0];
  const tone = METRIC_TONE[current];

  return (
    <section className="space-y-4">
      <div className="grid items-stretch gap-3 @min-[28rem]:grid-cols-2 @min-[60rem]:grid-cols-4">
        {cards.map((card) => {
          const cardTone = METRIC_TONE[card.key];
          const active = card.key === current;
          return (
            <button
              key={card.key}
              type="button"
              aria-pressed={active}
              onClick={() => setMetric(card.key)}
              className="h-full min-w-0 rounded-2xl border-2 px-4 py-3 text-left transition"
              style={{
                background: cardTone.wash,
                borderColor: active ? cardTone.ink : "#e4ddd2",
              }}
            >
              <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: cardTone.ink }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cardTone.bar }} />
                {card.label}
              </span>
              <span className="mt-2 block font-serif text-2xl leading-none tracking-tight tabular-nums">{card.value}</span>
              <span className="mt-2 block text-xs font-semibold" style={{ color: deltaColor(card.key, card.delta.direction) }}>
                {card.delta.text}
              </span>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border bg-card p-5" style={{ borderColor: tone.ink }}>
        <h2 className="mb-3 font-serif text-2xl tracking-tight" style={{ color: tone.ink }}>
          {selected?.label ?? "Spend"}
        </h2>
        <SpendChart points={points} metric={current} symbol={symbol} unitsPerUsd={unitsPerUsd} />
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PerformanceBoard } from "@/features/campaigns/components/performance-board";
import type { MetricKey } from "@/features/campaigns/components/metric-tone";
import type { DailyPoint, PeriodDelta } from "@/features/campaigns/services/series";
import { formatQuote, type RateQuote } from "@/lib/currency/convert";
import type { CampaignSummary } from "@/lib/domain";
import { formatCount, formatCtr } from "@/lib/money";

export function OverviewDesk({
  campaigns,
  quote,
  points,
  cards,
  symbol,
  unitsPerUsd,
}: {
  campaigns: CampaignSummary[];
  quote: RateQuote;
  points: DailyPoint[];
  cards: { key: MetricKey; label: string; value: string; delta: PeriodDelta }[];
  symbol: string;
  unitsPerUsd: number;
}) {
  const [metric, setMetric] = useState<MetricKey>("spend");
  const label = cards.find((card) => card.key === metric)?.label ?? "Spend";
  const ranked = [...campaigns].sort((left, right) => rank(right, metric) - rank(left, metric));

  return (
    <div className="space-y-6">
      <PerformanceBoard
        points={points}
        cards={cards}
        symbol={symbol}
        unitsPerUsd={unitsPerUsd}
        metric={metric}
        onMetric={setMetric}
      />
      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-2xl tracking-tight">{label}</h2>
        </div>
        <ul>
          {ranked.map((campaign) => (
            <li key={campaign.id} className="border-t border-line first:border-t-0">
              <Link href={`/campaigns/${campaign.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper">
                <span className="min-w-0 flex-1 truncate font-semibold">{campaign.name}</span>
                <Badge value={campaign.status} />
                <span className="w-28 shrink-0 text-right text-sm tabular-nums">{shown(campaign, metric, quote)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-3">
          <Link href="/campaigns" className="text-sm font-semibold text-ink">
            Campaigns
          </Link>
        </div>
      </section>
    </div>
  );
}

function rank(campaign: CampaignSummary, metric: MetricKey): number {
  if (metric === "spend") return campaign.spendCents;
  if (metric === "conversions") return campaign.conversions;
  if (metric === "ctr") return campaign.ctr ?? -1;
  if (campaign.conversions === 0) return -1;
  return campaign.spendCents / campaign.conversions;
}

function shown(campaign: CampaignSummary, metric: MetricKey, quote: RateQuote): string {
  if (metric === "spend") return formatQuote(campaign.spendCents, quote);
  if (metric === "conversions") return formatCount(campaign.conversions);
  if (metric === "ctr") return campaign.impressions === 0 ? "Unavailable" : formatCtr(campaign.ctr);
  if (campaign.conversions === 0) return "Unavailable";
  return formatQuote(Math.round(campaign.spendCents / campaign.conversions), quote);
}

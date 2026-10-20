"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<ListSort>("high");
  const label = cards.find((card) => card.key === metric)?.label ?? "Spend";
  const ranked = useMemo(() => {
    const filtered = campaigns.filter((campaign) => status === "all" || campaign.status === status);
    return filtered.sort((left, right) => compareCampaigns(left, right, metric, sort));
  }, [campaigns, metric, sort, status]);

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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-sans text-2xl font-semibold tracking-tight">{label}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilters value={status} onChange={setStatus} />
            <label className="flex items-center gap-2 text-sm font-semibold">
              Sort
              <select
                className="h-10 rounded-full border border-line bg-card px-3 text-sm"
                value={sort}
                aria-label="Sort campaigns"
                onChange={(event) => setSort(event.target.value as ListSort)}
              >
                <option value="high">High to low</option>
                <option value="low">Low to high</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>
        <ul>
          {ranked.length === 0 ? (
            <li className="px-5 py-8 text-sm text-muted">No campaigns with that status.</li>
          ) : null}
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

type StatusFilter = "all" | "active" | "paused" | "ended";
type ListSort = "high" | "low" | "name";

function StatusFilters({ value, onChange }: { value: StatusFilter; onChange: (value: StatusFilter) => void }) {
  const options: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "ended", label: "Ended" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={
              selected
                ? "inline-flex h-10 items-center rounded-full bg-ink px-3 text-sm font-semibold text-paper"
                : "inline-flex h-10 items-center rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function compareCampaigns(left: CampaignSummary, right: CampaignSummary, metric: MetricKey, sort: ListSort): number {
  if (sort === "name") return left.name.localeCompare(right.name);
  const compared = compareNumbers(metricValue(left, metric), metricValue(right, metric), sort);
  return compared === 0 ? left.name.localeCompare(right.name) : compared;
}

function metricValue(campaign: CampaignSummary, metric: MetricKey): number | null {
  if (metric === "spend") return campaign.spendCents;
  if (metric === "conversions") return campaign.conversions;
  if (metric === "ctr") return campaign.impressions === 0 ? null : campaign.ctr;
  if (campaign.conversions === 0) return null;
  return campaign.spendCents / campaign.conversions;
}

function compareNumbers(left: number | null, right: number | null, sort: "high" | "low"): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return sort === "high" ? right - left : left - right;
}

function shown(campaign: CampaignSummary, metric: MetricKey, quote: RateQuote): string {
  if (metric === "spend") return formatQuote(campaign.spendCents, quote);
  if (metric === "conversions") return formatCount(campaign.conversions);
  if (metric === "ctr") return campaign.impressions === 0 ? "Unavailable" : formatCtr(campaign.ctr);
  if (campaign.conversions === 0) return "Unavailable";
  return formatQuote(Math.round(campaign.spendCents / campaign.conversions), quote);
}

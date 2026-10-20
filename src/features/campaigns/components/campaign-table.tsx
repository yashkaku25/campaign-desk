"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusNote } from "@/components/ui/status-note";
import { StatusSwitch } from "@/features/campaigns/components/status-switch";
import { formatQuote, type RateQuote } from "@/lib/currency/convert";
import type { CampaignSummary } from "@/lib/domain";
import { formatCount, formatCtr } from "@/lib/money";

type Filter = "all" | "active" | "paused" | "ended";
type SortKey = "name" | "status" | "budget" | "spend" | "impressions" | "ctr" | "conversions" | "cpa";

export function CampaignTable({
  campaigns,
  quote,
  toolbar,
  canChange = true,
  emptyTitle = "No campaigns yet",
  emptyBody = "Create one from Chat. Nothing is saved until you approve.",
}: {
  campaigns: CampaignSummary[];
  quote: RateQuote;
  toolbar?: React.ReactNode;
  canChange?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const money = (cents: number) => formatQuote(cents, quote);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exported, setExported] = useState(false);
  const rows = useMemo(() => {
    const filtered = campaigns.filter((campaign) => matches(campaign, filter));
    return filtered.sort((left, right) => compareRows(left, right, sortKey, sortDir));
  }, [campaigns, filter, sortDir, sortKey]);

  function chooseSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "name" || key === "status" ? "asc" : "desc");
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterButton current={filter} value="all" label="All" onClick={setFilter} />
          <FilterButton current={filter} value="active" label="Active" onClick={setFilter} />
          <FilterButton current={filter} value="paused" label="Paused" onClick={setFilter} />
          <FilterButton current={filter} value="ended" label="Ended" onClick={setFilter} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              downloadCsv(rows, money);
              setExported(true);
            }}
          >
            Export
          </Button>
        </div>
      </div>
      {exported ? <StatusNote tone="ok">Saved campaign-desk.csv.</StatusNote> : null}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-sans text-2xl font-semibold tracking-tight">
            {campaigns.length === 0 ? emptyTitle : "No campaigns with that status."}
          </p>
          <p className="mt-2 text-sm text-muted">
            {campaigns.length === 0 ? emptyBody : "Choose another status to see the rest."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-line text-xs font-semibold text-muted">
              <tr>
                <SortHeader label="Campaign" column="name" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} sticky />
                <SortHeader label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} />
                <SortHeader label="Budget / day" column="budget" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} align="right" />
                <SortHeader label="Spend" column="spend" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} align="right" />
                <SortHeader label="Impressions" column="impressions" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} align="right" />
                <SortHeader label="CTR" column="ctr" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} align="right" />
                <SortHeader label="Conversions" column="conversions" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} align="right" />
                <SortHeader label="CPA" column="cpa" sortKey={sortKey} sortDir={sortDir} onSort={chooseSort} align="right" end />
              </tr>
            </thead>
            <tbody>
              {rows.map((campaign) => (
                <tr key={campaign.id} className="group border-t border-line hover:bg-paper">
                  <td className="sticky left-0 bg-card px-5 py-3 whitespace-nowrap group-hover:bg-paper">
                    <Link href={`/campaigns/${campaign.id}`} className="font-semibold hover:underline">
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <StatusSwitch id={campaign.id} name={campaign.name} status={campaign.status} canChange={canChange} />
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{money(campaign.dailyBudgetCents)}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{money(campaign.spendCents)}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatCount(campaign.impressions)}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                    <CtrCell impressions={campaign.impressions} ctr={campaign.ctr} />
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatCount(campaign.conversions)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap tabular-nums">
                    {campaign.conversions === 0 ? "Unavailable" : money(Math.round(campaign.spendCents / campaign.conversions))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FilterButton({
  current,
  value,
  label,
  onClick,
}: {
  current: Filter;
  value: Filter;
  label: string;
  onClick: (value: Filter) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(value)}
      className={
        active
          ? "inline-flex h-10 items-center rounded-full bg-ink px-3 text-sm font-semibold text-paper"
          : "inline-flex h-10 items-center rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink"
      }
    >
      {label}
    </button>
  );
}

function CtrCell({ impressions, ctr }: { impressions: number; ctr: number | null }) {
  if (impressions === 0) return <span className="text-muted">Unavailable</span>;
  if (ctr !== null && ctr < 0.02) return <span className="font-semibold text-amber">{formatCtr(ctr)}</span>;
  return <span>{formatCtr(ctr)}</span>;
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  align = "left",
  sticky = false,
  end = false,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (column: SortKey) => void;
  align?: "left" | "right";
  sticky?: boolean;
  end?: boolean;
}) {
  const selected = sortKey === column;
  return (
    <th
      aria-sort={selected ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={
        sticky
          ? "sticky left-0 bg-card px-5 py-3 text-left"
          : end
            ? "px-5 py-3 text-right"
            : align === "right"
              ? "px-3 py-3 text-right"
              : "px-3 py-3 text-left"
      }
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 font-semibold text-muted"
        onClick={() => onSort(column)}
      >
        {label}
        {selected ? <span aria-hidden="true">{sortDir === "asc" ? "↑" : "↓"}</span> : null}
      </button>
    </th>
  );
}

function matches(campaign: CampaignSummary, filter: Filter): boolean {
  if (filter === "all") return true;
  return campaign.status === filter;
}

function compareRows(left: CampaignSummary, right: CampaignSummary, key: SortKey, dir: "asc" | "desc"): number {
  const compared = compareValues(rowValue(left, key), rowValue(right, key), dir);
  return compared === 0 ? left.name.localeCompare(right.name) : compared;
}

function rowValue(campaign: CampaignSummary, key: SortKey): string | number | null {
  if (key === "name") return campaign.name;
  if (key === "status") return campaign.status;
  if (key === "budget") return campaign.dailyBudgetCents;
  if (key === "spend") return campaign.spendCents;
  if (key === "impressions") return campaign.impressions;
  if (key === "conversions") return campaign.conversions;
  if (key === "ctr") return campaign.impressions === 0 ? null : campaign.ctr;
  if (campaign.conversions === 0) return null;
  return campaign.spendCents / campaign.conversions;
}

function compareValues(left: string | number | null, right: string | number | null, dir: "asc" | "desc"): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  const delta = typeof left === "string" && typeof right === "string" ? left.localeCompare(right) : Number(left) - Number(right);
  return dir === "asc" ? delta : -delta;
}

function downloadCsv(campaigns: CampaignSummary[], money: (cents: number) => string) {
  const header = ["Campaign", "Status", "Daily budget", "Spend", "Impressions", "CTR", "Conversions", "CPA"];
  const lines = campaigns.map((campaign) =>
    [
      campaign.name,
      campaign.status,
      money(campaign.dailyBudgetCents),
      money(campaign.spendCents),
      String(campaign.impressions),
      campaign.impressions === 0 ? "Unavailable" : formatCtr(campaign.ctr),
      String(campaign.conversions),
      campaign.conversions === 0 ? "Unavailable" : money(Math.round(campaign.spendCents / campaign.conversions)),
    ]
      .map((cell) => `"${cell.replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "campaign-desk.csv";
  link.click();
  URL.revokeObjectURL(url);
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusNote } from "@/components/ui/status-note";
import { StatusSwitch } from "@/features/campaigns/components/status-switch";
import { formatQuote, type RateQuote } from "@/lib/currency/convert";
import type { CampaignSummary } from "@/lib/domain";
import { formatCount, formatCtr } from "@/lib/money";

type Filter = "all" | "active" | "paused";

export function CampaignTable({
  campaigns,
  quote,
  toolbar,
  emptyTitle = "No campaigns yet",
  emptyBody = "Create one from Chat. Nothing is saved until you approve.",
}: {
  campaigns: CampaignSummary[];
  quote: RateQuote;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const money = (cents: number) => formatQuote(cents, quote);
  const [filter, setFilter] = useState<Filter>("all");
  const [exported, setExported] = useState(false);
  const rows = useMemo(() => campaigns.filter((campaign) => matches(campaign, filter)), [campaigns, filter]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterButton current={filter} value="all" label="All" onClick={setFilter} />
          <FilterButton current={filter} value="active" label="Active" onClick={setFilter} />
          <FilterButton current={filter} value="paused" label="Paused" onClick={setFilter} />
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
          <p className="font-serif text-2xl">{emptyTitle}</p>
          <p className="mt-2 text-sm text-muted">{emptyBody}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-line text-xs font-semibold text-muted">
              <tr>
                <th className="sticky left-0 bg-card px-5 py-3 text-left font-semibold">Campaign</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Budget / day</th>
                <th className="px-3 py-3 text-right font-semibold">Spend</th>
                <th className="px-3 py-3 text-right font-semibold">Impressions</th>
                <th className="px-3 py-3 text-right font-semibold">CTR</th>
                <th className="px-3 py-3 text-right font-semibold">Conversions</th>
                <th className="px-5 py-3 text-right font-semibold">CPA</th>
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
                    <StatusSwitch id={campaign.id} name={campaign.name} status={campaign.status} />
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

function matches(campaign: CampaignSummary, filter: Filter): boolean {
  if (filter === "active") return campaign.status === "active";
  if (filter === "paused") return campaign.status === "paused";
  return true;
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

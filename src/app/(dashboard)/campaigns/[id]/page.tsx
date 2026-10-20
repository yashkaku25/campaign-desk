import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { accessOf } from "@/features/auth/services/access";
import { requireUser } from "@/features/auth/services/require-user";
import { PerformanceBoard } from "@/features/campaigns/components/performance-board";
import { StatusSwitch } from "@/features/campaigns/components/status-switch";
import { getCampaign } from "@/features/campaigns/services/get-campaign";
import { buildSeries, compareRecent } from "@/features/campaigns/services/series";
import { getQuote } from "@/features/currency/services/currency-actions";
import { currencyMark, formatQuote } from "@/lib/currency/convert";
import { formatCount, formatCtr } from "@/lib/money";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const found = await getCampaign(id);

  if (!found) {
    return (
      <div className="max-w-lg rounded-2xl border border-line bg-card px-6 py-10">
        <h1 className="font-sans font-semibold tracking-tight text-3xl">That campaign is not in this workspace.</h1>
        <p className="mt-3 text-sm text-muted">The link may be old, or the campaign was never created.</p>
        <Link href="/campaigns" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <ArrowLeft size={16} aria-hidden="true" />
          Campaigns
        </Link>
      </div>
    );
  }

  const { campaign, metrics } = found;
  const quote = await getQuote();
  const points = buildSeries(metrics, campaign.id);
  const delta = compareRecent(points);
  const cpa =
    campaign.conversions === 0 ? "Unavailable" : formatQuote(Math.round(campaign.spendCents / campaign.conversions), quote);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-ink hover:bg-paper">
          <ArrowLeft size={16} aria-hidden="true" />
          Campaigns
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-sans font-semibold tracking-tight text-4xl tracking-tight">{campaign.name}</h1>
          <StatusSwitch id={campaign.id} name={campaign.name} status={campaign.status} canChange={accessOf(user).canApprove} />
        </div>
        <p className="mt-2 text-sm text-muted">Daily budget {formatQuote(campaign.dailyBudgetCents, quote)}</p>
      </header>
      <PerformanceBoard
        symbol={currencyMark(quote.currency)}
        unitsPerUsd={quote.unitsPerUsd}
        points={points}
        cards={[
          { key: "spend", label: "Spend", value: formatQuote(campaign.spendCents, quote), delta: delta.spend },
          { key: "conversions", label: "Conversions", value: formatCount(campaign.conversions), delta: delta.conversions },
          {
            key: "ctr",
            label: "CTR",
            value: campaign.impressions === 0 ? "Unavailable" : formatCtr(campaign.ctr),
            delta: delta.ctr,
          },
          { key: "cpa", label: "CPA", value: cpa, delta: delta.cpa },
        ]}
      />
    </div>
  );
}

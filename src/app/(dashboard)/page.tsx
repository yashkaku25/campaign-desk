import { OverviewDesk } from "@/features/campaigns/components/overview-desk";
import { WatchdogBanner } from "@/features/campaigns/components/watchdog-banner";
import { findAnomalies } from "@/features/campaigns/services/anomaly-detector";
import { listCampaigns } from "@/features/campaigns/services/list-campaigns";
import { buildSeries, compareRecent, workspaceTotals } from "@/features/campaigns/services/series";
import { getQuote } from "@/features/currency/services/currency-actions";
import { requireUser } from "@/features/auth/services/require-user";
import { currencyMark, formatQuote } from "@/lib/currency/convert";
import { readWorkspace } from "@/lib/data/workspace-store";
import { formatCount, formatCtr } from "@/lib/money";

export default async function OverviewPage() {
  const user = await requireUser();
  const quote = await getQuote();
  const campaigns = await listCampaigns();
  const state = await readWorkspace(user.id);
  const totals = workspaceTotals(campaigns);
  const points = buildSeries(state.metrics);
  const delta = compareRecent(points);
  const alerts = findAnomalies(campaigns, state.metrics);
  const cpa =
    totals.conversions === 0 ? "Unavailable" : formatQuote(Math.round(totals.spendCents / totals.conversions), quote);

  return (
    <div className="space-y-6">
      <h1 className="font-sans font-semibold tracking-tight text-4xl tracking-tight">Overview</h1>
      <WatchdogBanner alerts={alerts} />
      <OverviewDesk
        campaigns={campaigns}
        quote={quote}
        symbol={currencyMark(quote.currency)}
        unitsPerUsd={quote.unitsPerUsd}
        points={points}
        cards={[
          { key: "spend", label: "Spend", value: formatQuote(totals.spendCents, quote), delta: delta.spend },
          { key: "conversions", label: "Conversions", value: formatCount(totals.conversions), delta: delta.conversions },
          {
            key: "ctr",
            label: "CTR",
            value: totals.impressions === 0 ? "Unavailable" : formatCtr(totals.ctr),
            delta: delta.ctr,
          },
          { key: "cpa", label: "CPA", value: cpa, delta: delta.cpa },
        ]}
      />
    </div>
  );
}

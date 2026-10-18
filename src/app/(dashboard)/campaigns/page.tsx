import { CampaignTable } from "@/features/campaigns/components/campaign-table";
import { SheetLink } from "@/features/ingestion/components/sheet-link";
import { currentSheetConnection } from "@/features/ingestion/services/connect-sheet";
import { listCampaigns } from "@/features/campaigns/services/list-campaigns";
import { getQuote } from "@/features/currency/services/currency-actions";

const googleNotes: Record<string, { ok: boolean; message: string }> = {
  connected: { ok: true, message: "Google is connected. Make a sheet, or paste one you already have." },
  failed: { ok: false, message: "Google did not give the desk permission to edit. Connect again." },
  mismatch: { ok: false, message: "That Google sign-in did not match. Connect again." },
};

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const campaigns = await listCampaigns();
  const quote = await getQuote();
  const connection = await currentSheetConnection();
  const params = await searchParams;
  const googleNote = params.google ? googleNotes[params.google] : undefined;
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">Campaigns</h1>
      <SheetLink
        url={connection.url}
        connected={connection.connected}
        ready={connection.ready}
        startUrl={connection.startUrl}
        initialNotice={googleNote}
      />
      <CampaignTable campaigns={campaigns} quote={quote} />
    </div>
  );
}

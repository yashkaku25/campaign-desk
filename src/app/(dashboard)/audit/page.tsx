import { Badge } from "@/components/ui/badge";
import { listAudit } from "@/features/audit/services/list-audit";

export default async function AuditPage() {
  const entries = await listAudit();

  return (
    <div className="space-y-6">
      <h1 className="font-sans font-semibold tracking-tight text-4xl tracking-tight">Audit</h1>
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12">
          <p className="font-sans font-semibold tracking-tight text-2xl">No changes yet</p>
          <p className="mt-2 text-sm text-muted">Approve or reject a preview and it will show up here.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-line bg-card px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{entry.what}</p>
                <Badge value={entry.outcome} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {entry.actorName} · {new Date(entry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

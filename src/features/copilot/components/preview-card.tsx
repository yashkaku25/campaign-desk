"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { approvePreview, rejectPreview } from "@/features/copilot/services/copilot-actions";
import type { PreviewModel } from "@/lib/domain";

export function PreviewCard({ preview }: { preview: PreviewModel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  function run(kind: "approve" | "reject") {
    setBusy(kind);
    setNotice(null);
    startTransition(async () => {
      const result = await (kind === "approve" ? approvePreview : rejectPreview)(preview.id);
      setNotice(result);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <article className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{preview.summary}</p>
        <Badge value={preview.status} />
      </div>
      <ul className="mt-3 space-y-2">
        {preview.lines.map((line) => (
          <li key={`${preview.id}-${line.name}`} className="text-sm">
            <p className="font-semibold">{line.name}</p>
            <p className="text-muted">
              {line.before} → {line.after}
            </p>
            {line.note ? <p className="text-xs text-clay">{line.note}</p> : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{preview.canApprove ? pendingCopy(preview.expiresAt) : decidedCopy(preview.status)}</p>
      {preview.canApprove ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" disabled={pending} aria-busy={busy === "approve"} onClick={() => run("approve")}>
            {busy === "approve" ? <BusyLabel>Saving the change.</BusyLabel> : "Approve"}
          </Button>
          <Button type="button" variant="outline" disabled={pending} aria-busy={busy === "reject"} onClick={() => run("reject")}>
            {busy === "reject" ? <BusyLabel>Leaving it unchanged.</BusyLabel> : "Reject"}
          </Button>
        </div>
      ) : null}
      {notice ? (
        <div className="mt-3">
          <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote>
        </div>
      ) : null}
    </article>
  );
}

function pendingCopy(iso: string): string {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return "Not saved yet.";
  const clock = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `Not saved. Expires ${clock}.`;
}

function decidedCopy(status: string): string {
  if (status === "approved") return "Saved.";
  if (status === "rejected") return "Left unchanged.";
  if (status === "expired") return "Expired before it was saved.";
  if (status === "failed") return "This change did not save.";
  return "The time to approve has passed.";
}

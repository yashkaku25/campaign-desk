"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { syncSheet } from "@/features/ingestion/services/sync-sheet";

export function SyncSheetButton({ variant = "outline" }: { variant?: "default" | "outline" }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        aria-busy={pending}
        onClick={() => {
          setNotice(null);
          startTransition(async () => {
            const result = await syncSheet();
            setNotice(result);
            if (result.openChat) window.dispatchEvent(new Event("desk-open"));
            if (result.ok) router.refresh();
          });
        }}
      >
        {pending ? <BusyLabel>Syncing the sheet.</BusyLabel> : "Sync sheet"}
      </Button>
      {notice && !pending ? <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote> : null}
    </div>
  );
}

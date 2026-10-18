"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { sendCommand } from "@/features/copilot/services/copilot-actions";
import type { Anomaly } from "@/features/campaigns/services/anomaly-detector";

export function WatchdogBanner({ alerts }: { alerts: Anomaly[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-line border-l-4 border-l-ink bg-card p-4">
      {alerts.map((alert) => (
        <div key={alert.command} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-semibold">{alert.name}.</span> {alert.text}
          </p>
          <Button
            type="button"
            disabled={pending}
            aria-busy={pending}
            onClick={() => {
              setNotice(null);
              startTransition(async () => {
                const result = await sendCommand(alert.command);
                setNotice(result.ok ? { ok: true, message: "Preview is in Chat." } : result);
                if (result.ok) window.dispatchEvent(new Event("desk-open"));
                router.refresh();
              });
            }}
          >
            {pending ? <BusyLabel>Reading your campaigns.</BusyLabel> : "Review"}
          </Button>
        </div>
      ))}
      {notice && !pending ? <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote> : null}
    </section>
  );
}

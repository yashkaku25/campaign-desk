"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { BusyLabel } from "@/components/ui/spinner";
import { setCampaignStatus } from "@/features/campaigns/services/set-campaign-status";
import type { CampaignStatus } from "@/lib/domain";

export function StatusSwitch({
  id,
  name,
  status,
  canChange = true,
}: {
  id: string;
  name: string;
  status: CampaignStatus;
  canChange?: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "ended" || !canChange) {
    return <Badge value={status} />;
  }

  const next = status === "active" ? "paused" : "active";
  const label = next === "paused" ? `Pause ${name}` : `Start ${name}`;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={pending}
        aria-busy={pending}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-70"
        onClick={() => {
          setNote(null);
          startTransition(async () => {
            const result = await setCampaignStatus(id, next);
            if (!result.ok) setNote(result.message);
            if (result.ok) router.refresh();
          });
        }}
      >
        {pending ? <BusyLabel>{next === "paused" ? "Pausing." : "Starting."}</BusyLabel> : <Badge value={status} />}
      </button>
      {note ? <span className="max-w-40 text-xs font-semibold text-clay">{note}</span> : null}
    </span>
  );
}

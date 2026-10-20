"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { generateCopy } from "@/features/campaigns/services/generate-copy";

export function CopyPanel({ campaignId }: { campaignId: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-sans font-semibold tracking-tight text-2xl">Copy</h2>
        <Button
          type="button"
          disabled={pending}
          aria-busy={pending}
          onClick={() => {
            setNotice(null);
            startTransition(async () => {
              const result = await generateCopy(campaignId);
              if (!result.ok) {
                setNotice(result.message);
                return;
              }
              setNotice(null);
              setLines(result.lines);
            });
          }}
        >
          {pending ? <BusyLabel>Writing lines.</BusyLabel> : "Write copy"}
        </Button>
      </div>
      {notice ? <StatusNote tone="bad">{notice}</StatusNote> : null}
      {lines.length > 0 && !pending && !notice ? <StatusNote tone="ok">Lines are ready.</StatusNote> : null}
      {lines.length === 0 && !pending && !notice ? <p className="text-sm text-muted">No lines yet.</p> : null}
      {lines.length > 0 ? (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li key={line} className="text-sm">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

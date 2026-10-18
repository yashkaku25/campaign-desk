"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { PhotoButton } from "@/features/ingestion/components/photo-button";
import { SyncSheetButton } from "@/features/ingestion/components/sync-sheet-button";
import { createDeskSheet, saveSheetUrl } from "@/features/ingestion/services/connect-sheet";
import { importCsv } from "@/features/ingestion/services/sync-sheet";

export function SheetLink({
  url,
  connected,
  ready,
  startUrl,
  initialNotice,
}: {
  url: string;
  connected: boolean;
  ready: boolean;
  startUrl: string;
  initialNotice?: { ok: boolean; message: string };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(url);
  const [changing, setChanging] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(initialNotice ?? null);
  const [pending, startTransition] = useTransition();
  const [uploading, startUpload] = useTransition();
  const hasSheet = Boolean(url);

  function connect() {
    if (!startUrl) return;
    setNotice(null);
    window.location.assign(startUrl);
  }

  function makeSheet() {
    setNotice(null);
    startTransition(async () => {
      const result = await createDeskSheet();
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  function showResult(result: { ok: boolean; message: string; openChat?: boolean }) {
    setNotice(result);
    if (result.openChat) window.dispatchEvent(new Event("desk-open"));
    if (result.ok) router.refresh();
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setNotice(null);
        startTransition(async () => {
          const result = await saveSheetUrl(value);
          setChanging(false);
          showResult(result);
        });
      }}
    >
      {connected && hasSheet ? (
        <div className="flex flex-wrap items-center gap-3">
          <SyncSheetButton variant="default" />
          <a href={url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
            Open sheet
          </a>
        </div>
      ) : null}

      {!connected ? (
        <Button type="button" disabled={pending || !ready} aria-busy={pending} onClick={connect}>
          {pending ? <BusyLabel>Opening Google.</BusyLabel> : "Connect Google"}
        </Button>
      ) : null}

      {connected && !hasSheet ? (
        <Button type="button" disabled={pending} aria-busy={pending} onClick={makeSheet}>
          {pending ? <BusyLabel>Making the sheet.</BusyLabel> : "Make a sheet for me"}
        </Button>
      ) : null}

      {connected && !hasSheet ? <SheetField value={value} onChange={setValue} pending={pending} /> : null}
      {connected && hasSheet && changing ? <SheetField value={value} onChange={setValue} pending={pending} /> : null}

      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant="ghost" disabled={uploading} aria-busy={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <BusyLabel>Reading the file.</BusyLabel> : "Upload CSV"}
        </Button>
        <PhotoButton onResult={showResult} />
        {connected && hasSheet ? (
          <Button type="button" variant="ghost" onClick={() => setChanging((open) => !open)}>
            {changing ? "Keep this sheet" : "Change sheet"}
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setNotice(null);
            const reader = new FileReader();
            reader.onload = () => {
              const text = typeof reader.result === "string" ? reader.result : "";
              startUpload(async () => {
                showResult(await importCsv(text));
              });
            };
            reader.readAsText(file);
          }}
        />
      </div>

      {!ready ? <p className="text-sm text-muted">Google sign-in is not set up on the server yet.</p> : null}
      {notice && !pending && !uploading ? <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote> : null}
    </form>
  );
}

function SheetField({
  value,
  onChange,
  pending,
}: {
  value: string;
  onChange: (value: string) => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://docs.google.com/spreadsheets/…"
        aria-label="Google Sheet link"
        className="min-w-[16rem] flex-1"
      />
      <Button type="submit" variant="outline" disabled={pending} aria-busy={pending}>
        {pending ? <BusyLabel>Saving the sheet.</BusyLabel> : "Use this sheet"}
      </Button>
    </div>
  );
}

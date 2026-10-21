"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { PreviewCard } from "@/features/copilot/components/preview-card";
import { decidePreviews, sendCommand } from "@/features/copilot/services/copilot-actions";
import { importPictures } from "@/features/ingestion/services/sync-sheet";
import type { ChatMessage, PreviewModel } from "@/lib/domain";

const PICTURE_LIMIT = 8;

type AttachedPicture = { id: string; url: string; base64: string; mimeType: string };

export function CopilotDrawer({
  messages,
  previews,
  onClose,
}: {
  messages: ChatMessage[];
  previews: PreviewModel[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pictures, setPictures] = useState<AttachedPicture[]>([]);
  const [sentPictures, setSentPictures] = useState<AttachedPicture[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [waitingOn, setWaitingOn] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [readingLabel, setReadingLabel] = useState("Reading your campaigns.");
  const [, startTransition] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const baseline = useRef(0);
  const previewById = new Map(previews.map((preview) => [preview.id, preview]));
  const batch = previews.filter((preview) => preview.canApprove && preview.lines.some((line) => line.before === "Not created"));
  const batchedIds = new Set(batch.length > 1 ? batch.map((preview) => preview.id) : []);

  useEffect(() => {
    setPicked((current) => {
      const next: Record<string, boolean> = {};
      for (const preview of batch) next[preview.id] = current[preview.id] ?? true;
      return next;
    });
  }, [batch.map((preview) => preview.id).join("|")]);

  useEffect(() => {
    field.current?.focus();
  }, []);

  useEffect(() => {
    if (!reading) return;
    if (messages.length > baseline.current) {
      setReading(false);
      setWaitingOn(null);
    }
  }, [messages.length, reading]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, reading, waitingOn, pictures.length, sentPictures.length]);

  function addPictures(files: File[]) {
    const images = files.filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type));
    if (images.length === 0) {
      setNotice({ ok: false, message: "Paste a PNG, JPG, or WebP picture." });
      return;
    }
    const room = PICTURE_LIMIT - pictures.length;
    if (room <= 0) {
      setNotice({ ok: false, message: "8 pictures is the most at one time." });
      return;
    }
    const accepted = images.slice(0, room);
    if (accepted.length < images.length) setNotice({ ok: false, message: "8 pictures is the most at one time." });
    else setNotice(null);
    for (const file of accepted) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = typeof reader.result === "string" ? reader.result : "";
        const base64 = data.split(",")[1] ?? "";
        if (!base64) return;
        setPictures((current) => {
          if (current.length >= PICTURE_LIMIT) return current;
          return [...current, { id: `${file.name}-${file.size}-${file.lastModified}`, url: data, base64, mimeType: file.type }];
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = filesFromClipboard(event.clipboardData);
    if (files.length === 0) return;
    event.preventDefault();
    addPictures(files);
  }

  function sendPictures() {
    const batchToSend = pictures.slice(0, PICTURE_LIMIT);
    if (batchToSend.length === 0 || reading) return;
    setPictures([]);
    setSentPictures(batchToSend);
    setNotice(null);
    setWaitingOn(null);
    setReadingLabel(batchToSend.length === 1 ? "Reading the picture." : "Reading the pictures.");
    setReading(true);
    baseline.current = messages.length;
    startTransition(async () => {
      const result = await importPictures(batchToSend.map((picture) => ({ base64: picture.base64, mimeType: picture.mimeType })));
      setReading(false);
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pictures.length > 0) {
      sendPictures();
      return;
    }
    const text = draft.trim();
    if (!text || reading) return;
    setDraft("");
    setNotice(null);
    setReadingLabel("Reading your campaigns.");
    setWaitingOn(text);
    setReading(true);
    baseline.current = messages.length;
    startTransition(async () => {
      const result = await sendCommand(text);
      setReading(false);
      setWaitingOn(null);
      if (!result.ok) setDraft(text);
      if (result.decided || !result.ok) setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  function decide(decision: "approve" | "reject") {
    const ids = batch.filter((preview) => picked[preview.id]).map((preview) => preview.id);
    if (ids.length === 0) {
      setNotice({ ok: false, message: "Choose at least one campaign." });
      return;
    }
    setNotice(null);
    setReadingLabel(decision === "approve" ? "Saving the chosen campaigns." : "Leaving the chosen campaigns unchanged.");
    setReading(true);
    startTransition(async () => {
      const result = await decidePreviews(ids, decision);
      setReading(false);
      setNotice(result);
      router.refresh();
    });
  }

  return (
    <section
      className="fixed top-0 right-0 z-40 flex h-dvh w-full max-w-[400px] flex-col border-l border-line bg-card shadow-2xl"
      aria-label="Chat"
      aria-busy={reading}
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-sans font-semibold tracking-tight text-2xl">Marketer</h2>
        <button type="button" className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink hover:bg-paper" onClick={onClose}>
          Close
        </button>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 && !waitingOn ? (
          <p className="text-sm text-muted">
            Your performance marketer reads the desk numbers. Ask it to optimize, explain spend, or propose a pause or
            budget move, then Approve to save.
          </p>
        ) : null}
        <History messages={messages} previewById={previewById} skipIds={batchedIds} />
        {sentPictures.length > 0 ? (
          <article className="flex justify-end">
            <div className="max-w-[90%]">
              <div className="rounded-2xl rounded-br-md bg-ink p-2">
                <PictureStrip pictures={sentPictures} />
              </div>
              <p className="mt-1 text-right text-xs text-muted">Just now</p>
            </div>
          </article>
        ) : null}
        {waitingOn ? (
          <article className="flex justify-end">
            <div className="max-w-[90%]">
              <div className="rounded-2xl rounded-br-md bg-ink px-3 py-2 text-sm text-paper">
                <p className="whitespace-pre-wrap">{waitingOn}</p>
              </div>
              <p className="mt-1 text-right text-xs text-muted">Just now</p>
            </div>
          </article>
        ) : null}
        {reading ? (
          <div className="mr-8">
            <StatusNote tone="wait">{readingLabel}</StatusNote>
          </div>
        ) : null}
      </div>
      <form onSubmit={onSubmit} className="border-t border-line p-3">
        {batch.length > 1 ? (
          <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
            <p className="text-sm font-semibold">{batch.length} new campaigns are waiting.</p>
            <p className="text-xs text-muted">Uncheck any you want to leave out.</p>
            <ul className="space-y-1">
              {batch.map((preview) => {
                const line = preview.lines.find((item) => item.before === "Not created") ?? preview.lines[0];
                return (
                  <li key={preview.id}>
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={picked[preview.id] ?? true}
                        onChange={(event) => setPicked((current) => ({ ...current, [preview.id]: event.target.checked }))}
                      />
                      <span>
                        <span className="font-semibold">{line?.name}</span>
                        <span className="block text-xs text-muted">{line?.after}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={reading} onClick={() => decide("approve")}>
                Approve selected
              </Button>
              <Button type="button" variant="outline" disabled={reading} onClick={() => decide("reject")}>
                Decline selected
              </Button>
            </div>
          </div>
        ) : null}
        {notice ? (
          <div className="mb-2">
            <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote>
          </div>
        ) : null}
        {pictures.length > 0 ? (
          <div className="mb-2">
            <PictureStrip
              pictures={pictures}
              onRemove={(id) => setPictures((current) => current.filter((picture) => picture.id !== id))}
            />
            <p className="mt-1 text-xs text-muted">{pictures.length} of 8 pictures</p>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="desk-message">
            Message
          </label>
          <textarea
            ref={field}
            id="desk-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPaste={onPaste}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={2000}
            rows={2}
            placeholder='Ask your marketer: "optimize my campaigns", "why is spend up?", or "pause CTR under 2%"'
            disabled={reading}
            className="min-h-11 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-2 text-sm leading-5 outline-none focus:border-ink disabled:opacity-60"
          />
          <Button
            className="shrink-0"
            type="submit"
            disabled={reading || (draft.trim().length === 0 && pictures.length === 0)}
            aria-busy={reading}
            aria-label={reading ? readingLabel : "Send"}
          >
            {reading ? <Spinner /> : "Send"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function History({
  messages,
  previewById,
  skipIds,
}: {
  messages: ChatMessage[];
  previewById: Map<string, PreviewModel>;
  skipIds: Set<string>;
}) {
  const groups: { label: string; items: ChatMessage[] }[] = [];
  for (const message of messages) {
    const label = dayLabel(message.createdAt);
    const last = groups.at(-1);
    if (!last || last.label !== label) groups.push({ label, items: [message] });
    else last.items.push(message);
  }

  return groups.map((group) => (
    <div key={group.label} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold text-muted">{group.label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      {group.items.map((message) => {
        const preview = message.actionId && !skipIds.has(message.actionId) ? previewById.get(message.actionId) : undefined;
        if (message.actionId && skipIds.has(message.actionId)) return null;
        const mine = message.role === "user";
        return (
          <article key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
            <div className={mine ? "max-w-[90%]" : "w-full max-w-[40rem]"}>
              {preview ? null : (
                <div
                  className={
                    mine
                      ? "rounded-2xl rounded-br-md bg-ink px-3 py-2 text-sm leading-6 text-paper"
                      : "rounded-2xl rounded-bl-md border border-line bg-paper px-3 py-2 text-sm leading-6"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
              {preview ? <PreviewCard preview={preview} /> : null}
              <p className={`mt-1 text-xs text-muted ${mine ? "text-right" : ""}`}>{clock(message.createdAt)}</p>
            </div>
          </article>
        );
      })}
    </div>
  ));
}

function dayLabel(iso: string): string {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return "Earlier";
  const today = new Date();
  if (time.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (time.toDateString() === yesterday.toDateString()) return "Yesterday";
  return time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function clock(iso: string): string {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return "";
  return time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function filesFromClipboard(data: DataTransfer): File[] {
  const fromItems = Array.from(data.items)
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
  if (fromItems.length > 0) return fromItems;
  return Array.from(data.files).filter((file) => file.type.startsWith("image/"));
}

function PictureStrip({ pictures, onRemove }: { pictures: AttachedPicture[]; onRemove?: (id: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {pictures.map((picture) => (
        <li key={picture.id} className="relative">
          <img src={picture.url} alt="" className="h-16 w-16 rounded-xl object-cover" />
          {onRemove ? (
            <button
              type="button"
              aria-label="Remove picture"
              className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-paper"
              onClick={() => onRemove(picture.id)}
            >
              ×
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

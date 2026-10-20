"use client";

import { useEffect, useRef, useState } from "react";

import { ACT_LABEL } from "@/features/practice/emotions/resolve";
import { STEP_LABEL, type ShopperMoment } from "@/features/practice/services/moments";
import { cn } from "@/lib/utils";

const STEP_EMOJI: Record<string, string> = {
  saw_ad: "👀",
  stopped: "✋",
  scrolled_past: "💨",
  opened_link: "🔗",
  read_url: "🌐",
  on_page: "📄",
  scrolling_site: "👇",
  matched: "✅",
  mismatched: "⚠️",
  form: "📝",
  cart: "🛒",
  checkout: "💳",
  result: "🎉",
  left: "🚪",
  hid: "🚫",
  reported: "🚩",
  messaged: "💬",
  called: "📞",
};

const STEP_TONE: Record<string, string> = {
  saw_ad: "bg-sea/10 border-sea/30",
  stopped: "bg-pine/10 border-pine/30",
  scrolled_past: "bg-paper border-line",
  opened_link: "bg-live/10 border-live/30",
  read_url: "bg-amber/10 border-amber/30",
  on_page: "bg-live/10 border-live/25",
  scrolling_site: "bg-sea/10 border-sea/25",
  matched: "bg-live/15 border-live/35",
  mismatched: "bg-clay/10 border-clay/30",
  form: "bg-indigo/10 border-indigo/25",
  cart: "bg-amber/10 border-amber/30",
  checkout: "bg-amber/15 border-amber/35",
  result: "bg-live/15 border-live/40",
  left: "bg-clay/10 border-clay/25",
  hid: "bg-clay/15 border-clay/35",
  reported: "bg-clay/20 border-clay/40",
  messaged: "bg-pine/15 border-pine/35",
  called: "bg-live/15 border-live/35",
};

const PLACEMENT_TONE: Record<string, string> = {
  feed: "bg-pine",
  reels: "bg-clay",
  stories: "bg-amber",
  advantage: "bg-sea",
};

export function LiveFeed({
  moments,
  playing,
  onTick,
  dense = false,
  objectiveLabel,
}: {
  moments: ShopperMoment[];
  playing: boolean;
  onTick: (elapsedMs: number) => void;
  dense?: boolean;
  objectiveLabel?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  /** Off by default so new bubbles do not yank the list while you read. */
  const [followLive, setFollowLive] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const onTickRef = useRef(onTick);
  const elapsedRef = useRef(0);
  const ignoreScrollRef = useRef(false);
  onTickRef.current = onTick;

  useEffect(() => {
    setVisibleCount(0);
    elapsedRef.current = 0;
    setFollowLive(false);
  }, [moments]);

  useEffect(() => {
    if (!playing || moments.length === 0 || hoverPaused) return;
    let frame = 0;
    let last = performance.now();
    const speed = 0.55;
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      elapsedRef.current += delta * speed;
      const elapsed = elapsedRef.current;
      onTickRef.current(elapsed);
      let count = 0;
      for (const moment of moments) {
        if (moment.tMs <= elapsed) count += 1;
        else break;
      }
      setVisibleCount(count);
      if (count < moments.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, moments, hoverPaused]);

  const visible = moments.slice(0, visibleCount);

  useEffect(() => {
    if (!followLive) return;
    const el = scrollerRef.current;
    if (!el) return;
    ignoreScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
    const t = window.setTimeout(() => {
      ignoreScrollRef.current = false;
    }, 80);
    return () => window.clearTimeout(t);
  }, [visibleCount, followLive]);

  function onScroll() {
    if (ignoreScrollRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
    if (!nearBottom && followLive) setFollowLive(false);
  }

  const done = moments.length > 0 && visibleCount >= moments.length;
  const shopperCount = visible.filter((moment) => moment.kind === "shopper").length;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        dense
          ? "h-[34rem] border border-line bg-card"
          : "h-[32rem] rounded-2xl border border-line bg-paper",
      )}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-card px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              playing && !done && !hoverPaused ? "animate-pulse bg-clay" : "bg-hold",
            )}
          />
          <p className="text-[13px] font-semibold text-ink">People researching 🔍</p>
          {objectiveLabel ? (
            <span className="rounded-full bg-pine/15 px-2 py-0.5 text-[10px] font-semibold text-pine">
              {objectiveLabel}
            </span>
          ) : null}
          {hoverPaused ? (
            <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-amber">
              Hover paused — read freely
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-paper"
            onClick={() => setFollowLive((v) => !v)}
          >
            {followLive ? "📌 Following live" : "📖 Reading mode"}
          </button>
          <p className="text-[11px] text-muted">
            {done ? "Week finished" : playing ? "Live" : "Paused"} · {shopperCount} steps
          </p>
        </div>
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onWheel={() => {
          if (followLive) setFollowLive(false);
        }}
        onTouchMove={() => {
          if (followLive) setFollowLive(false);
        }}
        className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-3"
      >
        {visible.length === 0 ? (
          <p className="text-[13px] text-muted">
            Reading mode is on — scroll freely. Hover pauses new bubbles. Tap “Following live” only when you want the feed to stick to the bottom.
          </p>
        ) : null}
        {visible.map((moment) => (
          <MomentBubble key={moment.id} moment={moment} />
        ))}
        {!done && playing && visible.length > 0 && !hoverPaused ? (
          <p className="flex items-center gap-2 text-[11px] text-muted" aria-live="polite">
            <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-pine" />
            Someone is researching…
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>
      {!followLive && visible.length > 0 && !done ? (
        <button
          type="button"
          className="absolute bottom-3 right-3 rounded-full bg-pine px-3 py-1.5 text-[11px] font-semibold text-paper shadow-lg"
          onClick={() => {
            setFollowLive(true);
            const el = scrollerRef.current;
            if (el) el.scrollTop = el.scrollHeight;
          }}
        >
          Jump to live ↓
        </button>
      ) : null}
    </div>
  );
}

function MomentBubble({ moment }: { moment: ShopperMoment }) {
  if (moment.kind === "day") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold tracking-wide text-paper shadow-sm">
          {moment.thought}
        </span>
      </div>
    );
  }

  if (moment.kind === "why") {
    return (
      <div className="mx-6 rounded-2xl border border-dashed border-pine/40 bg-pine/10 px-3 py-2 text-[12px] leading-5 text-ink">
        <p className="text-[10px] font-bold uppercase tracking-wide text-pine">💡 Why this matters</p>
        <p className="mt-0.5">{moment.thought}</p>
      </div>
    );
  }

  if (moment.kind === "marketer") {
    return (
      <div className="ml-auto max-w-[92%] animate-[fadeSlide_0.35s_ease-out] rounded-2xl border border-amber/40 bg-amber/10 px-3 py-2.5 text-[13px] leading-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber">📣 Marketer watching</p>
        <p className="mt-1 text-ink">{moment.thought}</p>
      </div>
    );
  }

  const place = moment.placement ?? "feed";
  const initial = (moment.person || "?").slice(0, 1).toUpperCase();
  const stepTone = moment.step ? STEP_TONE[moment.step] : "bg-card border-line";
  const emoji = moment.step ? STEP_EMOJI[moment.step] : "·";
  const stepLabel = moment.step ? STEP_LABEL[moment.step] : moment.act ? ACT_LABEL[moment.act] : null;

  return (
    <div className="mr-auto flex max-w-[96%] animate-[fadeSlide_0.35s_ease-out] items-start gap-2">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-paper shadow",
          PLACEMENT_TONE[place] ?? "bg-hold",
        )}
        aria-hidden
      >
        {initial}
      </div>
      <div className={cn("rounded-2xl border px-3 py-2.5 text-[13px] leading-5 shadow-sm", stepTone)}>
        <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          <span className="text-ink">{moment.person}</span>
          {stepLabel ? (
            <span className="rounded-full bg-ink/5 px-1.5 py-0.5 normal-case text-ink">
              {emoji} {stepLabel}
            </span>
          ) : null}
          {moment.creativeLabel ? (
            <span className="rounded-full bg-ink/5 px-1.5 py-0.5 normal-case">Creative {moment.creativeLabel}</span>
          ) : null}
          {moment.placement ? (
            <span className="rounded-full bg-ink/5 px-1.5 py-0.5 normal-case">{moment.placement}</span>
          ) : null}
        </p>
        <p className="mt-1 font-medium text-ink">{moment.thought}</p>
      </div>
    </div>
  );
}

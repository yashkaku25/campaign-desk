"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand/mark";

const SCENE_MS = 5600;

const scenes = [
  {
    id: "overview",
    label: "Overview",
    caption: "See what is live and what needs care on one screen.",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    caption: "Open a campaign. Read spend, results, and status.",
  },
  {
    id: "sheet",
    label: "Sheet",
    caption: "Paste your Google Sheet. Sync puts those rows on the desk.",
  },
  {
    id: "simulation",
    label: "Simulation",
    caption:
      "Write the ad and who it is for. You get a band for the next days. It can be wrong. It does not spend.",
  },
  {
    id: "chat",
    label: "Chat",
    caption: "Ask for a change. Read the preview. Approve saves. Reject leaves it.",
  },
] as const;

export function ProductFilm() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const barRef = useRef<HTMLSpanElement>(null);
  const started = useRef(0);
  const offset = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    started.current = performance.now() - offset.current;
    let frame = 0;
    const tick = (now: number) => {
      const total = SCENE_MS * scenes.length;
      const elapsed = (now - started.current) % total;
      offset.current = elapsed;
      const next = Math.floor(elapsed / SCENE_MS);
      const local = (elapsed % SCENE_MS) / SCENE_MS;
      if (barRef.current) barRef.current.style.transform = `scaleX(${local})`;
      setIndex((current) => (current === next ? current : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function go(next: number) {
    offset.current = next * SCENE_MS;
    setIndex(next);
    if (barRef.current) barRef.current.style.transform = "scaleX(0)";
    if (playing) started.current = performance.now() - offset.current;
  }

  const scene = scenes[index] ?? scenes[0];

  return (
    <section className="mt-14" aria-label="How Campaign desk works">
      <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_30px_70px_-40px_rgba(20,32,51,0.55)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <BrandMark />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-paper"
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
            onClick={() => setPlaying((current) => !current)}
          >
            {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
        </div>
        <div className="min-h-80 px-4 py-6 md:px-8 md:py-8">
          <div key={scene.id} className="landing-scene-fade">
            <Scene id={scene.id} />
          </div>
        </div>
        <div className="h-1 bg-line">
          <span ref={barRef} className="block h-full origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
      <p className="mt-4 text-base leading-7 text-ink">{scene.caption}</p>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Parts of the walkthrough">
        {scenes.map((item, itemIndex) => {
          const selected = itemIndex === index;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={
                selected
                  ? "rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-paper"
                  : "rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-ink"
              }
              onClick={() => go(itemIndex)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Scene({ id }: { id: (typeof scenes)[number]["id"] }) {
  if (id === "overview") {
    return (
      <div className="mx-auto grid max-w-lg gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-pine">Live</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">Spring sale</p>
          <p className="mt-1 text-sm text-muted">On · healthy click rate</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay">Needs care</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">Cart 30d</p>
          <p className="mt-1 text-sm text-muted">Spend up · few results</p>
        </div>
      </div>
    );
  }
  if (id === "campaigns") {
    return (
      <table className="w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="pb-3 font-medium">Campaign</th>
            <th className="pb-3 text-right font-medium">Spend</th>
            <th className="pb-3 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line">
            <td className="py-3 font-semibold">Quiet hair dryer</td>
            <td className="py-3 text-right tabular-nums">50.00 $</td>
            <td className="py-3 text-right">Active</td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-3 font-semibold">Cart 7d</td>
            <td className="py-3 text-right tabular-nums">28.00 $</td>
            <td className="py-3 text-right">Paused</td>
          </tr>
        </tbody>
      </table>
    );
  }
  if (id === "sheet") {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <p className="text-sm text-muted">Google Sheet link</p>
        <div className="rounded-2xl border border-dashed border-line px-4 py-3 font-mono text-xs text-muted">
          docs.google.com/spreadsheets/…
        </div>
        <span className="inline-flex rounded-full bg-pine px-3 py-1.5 text-sm font-semibold text-paper">Sync</span>
        <p className="text-sm leading-6 text-muted">Spend, clicks, and results land on the desk.</p>
      </div>
    );
  }
  if (id === "simulation") {
    return (
      <div className="mx-auto grid max-w-lg gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm text-muted">Next 7 days</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">40 to 70 clicks</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Simulation. This can be wrong. It does not spend.
          </p>
        </div>
        <div className="flex h-40 w-24 flex-col justify-between rounded-[1.4rem] border border-line bg-paper p-2 shadow-sm">
          <div className="h-2 w-8 self-center rounded-full bg-line" />
          <p className="text-[10px] font-semibold leading-tight">Quiet hair dryer</p>
          <p className="text-[9px] leading-snug text-muted">It dries hair without the roar.</p>
          <div className="h-10 rounded-lg border border-dashed border-line" />
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line p-4">
      <p className="text-sm text-muted">Chat preview</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">Create · Prospect Feed</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Strategy: cold people on Feed. Expect learning for a few days. Approve saves it.
      </p>
      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-paper">Approve</span>
        <span className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">Reject</span>
      </div>
    </div>
  );
}

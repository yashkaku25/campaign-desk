"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SCENE_MS = 5200;

const scenes = [
  {
    id: "desk",
    label: "Desk",
    caption: "Your campaigns on one desk.",
  },
  {
    id: "sheet",
    label: "Sheet",
    caption: "Real spend, clicks, and results come from your Google Sheet.",
  },
  {
    id: "simulation",
    label: "Simulation",
    caption:
      "Write the ad and who it is for. You get a band for the next days. It can be wrong. It does not spend.",
  },
  {
    id: "approve",
    label: "Approve",
    caption: "Chat can suggest a change. Nothing is saved until you Approve.",
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
    <section className="landing-film" aria-label="How Campaign desk works">
      <div className="landing-film-stage">
        <button
          type="button"
          className="landing-film-play"
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
        <div className="landing-film-screen">
          <div key={scene.id} className="landing-scene-fade landing-film-body">
            <Scene id={scene.id} />
          </div>
        </div>
        <div className="landing-film-progress" aria-hidden="true">
          <span ref={barRef} />
        </div>
      </div>

      <div className="landing-film-meta">
        <p className="landing-film-caption">{scene.caption}</p>
        <div className="landing-film-tabs" role="tablist" aria-label="Parts of the walkthrough">
          {scenes.map((item, itemIndex) => {
            const selected = itemIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={selected ? "is-active" : undefined}
                onClick={() => go(itemIndex)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Scene({ id }: { id: (typeof scenes)[number]["id"] }) {
  if (id === "desk") {
    return (
      <div className="landing-scene">
        <p className="landing-scene-kicker">Campaigns</p>
        <table className="landing-scene-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Spend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Quiet hair dryer</td>
              <td>50.00 $</td>
              <td>Active</td>
            </tr>
            <tr>
              <td>Cart 7d</td>
              <td>28.00 $</td>
              <td>Paused</td>
            </tr>
            <tr>
              <td>Prospect Feed</td>
              <td>41.00 $</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  if (id === "sheet") {
    return (
      <div className="landing-scene landing-scene-narrow">
        <p className="landing-scene-kicker">Google Sheet</p>
        <p className="landing-scene-mono">docs.google.com/spreadsheets/…</p>
        <span className="landing-scene-chip">Sync</span>
        <p className="landing-scene-note">Spend, clicks, and results land on the desk.</p>
      </div>
    );
  }
  if (id === "simulation") {
    return (
      <div className="landing-scene landing-scene-split">
        <div>
          <p className="landing-scene-kicker">Next 7 days</p>
          <p className="landing-scene-hero-num">40 to 70 clicks</p>
          <p className="landing-scene-note">Simulation. This can be wrong. It does not spend.</p>
        </div>
        <div className="landing-scene-ad">
          <p className="landing-scene-ad-title">Quiet hair dryer</p>
          <p className="landing-scene-note">It dries hair without the roar.</p>
          <div className="landing-scene-ad-media" />
        </div>
      </div>
    );
  }
  return (
    <div className="landing-scene landing-scene-narrow">
      <p className="landing-scene-kicker">Chat preview</p>
      <p className="landing-scene-title">Create · Prospect Feed</p>
      <p className="landing-scene-note">
        Strategy: cold people on Feed. Expect learning for a few days.
      </p>
      <div className="landing-scene-actions">
        <span className="landing-scene-chip is-ink">Approve</span>
        <span className="landing-scene-chip is-ghost">Reject</span>
      </div>
    </div>
  );
}

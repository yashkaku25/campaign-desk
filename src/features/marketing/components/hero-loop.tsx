"use client";

import { useEffect, useState } from "react";

/** Looping product demo — same job as Cursor’s hero GIF. */
const FRAMES = [
  {
    id: "desk",
    title: "Campaigns",
    holdMs: 2800,
  },
  {
    id: "sheet",
    title: "Sheet sync",
    holdMs: 2600,
  },
  {
    id: "sim",
    title: "Simulation",
    holdMs: 3000,
  },
  {
    id: "approve",
    title: "Chat · Approve",
    holdMs: 2800,
  },
] as const;

export function HeroLoop() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const hold = FRAMES[index]?.holdMs ?? 2800;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % FRAMES.length);
    }, hold);
    return () => window.clearTimeout(timer);
  }, [index, reduceMotion]);

  const frame = FRAMES[index] ?? FRAMES[0];

  return (
    <div className="hero-loop" aria-label="Product demo. Scenes change on a loop.">
      <div className="hero-loop-glow" aria-hidden="true" />
      <div className="hero-loop-window">
        <div className="hero-loop-chrome">
          <span className="hero-loop-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="hero-loop-chrome-title">{frame.title}</span>
        </div>
        <div className="hero-loop-stage">
          {FRAMES.map((item, itemIndex) => (
            <div
              key={item.id}
              className={`hero-loop-frame${itemIndex === index ? " is-active" : ""}`}
              aria-hidden={itemIndex !== index}
            >
              <FrameBody id={item.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FrameBody({ id }: { id: (typeof FRAMES)[number]["id"] }) {
  if (id === "desk") {
    return (
      <div className="hero-ui">
        <p className="hero-ui-kicker">Overview</p>
        <div className="hero-ui-rows">
          <Row name="Quiet hair dryer" spend="50.00 $" status="Active" hot />
          <Row name="Cart 7d" spend="28.00 $" status="Paused" />
          <Row name="Prospect Feed" spend="41.00 $" status="Active" />
        </div>
      </div>
    );
  }
  if (id === "sheet") {
    return (
      <div className="hero-ui">
        <p className="hero-ui-kicker">Google Sheet</p>
        <p className="hero-ui-mono">docs.google.com/spreadsheets/d/…</p>
        <div className="hero-ui-sync">
          <span className="hero-ui-pill">Sync</span>
          <span className="hero-ui-pulse" aria-hidden="true" />
        </div>
        <p className="hero-ui-note">Spend, clicks, and results land on the desk.</p>
      </div>
    );
  }
  if (id === "sim") {
    return (
      <div className="hero-ui hero-ui-split">
        <div>
          <p className="hero-ui-kicker">Next 7 days</p>
          <p className="hero-ui-big">40 to 70 clicks</p>
          <p className="hero-ui-note">Simulation. It can be wrong. It does not spend.</p>
        </div>
        <div className="hero-ui-ad">
          <p className="hero-ui-ad-title">Quiet hair dryer</p>
          <p className="hero-ui-note">It dries hair without the roar.</p>
          <div className="hero-ui-ad-media" />
        </div>
      </div>
    );
  }
  return (
    <div className="hero-ui">
      <p className="hero-ui-kicker">Chat preview</p>
      <p className="hero-ui-title">Create · Prospect Feed</p>
      <p className="hero-ui-note">Strategy: cold people on Feed. Expect learning for a few days.</p>
      <div className="hero-ui-actions">
        <span className="hero-ui-pill is-ink">Approve</span>
        <span className="hero-ui-pill is-ghost">Reject</span>
      </div>
    </div>
  );
}

function Row({
  name,
  spend,
  status,
  hot,
}: {
  name: string;
  spend: string;
  status: string;
  hot?: boolean;
}) {
  return (
    <div className={`hero-ui-row${hot ? " is-hot" : ""}`}>
      <span>{name}</span>
      <span>{spend}</span>
      <span>{status}</span>
    </div>
  );
}

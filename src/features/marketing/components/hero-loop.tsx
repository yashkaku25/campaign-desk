"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Cursor hero job: one wide, dense app window that loops real desk layouts.
 * No marketing eyebrows, titles live in the chrome / panel heads only.
 */
const FRAMES = [
  { id: "desk", title: "Overview", holdMs: 5000 },
  { id: "sheet", title: "Sheet sync", holdMs: 5000 },
  { id: "sim", title: "Simulation", holdMs: 5000 },
  { id: "approve", title: "Chat", holdMs: 5000 },
] as const;

type FrameId = (typeof FRAMES)[number]["id"];

const NAV = [
  { id: "desk", label: "Overview" },
  { id: "campaigns", label: "Campaigns" },
  { id: "sim", label: "Simulation" },
  { id: "audit", label: "Audit" },
  { id: "approve", label: "Chat" },
] as const;

export function HeroLoop() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const hold = FRAMES[index]?.holdMs ?? 3000;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % FRAMES.length);
    }, hold);
    return () => window.clearTimeout(timer);
  }, [index, reduceMotion, paused]);

  const frame = FRAMES[index] ?? FRAMES[0];

  return (
    <div className="hero-loop" id="demo" aria-label="Campaign desk product demo">
      <div className="hero-loop-window">
        <div className="hero-loop-chrome">
          <span className="hero-loop-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="hero-loop-chrome-title">Campaign desk · {frame.title}</span>
        </div>
        <div className="hero-loop-stage">
          {FRAMES.map((item, itemIndex) => (
            <div
              key={item.id}
              className={`hero-loop-frame${itemIndex === index ? " is-active" : ""}`}
              aria-hidden={itemIndex !== index}
            >
              <DeskShell active={item.id}>
                <FrameBody id={item.id} />
              </DeskShell>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-loop-controls">
        <div className="hero-loop-tabs" role="group" aria-label="Product demo scenes">
          {FRAMES.map((item, itemIndex) => <button type="button" key={item.id} aria-pressed={itemIndex === index} className={itemIndex === index ? "is-active" : ""} onClick={() => { setIndex(itemIndex); setPaused(true); }}><span>0{itemIndex + 1}</span>{item.title}</button>)}
        </div>
        <button className="hero-loop-pause" type="button" aria-pressed={paused || reduceMotion} onClick={() => setPaused(!paused)} disabled={reduceMotion}>{reduceMotion ? "Motion reduced" : paused ? "Play demo ▷" : "Pause demo Ⅱ"}</button>
      </div>
      <p className="hero-demo-caption">Product demonstration · Example campaign data</p>
    </div>
  );
}

function DeskShell({
  active,
  children,
}: {
  active: FrameId;
  children: ReactNode;
}) {
  const navActive =
    active === "sheet" ? "campaigns" : active === "desk" ? "desk" : active;

  return (
    <div className="hero-desk">
      <aside className="hero-desk-side" aria-hidden="true">
        <p className="hero-desk-brand">Campaign desk</p>
        <nav className="hero-desk-nav">
          {NAV.map((item) => (
            <span
              key={item.id}
              className={`hero-desk-nav-item${item.id === navActive ? " is-on" : ""}`}
            >
              {item.label}
            </span>
          ))}
        </nav>
        <div className="hero-desk-user">
          <span className="hero-desk-avatar">Y</span>
          <span>
            <strong>Yash</strong>
            <small>Owner</small>
          </span>
        </div>
      </aside>
      <div className="hero-desk-main">{children}</div>
    </div>
  );
}

function FrameBody({ id }: { id: FrameId }) {
  if (id === "desk") {
    return (
      <div className="hero-panel">
        <header className="hero-panel-head">
          <h3 className="hero-panel-title">Campaigns</h3>
          <div className="hero-metric-row" aria-hidden="true">
            <MetricChip label="Spend" value="169.00 $" hot />
            <MetricChip label="Clicks" value="1,135" />
            <MetricChip label="CTR" value="1.8 %" />
            <MetricChip label="Results" value="64" />
          </div>
        </header>
        <div className="hero-table-wrap">
          <table className="hero-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Spend</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              <tr className="is-hot">
                <td>Quiet hair dryer</td>
                <td>
                  <span className="hero-status is-live">Active</span>
                </td>
                <td>50.00 $</td>
                <td>312</td>
                <td>2.1 %</td>
                <td>18</td>
              </tr>
              <tr>
                <td>Cart 7d</td>
                <td>
                  <span className="hero-status">Paused</span>
                </td>
                <td>28.00 $</td>
                <td>190</td>
                <td>1.4 %</td>
                <td>11</td>
              </tr>
              <tr>
                <td>Prospect Feed</td>
                <td>
                  <span className="hero-status is-live">Active</span>
                </td>
                <td>41.00 $</td>
                <td>340</td>
                <td>1.9 %</td>
                <td>22</td>
              </tr>
              <tr>
                <td>Lookalike buyers</td>
                <td>
                  <span className="hero-status is-live">Active</span>
                </td>
                <td>36.00 $</td>
                <td>205</td>
                <td>1.6 %</td>
                <td>9</td>
              </tr>
              <tr>
                <td>Messages retarget</td>
                <td>
                  <span className="hero-status is-live">Active</span>
                </td>
                <td>14.00 $</td>
                <td>88</td>
                <td>2.4 %</td>
                <td>4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (id === "sheet") {
    return (
      <div className="hero-panel">
        <header className="hero-panel-head">
          <h3 className="hero-panel-title">Google Sheet sync</h3>
          <span className="hero-ui-pill">
            <span className="hero-ui-pulse" aria-hidden="true" />
            Synced
          </span>
        </header>
        <div className="hero-settings">
          <div className="hero-settings-strip">
            <div className="hero-settings-field">
              <span className="hero-settings-label">Sheet link</span>
              <p className="hero-ui-mono">docs.google.com/spreadsheets/d/1aB…xY9</p>
            </div>
            <div className="hero-settings-actions">
              <span className="hero-ui-pill is-ink">Sync now</span>
              <span className="hero-ui-pill is-ghost">Change link</span>
            </div>
          </div>
          <div className="hero-table-wrap">
            <table className="hero-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Spend</th>
                  <th>Clicks</th>
                  <th>Results</th>
                  <th>From sheet</th>
                </tr>
              </thead>
              <tbody>
                <tr className="is-hot">
                  <td>Quiet hair dryer</td>
                  <td>50.00 $</td>
                  <td>312</td>
                  <td>18</td>
                  <td>Just now</td>
                </tr>
                <tr>
                  <td>Cart 7d</td>
                  <td>28.00 $</td>
                  <td>190</td>
                  <td>11</td>
                  <td>Just now</td>
                </tr>
                <tr>
                  <td>Prospect Feed</td>
                  <td>41.00 $</td>
                  <td>340</td>
                  <td>22</td>
                  <td>Just now</td>
                </tr>
                <tr>
                  <td>Lookalike buyers</td>
                  <td>36.00 $</td>
                  <td>205</td>
                  <td>9</td>
                  <td>Just now</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (id === "sim") {
    return (
      <div className="hero-panel hero-panel-sim">
        <header className="hero-panel-head">
          <h3 className="hero-panel-title">Ads Manager path</h3>
          <div className="hero-sim-tabs" aria-hidden="true">
            <span>Campaign</span>
            <span className="is-on">Ad set</span>
            <span>Ad</span>
            <span>Analyse</span>
          </div>
        </header>
        <div className="hero-sim-grid">
          <div className="hero-sim-form">
            <span className="hero-settings-label">Who it is for</span>
            <div className="hero-chip-row">
              <span className="hero-chip is-on">Cold people</span>
              <span className="hero-chip">Custom</span>
              <span className="hero-chip">Lookalike</span>
            </div>
            <span className="hero-settings-label">Interests</span>
            <div className="hero-chip-row">
              <span className="hero-chip">Hair care</span>
              <span className="hero-chip">Home</span>
            </div>
            <span className="hero-settings-label">Placement</span>
            <div className="hero-chip-row">
              <span className="hero-chip is-on">Feed</span>
              <span className="hero-chip">Stories</span>
              <span className="hero-chip">Reels</span>
            </div>
            <span className="hero-settings-label">Devices</span>
            <div className="hero-chip-row">
              <span className="hero-chip is-on">Mobile</span>
              <span className="hero-chip is-on">Desktop</span>
            </div>
            <div className="hero-sim-band">
              <p className="hero-ui-big">40 to 70 clicks</p>
              <p className="hero-ui-note">
                Next 7 days. Simulation can be wrong. It does not spend.
              </p>
            </div>
          </div>
          <div className="hero-ui-ad hero-ui-ad-dense">
            <span className="hero-settings-label">Ad preview</span>
            <div className="hero-ui-ad-media" />
            <p className="hero-ui-ad-title">Quiet hair dryer</p>
            <p className="hero-ui-note">It dries hair without the roar.</p>
            <div className="hero-chip-row">
              <span className="hero-chip">Instant Form</span>
              <span className="hero-ui-pill is-ghost">Learn more</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-panel hero-panel-chat">
      <header className="hero-panel-head">
        <h3 className="hero-panel-title">Preview before save</h3>
      </header>
      <div className="hero-chat">
        <div className="hero-chat-thread">
          <div className="hero-bubble is-you">
            Create a cold Feed campaign for the hair dryer, daily budget 40.
          </div>
          <div className="hero-bubble is-desk">
            Draft ready. Strategy: cold people on Feed. Expect learning for a few days.
          </div>
          <div className="hero-bubble is-you">Show me the preview.</div>
          <div className="hero-bubble is-desk">
            Create · Prospect Feed is ready. Approve writes it. Reject leaves campaigns alone.
          </div>
        </div>
        <div className="hero-preview-card">
          <p className="hero-ui-title">Create · Prospect Feed</p>
          <p className="hero-ui-note">Quiet hair dryer · cold Feed</p>
          <ul className="hero-preview-list">
            <li>Daily budget 40.00 $</li>
            <li>Audience: cold people · Feed</li>
            <li>Strategy note saved on the preview</li>
            <li>Nothing saved until Approve</li>
          </ul>
          <div className="hero-ui-actions">
            <span className="hero-ui-pill is-ink">Approve</span>
            <span className="hero-ui-pill is-ghost">Reject</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  hot,
}: {
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div className={`hero-metric${hot ? " is-hot" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


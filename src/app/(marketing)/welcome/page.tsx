import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand/mark";
import { FaqList } from "@/features/marketing/components/faq-list";
import { FeatureVisual } from "@/features/marketing/components/feature-visual";
import { HeroLoop } from "@/features/marketing/components/hero-loop";
import "@/features/marketing/landing.css";

export const metadata: Metadata = {
  title: "Campaign desk",
  description: "See how the ad might land before it spends. Sync your sheet. Approve every real change.",
};

/** Mobbin Cursor section map → Campaign desk content. No eyebrows. */
const zigzags = [
  {
    title: "See the run before money moves.",
    body: "Write the headline and the copy. Add a picture or a video. Choose who it is for. You get a band for the next days. It can be wrong. It does not spend.",
    quote: "Simulate first. Spend later. That is the whole point of the week.",
    kind: "simulation" as const,
    flip: false,
  },
  {
    title: "Your sheet stays the source of truth.",
    body: "Real spend, clicks, and results live in your Google Sheet. Sync puts those rows on the desk so the band can use them when they exist.",
    quote: null,
    kind: "sheet" as const,
    flip: true,
  },
  {
    title: "You still choose what is saved.",
    body: "Chat can suggest a change, or draft a whole campaign with a strategy to try. Nothing is written until you Approve.",
    quote: null,
    kind: "approve" as const,
    flip: false,
  },
];

const differences = [
  {
    title: "Measure what the sheet already knows",
    body: "Spend, clicks, and results sync onto the desk. No second spreadsheet story.",
    span: "short" as const,
  },
  {
    title: "You’re in control of every write",
    body: "Approve is the gate. Reject leaves campaigns alone. Audit keeps the trail.",
    span: "tall" as const,
  },
  {
    title: "Walk the Ads Manager path",
    body: "Create → ad set → ad → Analyse, with Instant Form, placements, and devices.",
    span: "short" as const,
  },
  {
    title: "Strategies rotate when you ask",
    body: "Prospect, retarget, Instant Form, messages, and more — from Chat, then Approve.",
    span: "short" as const,
  },
  {
    title: "Roles keep the desk honest",
    body: "Sync gates and Approve stay on every real change, not only in the docs.",
    span: "short" as const,
  },
];

const featureCards = [
  {
    title: "Simulation week",
    body: "Shoppers, feelings, and a marketer note — without spending.",
    kind: "simulation" as const,
  },
  {
    title: "Sheet sync",
    body: "Paste the link. Sync. Rows and creative hints land on the desk.",
    kind: "sheet" as const,
  },
  {
    title: "Chat + Approve",
    body: "Ask for a move. Read the preview. Save only what you want.",
    kind: "approve" as const,
  },
];

const proofs = [
  {
    quote: "Simulate first. Spend later.",
    detail: "A week that does not spend, so you can see how people might react.",
  },
  {
    quote: "The sheet is the truth.",
    detail: "Sync brings real numbers onto the desk. No second spreadsheet story.",
  },
  {
    quote: "Approve is the gate.",
    detail: "Every real change waits for you. Reject leaves campaigns alone.",
  },
  {
    quote: "Strategies rotate.",
    detail: "Ask Chat for a new test. Prospect, retarget, Instant Form, messages, and more.",
  },
  {
    quote: "Audit keeps the trail.",
    detail: "Approve and Reject stay in the log so you know what changed.",
  },
  {
    quote: "Walk the Ads Manager path.",
    detail: "Create → ad set → ad → Analyse, with Instant Form, placements, and devices.",
  },
];

const updates = [
  { title: "Simulation", text: "Full Ads Manager path with Instant Form and placements." },
  { title: "Chat", text: "Create a campaign from a sentence, with a rotating strategy." },
  { title: "Sheet", text: "Creative columns feed the brief when they exist." },
  { title: "Safety", text: "Roles, sync gates, and Approve on every real write." },
];

export default function WelcomePage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <BrandMark />
          <nav className="landing-nav-center" aria-label="Page">
            <a href="#product">Product</a>
            <a href="#difference">Features</a>
            <a href="#faq">FAQ</a>
          </nav>
          <nav className="landing-nav-links" aria-label="Account">
            <Link href="/login" className="landing-link">
              Sign in
            </Link>
            <Link href="/login?mode=sign-up" className="landing-btn">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 1. Hero — Cursor: brand + headline + support + CTA above full product window */}
        <section className="landing-hero landing-hero-enter">
          <div className="landing-hero-copy">
            <p className="landing-hero-brand">Campaign desk</p>
            <h1>
              See how the ad might land
              <br />
              before it spends.
            </h1>
            <p className="landing-hero-support">
              Your sheet brings the real spend and results. Approve is what saves a real change.
            </p>
            <div className="landing-hero-cta">
              <Link href="/login?mode=sign-up" className="landing-btn landing-btn-lg">
                Create account
              </Link>
            </div>
          </div>
          <HeroLoop />
        </section>

        {/* 2. Trust / social proof strip */}
        <section className="landing-trust" aria-label="How the desk works">
          <p className="landing-trust-lead">
            Campaign desk is for marketers who simulate first, sync the sheet, and Approve every real write.
          </p>
          <div className="landing-trust-stats">
            <div>
              <p className="landing-trust-num">0 $</p>
              <p>Spent in Simulation</p>
            </div>
            <div>
              <p className="landing-trust-num">1</p>
              <p>Sheet as source of truth</p>
            </div>
            <div>
              <p className="landing-trust-num">1</p>
              <p>Approve gate on every write</p>
            </div>
          </div>
        </section>

        {/* 3. Zigzag product features — large UI, not thin cards */}
        <section id="product" className="landing-zigzag">
          {zigzags.map((item) => (
            <article
              key={item.title}
              className={`landing-zig${item.flip ? " is-flip" : ""}`}
            >
              <div className="landing-zig-copy">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                {item.quote ? (
                  <blockquote className="landing-zig-quote">
                    <p>“{item.quote}”</p>
                  </blockquote>
                ) : null}
              </div>
              <div className="landing-zig-visual">
                <FeatureVisual kind={item.kind} />
              </div>
            </article>
          ))}
        </section>

        {/* 4. “The Cursor difference” → bento */}
        <section className="landing-difference" id="difference">
          <div className="landing-difference-head">
            <h2>The desk difference</h2>
            <p>Simulate, sync, and Approve — so money only moves when you say so.</p>
          </div>
          <div className="landing-difference-grid">
            {differences.map((item) => (
              <article
                key={item.title}
                className={`landing-difference-card${item.span === "tall" ? " is-tall" : ""}`}
              >
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 5. Feature cards row — Build software faster */}
        <section className="landing-features" id="features">
          <div className="landing-features-head">
            <div>
              <h2>Run the desk faster</h2>
              <p>Simulation, sheet sync, and Chat — familiar, and gated by Approve.</p>
            </div>
            <a href="#faq" className="landing-btn">
              See questions
            </a>
          </div>
          <div className="landing-features-grid">
            {featureCards.map((item) => (
              <article key={item.title} className="landing-feature-card">
                <div className="landing-feature-visual">
                  <FeatureVisual kind={item.kind} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Proof wall — Loved by… */}
        <section className="landing-proof">
          <div className="landing-proof-head">
            <h2>Built for marketer work</h2>
            <p>Honest lines about how the desk is meant to be used.</p>
          </div>
          <ul className="landing-proof-grid">
            {proofs.map((item) => (
              <li key={item.quote}>
                <p className="landing-proof-quote">“{item.quote}”</p>
                <p className="landing-proof-detail">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 7. Updates row */}
        <section className="landing-updates">
          <div className="landing-updates-head">
            <h2>What shipped</h2>
            <a href="#faq">See FAQ</a>
          </div>
          <div className="landing-updates-grid">
            {updates.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 8. Cinema / team band */}
        <section className="landing-cinema" aria-label="Product still">
          <div className="landing-cinema-copy">
            <h2>
              Campaign desk is for people who want to see the ad
              <br />
              before money moves.
            </h2>
            <Link href="/login?mode=sign-up" className="landing-btn">
              Create account
            </Link>
          </div>
          <div className="landing-cinema-frame">
            <p className="landing-cinema-line">Simulate. Sync. Approve.</p>
          </div>
        </section>

        {/* 9. FAQ */}
        <section className="landing-faq" id="faq">
          <h2>Questions</h2>
          <FaqList />
        </section>

        {/* 10. Final CTA */}
        <section className="landing-close">
          <h2>Try Campaign desk now.</h2>
          <Link href="/login?mode=sign-up" className="landing-btn landing-btn-lg">
            Create account
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div>
            <BrandMark />
            <p className="landing-footer-note">See the ad before it spends.</p>
          </div>
          <div>
            <p className="landing-footer-label">Product</p>
            <a href="#product">Simulation</a>
            <a href="#product">Sheet</a>
            <a href="#product">Approve</a>
          </div>
          <div>
            <p className="landing-footer-label">Account</p>
            <Link href="/login">Sign in</Link>
            <Link href="/login?mode=sign-up">Create account</Link>
          </div>
          <div>
            <p className="landing-footer-label">Help</p>
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

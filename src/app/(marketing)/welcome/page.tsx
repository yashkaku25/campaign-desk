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

const zigzags = [
  {
    title: "See the run before money moves.",
    body: "Write the headline and the copy. Add a picture or a video. Choose who it is for. You get a band for the next days. It can be wrong. It does not spend.",
    kind: "simulation" as const,
    flip: false,
  },
  {
    title: "Your sheet stays the source of truth.",
    body: "Real spend, clicks, and results live in your Google Sheet. Sync puts those rows on the desk so the band can use them when they exist.",
    kind: "sheet" as const,
    flip: true,
  },
  {
    title: "You still choose what is saved.",
    body: "Chat can suggest a change, or draft a whole campaign with a strategy to try. Nothing is written until you Approve.",
    kind: "approve" as const,
    flip: false,
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
    quote: "Practice the Meta path.",
    detail: "Create → ad set → ad → Analyse, with Instant Form, placements, and devices.",
  },
];

const workflows = [
  {
    title: "Simulation week",
    body: "Shoppers, feelings, and a marketer note — without spending.",
  },
  {
    title: "Sheet sync",
    body: "Paste the link. Sync. Rows and creative hints land on the desk.",
  },
  {
    title: "Chat + Approve",
    body: "Ask for a move. Read the preview. Save only what you want.",
  },
];

const updates = [
  { tag: "Simulation", text: "Full Ads Manager path with Instant Form and placements." },
  { tag: "Chat", text: "Create a campaign from a sentence, with a rotating strategy." },
  { tag: "Sheet", text: "Creative columns feed the brief when they exist." },
  { tag: "Safety", text: "Roles, sync gates, and Approve on every real write." },
];

export default function WelcomePage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <BrandMark />
          <nav className="landing-nav-center" aria-label="Page">
            <a href="#product">Product</a>
            <a href="#features">Features</a>
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
        {/* 1. Hero — Cursor: big line + CTA + looping product window */}
        <section className="landing-hero landing-hero-enter">
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
          <HeroLoop />
        </section>

        {/* 2. Trust strip — Cursor: logo cloud → our job strip */}
        <section className="landing-trust" aria-label="What the desk does">
          <p>Simulation</p>
          <p>Sheet sync</p>
          <p>Chat</p>
          <p>Approve</p>
          <p>Audit</p>
        </section>

        {/* 3. Zigzag features */}
        <section id="product" className="landing-zigzag">
          {zigzags.map((item) => (
            <article
              key={item.title}
              className={`landing-zig${item.flip ? " is-flip" : ""}`}
            >
              <div className="landing-zig-copy">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
              <FeatureVisual kind={item.kind} />
            </article>
          ))}
        </section>

        {/* 4. Proof grid — Cursor testimonials shape, honest product lines */}
        <section className="landing-proof" id="features">
          <h2>The new way to run the desk.</h2>
          <ul className="landing-proof-grid">
            {proofs.map((item) => (
              <li key={item.quote}>
                <p className="landing-proof-quote">“{item.quote}”</p>
                <p className="landing-proof-detail">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Three workflows */}
        <section className="landing-workflows">
          <h2>Built for fast marketer work.</h2>
          <div className="landing-workflow-grid">
            {workflows.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Updates row */}
        <section className="landing-updates">
          <div className="landing-updates-head">
            <h2>What shipped</h2>
            <a href="#faq">See FAQ</a>
          </div>
          <div className="landing-updates-grid">
            {updates.map((item) => (
              <article key={item.tag}>
                <p className="landing-update-tag">{item.tag}</p>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 7. Wide atmosphere band — Cursor video block */}
        <section className="landing-cinema" aria-label="Product still">
          <div className="landing-cinema-inner">
            <p className="landing-cinema-kicker">Campaign desk</p>
            <p className="landing-cinema-line">Simulate. Sync. Approve.</p>
          </div>
        </section>

        {/* 8. FAQ */}
        <section className="landing-faq" id="faq">
          <h2>Questions</h2>
          <FaqList />
        </section>

        {/* 9. Final CTA */}
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

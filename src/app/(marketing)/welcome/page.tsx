import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand/mark";
import { FaqList } from "@/features/marketing/components/faq-list";
import { FeatureVisual } from "@/features/marketing/components/feature-visual";
import { HeroLoop } from "@/features/marketing/components/hero-loop";
import "@/features/marketing/landing.css";

export const metadata: Metadata = {
  title: "Campaign desk — See the ad before it spends",
  description: "Simulate your next campaign, bring in real results from your Google Sheet, and approve every change. A clearer desk for marketer work.",
};

const features = [
  { id: "simulation", title: "See the run before money moves.", body: "Write the headline and copy. Add your creative. Choose who it is for. See a range for the next few days, with a marketer’s note on what to try.", note: "Simulation can be wrong. It does not spend.", link: "Explore Simulation", kind: "simulation" as const },
  { id: "sheet", title: "Your sheet stays the source of truth.", body: "Real spend, clicks, and results live in your Google Sheet. Sync brings those rows onto the desk, so your next simulation can learn from what has already happened.", note: "One set of numbers. A clearer view of the next move.", link: "Bring your sheet", kind: "sheet" as const },
  { id: "approve", title: "You still choose what is saved.", body: "Ask Chat for a change or a whole campaign. Read the strategy, check the preview, then Approve. Reject leaves your campaigns alone.", note: "Nothing is saved until you Approve.", link: "Meet Chat + Approve", kind: "approve" as const },
];
const principles = [
  ["Simulate first. Spend later.", "Explore how people might respond before committing money to the idea."],
  ["The sheet is the truth.", "Real spend, clicks, and results stay connected to your Google Sheet."],
  ["Approve is the gate.", "Every real change waits for your decision. You choose what is saved."],
  ["A new strategy when you need it.", "Ask Chat to explore prospecting, retargeting, Instant Form, messages, and more."],
  ["Audit keeps the trail.", "See what was approved or rejected, so the next person can follow the decision."],
  ["A familiar campaign flow.", "Work through campaign, ad set, ad, and Analyse, with placements and devices."],
];

export default function WelcomePage() {
  return (
    <div className="landing" id="top">
      <a className="landing-skip" href="#main">Skip to content</a>
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <a className="landing-brand" href="#top" aria-label="Campaign desk home"><BrandMark /></a>
          <nav className="landing-nav-center" aria-label="Page"><a href="#product">Product</a><a href="#difference">Features</a><a href="#faq">Questions</a></nav>
          <nav className="landing-nav-links" aria-label="Account"><Link href="/login" className="landing-link">Sign in</Link><Link href="/login?mode=sign-up" className="landing-btn">Create account <span aria-hidden="true">↗</span></Link></nav>
        </div>
      </header>
      <main id="main">
        <section className="landing-hero landing-container">
          <div className="landing-hero-copy">
            <h1>See how the ad might land<br className="desktop-break" /> before it spends.</h1>
            <p>Your sheet brings the real results.<br />You decide what happens next.</p>
            <div className="landing-hero-cta"><Link href="/login?mode=sign-up" className="landing-btn landing-btn-lg">Create account <span aria-hidden="true">↗</span></Link><a href="#product" className="landing-text-link">See how it works <span aria-hidden="true">↓</span></a></div>
          </div>
          <HeroLoop />
        </section>
        <section className="landing-workflow landing-container" aria-label="How the desk works">
          <p>One desk. From the first idea to the change you approve.</p>
          <div className="landing-workflow-grid"><a href="#simulation"><span>01</span> Simulate the idea <span aria-hidden="true">↗</span></a><a href="#sheet"><span>02</span> Sync the real results <span aria-hidden="true">↗</span></a><a href="#approve"><span>03</span> Approve the next move <span aria-hidden="true">↗</span></a></div>
        </section>
        <section id="product" className="landing-product landing-container" aria-label="Explore Campaign desk">
          {features.map((feature, i) => <article id={feature.id} className={`landing-feature${i === 1 ? " is-flip" : ""}`} key={feature.id}>
            <div className="landing-feature-copy"><h2>{feature.title}</h2><p>{feature.body}</p><Link className="landing-text-link" href="/login?mode=sign-up">{feature.link} <span aria-hidden="true">↗</span></Link><small>{feature.note}</small></div>
            <div className={`landing-feature-stage stage-${feature.kind}`}><FeatureVisual kind={feature.kind} /></div>
          </article>)}
        </section>
        <section id="difference" className="landing-principles landing-container">
          <h2>Built for the way marketers work.</h2>
          <div className="landing-principles-grid">{principles.map(([title, body], i) => <article key={title}><h3>{title}</h3><p>{body}</p><span className="landing-principle-index" aria-hidden="true">0{i + 1}</span></article>)}</div>
        </section>
        <section className="landing-capabilities landing-container">
          <h2>A little more room to think.</h2>
          <div className="landing-capability-grid">
            <article><h3>Explore the audience.</h3><p>Cold people, custom audiences, or a lookalike. Choose the people and placements that fit the idea.</p><a className="landing-text-link" href="#simulation">Start with Simulation ↗</a><div className="cap-visual cap-audience" aria-hidden="true"><span>Who is this for?</span><div>Cold people <b>✓</b></div><div>Custom audience <i /></div><div>Lookalike <i /></div><small>Feed · Stories · Reels</small></div></article>
            <article><h3>Bring context to the brief.</h3><p>Creative hints from your sheet sit alongside performance, giving the next test a useful starting point.</p><a className="landing-text-link" href="#sheet">Connect the numbers ↗</a><div className="cap-visual cap-sheet" aria-hidden="true"><span>From your Google Sheet</span><div><span>Headline</span><strong>Quiet hair dryer</strong></div><div><span>Copy</span><strong>Without the roar.</strong></div><div><span>Results</span><strong>18</strong></div><small>Creative hints ready <b>✓</b></small></div></article>
            <article><h3>Keep the decision yours.</h3><p>Roles, sync gates, and an approval step keep every saved change deliberate. Audit keeps the record.</p><a className="landing-text-link" href="#approve">See the approval step ↗</a><div className="cap-visual cap-approval" aria-hidden="true"><span>Campaign change</span><strong>Ready for your review</strong><div><span>Preview</span><span>Read the change</span></div><div><span>Your decision</span><b>Approve / Reject</b></div><small>Nothing saved yet</small></div></article>
          </div>
        </section>
        <section className="landing-updates landing-container"><h2>Inside the desk.</h2><div className="landing-updates-grid">{[["Simulation", "The full campaign path, from audience to analysis."], ["Chat", "A campaign draft from a sentence, with a strategy to try."], ["Sheet sync", "Your real results and creative hints, together."], ["Audit", "A record of the decisions behind each change."]].map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>
        <section className="landing-faq landing-container" id="faq"><div><h2>A few things<br />worth knowing.</h2><p>Before your first simulation.</p></div><FaqList /></section>
        <section className="landing-close landing-container"><h2>Try Campaign desk.</h2><p>Simulate. Sync. Approve.</p><Link href="/login?mode=sign-up" className="landing-btn landing-btn-lg">Create account <span aria-hidden="true">↗</span></Link></section>
      </main>
      <footer className="landing-footer"><div className="landing-container"><div className="landing-footer-grid"><div><BrandMark /><p>See the ad before it spends.</p></div><nav aria-label="Product links"><h3>Product</h3><a href="#simulation">Simulation</a><a href="#sheet">Sheet sync</a><a href="#approve">Chat + Approve</a></nav><nav aria-label="Account links"><h3>Account</h3><Link href="/login">Sign in</Link><Link href="/login?mode=sign-up">Create account</Link></nav><nav aria-label="Help links"><h3>Help</h3><a href="#faq">Questions</a><a href="#top">Back to top ↑</a></nav></div><div className="landing-footer-bottom"><span>© {new Date().getFullYear()} Campaign desk</span><span>Built for a more considered next move.</span></div></div></footer>
    </div>
  );
}

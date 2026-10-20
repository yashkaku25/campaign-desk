import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand/mark";
import { ProductFilm } from "@/features/marketing/components/product-film";

export const metadata: Metadata = {
  title: "Campaign desk",
  description: "See how the ad might land before it spends. Sync your sheet. Approve every real change.",
};

const features = [
  {
    title: "See the run before money moves.",
    body: "You write the headline and the copy, and add a picture or a video. You choose cold people, a custom audience, or a lookalike. Interests are a hint. You can leave out people who already bought. Shoppers play how a person might act. A marketer reads the numbers and suggests a change. The result is a band for the next days. It can be wrong. It does not spend money.",
  },
  {
    title: "Your sheet stays the source of truth.",
    body: "Real spend, clicks, and results live in your Google Sheet. Sync brings those numbers onto the desk so the band can use them when they exist.",
  },
  {
    title: "You still choose what is saved.",
    body: "Chat can suggest a change on the real desk, or draft a new campaign with a strategy to try. Nothing is saved until you Approve.",
  },
] as const;

export default function WelcomePage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <BrandMark />
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
        <section className="landing-hero landing-hero-enter">
          <h1>
            <span>Campaign desk</span>
            <span>See how the ad might land</span>
            <span>before it spends.</span>
          </h1>
          <p className="landing-hero-support">
            Your sheet brings the real spend and results. Approve is what saves a real change.
          </p>
          <div className="landing-hero-cta">
            <Link href="/login?mode=sign-up" className="landing-btn">
              Create account
            </Link>
            <Link href="/login" className="landing-btn-ghost">
              Sign in
            </Link>
          </div>
        </section>

        <ProductFilm />

        <section className="landing-features" aria-label="What you get">
          {features.map((feature) => (
            <article key={feature.title} className="landing-feature landing-feature-enter">
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="landing-close landing-feature-enter">
          <h2>Start with a sheet. Keep Approve in your hands.</h2>
          <div className="landing-hero-cta">
            <Link href="/login?mode=sign-up" className="landing-btn">
              Create account
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Campaign desk</p>
      </footer>
    </div>
  );
}

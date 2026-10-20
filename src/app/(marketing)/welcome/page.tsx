import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { ProductFilm } from "@/features/marketing/components/product-film";

export const metadata: Metadata = {
  title: "Campaign desk",
  description: "See how the ad might land before it spends. Sync your sheet. Approve every real change.",
};

const features = [
  {
    title: "Overview",
    body: "This is the front of the desk. You see the campaigns that matter today without opening every row.",
  },
  {
    title: "Campaigns",
    body: "Each row is one campaign. Open it for spend, results, and whether it is on or held.",
  },
  {
    title: "Sheet sync",
    body: "Real spend, clicks, and results live in your Google Sheet. Sync brings those numbers onto the desk so the band can use them when they exist.",
  },
  {
    title: "Simulation",
    body: "You write the headline and the copy, and add a picture or a video. You choose cold people, a custom audience, or a lookalike. Interests are a hint. You can leave out people who already bought. Shoppers play how a person might act. A marketer reads the numbers and suggests a change. The result is a band for the next days. It can be wrong. It does not spend money.",
  },
  {
    title: "Chat / Approve",
    body: "Chat can suggest a change on the real desk, or draft a whole new campaign with a strategy to test. You still choose. Nothing is saved until you Approve.",
  },
] as const;

export default function WelcomePage() {
  return (
    <div className="site-wash desk-canvas min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <BrandMark />
          <nav className="flex items-center gap-2" aria-label="Account">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/login?mode=sign-up">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-20">
        <div className="landing-hero-enter max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl md:leading-[1.08]">
            <span className="block">Campaign desk</span>
            <span className="block">See how the ad might land</span>
            <span className="block">before it spends.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Your sheet brings real spend and results. Approve is what saves a real change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login?mode=sign-up">Create account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <ProductFilm />

        <ol className="mt-20 space-y-14">
          {features.map((feature, index) => (
            <li key={feature.title} className="landing-feature-enter max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{feature.title}</h2>
              <p className="mt-3 text-base leading-8 text-muted md:text-lg">{feature.body}</p>
            </li>
          ))}
        </ol>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">Campaign desk</p>
      </footer>
    </div>
  );
}

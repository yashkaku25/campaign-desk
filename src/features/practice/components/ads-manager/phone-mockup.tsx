"use client";

import type { MetaAdCreative } from "@/features/practice/meta/draft-types";
import { cn } from "@/lib/utils";

export function PhoneMockup({
  creative,
  pageName,
  placement = "feed",
  pulse,
}: {
  creative: MetaAdCreative | null;
  pageName: string;
  placement?: "feed" | "reels" | "stories" | "advantage";
  pulse?: boolean;
}) {
  const media = creative?.mediaDataUrl;
  const isVideo = creative?.mediaKind === "video" || creative?.hasVideo;
  const place = placement === "advantage" ? "feed" : placement;

  return (
    <div className="mx-auto w-[220px] shrink-0">
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border-[3px] border-ink bg-ink shadow-xl transition",
          pulse && "ring-2 ring-pine ring-offset-2 ring-offset-paper",
        )}
      >
        <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black/80" />
        <div className="bg-paper pt-7">
          <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-semibold text-muted">
            <span>{place === "reels" ? "🎬 Reels" : place === "stories" ? "◐ Stories" : "⌂ Feed"}</span>
            <span>9:41</span>
          </div>

          <article className="border-t border-line bg-card px-2.5 pb-3 pt-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-paper">
                {(pageName || "A").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-ink">{pageName || "Your Page"}</p>
                <p className="text-[9px] text-muted">Sponsored · {creative?.label ? `Creative ${creative.label}` : "Ad"}</p>
              </div>
            </div>

            <p className="mb-2 text-[11px] leading-4 text-ink">
              {creative?.primaryText || "Your primary text shows here."}
            </p>

            <div
              className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-xl border border-line bg-paper",
                place === "reels" || place === "stories" ? "aspect-[9/14]" : "aspect-square",
              )}
            >
              {media && isVideo ? (
                <video src={media} className="h-full w-full object-cover" muted playsInline autoPlay loop />
              ) : media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 px-3 text-center text-[11px] text-muted">
                  <span className="text-2xl">{isVideo ? "🎥" : "🖼️"}</span>
                  <span>{isVideo ? "Upload a video creative" : "Upload an image creative"}</span>
                </div>
              )}
              {(place === "reels" || place === "stories") && (
                <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-ink/70 px-2 py-1.5 text-[10px] text-paper">
                  {creative?.headline || "Headline"}
                </div>
              )}
            </div>

            {place === "feed" ? (
              <div className="mt-2">
                <p className="text-[11px] font-semibold text-ink">{creative?.headline || "Headline"}</p>
                <p className="text-[10px] text-muted">{creative?.description || "Description"}</p>
                <button
                  type="button"
                  className="mt-2 w-full rounded-full bg-pine py-1.5 text-[11px] font-semibold text-paper"
                >
                  {creative?.cta || "Learn more"}
                </button>
              </div>
            ) : null}

            <div className="mt-2 flex justify-between px-1 text-[12px] text-muted">
              <span>❤️ 💬 ↗</span>
              <span>🔖</span>
            </div>
          </article>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted">What people see on their phone</p>
    </div>
  );
}

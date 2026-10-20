"use client";

import { useCallback, useMemo, useState } from "react";

import { LiveFeed } from "@/features/practice/components/live-feed";
import { PhoneMockup } from "@/features/practice/components/ads-manager/phone-mockup";
import type { DeskSeed, MetaAd, MetaAdSet, MetaCampaign } from "@/features/practice/meta/draft-types";
import { DELIVERY_LABEL, OBJECTIVE_COPY } from "@/features/practice/meta/labels";
import { resultNoun, summarizeTargeting } from "@/features/practice/meta/detailed-targeting";
import { readDestination } from "@/features/practice/services/research-journey";
import { DEFAULT_OFFER, type SimulationSetup } from "@/features/practice/services/setup";
import { buildMoments, countActs } from "@/features/practice/services/moments";
import { runPractice } from "@/features/practice/services/run-practice";
import { buildMetricStrip } from "@/features/practice/services/sim-metrics";
import { suggestMove } from "@/features/practice/services/suggest-move";
import { formatCount, formatDollars } from "@/lib/money";

function locationLabel(adSet: MetaAdSet): string {
  if (adSet.conversionLocation === "other") {
    return adSet.conversionLocationOther.trim() || "Other destination";
  }
  const map: Record<MetaAdSet["conversionLocation"], string> = {
    website: "Website",
    messenger: "Messenger",
    instagram: "Instagram inbox",
    whatsapp: "WhatsApp",
    instant_form: "Instant form",
    app: "App",
    calls: "Calls",
    other: "Other",
  };
  return map[adSet.conversionLocation];
}

function isMessagePath(adSet: MetaAdSet, campaign: MetaCampaign): boolean {
  return (
    adSet.conversionLocation === "messenger" ||
    adSet.conversionLocation === "instagram" ||
    adSet.conversionLocation === "whatsapp" ||
    adSet.optimizeFor === "messages" ||
    adSet.optimizeFor === "conversations" ||
    campaign.objective === "engagement"
  );
}

export function DeliveryDrawer({
  campaign,
  adSet,
  ad,
  seed,
  onClose,
  onMarketerAction,
}: {
  campaign: MetaCampaign;
  adSet: MetaAdSet;
  ad: MetaAd;
  seed: DeskSeed | null;
  onClose: () => void;
  onMarketerAction: (action: "shorten_window" | "turn_off") => void;
}) {
  const creative = ad.creatives[0];
  const destinationUrl = creative?.destinationUrl || "https://example.com";
  const urlRead = readDestination(destinationUrl);
  const messagePath = isMessagePath(adSet, campaign);
  const where = locationLabel(adSet);

  const [playing, setPlaying] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [windowDays, setWindowDays] = useState(adSet.windowDays);
  const [turnedOff, setTurnedOff] = useState(!ad.on);
  const [previewCreative, setPreviewCreative] = useState(0);

  const setup: SimulationSetup = useMemo(
    () => ({
      creative: {
        headline: creative?.headline ?? campaign.name,
        primaryText: creative?.primaryText ?? "",
        hasImage: creative?.hasImage ?? true,
        hasVideo: creative?.hasVideo ?? false,
        videoHasWords: creative?.videoHasWords ?? false,
        product: creative?.description || campaign.name,
        destinationUrl,
      },
      offer: {
        ...DEFAULT_OFFER,
        device: adSet.devices.length === 1 && adSet.devices[0] === "desktop" ? "desktop" : "phone",
        timeOfDay:
          adSet.dayParting === "evenings"
            ? "evening"
            : adSet.dayParting === "business"
              ? "morning"
              : DEFAULT_OFFER.timeOfDay,
      },
      audience: {
        mode: adSet.audienceMode === "manual" ? "original" : "advantage",
        audienceKind: adSet.audienceKind,
        windowDays: turnedOff ? 0 : windowDays,
        interest: adSet.interestOther.trim() || adSet.interest,
        placement: adSet.placement,
        optimizeFor: adSet.optimizeFor,
      },
      numbers: seed
        ? {
            impressions: seed.impressions,
            clicks: seed.clicks,
            spendCents: seed.spendCents,
            conversions: seed.conversions,
            dailyBudgetCents: adSet.dailyBudgetCents,
          }
        : {
            impressions: Math.max(1200, adSet.dailyBudgetCents * 2),
            clicks: Math.max(18, Math.round(adSet.dailyBudgetCents / 80)),
            spendCents: Math.round(adSet.dailyBudgetCents * 4),
            conversions: campaign.objective === "sales" ? 2 : campaign.objective === "leads" ? 1 : 0,
            dailyBudgetCents: adSet.dailyBudgetCents,
          },
      objective: campaign.objective,
      targeting: adSet.targeting,
      conversionLocation: adSet.conversionLocation,
      conversionLocationOther: adSet.conversionLocationOther,
    }),
    [ad, adSet, campaign, creative, destinationUrl, seed, turnedOff, windowDays],
  );

  const run = useMemo(() => runPractice(setup), [setup]);
  const moments = useMemo(
    () => buildMoments(run, setup.creative.product, destinationUrl),
    [run, setup.creative.product, destinationUrl],
  );
  const counts = useMemo(
    () => countActs(moments, playing ? elapsedMs : undefined),
    [moments, playing, elapsedMs],
  );
  const strip = useMemo(
    () => buildMetricStrip(setup, turnedOff ? null : run.prediction, counts),
    [setup, run.prediction, counts, turnedOff],
  );
  const move = useMemo(
    () =>
      suggestMove(
        run.days,
        setup.numbers,
        run.prediction,
        adSet.audienceKind,
        windowDays,
        counts,
        setup,
      ),
    [run, setup, adSet.audienceKind, windowDays, counts],
  );

  const onTick = useCallback((ms: number) => setElapsedMs(ms), []);
  const objectiveLabel = OBJECTIVE_COPY[campaign.objective]?.name ?? campaign.objective;
  const thinBudget = adSet.dailyBudgetCents > 0 && adSet.dailyBudgetCents < 5000;
  const activeCreative = ad.creatives[previewCreative] ?? creative;

  const feedback = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Results for this run resolve in ${where}.`);
    if (messagePath) {
      lines.push(
        `Message path: watch 💬 opened chats (${counts.messages}) → started conversations (${counts.leads}). Reply speed matters more than page load.`,
      );
    }
    if (campaign.objective === "leads" && !messagePath) {
      lines.push(
        `Lead path: Stopped → Landing → Form open (${counts.formOpen}) → Leads (${counts.leads}).`,
      );
    }
    if (urlRead.looksLikeTest && !messagePath) {
      lines.push(
        `People open ${urlRead.host} and read a test/placeholder URL — many leave before the form.`,
      );
    }
    if (thinBudget) {
      lines.push(
        `~$${(adSet.dailyBudgetCents / 100).toFixed(0)}/day is a thin test. Expect skimming, not deep trust.`,
      );
    }
    if (adSet.audienceNote.trim()) {
      lines.push(`Your audience note is in play: “${adSet.audienceNote.trim()}”.`);
    }
    if (counts.clicked > 0 && counts.landing === 0 && !messagePath) {
      lines.push("Clicks are not becoming landing views in the live window yet — keep watching.");
    }
    if (
      counts.landing > 0 &&
      counts.leads === 0 &&
      counts.purchases === 0 &&
      campaign.objective === "leads" &&
      !messagePath
    ) {
      lines.push(
        `${counts.landing} people researched the site; ${counts.formOpen} opened the form; ${counts.leads} submitted. Fix page match and trust.`,
      );
    }
    if (counts.bounced >= 3) {
      lines.push(`${counts.bounced} people researched then left. That is an ad→destination problem.`);
    }
    if (counts.hid >= 2) {
      lines.push(`${counts.hid} hid the ad. Change creative ${ad.creatives.length > 1 ? "A/B" : ""}.`);
    }
    if (counts.reported >= 1) {
      lines.push(`${counts.reported} reported the ad. Creative or audience fit is wrong — pause and rewrite.`);
    }
    if (lines.length <= 1 && counts.stopped > 0) {
      lines.push("People are stopping. Watch whether they open the path and finish.");
    }
    return lines;
  }, [
    ad.creatives.length,
    adSet.audienceNote,
    adSet.dailyBudgetCents,
    campaign.objective,
    counts,
    messagePath,
    thinBudget,
    urlRead,
    where,
  ]);

  const resultValue = messagePath
    ? String(counts.leads)
    : campaign.objective === "leads"
      ? String(counts.leads)
      : campaign.objective === "sales"
        ? String(counts.purchases)
        : strip.results != null
          ? formatCount(strip.results)
          : "—";

  return (
    <div className="fixed inset-y-0 right-0 z-[55] flex w-full max-w-[560px] flex-col border-l border-[var(--meta-line)] bg-[var(--meta-card)] shadow-2xl">
      <header className="border-b border-[var(--meta-line)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--meta-muted)]">
              Analyse · {objectiveLabel}
            </p>
            <h2 className="text-[16px] font-semibold text-[var(--meta-ink)]">{campaign.name}</h2>
            <p className="mt-1 text-[12px] text-[var(--meta-muted)]">
              {DELIVERY_LABEL[turnedOff ? "off" : campaign.delivery]} · Results ={" "}
              {messagePath ? "Messaging conversations" : resultNoun(campaign.objective)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--meta-blue)]">
              Destination: {where}
              {adSet.devices.length > 0 ? ` · ${adSet.devices.join(", ")}` : ""}
              {adSet.dayParting !== "all_day" ? ` · ${adSet.dayParting}` : ""}
            </p>
            <p className="mt-1 text-[11px] text-[var(--meta-muted)]">{summarizeTargeting(adSet.targeting)}</p>
            {!messagePath ? (
              <p className="mt-1 font-mono text-[11px] text-[var(--meta-ink)]">
                Click goes to {urlRead.host}
                {urlRead.pathHint !== "/" ? urlRead.pathHint : ""}
                {urlRead.looksLikeTest ? " · looks like a test URL" : ""}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-[var(--meta-ink)]">
                People finish in {where} — not on a website thank-you page.
              </p>
            )}
          </div>
          <button type="button" className="meta-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
            <Metric label="Reach" value={strip.reach != null ? formatCount(strip.reach) : "—"} />
            <Metric label="Frequency" value={strip.frequency != null ? String(strip.frequency) : "—"} />
            <Metric label="Link CTR" value={strip.linkCtr != null ? `${strip.linkCtr}%` : "—"} />
            <Metric
              label={messagePath ? "Conversations" : resultNoun(campaign.objective)}
              value={resultValue}
            />
          </div>
          <PhoneMockup
            creative={activeCreative ?? null}
            pageName={ad.pageName}
            placement={adSet.placement === "advantage" ? "feed" : adSet.placement}
            pulse={playing && !turnedOff}
          />
        </div>

        {ad.creatives.length > 1 ? (
          <div className="flex gap-2">
            {ad.creatives.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  previewCreative === index
                    ? "border-[var(--meta-blue)] bg-[var(--meta-blue-soft)] text-[var(--meta-blue)]"
                    : "border-[var(--meta-line)] text-[var(--meta-muted)]"
                }`}
                onClick={() => setPreviewCreative(index)}
              >
                Phone · Creative {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <section className="rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
          <p className="text-[12px] font-semibold text-[var(--meta-ink)]">
            {messagePath
              ? "Message funnel (live)"
              : campaign.objective === "leads"
                ? "Lead funnel (live)"
                : "Research funnel (live)"}
          </p>
          <dl className="mt-2 grid grid-cols-4 gap-2 text-[12px]">
            {messagePath ? (
              <>
                <Metric label="Stopped" value={String(counts.stopped)} />
                <Metric label="Opened chat" value={String(counts.messages)} />
                <Metric label="Conversations" value={String(counts.leads)} />
                <Metric label="Left / hid" value={String(counts.bounced + counts.hid)} />
              </>
            ) : campaign.objective === "leads" || adSet.conversionLocation === "instant_form" ? (
              <>
                <Metric label="Stopped" value={String(counts.stopped)} />
                <Metric label="Landing" value={String(counts.landing)} />
                <Metric label="Form open" value={String(counts.formOpen)} />
                <Metric label="Leads" value={String(counts.leads)} />
              </>
            ) : campaign.objective === "traffic" || campaign.objective === "awareness" ? (
              <>
                <Metric label="Stopped" value={String(counts.stopped)} />
                <Metric label="Clicked" value={String(counts.clicked)} />
                <Metric label="On site" value={String(counts.landing)} />
                <Metric label="Left" value={String(counts.bounced)} />
              </>
            ) : (
              <>
                <Metric label="On site" value={String(counts.landing)} />
                <Metric label="Cart" value={String(counts.cart)} />
                <Metric label="Checkout" value={String(counts.checkout)} />
                <Metric label="Purchase" value={String(counts.purchases)} />
              </>
            )}
          </dl>
          <p className="mt-2 text-[11px] text-[var(--meta-muted)]">
            Hid {counts.hid} · Reported {counts.reported} · Scrolled past {counts.scrolled} · Bounced{" "}
            {counts.bounced}
          </p>
        </section>

        {feedback.length > 0 ? (
          <section className="rounded-md border border-[var(--meta-blue)]/25 bg-[var(--meta-blue-soft)] p-3">
            <p className="text-[12px] font-semibold text-[var(--meta-blue)]">What you should notice</p>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--meta-ink)]">
              {feedback.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {ad.creatives.length > 1 ? (
          <section className="rounded-md border border-[var(--meta-line)] p-3">
            <p className="text-[12px] font-semibold">Creative A/B in the feed</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ad.creatives.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-[var(--meta-line)] bg-[var(--meta-bg)] p-2"
                >
                  <p className="text-[11px] font-semibold text-[var(--meta-muted)]">
                    Creative {item.label}
                    {item.mediaKind !== "none" ? ` · ${item.mediaKind}` : ""}
                  </p>
                  <p className="mt-1 font-semibold">{item.headline}</p>
                  <p className="mt-1 text-[12px] text-[var(--meta-muted)]">{item.primaryText}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="meta-btn-ghost" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause week" : "Play week"}
          </button>
          <button
            type="button"
            className="meta-btn-ghost"
            onClick={() => {
              setWindowDays(7);
              onMarketerAction("shorten_window");
            }}
          >
            Shorten window
          </button>
          <button
            type="button"
            className="meta-btn-ghost"
            onClick={() => {
              setTurnedOff(true);
              setPlaying(false);
              onMarketerAction("turn_off");
            }}
          >
            Turn off ad
          </button>
        </div>

        <LiveFeed
          moments={moments}
          playing={playing && !turnedOff}
          onTick={onTick}
          dense
          objectiveLabel={objectiveLabel}
        />

        <section className="rounded-md border border-[var(--meta-line)] p-3">
          <p className="text-[12px] font-semibold">Marketer read</p>
          <p className="mt-2 text-[14px] font-semibold">{move.what}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--meta-muted)]">{move.why}</p>
          <p className="mt-2 text-[11px] text-[var(--meta-muted)]">
            Spend band {seed ? formatDollars(seed.spendCents) : formatDollars(adSet.dailyBudgetCents * 4)}.
            Approve in Marketer chat to change the real desk.
          </p>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--meta-muted)]">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-[var(--meta-ink)]">{value}</dd>
    </div>
  );
}

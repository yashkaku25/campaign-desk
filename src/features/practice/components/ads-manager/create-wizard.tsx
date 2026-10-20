"use client";

import { useMemo, useState, type ReactNode } from "react";

import { AudienceBuilder } from "@/features/practice/components/audience-builder";
import { PhoneMockup } from "@/features/practice/components/ads-manager/phone-mockup";
import {
  AUDIENCE_MODES,
  BUDGET_LEVELS,
  BUYING_TYPES,
  CALL_TO_ACTIONS,
  OBJECTIVES,
  SPECIAL_CATEGORIES,
} from "@/features/practice/meta/options";
import { WINDOWS } from "@/features/practice/meta/audiences";
import type {
  ConversionLocation,
  CreateStep,
  DeskSeed,
  MetaAd,
  MetaAdSet,
  MetaCampaign,
  MetaObjective,
} from "@/features/practice/meta/draft-types";
import {
  DEFAULT_TARGETING,
  optimizeForObjective,
  resultNoun,
  summarizeTargeting,
  type DetailedTargeting,
} from "@/features/practice/meta/detailed-targeting";
import {
  DEFAULT_INSTANT_FORM,
  INSTANT_FORM_FIELDS,
  summarizeInstantForm,
  type InstantFormConfig,
  type InstantFormFieldId,
  type InstantFormThankYouCta,
} from "@/features/practice/meta/instant-form";
import { OBJECTIVE_COPY } from "@/features/practice/meta/labels";
import {
  coarsePlacement,
  DEFAULT_SURFACES,
  DEVICE_OPTIONS,
  PLACEMENT_PLATFORMS,
  PLACEMENT_SURFACES,
  summarizeDevices,
  summarizeSurfaces,
  type DeviceId,
  type PlacementSurfaceId,
} from "@/features/practice/meta/placements";
import { newId } from "@/features/practice/meta/seed-from-desk";
import { prefillFromDesk } from "@/features/practice/services/desk-prefill";

export interface CreatePublishPayload {
  campaign: MetaCampaign;
  adSet: MetaAdSet;
  ad: MetaAd;
}

export function CreateWizard({
  seeds,
  onCancel,
  onPublish,
}: {
  seeds: DeskSeed[];
  onCancel: () => void;
  onPublish: (payload: CreatePublishPayload) => void;
}) {
  const [step, setStep] = useState<CreateStep>("objective");
  const [buyingType, setBuyingType] = useState<"auction" | "reserved">("auction");
  const [objective, setObjective] = useState<MetaObjective | null>(null);
  const [setupPath, setSetupPath] = useState<"advantage" | "manual">("advantage");
  const [campaignName, setCampaignName] = useState("");
  const [specialCategory, setSpecialCategory] = useState("none");
  const [budgetLevel, setBudgetLevel] = useState<"campaign" | "ad_set">("ad_set");
  const [campaignBudget, setCampaignBudget] = useState(40);
  const [abTest, setAbTest] = useState(true);
  const [deskLink, setDeskLink] = useState(seeds[0]?.id ?? "");

  const [adSetName, setAdSetName] = useState("");
  const [audienceMode, setAudienceMode] = useState<"advantage" | "manual">("advantage");
  const [targeting, setTargeting] = useState<DetailedTargeting>({ ...DEFAULT_TARGETING });
  const [placementMode, setPlacementMode] = useState<"advantage" | "manual">("advantage");
  const [placementSurfaces, setPlacementSurfaces] = useState<PlacementSurfaceId[]>([...DEFAULT_SURFACES]);
  const [windowDays, setWindowDays] = useState("d7");
  const [attribution, setAttribution] = useState<MetaAdSet["attribution"]>("7c1v");
  const [adSetBudget, setAdSetBudget] = useState(40);
  const [bidStrategy, setBidStrategy] = useState<MetaAdSet["bidStrategy"]>("lowest_cost");
  const [conversionLocation, setConversionLocation] = useState<ConversionLocation>("website");
  const [conversionLocationOther, setConversionLocationOther] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("https://yoursite.com/offer");
  const [callPhoneNumber, setCallPhoneNumber] = useState("+1 555 0100");
  const [appStoreUrl, setAppStoreUrl] = useState("https://apps.apple.com/app/id000");
  const [instantForm, setInstantForm] = useState<InstantFormConfig>({ ...DEFAULT_INSTANT_FORM });
  const [customQuestionDraft, setCustomQuestionDraft] = useState("");
  const [devices, setDevices] = useState<DeviceId[]>([]);
  const [dayParting, setDayParting] = useState<MetaAdSet["dayParting"]>("all_day");
  const [dayPartingNote, setDayPartingNote] = useState("");
  const [audienceNote, setAudienceNote] = useState("");
  const [interestOther, setInterestOther] = useState("");
  const [optimizeOverride, setOptimizeOverride] = useState<MetaAdSet["optimizeFor"] | "auto">("auto");

  const linked = seeds.find((seed) => seed.id === deskLink) ?? null;
  const prefill = useMemo(() => prefillFromDesk(linked), [linked]);

  const [adName, setAdName] = useState("");
  const [pageName, setPageName] = useState("Studio Page");
  const [format, setFormat] = useState<MetaAd["format"]>("single_image");
  const [headlineA, setHeadlineA] = useState(prefill.headline);
  const [primaryA, setPrimaryA] = useState(prefill.primaryText);
  const [headlineB, setHeadlineB] = useState(prefill.headlineB);
  const [primaryB, setPrimaryB] = useState(prefill.primaryTextB);
  const [description, setDescription] = useState(prefill.product);
  const [hasImage, setHasImage] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoHasWords, setVideoHasWords] = useState(false);
  const [cta, setCta] = useState("Shop now");
  const [url, setUrl] = useState(websiteUrl);
  const [mediaA, setMediaA] = useState<string | null>(null);
  const [mediaB, setMediaB] = useState<string | null>(null);
  const [mediaKindA, setMediaKindA] = useState<"none" | "image" | "video">("none");
  const [mediaKindB, setMediaKindB] = useState<"none" | "image" | "video">("none");

  const windowValue = Number((WINDOWS.find((item) => item.id === windowDays)?.name ?? "7").replace(/\D/g, "")) || 7;

  function applyDeskLink(id: string) {
    setDeskLink(id);
    const seed = seeds.find((item) => item.id === id);
    const next = prefillFromDesk(seed);
    setHeadlineA(next.headline);
    setPrimaryA(next.primaryText);
    setHeadlineB(next.headlineB);
    setPrimaryB(next.primaryTextB);
    setDescription(next.product);
    if (seed) {
      setCampaignName(seed.name);
      setAdSetName(`${seed.name} — Ad set`);
      setAdName(`${seed.name} — Ad`);
      setAdSetBudget(Math.max(1, Math.round(seed.dailyBudgetCents / 100)));
      setCampaignBudget(Math.max(1, Math.round(seed.dailyBudgetCents / 100)));
    }
  }

  function continueFromObjective() {
    if (!objective) return;
    const seed = linked ?? seeds[0];
    const name = seed?.name || `${OBJECTIVE_COPY[objective].name} campaign`;
    if (!campaignName) setCampaignName(name);
    if (!adSetName) setAdSetName(`${name} — Ad set`);
    if (!adName) setAdName(`${name} — Ad`);
    if (seed && !deskLink) applyDeskLink(seed.id);
    setStep("setup_path");
  }

  function publish() {
    if (!objective) return;
    const campaignId = newId("mc");
    const adSetId = newId("ms");
    const adId = newId("ma");
    const daily =
      budgetLevel === "campaign"
        ? Math.round(campaignBudget * 100)
        : Math.round(adSetBudget * 100);

    const campaign: MetaCampaign = {
      id: campaignId,
      name: campaignName.trim() || "Untitled campaign",
      on: true,
      delivery: "in_review",
      objective,
      buyingType,
      specialCategory,
      budgetLevel,
      dailyBudgetCents: daily,
      deskCampaignId: deskLink || null,
      results: 0,
      costPerResultCents: null,
      spendCents: 0,
      attribution:
        attribution === "7c1v"
          ? "7-day click, 1-day view"
          : attribution === "7c"
            ? "7-day click"
            : "1-day click",
    };

    const audienceKind =
      targeting.customAudiences.find((id) => id !== "cold") ?? targeting.customAudiences[0] ?? "cold";
    const interest =
      interestOther.trim() ||
      targeting.interestOther?.trim() ||
      targeting.interests.find((id) => id === "online_shopping" || id === "shopping") ||
      targeting.interests[0] ||
      "online_shopping";
    let optimizeFor: MetaAdSet["optimizeFor"] =
      optimizeOverride === "auto" ? optimizeForObjective(objective) : optimizeOverride;
    if (conversionLocation === "messenger" || conversionLocation === "instagram" || conversionLocation === "whatsapp") {
      optimizeFor = "messages";
    }
    if (conversionLocation === "instant_form" || conversionLocation === "calls") {
      optimizeFor = "lead";
    }

    const placement = coarsePlacement(placementMode, placementSurfaces);
    const destinationUrl =
      conversionLocation === "website"
        ? websiteUrl.trim() || url.trim() || "https://yoursite.com/offer"
        : conversionLocation === "app"
          ? appStoreUrl.trim() || url.trim()
          : conversionLocation === "calls"
            ? `tel:${callPhoneNumber.replace(/\s+/g, "")}`
            : conversionLocation === "instant_form"
              ? instantForm.privacyUrl.trim() || "https://yoursite.com/privacy"
              : url.trim() || websiteUrl.trim() || "https://yoursite.com/offer";

    const adSet: MetaAdSet = {
      id: adSetId,
      campaignId,
      name: adSetName.trim() || "Untitled ad set",
      on: true,
      delivery: "learning",
      audienceKind,
      audienceMode,
      interest,
      placement,
      placementMode,
      placementSurfaces: placementMode === "manual" ? placementSurfaces : [],
      optimizeFor,
      windowDays: windowValue,
      attribution,
      dailyBudgetCents: daily,
      bidStrategy,
      scheduleStart: "2026-10-13",
      scheduleEnd: "2026-10-20",
      conversionLocation,
      conversionLocationOther: conversionLocationOther.trim(),
      websiteUrl: websiteUrl.trim(),
      callPhoneNumber: callPhoneNumber.trim(),
      appStoreUrl: appStoreUrl.trim(),
      instantForm: conversionLocation === "instant_form" ? { ...instantForm } : null,
      devices,
      dayParting,
      dayPartingNote: dayPartingNote.trim(),
      interestOther: interestOther.trim() || targeting.interestOther?.trim() || "",
      audienceNote: [
        audienceNote.trim(),
        targeting.excludeNote?.trim(),
        targeting.locationOther?.trim() ? `Location: ${targeting.locationOther.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      results: 0,
      costPerResultCents: null,
      spendCents: 0,
      reach: 0,
      frequency: 0,
      targeting,
    };

    const creatives: MetaAd["creatives"] = [
      {
        id: `${adId}-a`,
        label: "A",
        headline: headlineA.trim() || campaign.name,
        primaryText: primaryA.trim() || campaign.name,
        description: description.trim(),
        hasImage: hasImage || mediaKindA === "image",
        hasVideo: hasVideo || mediaKindA === "video",
        videoHasWords,
        cta:
          conversionLocation === "calls"
            ? "Call now"
            : conversionLocation === "whatsapp"
              ? "WhatsApp message"
              : cta,
        destinationUrl,
        mediaDataUrl: mediaA,
        mediaKind: mediaKindA,
      },
    ];
    if (abTest) {
      creatives.push({
        id: `${adId}-b`,
        label: "B",
        headline: headlineB.trim() || `${campaign.name} — B`,
        primaryText: primaryB.trim() || primaryA.trim(),
        description: description.trim(),
        hasImage: hasImage || mediaKindB === "image",
        hasVideo: hasVideo || mediaKindB === "video",
        videoHasWords,
        cta: creatives[0]!.cta,
        destinationUrl,
        mediaDataUrl: mediaB,
        mediaKind: mediaKindB,
      });
    }

    const ad: MetaAd = {
      id: adId,
      adSetId,
      campaignId,
      name: adName.trim() || "Untitled ad",
      on: true,
      delivery: "learning",
      pageName,
      format,
      creatives,
      results: 0,
      costPerResultCents: null,
      spendCents: 0,
    };

    onPublish({ campaign, adSet, ad });
  }

  const canContinue =
    (step === "objective" && objective !== null) ||
    step === "setup_path" ||
    (step === "campaign" && campaignName.trim().length > 0) ||
    (step === "adset" && adSetName.trim().length > 0) ||
    (step === "ad" && headlineA.trim().length > 0 && primaryA.trim().length > 0) ||
    step === "review";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Create new campaign">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-[var(--meta-card)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--meta-line)] px-5 py-3">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--meta-ink)]">
              {step === "objective" ? "Create new campaign" : stepTitle(step)}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--meta-muted)]">
              Simulation only — Publish runs a week on the desk. It does not spend on Meta.
            </p>
          </div>
          <StepDots step={step} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === "objective" ? (
            <ObjectiveStep
              buyingType={buyingType}
              objective={objective}
              onBuyingType={setBuyingType}
              onObjective={setObjective}
            />
          ) : null}

          {step === "setup_path" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PathCard
                title="Advantage+"
                body="Meta automates more audience, placement, and creative choices. Good default for a first week."
                selected={setupPath === "advantage"}
                onClick={() => setSetupPath("advantage")}
              />
              <PathCard
                title="Manual"
                body="You control audience, placements, and structure. Use this for clean creative or audience tests."
                selected={setupPath === "manual"}
                onClick={() => setSetupPath("manual")}
              />
            </div>
          ) : null}

          {step === "campaign" ? (
            <div className="space-y-3">
              <Field label="Campaign name">
                <input className="meta-input" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </Field>
              <Field label="Link desk campaign (numbers + sheet copy)">
                <select className="meta-input" value={deskLink} onChange={(e) => applyDeskLink(e.target.value)}>
                  <option value="">None — blank simulation</option>
                  {seeds.map((seed) => (
                    <option key={seed.id} value={seed.id}>
                      {seed.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Special ad categories">
                <select className="meta-input" value={specialCategory} onChange={(e) => setSpecialCategory(e.target.value)}>
                  {SPECIAL_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Budget">
                <select
                  className="meta-input"
                  value={budgetLevel}
                  onChange={(e) => setBudgetLevel(e.target.value as "campaign" | "ad_set")}
                >
                  {BUDGET_LEVELS.map((item) => (
                    <option key={item.id} value={item.id === "campaign" ? "campaign" : "ad_set"}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              {budgetLevel === "campaign" ? (
                <Field label="Campaign daily budget ($)">
                  <input
                    type="number"
                    min={1}
                    className="meta-input"
                    value={campaignBudget}
                    onChange={(e) => setCampaignBudget(Number(e.target.value) || 1)}
                  />
                </Field>
              ) : null}
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={abTest} onChange={(e) => setAbTest(e.target.checked)} />
                A/B test creatives in this campaign
              </label>
            </div>
          ) : null}

          {step === "adset" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ad set name" className="sm:col-span-2">
                  <input className="meta-input" value={adSetName} onChange={(e) => setAdSetName(e.target.value)} />
                </Field>
                <Field label="Audience setup">
                  <select
                    className="meta-input"
                    value={audienceMode}
                    onChange={(e) => setAudienceMode(e.target.value as "advantage" | "manual")}
                  >
                    {AUDIENCE_MODES.map((item) => (
                      <option key={item.id} value={item.id === "advantage" ? "advantage" : "manual"}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Conversion location (where the result happens)">
                  <select
                    className="meta-input"
                    value={conversionLocation}
                    onChange={(e) => {
                      const next = e.target.value as ConversionLocation;
                      setConversionLocation(next);
                      if (next === "messenger" || next === "whatsapp" || next === "instagram") {
                        setOptimizeOverride("messages");
                        setCta(next === "whatsapp" ? "WhatsApp message" : "Send message");
                      }
                      if (next === "calls") {
                        setOptimizeOverride("lead");
                        setCta("Call now");
                      }
                      if (next === "instant_form") {
                        setOptimizeOverride("lead");
                        setCta("Sign up");
                      }
                      if (next === "website") {
                        setUrl(websiteUrl);
                        setCta("Shop now");
                      }
                    }}
                  >
                    <option value="website">Website</option>
                    <option value="instant_form">Instant form</option>
                    <option value="messenger">Messenger</option>
                    <option value="instagram">Instagram inbox</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="app">App</option>
                    <option value="calls">Calls</option>
                    <option value="other">Other (type your own)</option>
                  </select>
                </Field>

                {conversionLocation === "website" ? (
                  <Field label="Website URL" className="sm:col-span-2">
                    <input
                      className="meta-input"
                      placeholder="https://yoursite.com/offer"
                      value={websiteUrl}
                      onChange={(e) => {
                        setWebsiteUrl(e.target.value);
                        setUrl(e.target.value);
                      }}
                    />
                    <p className="mt-1 text-[11px] text-[var(--meta-muted)]">
                      People leave Meta and land here. Match the ad promise to this page.
                    </p>
                  </Field>
                ) : null}

                {conversionLocation === "calls" ? (
                  <Field label="Phone number to call" className="sm:col-span-2">
                    <input
                      className="meta-input"
                      placeholder="+1 555 0100"
                      value={callPhoneNumber}
                      onChange={(e) => setCallPhoneNumber(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-[var(--meta-muted)]">
                      Tap Call opens the phone dialer. A started call is the result — not a website visit.
                    </p>
                  </Field>
                ) : null}

                {conversionLocation === "app" ? (
                  <Field label="App store / deep link" className="sm:col-span-2">
                    <input
                      className="meta-input"
                      placeholder="https://apps.apple.com/… or Play Store link"
                      value={appStoreUrl}
                      onChange={(e) => setAppStoreUrl(e.target.value)}
                    />
                  </Field>
                ) : null}

                {conversionLocation === "messenger" ||
                conversionLocation === "instagram" ||
                conversionLocation === "whatsapp" ? (
                  <p className="sm:col-span-2 rounded-xl border border-[var(--meta-line)] bg-[var(--meta-blue-soft)] px-3 py-2 text-[12px] text-[var(--meta-ink)]">
                    Result happens in{" "}
                    {conversionLocation === "whatsapp"
                      ? "WhatsApp chat"
                      : conversionLocation === "instagram"
                        ? "Instagram inbox"
                        : "Messenger"}
                    . No website required — optional fallback URL is on the Ad step.
                  </p>
                ) : null}

                {conversionLocation === "other" ? (
                  <Field label="Other conversion location" className="sm:col-span-2">
                    <input
                      className="meta-input"
                      placeholder="e.g. QR code at store, SMS shortcode…"
                      value={conversionLocationOther}
                      onChange={(e) => setConversionLocationOther(e.target.value)}
                    />
                  </Field>
                ) : null}

                {conversionLocation === "instant_form" ? (
                  <div className="sm:col-span-2 space-y-3 rounded-2xl border border-[var(--meta-line)] bg-[var(--meta-bg)] p-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--meta-ink)]">Instant Form (inside Meta)</p>
                      <p className="text-[11px] text-[var(--meta-muted)]">
                        People fill this on Facebook or Instagram — they do not open your site first.{" "}
                        {summarizeInstantForm(instantForm)}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Form name">
                        <input
                          className="meta-input"
                          value={instantForm.formName}
                          onChange={(e) => setInstantForm({ ...instantForm, formName: e.target.value })}
                        />
                      </Field>
                      <Field label="Privacy policy URL">
                        <input
                          className="meta-input"
                          value={instantForm.privacyUrl}
                          onChange={(e) => setInstantForm({ ...instantForm, privacyUrl: e.target.value })}
                        />
                      </Field>
                      <Field label="Intro headline" className="sm:col-span-2">
                        <input
                          className="meta-input"
                          value={instantForm.introHeadline}
                          onChange={(e) => setInstantForm({ ...instantForm, introHeadline: e.target.value })}
                        />
                      </Field>
                      <Field label="Intro description" className="sm:col-span-2">
                        <textarea
                          className="meta-input min-h-16"
                          value={instantForm.introDescription}
                          onChange={(e) => setInstantForm({ ...instantForm, introDescription: e.target.value })}
                        />
                      </Field>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold text-[var(--meta-muted)]">Questions on the form</p>
                      <div className="flex flex-wrap gap-1.5">
                        {INSTANT_FORM_FIELDS.filter((f) => f.id !== "custom").map((field) => {
                          const on = instantForm.fields.includes(field.id);
                          return (
                            <button
                              key={field.id}
                              type="button"
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                on
                                  ? "border-[var(--meta-blue)] bg-[var(--meta-blue-soft)] text-[var(--meta-blue)]"
                                  : "border-[var(--meta-line)] text-[var(--meta-ink)]"
                              }`}
                              onClick={() => {
                                const fields = on
                                  ? instantForm.fields.filter((id) => id !== field.id)
                                  : [...instantForm.fields, field.id];
                                setInstantForm({ ...instantForm, fields: fields.length ? fields : ["email"] });
                              }}
                            >
                              {field.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Field label="Custom questions (your words)">
                      <div className="flex gap-2">
                        <input
                          className="meta-input"
                          placeholder="e.g. What’s your monthly ad budget?"
                          value={customQuestionDraft}
                          onChange={(e) => setCustomQuestionDraft(e.target.value)}
                        />
                        <button
                          type="button"
                          className="meta-btn-ghost shrink-0"
                          onClick={() => {
                            const q = customQuestionDraft.trim();
                            if (!q) return;
                            setInstantForm({
                              ...instantForm,
                              customQuestions: [...instantForm.customQuestions, q],
                              fields: instantForm.fields.includes("custom")
                                ? instantForm.fields
                                : [...instantForm.fields, "custom" as InstantFormFieldId],
                            });
                            setCustomQuestionDraft("");
                          }}
                        >
                          Add
                        </button>
                      </div>
                      {instantForm.customQuestions.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-[12px] text-[var(--meta-muted)]">
                          {instantForm.customQuestions.map((q) => (
                            <li key={q} className="flex justify-between gap-2">
                              <span>· {q}</span>
                              <button
                                type="button"
                                className="font-semibold text-[var(--meta-danger)]"
                                onClick={() =>
                                  setInstantForm({
                                    ...instantForm,
                                    customQuestions: instantForm.customQuestions.filter((item) => item !== q),
                                  })
                                }
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </Field>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Thank-you headline">
                        <input
                          className="meta-input"
                          value={instantForm.thankYouHeadline}
                          onChange={(e) => setInstantForm({ ...instantForm, thankYouHeadline: e.target.value })}
                        />
                      </Field>
                      <Field label="Thank-you next step">
                        <select
                          className="meta-input"
                          value={instantForm.thankYouCta}
                          onChange={(e) =>
                            setInstantForm({
                              ...instantForm,
                              thankYouCta: e.target.value as InstantFormThankYouCta,
                            })
                          }
                        >
                          <option value="none">No button</option>
                          <option value="website">Visit website</option>
                          <option value="call">Call business</option>
                          <option value="whatsapp">Chat on WhatsApp</option>
                          <option value="messenger">Open Messenger</option>
                        </select>
                      </Field>
                      {instantForm.thankYouCta === "website" || instantForm.thankYouCta === "whatsapp" ? (
                        <Field label="Thank-you link / number" className="sm:col-span-2">
                          <input
                            className="meta-input"
                            value={instantForm.thankYouUrl}
                            onChange={(e) => setInstantForm({ ...instantForm, thankYouUrl: e.target.value })}
                          />
                        </Field>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <Field label="Placements" className="sm:col-span-2">
                  <select
                    className="meta-input"
                    value={placementMode}
                    onChange={(e) => setPlacementMode(e.target.value as "advantage" | "manual")}
                  >
                    <option value="advantage">Advantage+ (Meta picks where to show)</option>
                    <option value="manual">Manual — pick Facebook / Instagram / WhatsApp surfaces</option>
                  </select>
                  <p className="mt-1 text-[11px] text-[var(--meta-muted)]">
                    {summarizeSurfaces(placementMode, placementSurfaces)}
                  </p>
                </Field>
                {placementMode === "manual" ? (
                  <div className="sm:col-span-2 space-y-3 rounded-2xl border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
                    {PLACEMENT_PLATFORMS.map((platform) => (
                      <div key={platform}>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--meta-muted)]">
                          {platform}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {PLACEMENT_SURFACES.filter((s) => s.platform === platform).map((surface) => {
                            const on = placementSurfaces.includes(surface.id);
                            return (
                              <button
                                key={surface.id}
                                type="button"
                                title={surface.blurb}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  on
                                    ? "border-[var(--meta-blue)] bg-[var(--meta-blue-soft)] text-[var(--meta-blue)]"
                                    : "border-[var(--meta-line)] text-[var(--meta-ink)]"
                                }`}
                                onClick={() => {
                                  setPlacementSurfaces((list) =>
                                    on ? list.filter((id) => id !== surface.id) : [...list, surface.id],
                                  );
                                }}
                              >
                                {surface.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Field label="Devices" className="sm:col-span-2">
                  <p className="mb-1.5 text-[11px] text-[var(--meta-muted)]">
                    {summarizeDevices(devices)} — leave empty for all. Phones split Android vs iOS; tablets are separate.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEVICE_OPTIONS.map((device) => {
                      const on = devices.includes(device.id);
                      return (
                        <button
                          key={device.id}
                          type="button"
                          title={device.blurb}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            on
                              ? "border-[var(--meta-blue)] bg-[var(--meta-blue-soft)] text-[var(--meta-blue)]"
                              : "border-[var(--meta-line)] text-[var(--meta-ink)]"
                          }`}
                          onClick={() => {
                            setDevices((list) =>
                              on ? list.filter((id) => id !== device.id) : [...list, device.id],
                            );
                          }}
                        >
                          {device.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="rounded-full border border-[var(--meta-line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--meta-muted)]"
                      onClick={() => setDevices([])}
                    >
                      All devices
                    </button>
                  </div>
                </Field>

                <Field label="Performance goal">
                  <select
                    className="meta-input"
                    value={optimizeOverride}
                    onChange={(e) => setOptimizeOverride(e.target.value as typeof optimizeOverride)}
                  >
                    <option value="auto">
                      Auto from objective
                      {objective ? ` (${resultNoun(objective)})` : ""}
                    </option>
                    <option value="purchase">Purchases</option>
                    <option value="add_to_cart">Add to cart</option>
                    <option value="landing_page">Landing page views</option>
                    <option value="link_click">Link clicks</option>
                    <option value="lead">Leads</option>
                    <option value="messages">Messaging conversations</option>
                    <option value="conversations">Conversations</option>
                  </select>
                </Field>
                <Field label="Day parting">
                  <select
                    className="meta-input"
                    value={dayParting}
                    onChange={(e) => setDayParting(e.target.value as MetaAdSet["dayParting"])}
                  >
                    <option value="all_day">Run all day</option>
                    <option value="business">Business hours</option>
                    <option value="evenings">Evenings</option>
                    <option value="custom">Custom (describe below)</option>
                  </select>
                </Field>
                {dayParting === "custom" ? (
                  <Field label="Custom schedule note" className="sm:col-span-2">
                    <input
                      className="meta-input"
                      placeholder="e.g. Weekdays 9–12 IST only"
                      value={dayPartingNote}
                      onChange={(e) => setDayPartingNote(e.target.value)}
                    />
                  </Field>
                ) : null}
                <Field label="Audience window">
                  <select className="meta-input" value={windowDays} onChange={(e) => setWindowDays(e.target.value)}>
                    {WINDOWS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Attribution setting">
                  <select
                    className="meta-input"
                    value={attribution}
                    onChange={(e) => setAttribution(e.target.value as MetaAdSet["attribution"])}
                  >
                    <option value="7c1v">7-day click, 1-day view</option>
                    <option value="7c">7-day click</option>
                    <option value="1c">1-day click</option>
                  </select>
                </Field>
                <Field label="Daily budget ($)">
                  <input
                    type="number"
                    min={1}
                    className="meta-input"
                    value={adSetBudget}
                    onChange={(e) => setAdSetBudget(Number(e.target.value) || 1)}
                  />
                </Field>
                <Field label="Bid strategy">
                  <select
                    className="meta-input"
                    value={bidStrategy}
                    onChange={(e) => setBidStrategy(e.target.value as MetaAdSet["bidStrategy"])}
                  >
                    <option value="lowest_cost">Highest volume</option>
                    <option value="cost_cap">Cost per result goal</option>
                    <option value="bid_cap">Bid cap</option>
                  </select>
                </Field>
                <Field label="Extra interest (your own words)" className="sm:col-span-2">
                  <input
                    className="meta-input"
                    placeholder="Type an interest not in the list…"
                    value={interestOther}
                    onChange={(e) => setInterestOther(e.target.value)}
                  />
                </Field>
                <Field label="Audience notes (who to include / exclude)" className="sm:col-span-2">
                  <textarea
                    className="meta-input min-h-16"
                    placeholder="e.g. Exclude staff emails, only new parents in Mumbai…"
                    value={audienceNote}
                    onChange={(e) => setAudienceNote(e.target.value)}
                  />
                </Field>
              </div>
              <AudienceBuilder value={targeting} onChange={setTargeting} />
            </div>
          ) : null}

          {step === "ad" ? (
            <div className="space-y-3">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Ad name">
                      <input className="meta-input" value={adName} onChange={(e) => setAdName(e.target.value)} />
                    </Field>
                    <Field label="Identity (Page)">
                      <input className="meta-input" value={pageName} onChange={(e) => setPageName(e.target.value)} />
                    </Field>
                    <Field label="Format">
                      <select
                        className="meta-input"
                        value={format}
                        onChange={(e) => {
                          const next = e.target.value as MetaAd["format"];
                          setFormat(next);
                          setHasImage(next !== "single_video");
                          setHasVideo(next === "single_video");
                        }}
                      >
                        <option value="single_image">Single image</option>
                        <option value="single_video">Single video</option>
                        <option value="carousel">Carousel</option>
                      </select>
                    </Field>
                    <Field label="Call to action">
                      <select className="meta-input" value={cta} onChange={(e) => setCta(e.target.value)}>
                        {CALL_TO_ACTIONS.map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field
                    label={
                      conversionLocation === "website" || conversionLocation === "instant_form"
                        ? "Website / form URL"
                        : conversionLocation === "messenger" ||
                            conversionLocation === "instagram" ||
                            conversionLocation === "whatsapp"
                          ? "Fallback URL (optional — result happens in chat)"
                          : "Deep link or fallback URL (optional)"
                    }
                  >
                    <input className="meta-input" value={url} onChange={(e) => setUrl(e.target.value)} />
                  </Field>
                  <CreativeUpload
                    label="Creative A — upload image or video"
                    headline={headlineA}
                    primary={primaryA}
                    description={description}
                    media={mediaA}
                    mediaKind={mediaKindA}
                    onHeadline={setHeadlineA}
                    onPrimary={setPrimaryA}
                    onDescription={setDescription}
                    onMedia={(urlValue, kind) => {
                      setMediaA(urlValue);
                      setMediaKindA(kind);
                      if (kind === "video") {
                        setHasVideo(true);
                        setFormat("single_video");
                      }
                      if (kind === "image") setHasImage(true);
                    }}
                  />
                  {abTest ? (
                    <CreativeUpload
                      label="Creative B — upload image or video"
                      headline={headlineB}
                      primary={primaryB}
                      description={description}
                      media={mediaB}
                      mediaKind={mediaKindB}
                      onHeadline={setHeadlineB}
                      onPrimary={setPrimaryB}
                      onDescription={setDescription}
                      onMedia={(urlValue, kind) => {
                        setMediaB(urlValue);
                        setMediaKindB(kind);
                      }}
                    />
                  ) : null}
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={videoHasWords}
                      disabled={mediaKindA !== "video" && !hasVideo}
                      onChange={(e) => setVideoHasWords(e.target.checked)}
                    />
                    Words on the video (sound-off viewers)
                  </label>
                </div>
                <div className="flex justify-center lg:sticky lg:top-0 lg:self-start">
                  <PhoneMockup
                    creative={{
                      id: "preview-a",
                      label: "A",
                      headline: headlineA,
                      primaryText: primaryA,
                      description,
                      hasImage: hasImage || mediaKindA === "image",
                      hasVideo: hasVideo || mediaKindA === "video",
                      videoHasWords,
                      cta,
                      destinationUrl: url,
                      mediaDataUrl: mediaA,
                      mediaKind: mediaKindA,
                    }}
                    pageName={pageName}
                    placement={
                      coarsePlacement(placementMode, placementSurfaces) === "advantage"
                        ? "feed"
                        : coarsePlacement(placementMode, placementSurfaces)
                    }
                    pulse
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-3 text-[13px]">
              <ReviewRow label="Buying type" value={BUYING_TYPES.find((item) => item.id === buyingType)?.name ?? buyingType} />
              <ReviewRow label="Objective" value={objective ? OBJECTIVE_COPY[objective].name : "—"} />
              <ReviewRow label="Setup" value={setupPath === "advantage" ? "Advantage+" : "Manual"} />
              <ReviewRow label="Campaign" value={campaignName} />
              <ReviewRow label="Ad set" value={adSetName} />
              <ReviewRow label="Ad" value={adName} />
              <ReviewRow label="Audience" value={summarizeTargeting(targeting)} />
              <ReviewRow
                label="Conversion location"
                value={
                  conversionLocation === "other"
                    ? conversionLocationOther || "Other"
                    : conversionLocation === "website"
                      ? `Website · ${websiteUrl}`
                      : conversionLocation === "calls"
                        ? `Calls · ${callPhoneNumber}`
                        : conversionLocation === "instant_form"
                          ? summarizeInstantForm(instantForm)
                          : conversionLocation
                }
              />
              <ReviewRow
                label="Results mean"
                value={objective ? resultNoun(objective) : "—"}
              />
              <ReviewRow label="Placements" value={summarizeSurfaces(placementMode, placementSurfaces)} />
              <ReviewRow label="Devices" value={summarizeDevices(devices)} />
              {audienceNote ? <ReviewRow label="Audience notes" value={audienceNote} /> : null}
              <ReviewRow label="Creative media A" value={mediaKindA === "none" ? "No upload" : mediaKindA} />
              <ReviewRow label="Daily budget" value={`$${budgetLevel === "campaign" ? campaignBudget : adSetBudget}`} />
              <ReviewRow label="Attribution" value={attribution === "7c1v" ? "7-day click, 1-day view" : attribution} />
              <ReviewRow label="Creative A" value={headlineA} />
              {abTest ? <ReviewRow label="Creative B" value={headlineB} /> : null}
              <p className="rounded-md bg-[var(--meta-blue-soft)] px-3 py-2 text-[12px] text-[var(--meta-ink)]">
                Publish starts a simulated delivery week. Real desk changes still need Approve in Marketer chat.
              </p>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-[var(--meta-line)] px-5 py-3">
          {step === "objective" ? (
            <a
              href="https://www.facebook.com/business/help/1432145923441919"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-semibold text-[var(--meta-blue)] hover:underline"
            >
              About campaign objectives
            </a>
          ) : (
            <button type="button" className="text-[13px] font-semibold text-[var(--meta-blue)]" onClick={onCancel}>
              Cancel
            </button>
          )}
          <div className="flex gap-2">
            {step !== "objective" ? (
              <button type="button" className="meta-btn-ghost" onClick={() => setStep(prevStep(step))}>
                Back
              </button>
            ) : (
              <button type="button" className="meta-btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            )}
            {step === "review" ? (
              <button type="button" className="meta-btn-primary" onClick={publish}>
                Publish
              </button>
            ) : (
              <button
                type="button"
                className="meta-btn-primary"
                disabled={!canContinue}
                onClick={() => {
                  if (step === "objective") continueFromObjective();
                  else setStep(nextStep(step));
                }}
              >
                Continue
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function ObjectiveStep({
  buyingType,
  objective,
  onBuyingType,
  onObjective,
}: {
  buyingType: "auction" | "reserved";
  objective: MetaObjective | null;
  onBuyingType: (value: "auction" | "reserved") => void;
  onObjective: (value: MetaObjective) => void;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <Field label="Buying type">
          <select
            className="meta-input"
            value={buyingType}
            onChange={(e) => onBuyingType(e.target.value as "auction" | "reserved")}
          >
            {BUYING_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="space-y-1">
          <p className="text-[13px] font-semibold">Choose a campaign objective</p>
          <ul className="divide-y divide-[var(--meta-line)] rounded-md border border-[var(--meta-line)]">
            {OBJECTIVES.map((item) => {
              const id = item.id as MetaObjective;
              const copy = OBJECTIVE_COPY[id];
              const selected = objective === id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-[var(--meta-hover)] ${selected ? "bg-[var(--meta-blue-soft)]" : ""}`}
                    onClick={() => onObjective(id)}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[var(--meta-blue)]" : "border-[var(--meta-line)]"}`}
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-[var(--meta-blue)]" /> : null}
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold">{copy.name}</span>
                      <span className="mt-0.5 block text-[12px] text-[var(--meta-muted)]">{copy.blurb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <aside className="rounded-md bg-[var(--meta-blue-soft)] p-4 text-[12px] leading-5 text-[var(--meta-ink)]">
        <div className="mb-3 flex h-28 items-center justify-center rounded bg-white/70 text-[40px]">🧭</div>
        Your campaign objective is the business goal you hope to achieve by running your ads. Hover over each one for
        more information.
      </aside>
    </div>
  );
}

function PathCard({
  title,
  body,
  selected,
  onClick,
}: {
  title: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left ${selected ? "border-[var(--meta-blue)] bg-[var(--meta-blue-soft)]" : "border-[var(--meta-line)] bg-white"}`}
    >
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-2 text-[12px] leading-5 text-[var(--meta-muted)]">{body}</p>
    </button>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-[12px] font-semibold text-[var(--meta-ink)]">{label}</span>
      {children}
    </label>
  );
}

function CreativeUpload({
  label,
  headline,
  primary,
  description,
  media,
  mediaKind,
  onHeadline,
  onPrimary,
  onDescription,
  onMedia,
}: {
  label: string;
  headline: string;
  primary: string;
  description: string;
  media: string | null;
  mediaKind: "none" | "image" | "video";
  onHeadline: (value: string) => void;
  onPrimary: (value: string) => void;
  onDescription: (value: string) => void;
  onMedia: (url: string | null, kind: "none" | "image" | "video") => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--meta-muted)]">{label}</p>
      <Field label="Upload image or video">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          className="block w-full text-[12px] text-[var(--meta-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-pine file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-paper"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              onMedia(null, "none");
              return;
            }
            if (file.size > 12 * 1024 * 1024) {
              onMedia(null, "none");
              return;
            }
            const kind = file.type.startsWith("video/") ? "video" : "image";
            const objectUrl = URL.createObjectURL(file);
            onMedia(objectUrl, kind);
          }}
        />
      </Field>
      {media ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-[var(--meta-line)]">
          {mediaKind === "video" ? (
            <video src={media} className="max-h-40 w-full object-cover" muted controls playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media} alt="" className="max-h-40 w-full object-cover" />
          )}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--meta-muted)]">PNG, JPG, WebP, or MP4 — stays in this browser for the simulation.</p>
      )}
      <div className="mt-3 space-y-2">
        <Field label="Primary text">
          <textarea className="meta-input min-h-20" value={primary} onChange={(e) => onPrimary(e.target.value)} />
        </Field>
        <Field label="Headline">
          <input className="meta-input" value={headline} onChange={(e) => onHeadline(e.target.value)} />
        </Field>
        <Field label="Description">
          <input className="meta-input" value={description} onChange={(e) => onDescription(e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--meta-line)] py-2">
      <span className="text-[var(--meta-muted)]">{label}</span>
      <span className="text-right font-semibold">{value || "—"}</span>
    </div>
  );
}

function StepDots({ step }: { step: CreateStep }) {
  const order: CreateStep[] = ["objective", "setup_path", "campaign", "adset", "ad", "review"];
  const index = order.indexOf(step);
  return (
    <div className="flex gap-1" aria-hidden>
      {order.map((item, i) => (
        <span
          key={item}
          className={`h-1.5 w-6 rounded-full ${i <= index ? "bg-[var(--meta-blue)]" : "bg-[var(--meta-line)]"}`}
        />
      ))}
    </div>
  );
}

function stepTitle(step: CreateStep): string {
  if (step === "setup_path") return "Campaign setup";
  if (step === "campaign") return "Campaign details";
  if (step === "adset") return "Ad set";
  if (step === "ad") return "Ad";
  return "Review";
}

function nextStep(step: CreateStep): CreateStep {
  const order: CreateStep[] = ["objective", "setup_path", "campaign", "adset", "ad", "review"];
  return order[Math.min(order.indexOf(step) + 1, order.length - 1)] ?? "review";
}

function prevStep(step: CreateStep): CreateStep {
  const order: CreateStep[] = ["objective", "setup_path", "campaign", "adset", "ad", "review"];
  return order[Math.max(order.indexOf(step) - 1, 0)] ?? "objective";
}

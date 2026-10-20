"use client";

import { useMemo, useState } from "react";

import { CreateWizard, type CreatePublishPayload } from "@/features/practice/components/ads-manager/create-wizard";
import { DeliveryDrawer } from "@/features/practice/components/ads-manager/delivery-drawer";
import type {
  DeskSeed,
  MetaAd,
  MetaAdSet,
  MetaCampaign,
  MetaDelivery,
  MetaLevel,
} from "@/features/practice/meta/draft-types";
import { DATE_PRESETS, DELIVERY_LABEL, FILTER_CHIPS } from "@/features/practice/meta/labels";
import { newId, seedAccountFromDesk } from "@/features/practice/meta/seed-from-desk";
import { formatCount, formatDollars } from "@/lib/money";

export function AdsManager({ seeds }: { seeds: DeskSeed[] }) {
  const initial = useMemo(() => seedAccountFromDesk(seeds), [seeds]);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>(initial.campaigns);
  const [adSets, setAdSets] = useState<MetaAdSet[]>(initial.adSets);
  const [ads, setAds] = useState<MetaAd[]>(initial.ads);
  const [level, setLevel] = useState<MetaLevel>("campaigns");
  const [filter, setFilter] = useState<(typeof FILTER_CHIPS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState<(typeof DATE_PRESETS)[number]["id"]>("last_30");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [analyseId, setAnalyseId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const seedByDesk = useMemo(() => new Map(seeds.map((seed) => [seed.id, seed])), [seeds]);
  const hasSelection = selected.size > 0;

  const rows = useMemo(() => {
    const list = level === "campaigns" ? campaigns : level === "adsets" ? adSets : ads;
    return list.filter((row) => {
      if (query && !row.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "active" && !row.on) return false;
      if (filter === "delivery" && row.spendCents <= 0 && row.delivery !== "active" && row.delivery !== "learning") {
        return false;
      }
      if (filter === "actions") {
        return selected.has(row.id) || row.delivery.includes("limited") || row.delivery === "creative_fatigue";
      }
      return true;
    });
  }, [ads, adSets, campaigns, filter, level, query, selected]);

  const analyseCampaign = campaigns.find((item) => item.id === analyseId) ?? null;
  const analyseAdSet = analyseCampaign
    ? (adSets.find((item) => item.campaignId === analyseCampaign.id) ?? null)
    : null;
  const analyseAd = analyseCampaign
    ? (ads.find((item) => item.campaignId === analyseCampaign.id) ?? null)
    : null;
  const analyseSeed = analyseCampaign?.deskCampaignId
    ? (seedByDesk.get(analyseCampaign.deskCampaignId) ?? null)
    : null;

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openDeliveryWeek(rowId?: string) {
    const id = rowId ?? [...selected][0] ?? campaigns[0]?.id;
    if (!id) {
      flash("Create a practice ad first.");
      return;
    }
    const campaignId =
      campaigns.find((item) => item.id === id)?.id ??
      adSets.find((item) => item.id === id)?.campaignId ??
      ads.find((item) => item.id === id)?.campaignId;
    if (campaignId) setAnalyseId(campaignId);
  }

  function toggleOn(id: string) {
    if (level === "campaigns") {
      setCampaigns((list) =>
        list.map((item) =>
          item.id === id
            ? { ...item, on: !item.on, delivery: (!item.on ? "active" : "off") as MetaDelivery }
            : item,
        ),
      );
      setAdSets((list) =>
        list.map((item) =>
          item.campaignId === id
            ? { ...item, on: !item.on, delivery: (!item.on ? item.delivery : "campaign_off") as MetaDelivery }
            : item,
        ),
      );
      setAds((list) =>
        list.map((item) =>
          item.campaignId === id
            ? { ...item, on: !item.on, delivery: (!item.on ? item.delivery : "campaign_off") as MetaDelivery }
            : item,
        ),
      );
    } else if (level === "adsets") {
      setAdSets((list) =>
        list.map((item) =>
          item.id === id ? { ...item, on: !item.on, delivery: (!item.on ? "learning" : "off") as MetaDelivery } : item,
        ),
      );
    } else {
      setAds((list) =>
        list.map((item) =>
          item.id === id ? { ...item, on: !item.on, delivery: (!item.on ? "active" : "off") as MetaDelivery } : item,
        ),
      );
    }
  }

  function onPublish(payload: CreatePublishPayload) {
    setCampaigns((list) => [payload.campaign, ...list]);
    setAdSets((list) => [payload.adSet, ...list]);
    setAds((list) => [payload.ad, ...list]);
    setCreating(false);
    setLevel("campaigns");
    setAnalyseId(payload.campaign.id);
    flash("Published. Open Delivery week to watch people.");
  }

  function duplicateSelected() {
    const ids = [...selected];
    if (ids.length === 0) {
      flash("Select a row to duplicate.");
      return;
    }
    for (const id of ids) {
      const campaign = campaigns.find((item) => item.id === id);
      if (!campaign) continue;
      const copyId = newId("mc");
      const setId = newId("ms");
      const adId = newId("ma");
      const set = adSets.find((item) => item.campaignId === id);
      const ad = ads.find((item) => item.campaignId === id);
      setCampaigns((list) => [
        { ...campaign, id: copyId, name: `${campaign.name} — Copy`, delivery: "scheduled", spendCents: 0, results: 0 },
        ...list,
      ]);
      if (set) {
        setAdSets((list) => [
          {
            ...set,
            id: setId,
            campaignId: copyId,
            name: `${set.name} — Copy`,
            spendCents: 0,
            results: 0,
            targeting: { ...set.targeting, interests: [...set.targeting.interests] },
          },
          ...list,
        ]);
      }
      if (ad) {
        setAds((list) => [
          {
            ...ad,
            id: adId,
            campaignId: copyId,
            adSetId: setId,
            name: `${ad.name} — Copy`,
            spendCents: 0,
            results: 0,
            creatives: ad.creatives.map((creative, index) => ({
              ...creative,
              id: `${adId}-${index}`,
            })),
          },
          ...list,
        ]);
      }
    }
    flash("Duplicated in simulation.");
  }

  function startAbTest() {
    const id = [...selected][0];
    const ad = ads.find((item) => item.id === id) ?? ads.find((item) => item.campaignId === id);
    if (!ad) {
      flash("Select an ad or campaign to A/B test.");
      return;
    }
    if (ad.creatives.length >= 2) {
      flash("This ad already has Creative A and B.");
      setAnalyseId(ad.campaignId);
      return;
    }
    setAds((list) =>
      list.map((item) =>
        item.id === ad.id
          ? {
              ...item,
              creatives: [
                ...item.creatives,
                {
                  id: newId("cr"),
                  label: "B",
                  headline: `${item.creatives[0]?.headline ?? item.name} — B`,
                  primaryText: item.creatives[0]?.primaryText ?? "",
                  description: item.creatives[0]?.description ?? "",
                  hasImage: true,
                  hasVideo: false,
                  videoHasWords: false,
                  cta: "Learn more",
                  destinationUrl: item.creatives[0]?.destinationUrl ?? "https://example.com",
                  mediaDataUrl: null,
                  mediaKind: "none",
                },
              ],
            }
          : item,
      ),
    );
    setAnalyseId(ad.campaignId);
    flash("Creative B added. Open Delivery week to watch A/B.");
  }

  const totals = useMemo(() => {
    const spend = rows.reduce((sum, item) => sum + item.spendCents, 0);
    const results = rows.reduce((sum, item) => sum + item.results, 0);
    return { spend, results };
  }, [rows]);

  const nameLabel = level === "campaigns" ? "Campaign" : level === "adsets" ? "Ad set" : "Ad";

  return (
    <div className="meta-ads flex min-h-dvh flex-col bg-[var(--meta-bg)]">
      <header className="border-b border-[var(--meta-line)] bg-[var(--meta-card)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--meta-ink)]">Simulation</h1>
            <p className="mt-1 text-[13px] text-[var(--meta-muted)]">Practice run. Nothing spends on a real ad account.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="meta-input w-auto min-w-[9rem]"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as (typeof DATE_PRESETS)[number]["id"])}
              aria-label="Date range"
            >
              {DATE_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button type="button" className="meta-btn-primary" onClick={() => setCreating(true)}>
              + Create
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[var(--meta-line)] bg-[var(--meta-card)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="meta-input max-w-xs flex-1"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                  filter === chip.id
                    ? "bg-[var(--meta-blue-soft)] text-[var(--meta-blue)]"
                    : "text-[var(--meta-muted)] hover:bg-[var(--meta-hover)] hover:text-[var(--meta-ink)]"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1 border-b border-transparent">
            {(
              [
                ["campaigns", "Campaigns"],
                ["adsets", "Ad sets"],
                ["ads", "Ads"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setLevel(id);
                  setSelected(new Set());
                }}
                className={`border-b-2 px-3 pb-1.5 text-[13px] font-semibold ${
                  level === id
                    ? "border-[var(--meta-blue)] text-[var(--meta-ink)]"
                    : "border-transparent text-[var(--meta-muted)] hover:text-[var(--meta-ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {hasSelection ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--meta-line)] pt-3">
            <p className="text-[12px] font-semibold text-[var(--meta-muted)]">{selected.size} selected</p>
            <button type="button" className="meta-btn-ghost" onClick={() => openDeliveryWeek()}>
              Delivery week
            </button>
            <button type="button" className="meta-btn-ghost" onClick={duplicateSelected}>
              Duplicate
            </button>
            <button
              type="button"
              className="meta-btn-ghost"
              onClick={() => {
                setCreating(true);
                flash("Adjust the structure, then Publish again.");
              }}
            >
              Edit
            </button>
            <button type="button" className="meta-btn-ghost" onClick={startAbTest}>
              A/B test
            </button>
            <button type="button" className="meta-btn-ghost" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {rows.length === 0 ? (
          <EmptyState onCreate={() => setCreating(true)} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--meta-line)] bg-[var(--meta-card)]">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-10 border-b border-[var(--meta-line)] bg-[var(--meta-bg)] text-[11px] font-semibold uppercase tracking-wide text-[var(--meta-muted)]">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="sticky left-0 z-[1] w-14 bg-[var(--meta-bg)] px-3 py-3">On</th>
                  <th className="sticky left-14 z-[1] min-w-[12rem] bg-[var(--meta-bg)] px-3 py-3">{nameLabel}</th>
                  <th className="px-3 py-3">Delivery</th>
                  <th className="px-3 py-3 text-right">Results</th>
                  <th className="px-3 py-3 text-right">CPR</th>
                  <th className="px-3 py-3 text-right">Budget</th>
                  <th className="px-3 py-3 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const campaign =
                    "objective" in row
                      ? (row as MetaCampaign)
                      : (campaigns.find((item) => item.id === ("campaignId" in row ? row.campaignId : "")) ?? null);
                  const budget = "dailyBudgetCents" in row ? row.dailyBudgetCents : (campaign?.dailyBudgetCents ?? 0);
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-[var(--meta-line)] transition hover:bg-[var(--meta-hover)]"
                    >
                      <td className="px-3 py-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select ${row.name}`}
                        />
                      </td>
                      <td className="sticky left-0 z-[1] bg-[var(--meta-card)] px-3 py-3 align-middle group-hover:bg-[var(--meta-hover)]">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.on}
                          aria-label={row.on ? "Turn off" : "Turn on"}
                          onClick={() => toggleOn(row.id)}
                          className={`relative h-6 w-11 rounded-full transition ${
                            row.on ? "bg-[var(--meta-ok)]" : "bg-[var(--meta-line)]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                              row.on ? "left-5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="sticky left-14 z-[1] bg-[var(--meta-card)] px-3 py-3 align-middle">
                        <button
                          type="button"
                          className="max-w-[18rem] truncate text-left font-semibold text-[var(--meta-ink)] hover:text-[var(--meta-blue)] hover:underline"
                          onClick={() => openDeliveryWeek(campaignIdOf(row))}
                          title="Open Delivery week"
                        >
                          {row.name}
                        </button>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <DeliveryPill delivery={row.delivery} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--meta-ink)]">
                        {formatCount(row.results)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--meta-ink)]">
                        {row.costPerResultCents != null ? formatDollars(row.costPerResultCents) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--meta-muted)]">
                        {formatDollars(budget)}/day
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--meta-ink)]">
                        {formatDollars(row.spendCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--meta-line)] bg-[var(--meta-bg)] text-[12px] font-semibold">
                  <td colSpan={4} className="px-3 py-3 text-[var(--meta-muted)]">
                    {rows.length} {level} in this view
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCount(totals.results)}</td>
                  <td className="px-3 py-3 text-right text-[var(--meta-muted)]">—</td>
                  <td className="px-3 py-3 text-right text-[var(--meta-muted)]">—</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatDollars(totals.spend)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {creating ? (
        <CreateWizard seeds={seeds} onCancel={() => setCreating(false)} onPublish={onPublish} />
      ) : null}

      {analyseCampaign && analyseAdSet && analyseAd ? (
        <DeliveryDrawer
          campaign={analyseCampaign}
          adSet={analyseAdSet}
          ad={analyseAd}
          seed={analyseSeed}
          onClose={() => setAnalyseId(null)}
          onMarketerAction={(action) => {
            if (action === "turn_off") {
              setAds((list) =>
                list.map((item) =>
                  item.campaignId === analyseCampaign.id ? { ...item, on: false, delivery: "off" } : item,
                ),
              );
              setCampaigns((list) =>
                list.map((item) =>
                  item.id === analyseCampaign.id ? { ...item, on: false, delivery: "off" } : item,
                ),
              );
              flash("Ad turned off in simulation.");
            }
            if (action === "shorten_window") {
              setAdSets((list) =>
                list.map((item) =>
                  item.campaignId === analyseCampaign.id
                    ? { ...item, windowDays: 7, delivery: "learning" }
                    : item,
                ),
              );
              flash("Window shortened to 7 days in simulation.");
            }
          }}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[var(--meta-ink)] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[22rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--meta-line)] bg-[var(--meta-card)] px-6 text-center">
      <p className="text-[16px] font-semibold text-[var(--meta-ink)]">No practice ads yet</p>
      <p className="max-w-sm text-[13px] text-[var(--meta-muted)]">
        Create a campaign, ad set, and ad — then open Delivery week to watch how people research it.
      </p>
      <button type="button" className="meta-btn-primary" onClick={onCreate}>
        Create practice ad
      </button>
    </div>
  );
}

function campaignIdOf(row: MetaCampaign | MetaAdSet | MetaAd): string {
  if ("objective" in row) return row.id;
  return row.campaignId;
}

function DeliveryPill({ delivery }: { delivery: MetaDelivery }) {
  const tone =
    delivery === "active" || delivery === "learning"
      ? "bg-[var(--meta-ok)]/15 text-[var(--meta-ok)]"
      : delivery === "off" || delivery === "campaign_off"
        ? "bg-[var(--meta-hover)] text-[var(--meta-muted)]"
        : delivery.includes("limited") || delivery === "creative_fatigue"
          ? "bg-[var(--meta-danger)]/10 text-[var(--meta-danger)]"
          : "bg-[var(--meta-warn)]/10 text-[var(--meta-warn)]";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {DELIVERY_LABEL[delivery]}
    </span>
  );
}

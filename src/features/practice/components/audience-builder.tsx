"use client";

import { useMemo, useState } from "react";

import {
  AGE_PRESETS,
  BEHAVIOR_LEAVES,
  DEMOGRAPHIC_LEAVES,
  GENDERS,
  INTEREST_GROUPS,
  INTEREST_LEAVES,
  LANGUAGES,
  LOCATIONS,
  summarizeTargeting,
  type DetailedTargeting,
} from "@/features/practice/meta/detailed-targeting";
import { CUSTOM_AUDIENCES as CUSTOM_LIST, LOOKALIKE_SIZES as LAL_LIST } from "@/features/practice/meta/audiences";
import { cn } from "@/lib/utils";

export function AudienceBuilder({
  value,
  onChange,
}: {
  value: DetailedTargeting;
  onChange: (next: DetailedTargeting) => void;
}) {
  const [interestQuery, setInterestQuery] = useState("");
  const [interestGroup, setInterestGroup] = useState<string>("all");

  function toggle(
    list: keyof Pick<
      DetailedTargeting,
      "locations" | "languages" | "interests" | "behaviors" | "demographics" | "customAudiences"
    >,
    id: string,
  ) {
    const current = value[list];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    onChange({ ...value, [list]: next });
  }

  const selectedInterests = useMemo(
    () => INTEREST_LEAVES.filter((item) => value.interests.includes(item.id)),
    [value.interests],
  );

  const filteredInterests = useMemo(() => {
    const q = interestQuery.trim().toLowerCase();
    return INTEREST_LEAVES.filter((item) => {
      if (interestGroup !== "all" && item.group !== interestGroup) return false;
      if (!q) return true;
      return item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q);
    }).slice(0, q || interestGroup !== "all" ? 120 : 48);
  }, [interestGroup, interestQuery]);

  return (
    <div className="space-y-4 rounded-lg border border-[var(--meta-line)] bg-[var(--meta-bg)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-[var(--meta-ink)]">Audience</p>
          <p className="text-[11px] text-[var(--meta-muted)]">
            Custom audiences from your data, plus detailed targeting. Type “Other” when the list is not enough.
          </p>
        </div>
        <p className="rounded-full bg-[var(--meta-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--meta-blue)] ring-1 ring-[var(--meta-line)]">
          {summarizeTargeting(value)}
        </p>
      </div>

      <section className="space-y-2 rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
        <p className="text-[12px] font-semibold text-[var(--meta-ink)]">Locations, age & gender</p>
        <div className="flex flex-wrap gap-1.5">
          {LOCATIONS.map((item) => (
            <Chip
              key={item.id}
              active={value.locations.includes(item.id)}
              label={item.label}
              onClick={() => toggle("locations", item.id)}
            />
          ))}
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-[var(--meta-muted)]">Other location (city, zip, radius…)</span>
          <input
            className="meta-input"
            placeholder="e.g. Pune 10km, Austin TX, Bangalore IT corridor"
            value={value.locationOther ?? ""}
            onChange={(e) => onChange({ ...value, locationOther: e.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AGE_PRESETS.map((preset) => (
            <Chip
              key={preset.id}
              active={value.ageMin === preset.min && value.ageMax === preset.max}
              label={preset.label}
              onClick={() => onChange({ ...value, ageMin: preset.min, ageMax: preset.max })}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GENDERS.map((item) => (
            <Chip
              key={item.id}
              active={value.gender === item.id}
              label={item.label}
              onClick={() => onChange({ ...value, gender: item.id })}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((item) => (
            <Chip
              key={item.id}
              active={value.languages.includes(item.id)}
              label={item.label}
              onClick={() => toggle("languages", item.id)}
            />
          ))}
        </div>
        <label className="mt-1 flex items-center gap-2 text-[12px] text-[var(--meta-muted)]">
          Age range
          <input
            type="number"
            min={18}
            max={65}
            className="meta-input w-16"
            value={value.ageMin}
            onChange={(e) => onChange({ ...value, ageMin: Math.min(Number(e.target.value) || 18, value.ageMax) })}
          />
          to
          <input
            type="number"
            min={18}
            max={65}
            className="meta-input w-16"
            value={value.ageMax}
            onChange={(e) => onChange({ ...value, ageMax: Math.max(Number(e.target.value) || 65, value.ageMin) })}
          />
        </label>
      </section>

      <section className="space-y-2 rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
        <p className="text-[12px] font-semibold text-[var(--meta-ink)]">Custom audiences & lookalikes</p>
        <p className="text-[11px] text-[var(--meta-muted)]">Your site, list, video, and engagers — the warmest people.</p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={value.customAudiences.includes("cold")}
            label="Cold (no custom)"
            onClick={() => onChange({ ...value, customAudiences: ["cold"] })}
          />
          {CUSTOM_LIST.map((item) => (
            <Chip
              key={item.id}
              active={value.customAudiences.includes(item.id)}
              label={item.name}
              onClick={() => {
                const withoutCold = value.customAudiences.filter((id) => id !== "cold");
                const next = withoutCold.includes(item.id)
                  ? withoutCold.filter((id) => id !== item.id)
                  : [...withoutCold, item.id];
                onChange({ ...value, customAudiences: next.length ? next : ["cold"] });
              }}
            />
          ))}
          {LAL_LIST.map((item) => (
            <Chip
              key={item.id}
              active={value.customAudiences.includes(item.id)}
              label={item.name}
              onClick={() => toggle("customAudiences", item.id)}
            />
          ))}
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-[var(--meta-muted)]">Other custom / list name</span>
          <input
            className="meta-input"
            placeholder="e.g. WhatsApp opt-ins Oct, CRM buyers 90d"
            value={value.customOther ?? ""}
            onChange={(e) => onChange({ ...value, customOther: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-2 rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[12px] font-semibold text-[var(--meta-ink)]">
            Detailed targeting · Interests
          </p>
          <p className="text-[11px] text-[var(--meta-muted)]">
            {INTEREST_LEAVES.length} from Facebook interest list · {value.interests.length} selected
          </p>
        </div>
        {selectedInterests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--meta-blue)]/20 bg-[var(--meta-blue-soft)] p-2">
            {selectedInterests.map((item) => (
              <Chip
                key={`sel-${item.id}`}
                active
                label={item.label}
                hint={item.group}
                onClick={() => toggle("interests", item.id)}
              />
            ))}
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            className="meta-input"
            placeholder="Search interests — e.g. yoga, digital marketing, dogs…"
            value={interestQuery}
            onChange={(e) => setInterestQuery(e.target.value)}
          />
          <select
            className="meta-input"
            value={interestGroup}
            onChange={(e) => setInterestGroup(e.target.value)}
          >
            <option value="all">All categories</option>
            {INTEREST_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <div className="max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-[var(--meta-line)] bg-[var(--meta-bg)] p-2">
          <div className="flex flex-wrap gap-1.5">
            {filteredInterests.map((item) => (
              <Chip
                key={item.id}
                active={value.interests.includes(item.id)}
                label={item.label}
                hint={item.group}
                onClick={() => toggle("interests", item.id)}
              />
            ))}
          </div>
          {filteredInterests.length === 0 ? (
            <p className="p-2 text-[12px] text-[var(--meta-muted)]">
              No match. Widen the search or type your own interest below.
            </p>
          ) : interestQuery.trim() === "" && interestGroup === "all" ? (
            <p className="mt-2 px-1 text-[11px] text-[var(--meta-muted)]">
              Showing a starter set — search or pick a category to browse all {INTEREST_LEAVES.length}.
            </p>
          ) : null}
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-[var(--meta-muted)]">Other interest (your words)</span>
          <input
            className="meta-input"
            placeholder="e.g. Ayurveda, SaaS founders, bridal wear"
            value={value.interestOther ?? ""}
            onChange={(e) => onChange({ ...value, interestOther: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-2 rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
        <p className="text-[12px] font-semibold text-[var(--meta-ink)]">Behaviors</p>
        <div className="flex flex-wrap gap-1.5">
          {BEHAVIOR_LEAVES.map((item) => (
            <Chip
              key={item.id}
              active={value.behaviors.includes(item.id)}
              label={item.label}
              hint={item.group}
              onClick={() => toggle("behaviors", item.id)}
            />
          ))}
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-[var(--meta-muted)]">Other behavior</span>
          <input
            className="meta-input"
            placeholder="e.g. Frequent Instagram Shoppers, Expats"
            value={value.behaviorOther ?? ""}
            onChange={(e) => onChange({ ...value, behaviorOther: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-2 rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
        <p className="text-[12px] font-semibold text-[var(--meta-ink)]">Demographics</p>
        <div className="flex flex-wrap gap-1.5">
          {DEMOGRAPHIC_LEAVES.map((item) => (
            <Chip
              key={item.id}
              active={value.demographics.includes(item.id)}
              label={item.label}
              hint={item.group}
              onClick={() => toggle("demographics", item.id)}
            />
          ))}
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-[var(--meta-muted)]">Other demographic / life stage</span>
          <input
            className="meta-input"
            placeholder="e.g. New homeowners, College seniors"
            value={value.demographicOther ?? ""}
            onChange={(e) => onChange({ ...value, demographicOther: e.target.value })}
          />
        </label>
        <p className="text-[11px] text-[var(--meta-muted)]">
          Health, politics, religion, and orientation targeting were removed. Detailed exclusions were removed in 2025.
        </p>
      </section>

      <section className="space-y-2 rounded-md border border-[var(--meta-line)] bg-[var(--meta-card)] p-3">
        <p className="text-[12px] font-semibold text-[var(--meta-ink)]">Who to exclude (your words)</p>
        <textarea
          className="meta-input min-h-16"
          placeholder="e.g. Existing customers, staff emails, people who purchased in 30 days…"
          value={value.excludeNote ?? ""}
          onChange={(e) => onChange({ ...value, excludeNote: e.target.value })}
        />
      </section>
    </div>
  );
}

function Chip({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={hint}
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "border-[var(--meta-blue)] bg-[var(--meta-blue-soft)] text-[var(--meta-blue)]"
          : "border-[var(--meta-line)] bg-[var(--meta-card)] text-[var(--meta-ink)] hover:bg-[var(--meta-hover)]",
      )}
    >
      {label}
    </button>
  );
}

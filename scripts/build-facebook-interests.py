"""Parse The-Complete-List-of-Facebook-Interests.pdf text dump into a TS catalog."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT = ROOT / "tmp-fb-interests.txt"
OUT_TS = ROOT / "src" / "features" / "practice" / "meta" / "facebook-interests.ts"
OUT_JSON = ROOT / "tmp-fb-interests.json"

TOP = {
    "Business and industry",
    "Entertainment",
    "Family and relationships",
    "Fitness and wellness",
    "Food and drink",
    "Hobbies and activities",
    "Shopping and fashion",
    "Sports and outdoors",
    "Technology",
}

# Keep ids used by DEFAULT_TARGETING / older simulation facts.
# Prefer leaf labels when a mid-level and leaf would collide.
LEGACY = {
    # Keep Shopping vs Online shopping as separate ids, in-store vs digital.
    # (do not alias online_shopping → shopping)
    "luxury_goods": "luxury",
    "fashion_accessories": "fashion",
    "physical_fitness": "fitness",
    "yoga": "yoga",
    "cooking": "food",
    "coffee": "coffee",
    "consumer_electronics": "technology",
    "parenting": "family",
    "films": "entertainment",
    "video_games": "gaming",
    "outdoor_recreation": "sports",
    "travel": "travel_int",
    "photography": "photography",
    "interior_design": "home",
    "business": "business_category",
}


def slug(label: str) -> str:
    s = label.lower().replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return (s or "interest")[:48]


def main() -> None:
    raw_lines = TEXT.read_text(encoding="utf-8").splitlines()
    lines: list[str] = []
    for raw in raw_lines:
        s = raw.strip()
        if not s or s.startswith("---PAGE---") or s.startswith("The Complete"):
            continue
        lines.append(s)

    items: list[dict[str, str | None]] = []
    group: str | None = None
    parent: str | None = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line in TOP:
            group = line
            parent = None
            i += 1
            continue
        if line in ("●", "❏"):
            kind = "mid" if line == "●" else "leaf"
            j = i + 1
            while j < len(lines) and lines[j] in ("●", "❏"):
                j += 1
            if j >= len(lines):
                break
            label = lines[j]
            if label in TOP:
                i = j
                continue
            if kind == "mid":
                parent = label
                items.append({"label": label, "group": group or "Other", "level": "mid", "parent": None})
            else:
                items.append(
                    {"label": label, "group": group or "Other", "level": "leaf", "parent": parent},
                )
            i = j + 1
            continue
        i += 1

    seen: dict[str, bool] = {}
    out: list[dict[str, str]] = []
    for it in items:
        sid = slug(str(it["label"]))
        if sid in seen:
            n = 2
            while f"{sid}_{n}" in seen:
                n += 1
            sid = f"{sid}_{n}"
        seen[sid] = True
        out.append(
            {
                "id": sid,
                "label": str(it["label"]),
                "group": str(it["group"]),
            },
        )

    for it in out:
        if it["id"] in LEGACY:
            it["id"] = LEGACY[it["id"]]

    seen2: dict[str, bool] = {}
    final: list[dict[str, str]] = []
    for it in out:
        sid = it["id"]
        if sid in seen2:
            base = slug(it["label"])
            n = 2
            sid = f"{base}_{n}"
            while sid in seen2:
                n += 1
                sid = f"{base}_{n}"
            it = {**it, "id": sid}
        seen2[it["id"]] = True
        final.append(it)

    # Clarify store vs online, same Facebook tree, different shopper habits.
    LABEL_CLARITY = {
        "shopping": "Shopping (visit stores)",
        "online_shopping": "Online shopping",
        "shopping_centres": "Shopping centres (malls)",
        "boutiques": "Boutiques (in person)",
        "discount_shops": "Discount shops (in person)",
    }
    for it in final:
        if it["id"] in LABEL_CLARITY:
            it["label"] = LABEL_CLARITY[it["id"]]

    # Extra modern leaves not in the old PDF but useful for the desk.
    extras = [
        {"id": "ai", "label": "Artificial intelligence", "group": "Technology"},
        {"id": "ecommerce", "label": "Ecommerce", "group": "Business and industry"},
        {"id": "nutrition", "label": "Nutrition", "group": "Fitness and wellness"},
    ]
    for extra in extras:
        if extra["id"] not in seen2:
            final.append(extra)
            seen2[extra["id"]] = True

    OUT_JSON.write_text(json.dumps(final, indent=2), encoding="utf-8")

    lines_ts = [
        "/**",
        " * Facebook interest catalog for Simulation targeting.",
        " * Source: The-Complete-List-of-Facebook-Interests.pdf (user Downloads).",
        " * Built by scripts/build-facebook-interests.py, re-run that script if the PDF changes.",
        " */",
        "",
        "export interface FacebookInterest {",
        "  id: string;",
        "  label: string;",
        "  group: string;",
        "}",
        "",
        "export const FACEBOOK_INTERESTS: readonly FacebookInterest[] = [",
    ]
    for it in final:
        lab = it["label"].replace("\\", "\\\\").replace("'", "\\'")
        grp = it["group"].replace("\\", "\\\\").replace("'", "\\'")
        lines_ts.append(f"  {{ id: '{it['id']}', label: '{lab}', group: '{grp}' }},")
    lines_ts.append("];")
    lines_ts.append("")
    lines_ts.append("export const FACEBOOK_INTEREST_GROUPS = [")
    for g in sorted({it["group"] for it in final}):
        lines_ts.append(f"  '{g.replace(chr(39), chr(92) + chr(39))}',")
    lines_ts.append("] as const;")
    lines_ts.append("")

    OUT_TS.write_text("\n".join(lines_ts), encoding="utf-8")
    print("count", len(final))
    print(Counter(x["group"] for x in final))
    print("wrote", OUT_TS)


if __name__ == "__main__":
    main()

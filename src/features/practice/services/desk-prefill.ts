import { formatCount, formatDollars } from "@/lib/money";

export interface DeskCampaignSeed {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  dailyBudgetCents: number;
  /** From a sheet column such as headline, when present. */
  headline?: string | null;
  /** From a sheet column such as primary_text or copy, when present. */
  primaryText?: string | null;
  /** From a sheet column such as product, when present. */
  product?: string | null;
}

export interface DeskPrefill {
  headline: string;
  primaryText: string;
  product: string;
  headlineB: string;
  primaryTextB: string;
}

/** Turns a desk campaign (and optional sheet extras) into the simulation setup defaults. */
export function prefillFromDesk(campaign: DeskCampaignSeed | null | undefined): DeskPrefill {
  if (!campaign) {
    return {
      headline: "",
      primaryText: "",
      product: "",
      headlineB: "",
      primaryTextB: "",
    };
  }

  const product = (campaign.product?.trim() || guessProduct(campaign.name)).slice(0, 80);
  const headline = (campaign.headline?.trim() || campaign.name).slice(0, 120);
  const primaryText = (
    campaign.primaryText?.trim() ||
    defaultCopy(campaign.name, campaign.spendCents, campaign.clicks, campaign.conversions)
  ).slice(0, 280);

  return {
    headline,
    primaryText,
    product,
    headlineB: alternateHeadline(headline, product),
    primaryTextB: alternateCopy(primaryText, product),
  };
}

function guessProduct(name: string): string {
  const cleaned = name
    .replace(/\b(spring|holiday|brand|video|launch|retargeting|warm|cold|prospecting|holdout|creative|push)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 2 ? cleaned : name;
}

function defaultCopy(name: string, spendCents: number, clicks: number, conversions: number): string {
  const spend = spendCents > 0 ? ` Spend so far ${formatDollars(spendCents)}.` : "";
  const clicksLine = clicks > 0 ? ` ${formatCount(clicks)} clicks.` : "";
  const results = conversions > 0 ? ` ${formatCount(conversions)} results.` : "";
  return `${name}.${spend}${clicksLine}${results}`.trim();
}

function alternateHeadline(headline: string, product: string): string {
  if (/free trial|no card/i.test(headline)) return `${product || "This"}, try it this week`;
  if (product && headline.toLowerCase().includes(product.toLowerCase())) {
    return `Why people keep the ${product}`;
  }
  return `${headline} (shorter take)`;
}

function alternateCopy(primaryText: string, product: string): string {
  if (product) return `A clearer ${product} story. Same offer, different first line.`;
  return primaryText.length > 40 ? `${primaryText.slice(0, 40).trim()}…` : `${primaryText} (B)`;
}

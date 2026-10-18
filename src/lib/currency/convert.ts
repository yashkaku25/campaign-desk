import type { CurrencyCode } from "@/lib/currency/codes";

export interface RateQuote {
  currency: CurrencyCode;
  /** How many units of `currency` equal 1 US dollar. USD is always 1. */
  unitsPerUsd: number;
  /** The day the rate source published this table. */
  date: string;
  fresh: boolean;
}

export function convertCents(cents: number, unitsPerUsd: number): number {
  return (cents / 100) * unitsPerUsd;
}

export function currencyMark(currency: CurrencyCode): string {
  const mark = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(1)
    .find((part) => part.type === "currency");
  return mark?.value ?? currency;
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${number} ${currencyMark(currency)}`;
}

export function formatQuote(cents: number, quote: Pick<RateQuote, "currency" | "unitsPerUsd">): string {
  return formatAmount(convertCents(cents, quote.unitsPerUsd), quote.currency);
}

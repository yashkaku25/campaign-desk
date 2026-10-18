export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "INR"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  CAD: "Canadian dollar",
  INR: "Indian rupee",
};

export function isCurrency(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value);
}

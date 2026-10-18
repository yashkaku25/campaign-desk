import { CURRENCY_LABEL } from "@/lib/currency/codes";
import type { RateQuote } from "@/lib/currency/convert";
import { formatDay } from "@/lib/money";

export function RateNote({ quote }: { quote: RateQuote }) {
  if (quote.currency === "USD") return null;
  return (
    <p className="rounded-2xl border border-sea/30 bg-sea/10 px-4 py-3 text-sm text-sea">
      Shown in {CURRENCY_LABEL[quote.currency]}. Rate from {formatDay(quote.date)}
      {quote.fresh ? "" : ", kept from the last successful refresh"}. Saved amounts stay in US dollars.
    </p>
  );
}

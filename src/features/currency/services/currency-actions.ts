"use server";

import { getCurrentUser } from "@/features/auth/services/require-user";
import { isCurrency } from "@/lib/currency/codes";
import { loadRateTable } from "@/lib/currency/rates";
import type { RateQuote } from "@/lib/currency/convert";

export async function getQuote(): Promise<RateQuote> {
  const user = await getCurrentUser();
  const currency = user && isCurrency(user.currency) ? user.currency : "USD";
  const table = await loadRateTable();
  return {
    currency,
    unitsPerUsd: currency === "USD" ? 1 : table.rates[currency],
    date: table.date,
    fresh: table.fresh,
  };
}

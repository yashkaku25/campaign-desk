"use client";

import Link from "next/link";

export function CurrencyPicker() {
  return (
    <Link href="/settings" className="text-sm font-semibold text-indigo">
      Change currency in settings
    </Link>
  );
}

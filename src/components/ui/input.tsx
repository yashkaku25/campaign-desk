import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-line bg-card px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-ink",
        className,
      )}
      {...props}
    />
  );
}

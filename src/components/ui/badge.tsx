import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  active: "bg-live text-white",
  paused: "bg-hold text-white",
  draft: "bg-ink/10 text-ink",
  ended: "bg-ink/10 text-muted",
  pending: "bg-ink text-paper",
  approved: "bg-live text-white",
  rejected: "bg-ink/10 text-ink",
  failed: "bg-clay text-white",
  expired: "bg-ink/10 text-muted",
};

export function Badge({ value }: { value: string }) {
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[value] ?? tones.draft)}>
      {label}
    </span>
  );
}

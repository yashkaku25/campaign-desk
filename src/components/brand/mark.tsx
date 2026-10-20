import { cn } from "@/lib/utils";

const dots = [
  { name: "pine", className: "bg-pine" },
  { name: "indigo", className: "bg-indigo" },
  { name: "amber", className: "bg-amber" },
  { name: "rose", className: "bg-rose" },
] as const;

export function BrandMark({
  tone = "ink",
  word = true,
  className,
}: {
  tone?: "ink" | "paper";
  word?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3 whitespace-nowrap", className)}>
      <span className="grid grid-cols-2 gap-1" aria-hidden="true">
        {dots.map((dot) => (
          <span key={dot.name} className={cn("size-2.5 rounded-full", dot.className)} />
        ))}
      </span>
      {word ? (
        <span
          className={cn(
            "font-sans text-xl font-semibold leading-none tracking-tight",
            tone === "paper" ? "text-paper" : "text-ink",
          )}
        >
          Campaign desk
        </span>
      ) : (
        <span className="sr-only">Campaign desk</span>
      )}
    </span>
  );
}

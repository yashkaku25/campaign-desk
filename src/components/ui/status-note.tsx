import { Spinner } from "@/components/ui/spinner";

export function StatusNote({
  tone,
  children,
}: {
  tone: "ok" | "bad" | "wait";
  children: React.ReactNode;
}) {
  if (tone === "wait") {
    return (
      <p role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
        <Spinner />
        {children}
      </p>
    );
  }

  const color = tone === "ok" ? "text-live" : "text-clay";
  return (
    <p role="status" className={`text-sm font-semibold ${color}`}>
      {children}
    </p>
  );
}

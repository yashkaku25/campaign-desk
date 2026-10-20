"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg rounded-3xl border border-line bg-card px-6 py-10">
      <h1 className="font-sans font-semibold tracking-tight text-3xl">This screen could not load.</h1>
      <p className="mt-3 text-sm text-muted">{error.message}</p>
      <button
        type="button"
        className="mt-6 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-paper"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}

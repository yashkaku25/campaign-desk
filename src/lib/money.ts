export function formatDollars(cents: number): string {
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return `${number} $`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCtr(ctr: number | null): string {
  if (ctr === null) return "—";
  return `${(ctr * 100).toFixed(2)}%`;
}

export function formatDay(isoDay: string): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  if (!year || !month || !day) return isoDay;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function statusLabel(status: string): string {
  if (status.length === 0) return status;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

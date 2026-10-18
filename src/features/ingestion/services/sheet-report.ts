export type ImportKind = "sheet" | "picture" | "file";

export function describeImport(input: {
  kind: ImportKind;
  metricCount: number;
  extraColumns: string[];
  skipped: number;
  queued: number;
  needsBudget: string[];
  outOfRange: string[];
  alreadyWaiting: boolean;
  leftOut: boolean;
}): { ok: boolean; message: string } {
  const parts: string[] = [];
  if (input.kind === "picture") parts.push("Read the picture.");
  if (input.metricCount > 0) {
    parts.push(
      input.kind === "picture"
        ? `Saved ${input.metricCount} days of numbers.`
        : `Synced ${input.metricCount} metric rows.`,
    );
  }
  if (input.extraColumns.length > 3) {
    parts.push(
      input.kind === "picture"
        ? `The picture has ${input.extraColumns.length} other columns.`
        : `Kept ${input.extraColumns.length} other columns.`,
    );
  } else if (input.extraColumns.length > 0) {
    parts.push(`Also kept ${input.extraColumns.map(plainColumn).join(", ")}.`);
  }
  if (input.skipped > 0) parts.push(`Skipped ${input.skipped} incomplete rows.`);
  if (input.queued > 0) {
    parts.push(input.kind === "picture" ? "Review the new campaigns in Chat." : "Review the sheet in Chat. Nothing new is saved until you approve.");
  }
  if (input.needsBudget.length === 1) {
    parts.push(`Add a daily budget for ${shortName(input.needsBudget[0] ?? "")}, then try again.`);
  } else if (input.needsBudget.length > 1) {
    parts.push(`Add a daily budget for ${input.needsBudget.length} new campaigns, then try again.`);
  }
  if (input.outOfRange.length > 0) {
    parts.push(`${input.outOfRange.length} campaigns sit outside the daily budget range, so those rows were left out.`);
  }
  if (input.alreadyWaiting) parts.push("Those new campaigns are already waiting in Chat.");
  if (input.leftOut) parts.push("The desk holds 25 campaigns. The rest was left out.");

  const saved = input.metricCount > 0 || input.queued > 0;
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "Read the picture.")) {
    return {
      ok: true,
      message: input.kind === "picture" ? "The picture matches the desk." : "The sheet already matches the desk.",
    };
  }
  return { ok: saved || input.kind !== "picture", message: parts.join(" ") };
}

function plainColumn(key: string): string {
  return key.replaceAll("_", " ");
}

function shortName(name: string): string {
  const clean = name.trim();
  return clean.length > 40 ? `${clean.slice(0, 37)}…` : clean;
}

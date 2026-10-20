const SHEET_URL = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:[/?#].*)?$/;

export function sheetIdFromUrl(raw: string): string | null {
  const match = raw.trim().match(SHEET_URL);
  return match?.[1] ?? null;
}

export function normalizeModelCsv(csv: string): string {
  let text = csv.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:csv)?\s*/i, "").replace(/```$/, "").trim();
  }
  if (!text.includes("\n") && text.includes("\\n")) {
    text = text.replaceAll("\\r\\n", "\n").replaceAll("\\n", "\n");
  }
  return text;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export interface ParsedCsvWord {
  word: string;
  date?: Date;
}

/**
 * Parse CSV text extracting words and optional timestamps.
 * Supports headers like "word,date" or single-column lists.
 */
export function parseWordsCsv(csvContent: string): ParsedCsvWord[] {
  if (!csvContent || typeof csvContent !== "string") return [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const results: ParsedCsvWord[] = [];
  let wordColIdx = 0;
  let dateColIdx = -1;
  let startIndex = 0;

  // Check if first row is a header
  const firstRowCols = lines[0]
    .split(",")
    .map((c) => c.trim().toLowerCase().replace(/['"]/g, ""));
  const hasHeader = firstRowCols.some((c) =>
    [
      "word",
      "palabra",
      "vocab",
      "term",
      "date",
      "fecha",
      "added_at",
      "created_at",
    ].includes(c),
  );

  if (hasHeader) {
    startIndex = 1;
    const foundWordIdx = firstRowCols.findIndex((c) =>
      ["word", "palabra", "vocab", "term"].includes(c),
    );
    if (foundWordIdx !== -1) wordColIdx = foundWordIdx;

    const foundDateIdx = firstRowCols.findIndex((c) =>
      [
        "date",
        "fecha",
        "added_at",
        "added",
        "created_at",
        "timestamp",
      ].includes(c),
    );
    if (foundDateIdx !== -1) dateColIdx = foundDateIdx;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by comma ignoring commas enclosed in quotes
    const cols = rawLine
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((c) => c.trim().replace(/^"|"$/g, ""));

    const rawWord = cols[wordColIdx]?.trim().toLowerCase();
    if (!rawWord) continue;

    let parsedDate: Date | undefined = undefined;
    if (dateColIdx !== -1 && cols[dateColIdx]) {
      const parsedTime = Date.parse(cols[dateColIdx]);
      if (!isNaN(parsedTime)) {
        parsedDate = new Date(parsedTime);
      }
    }

    results.push({
      word: rawWord,
      date: parsedDate,
    });
  }

  return results;
}

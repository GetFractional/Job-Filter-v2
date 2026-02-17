export interface PositionedTextToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface TokenLine {
  y: number;
  avgHeight: number;
  page: number;
  tokens: PositionedTextToken[];
}

interface MaterializedLine {
  text: string;
  y: number;
  minX: number;
  maxX: number;
  page: number;
}

function lineThreshold(a: TokenLine, b: PositionedTextToken): number {
  const basis = Math.max(a.avgHeight, b.height);
  return Math.max(2.2, Math.min(8.5, basis * 0.65));
}

function joinTokens(tokens: PositionedTextToken[]): { text: string; minX: number; maxX: number } {
  const sorted = [...tokens].sort((a, b) => a.x - b.x);

  let text = '';
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let previousRight: number | null = null;

  for (const token of sorted) {
    const value = token.text.replace(/\s+/g, ' ').trim();
    if (!value) continue;

    minX = Math.min(minX, token.x);
    const tokenRight = token.x + Math.max(token.width, value.length * 3.8);
    maxX = Math.max(maxX, tokenRight);

    if (previousRight !== null) {
      const gap = token.x - previousRight;
      const approxChar = Math.max(3.2, token.width / Math.max(value.length, 1));
      if (gap > approxChar * 0.6) text += ' ';
      if (gap > approxChar * 2.6) text += ' ';
    }

    text += value;
    previousRight = tokenRight;
  }

  return {
    text: text.replace(/\s{2,}/g, ' ').trim(),
    minX: Number.isFinite(minX) ? minX : 0,
    maxX: Number.isFinite(maxX) ? maxX : 0,
  };
}

function splitTokenSegments(tokens: PositionedTextToken[]): PositionedTextToken[][] {
  const sorted = [...tokens].sort((a, b) => a.x - b.x);
  if (sorted.length <= 1) return [sorted];

  const segments: PositionedTextToken[][] = [[]];
  let previousRight = sorted[0].x + Math.max(sorted[0].width, sorted[0].text.length * 3.8);
  segments[0].push(sorted[0]);

  for (let i = 1; i < sorted.length; i += 1) {
    const token = sorted[i];
    const gap = token.x - previousRight;
    if (gap > 120) {
      segments.push([token]);
    } else {
      segments[segments.length - 1].push(token);
    }
    previousRight = token.x + Math.max(token.width, token.text.length * 3.8);
  }

  return segments;
}

function orderSingleColumn(lines: MaterializedLine[]): MaterializedLine[] {
  return [...lines].sort((a, b) => b.y - a.y || a.minX - b.minX);
}

function splitColumns(lines: MaterializedLine[]): MaterializedLine[] {
  if (lines.length < 14) return orderSingleColumn(lines);

  const minXs = lines.map((line) => line.minX).sort((a, b) => a - b);
  let maxGap = 0;
  let splitAt = 0;

  for (let i = 1; i < minXs.length; i += 1) {
    const gap = minXs[i] - minXs[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      splitAt = minXs[i - 1] + gap / 2;
    }
  }

  if (maxGap < 105) return orderSingleColumn(lines);

  const left = lines.filter((line) => line.minX <= splitAt);
  const right = lines.filter((line) => line.minX > splitAt);

  if (left.length < 6 || right.length < 6) return orderSingleColumn(lines);

  return [...orderSingleColumn(left), ...orderSingleColumn(right)];
}

function materializeLines(lines: TokenLine[]): MaterializedLine[] {
  const materialized: MaterializedLine[] = [];

  for (const line of lines) {
    const segments = splitTokenSegments(line.tokens);
    for (const segment of segments) {
      const merged = joinTokens(segment);
      if (!merged.text) continue;
      materialized.push({
        text: merged.text,
        y: line.y,
        minX: merged.minX,
        maxX: merged.maxX,
        page: line.page,
      });
    }
  }

  return materialized;
}

export function reconstructPageLines(tokens: PositionedTextToken[]): string[] {
  if (tokens.length === 0) return [];

  const rows: TokenLine[] = [];
  const orderedTokens = [...tokens].sort((a, b) => b.y - a.y || a.x - b.x);

  for (const token of orderedTokens) {
    let bestIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (row.page !== token.page) continue;

      const delta = Math.abs(row.y - token.y);
      if (delta <= lineThreshold(row, token) && delta < bestDelta) {
        bestDelta = delta;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) {
      rows.push({
        y: token.y,
        avgHeight: token.height || 10,
        page: token.page,
        tokens: [token],
      });
      continue;
    }

    const row = rows[bestIndex];
    const previousCount = row.tokens.length;
    row.tokens.push(token);
    row.y = (row.y * previousCount + token.y) / (previousCount + 1);
    row.avgHeight = (row.avgHeight * previousCount + token.height) / (previousCount + 1);
  }

  const materialized = materializeLines(rows);
  const byPage = new Map<number, MaterializedLine[]>();

  for (const line of materialized) {
    const bucket = byPage.get(line.page) || [];
    bucket.push(line);
    byPage.set(line.page, bucket);
  }

  const output: string[] = [];
  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    const ordered = splitColumns(byPage.get(page) || []);
    ordered.forEach((line) => output.push(line.text));
  }

  return output;
}

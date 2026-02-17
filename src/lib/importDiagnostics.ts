export interface BulletGlyphCount {
  glyph: string;
  count: number;
}

export interface TextStageMetrics {
  extractedChars: number;
  detectedLinesCount: number;
  bulletCandidatesCount: number;
  topBulletGlyphs: BulletGlyphCount[];
}

const BULLET_GLYPH_RE = /^[\s]*([•●◦▪▫‣⁃\-–—*✅✔➤➔])/u;

export function countTopBulletGlyphs(lines: string[], max = 8): BulletGlyphCount[] {
  const counts = new Map<string, number>();

  for (const line of lines) {
    const match = line.match(BULLET_GLYPH_RE);
    if (!match) continue;

    const glyph = match[1];
    counts.set(glyph, (counts.get(glyph) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([glyph, count]) => ({ glyph, count }));
}

export function summarizeTextStage(lines: string[]): TextStageMetrics {
  const nonEmptyLines = lines.map((line) => line.trim()).filter(Boolean);
  const topBulletGlyphs = countTopBulletGlyphs(nonEmptyLines);
  const bulletCandidatesCount = topBulletGlyphs.reduce((total, item) => total + item.count, 0);

  return {
    extractedChars: nonEmptyLines.join('\n').length,
    detectedLinesCount: nonEmptyLines.length,
    bulletCandidatesCount,
    topBulletGlyphs,
  };
}

export function toNumberedPreview(lines: string[], maxLines = 40): { line: number; text: string }[] {
  const numbered: { line: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i].trim();
    if (!text) continue;
    numbered.push({ line: i + 1, text });
    if (numbered.length >= maxLines) break;
  }

  return numbered;
}

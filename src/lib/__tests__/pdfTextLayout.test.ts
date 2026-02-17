import { describe, expect, it } from 'vitest';
import { reconstructPageLines, type PositionedTextToken } from '../pdfTextLayout';

function token(text: string, x: number, y: number, page = 1): PositionedTextToken {
  return {
    text,
    x,
    y,
    width: Math.max(20, text.length * 5),
    height: 10,
    page,
  };
}

describe('pdfTextLayout', () => {
  it('orders two-column pages left column before right column', () => {
    const tokens: PositionedTextToken[] = [
      token('Left Company', 42, 700),
      token('Left Role', 42, 680),
      token('• Increased pipeline by 32%', 42, 660),
      token('• Built lifecycle strategy', 42, 640),
      token('Right Company', 330, 700),
      token('Right Role', 330, 680),
      token('• Improved CAC by 18%', 330, 660),
      token('• Standardized reporting', 330, 640),
      token('Left Company 2', 42, 610),
      token('Left Role 2', 42, 590),
      token('• Added partner channel', 42, 570),
      token('• Raised conversion', 42, 550),
      token('Right Company 2', 330, 610),
      token('Right Role 2', 330, 590),
      token('• Built dashboards', 330, 570),
      token('• Reduced lag', 330, 550),
    ];

    const lines = reconstructPageLines(tokens);

    const leftIndex = lines.findIndex((line) => line.includes('Left Company'));
    const rightIndex = lines.findIndex((line) => line.includes('Right Company'));

    expect(leftIndex).toBeGreaterThanOrEqual(0);
    expect(rightIndex).toBeGreaterThanOrEqual(0);
    expect(leftIndex).toBeLessThan(rightIndex);
  });

  it('preserves spacing for separated tokens on same line', () => {
    const lines = reconstructPageLines([
      token('Senior', 40, 500),
      token('Growth', 100, 500),
      token('Manager', 160, 500),
      token('Acme', 280, 500),
    ]);

    expect(lines[0]).toContain('Senior Growth Manager');
    expect(lines[0]).toContain('Acme');
  });
});

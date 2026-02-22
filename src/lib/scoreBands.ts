import type { FitLabel } from '../types';

export const SCORE_LABEL_THRESHOLDS = {
  pursueMin: 70,
  maybeMin: 40,
} as const;

export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getFitLabel(score: number): FitLabel {
  const normalized = clampScore(score);
  if (normalized >= SCORE_LABEL_THRESHOLDS.pursueMin) return 'Pursue';
  if (normalized >= SCORE_LABEL_THRESHOLDS.maybeMin) return 'Maybe';
  return 'Pass';
}

export function getEffectiveFitLabel(score: number | undefined, label: FitLabel | undefined): FitLabel | undefined {
  if (score === undefined) return label;
  return getFitLabel(score);
}

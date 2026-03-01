import { describe, expect, it } from 'vitest';
import { getEffectiveFitLabel, getFitLabel, getFitLabelText } from '../scoreBands';

describe('score band contract', () => {
  it('maps 0-39 to Pass', () => {
    expect(getFitLabel(0)).toBe('Pass');
    expect(getFitLabel(39)).toBe('Pass');
  });

  it('maps 40-69 to Maybe', () => {
    expect(getFitLabel(40)).toBe('Maybe');
    expect(getFitLabel(69)).toBe('Maybe');
  });

  it('maps 70-100 to Pursue', () => {
    expect(getFitLabel(70)).toBe('Pursue');
    expect(getFitLabel(100)).toBe('Pursue');
  });

  it('prefers score-derived label when score is present', () => {
    expect(getEffectiveFitLabel(15, 'Pursue')).toBe('Pass');
    expect(getEffectiveFitLabel(undefined, 'Maybe')).toBe('Maybe');
  });

  it('renders user-facing pass label text clearly', () => {
    expect(getFitLabelText('Pass')).toBe('Pass on this job');
    expect(getFitLabelText('Maybe')).toBe('Maybe');
  });
});

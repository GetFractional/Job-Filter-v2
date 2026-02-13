import { describe, it, expect } from 'vitest';
import { isClosedWonDemotionBlocked } from '../stageTransitions';

describe('isClosedWonDemotionBlocked', () => {
  it('blocks Closed Won -> Closed Lost to protect terminal won outcomes', () => {
    expect(isClosedWonDemotionBlocked('Closed Won', 'Closed Lost')).toBe(true);
  });

  it('does not block non-demotion transitions', () => {
    expect(isClosedWonDemotionBlocked('Interviewing', 'Offer')).toBe(false);
    expect(isClosedWonDemotionBlocked('Closed Lost', 'Closed Won')).toBe(false);
    expect(isClosedWonDemotionBlocked('Closed Won', 'Closed Won')).toBe(false);
  });
});

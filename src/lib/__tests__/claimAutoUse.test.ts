import { describe, it, expect } from 'vitest';
import { getAutoUsableClaims, isClaimAutoUsable } from '../claimAutoUse';
import type { Claim } from '../../types';

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'c1',
    company: 'Acme',
    role: 'Head of Growth',
    startDate: 'Jan 2021',
    responsibilities: ['Built lifecycle strategy'],
    tools: [],
    outcomes: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('claimAutoUse', () => {
  it('includes legacy claims with no review metadata', () => {
    expect(isClaimAutoUsable(makeClaim())).toBe(true);
  });

  it('excludes conflict/needs_review when autoUse is not enabled', () => {
    expect(isClaimAutoUsable(makeClaim({ reviewStatus: 'conflict' }))).toBe(false);
    expect(isClaimAutoUsable(makeClaim({ reviewStatus: 'needs_review' }))).toBe(false);
  });

  it('allows explicit override when autoUse=true', () => {
    expect(isClaimAutoUsable(makeClaim({ reviewStatus: 'conflict', autoUse: true }))).toBe(true);
  });

  it('filters only auto-usable claims', () => {
    const claims = [
      makeClaim({ id: '1' }),
      makeClaim({ id: '2', reviewStatus: 'conflict' }),
      makeClaim({ id: '3', reviewStatus: 'needs_review', autoUse: true }),
    ];

    const filtered = getAutoUsableClaims(claims);
    expect(filtered.map((claim) => claim.id)).toEqual(['1', '3']);
  });
});

import { describe, expect, it } from 'vitest';
import type { Claim } from '../../types';
import {
  FutureRemoteClaimsProvider,
  LocalClaimsProvider,
  filterAutoUsableClaims,
  summarizeClaimsAvailability,
} from '../claimsProvider';

function makeClaim(id: string, status?: 'active' | 'conflict' | 'needs_review'): Claim {
  return {
    id,
    company: 'Acme',
    role: 'Director of Growth',
    startDate: 'Jan 2022',
    responsibilities: ['Built lifecycle program'],
    tools: ['HubSpot'],
    outcomes: [{ description: 'Grew revenue 120%', metric: '120%', isNumeric: true, verified: false }],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...(status ? { status } : {}),
  } as Claim;
}

describe('claimsProvider helpers', () => {
  it('filters conflicts and needs_review from auto-usable claims', () => {
    const claims = [
      makeClaim('a', 'active'),
      makeClaim('b', 'conflict'),
      makeClaim('c', 'needs_review'),
      makeClaim('d'),
    ];

    const autoUsable = filterAutoUsableClaims(claims);
    expect(autoUsable.map((claim) => claim.id)).toEqual(['a', 'd']);
  });

  it('summarizes claim availability and warnings', () => {
    const claims = [
      makeClaim('a', 'active'),
      makeClaim('b', 'conflict'),
      makeClaim('c', 'needs_review'),
    ];

    const summary = summarizeClaimsAvailability(claims);
    expect(summary.totalClaims).toBe(3);
    expect(summary.autoUsableClaims).toBe(1);
    expect(summary.conflictClaims).toBe(1);
    expect(summary.needsReviewClaims).toBe(1);
    expect(summary.warnings.length).toBeGreaterThan(0);
  });
});

describe('claims provider implementations', () => {
  it('local provider returns claims and availability', async () => {
    const claims = [makeClaim('a'), makeClaim('b', 'conflict')];
    const provider = new LocalClaimsProvider(() => claims);

    await expect(provider.getClaims()).resolves.toHaveLength(2);
    await expect(provider.getAutoUsableClaims()).resolves.toHaveLength(1);
    const availability = await provider.getAvailability();
    expect(availability.conflictClaims).toBe(1);
  });

  it('future remote provider is a safe stub', async () => {
    const provider = new FutureRemoteClaimsProvider();
    const availability = await provider.getAvailability();
    expect(availability.totalClaims).toBe(0);
    expect(availability.warnings[0]).toContain('not configured');
  });
});

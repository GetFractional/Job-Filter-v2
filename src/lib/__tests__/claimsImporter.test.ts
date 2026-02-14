import { describe, expect, it } from 'vitest';
import type { ParsedClaim } from '../claimParser';
import type { Claim } from '../../types';
import {
  isLikelyDuplicateClaim,
  parseClaimsForImport,
  prepareClaimsFromParsedClaims,
  summarizeClaimsHealth,
} from '../claimsImporter';

function makeParsedClaim(overrides: Partial<ParsedClaim>): ParsedClaim {
  return {
    _key: overrides._key || 'claim-key',
    role: overrides.role || 'Director of Growth',
    company: overrides.company || 'Acme',
    startDate: overrides.startDate || 'Jan 2022',
    endDate: overrides.endDate || '',
    responsibilities: overrides.responsibilities || [],
    tools: overrides.tools || [],
    outcomes: overrides.outcomes || [],
    included: overrides.included ?? true,
  };
}

describe('prepareClaimsFromParsedClaims', () => {
  it('deduplicates highly similar claims for the same company and role', () => {
    const parsed: ParsedClaim[] = [
      makeParsedClaim({
        _key: 'a',
        outcomes: [{ description: 'Increased revenue 120% YoY', metric: '120%', isNumeric: true }],
      }),
      makeParsedClaim({
        _key: 'b',
        outcomes: [{ description: 'Increased revenue by 120% year over year', metric: '120%', isNumeric: true }],
      }),
    ];

    const result = prepareClaimsFromParsedClaims(parsed, { source: 'Profile.pdf' });
    expect(result.inputCount).toBe(2);
    expect(result.dedupedCount).toBe(1);
    expect(result.claims[0].status).toBe('active');
  });

  it('marks conflicting metrics as conflict status', () => {
    const parsed: ParsedClaim[] = [
      makeParsedClaim({
        _key: 'a',
        company: 'Acme',
        startDate: 'Jan 2020',
        endDate: 'Dec 2021',
        outcomes: [{ description: 'Grew revenue to $2M ARR', metric: '$2M', isNumeric: true }],
      }),
      makeParsedClaim({
        _key: 'b',
        company: 'Acme',
        startDate: 'Jan 2022',
        endDate: 'Dec 2023',
        outcomes: [{ description: 'Grew revenue to $3M ARR', metric: '$3M', isNumeric: true }],
      }),
    ];

    const result = prepareClaimsFromParsedClaims(parsed, { source: 'Profile.pdf' });
    expect(result.dedupedCount).toBe(2);
    expect(result.conflictCount).toBe(2);
    expect(result.claims.every((claim) => claim.status === 'conflict')).toBe(true);
    expect(result.claims[0].conflictKey).toContain('acme|revenue');
  });
});

describe('parseClaimsForImport', () => {
  it('prefers LinkedIn profile parsing when it yields cleaner company/role structure', () => {
    const linkedInText = `
      Experience
      Get Fractional Owner October 2022 - Present (3 years 5 months) Mount Juliet, Tennessee
      Role: Fractional growth and operations consulting.
      ✅ Achievements: • Grew revenue 120% across client portfolio • Built lifecycle system with HubSpot
      Prosper Wireless Director of Growth September 2023 - November 2025 (2 years 3 months) Los Angeles, California
      ✅ Achievements: • Scaled revenue from $45M to $120M
      Education
    `;

    const parsed = parseClaimsForImport(linkedInText);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
    expect(parsed[0].company.length).toBeGreaterThan(0);
    expect(parsed[0].role.length).toBeGreaterThan(0);
    expect(parsed[0].role.length).toBeLessThan(120);
  });
});

describe('claims health helpers', () => {
  it('summarizes counts and last import metadata', () => {
    const claims: Claim[] = [
      {
        id: '1',
        company: 'Acme',
        role: 'Director',
        startDate: 'Jan 2022',
        responsibilities: ['Led lifecycle'],
        tools: ['HubSpot'],
        outcomes: [],
        claimText: 'Led lifecycle',
        source: 'Profile.pdf',
        verification: 'self_reported',
        status: 'active',
        metrics: [],
        createdAt: '2026-02-01T00:00:00.000Z',
        importedAt: '2026-02-10T00:00:00.000Z',
      },
      {
        id: '2',
        company: 'Acme',
        role: 'Director',
        startDate: 'Jan 2021',
        responsibilities: ['Revenue doubled'],
        tools: [],
        outcomes: [{ description: 'Revenue doubled', metric: '2x', isNumeric: true, verified: false }],
        claimText: 'Revenue doubled',
        source: 'Profile.pdf',
        verification: 'self_reported',
        status: 'conflict',
        metrics: [{ metricType: 'revenue', value: 2, unit: 'x', context: 'Revenue doubled', raw: '2x' }],
        conflictKey: 'acme|revenue',
        createdAt: '2026-02-01T00:00:00.000Z',
        importedAt: '2026-02-12T00:00:00.000Z',
      },
    ];

    const summary = summarizeClaimsHealth(claims);
    expect(summary.total).toBe(2);
    expect(summary.active).toBe(1);
    expect(summary.conflict).toBe(1);
    expect(summary.lastImportSource).toBe('Profile.pdf');
    expect(summary.lastImportTimestamp).toBe('2026-02-12T00:00:00.000Z');
  });

  it('detects likely duplicates against existing claims', () => {
    const existing: Claim = {
      id: 'existing',
      company: 'Acme',
      role: 'Director of Growth',
      startDate: 'Jan 2020',
      responsibilities: ['Built demand engine'],
      tools: [],
      outcomes: [{ description: 'Increased revenue 120%', metric: '120%', isNumeric: true, verified: false }],
      claimText: 'Increased revenue 120% through lifecycle experimentation',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const candidate = {
      company: 'Acme',
      role: 'Director of Growth',
      startDate: 'Jan 2020',
      responsibilities: [],
      tools: [],
      outcomes: [],
      claimText: 'Increased revenue by 120% through lifecycle testing',
      verification: 'self_reported' as const,
      status: 'active' as const,
      metrics: [],
      source: 'Profile.pdf',
      importedAt: '2026-02-14T00:00:00.000Z',
    };

    expect(isLikelyDuplicateClaim(candidate, existing)).toBe(true);
  });
});

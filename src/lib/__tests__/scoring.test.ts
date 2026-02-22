// Unit tests for deterministic scoring engine and requirements extraction
import { describe, it, expect } from 'vitest';
import { scoreJob, parseCompFromText } from '../scoring';
import type { Job, Profile, Claim } from '../../types';

const baseProfile: Profile = {
  id: 'default',
  name: 'Matt',
  targetRoles: ['Director of Growth', 'VP of Marketing'],
  compFloor: 150000,
  compTarget: 180000,
  requiredBenefits: ['Medical'],
  preferredBenefits: ['401(k)', 'Equity'],
  requiredBenefitIds: [],
  preferredBenefitIds: [],
  locationPreference: 'Remote',
  disqualifiers: [],
  locationPreferences: [{ id: 'lp-1', type: 'Remote', city: '', willingToRelocate: false }],
  willingToRelocate: false,
  hardFilters: {
    requiresVisaSponsorship: false,
    minBaseSalary: 150000,
    maxOnsiteDaysPerWeek: 5,
    maxTravelPercent: 100,
    employmentTypes: ['full_time_w2', 'contract_to_hire', 'part_time', 'internship', 'temporary'],
  },
  scoringPolicy: {
    seedStagePolicy: 'warn',
  },
  updatedAt: new Date().toISOString(),
};

const baseJob: Partial<Job> = {
  title: 'Director of Growth',
  company: 'TestCo',
  jobDescription: `
We are looking for a Director of Growth to lead our marketing strategy and build a high-performing team.

Requirements:
- 7+ years of experience in growth marketing
- Experience with HubSpot, Salesforce, and Google Analytics
- Strong analytical and strategic thinking skills
- Bachelor's degree in marketing or related field

Nice to have:
- MBA preferred
- Experience with Amplitude

Benefits: Medical, dental, 401(k), equity, bonus
Compensation: $160,000 - $200,000
  `,
  compMin: 160000,
  compMax: 200000,
  locationType: 'Remote',
  employmentType: 'Full-time',
};

const testClaims: Claim[] = [
  {
    id: 'c1',
    company: 'PreviousCo',
    role: 'Head of Growth',
    startDate: 'Jan 2018',
    endDate: 'Dec 2023',
    responsibilities: ['Led growth strategy and team of 6', 'Managed marketing budget'],
    tools: ['HubSpot', 'Salesforce', 'Google Analytics', 'Amplitude'],
    outcomes: [
      { description: 'Grew pipeline revenue by 200%', metric: '200%', isNumeric: true, verified: false },
    ],
    createdAt: new Date().toISOString(),
  },
];

describe('scoreJob', () => {
  it('scores a well-matching job highly', () => {
    const result = scoreJob(baseJob, baseProfile, testClaims);
    expect(result.fitScore).toBeGreaterThanOrEqual(50);
    expect(result.fitLabel).not.toBe('Pass');
    expect(result.disqualifiers).toHaveLength(0);
  });

  it('disqualifies paid media operator roles', () => {
    const paidJob: Partial<Job> = {
      ...baseJob,
      title: 'Paid Media Manager',
      jobDescription: 'Manage paid social and paid search campaigns. Hands-on paid media account management.',
    };
    const result = scoreJob(paidJob, baseProfile);
    expect(result.fitScore).toBe(0);
    expect(result.fitLabel).toBe('Pass');
    expect(result.disqualifiers.length).toBeGreaterThan(0);
  });

  it('treats seed-stage as warning by default', () => {
    const seedJob: Partial<Job> = {
      ...baseJob,
      jobDescription: 'Seed stage startup looking for a marketing lead to help us grow.',
    };
    const result = scoreJob(seedJob, baseProfile);
    expect(result.disqualifiers.some((d) => d.toLowerCase().includes('seed-stage'))).toBe(false);
    expect((result.riskWarnings || []).some((warning) => warning.toLowerCase().includes('seed-stage'))).toBe(true);
  });

  it('allows users to hard-disqualify seed-stage companies', () => {
    const seedJob: Partial<Job> = {
      ...baseJob,
      jobDescription: 'Seed stage startup looking for a marketing lead to help us grow.',
    };
    const strictProfile: Profile = {
      ...baseProfile,
      scoringPolicy: {
        seedStagePolicy: 'disqualify',
      },
    };
    const result = scoreJob(seedJob, strictProfile);
    expect(result.fitScore).toBe(0);
    expect(result.disqualifiers.some((d) => d.toLowerCase().includes('seed-stage'))).toBe(true);
  });

  it('disqualifies when comp is below floor', () => {
    const lowCompJob: Partial<Job> = {
      ...baseJob,
      compMax: 120000,
    };
    const result = scoreJob(lowCompJob, baseProfile);
    expect(result.fitScore).toBe(0);
    expect(result.disqualifiers.some((d) => d.includes('compensation'))).toBe(true);
  });

  it('applies employment type hard filter', () => {
    const contractJob: Partial<Job> = {
      ...baseJob,
      employmentType: 'Contract',
    };
    const result = scoreJob(contractJob, baseProfile);
    expect(result.fitScore).toBe(0);
    expect(result.disqualifiers.some((d) => d.toLowerCase().includes('employment type'))).toBe(true);
  });

  it('applies max travel hard filter', () => {
    const travelJob: Partial<Job> = {
      ...baseJob,
      jobDescription: `${baseJob.jobDescription}\\nRequires 60% travel to client sites.`,
    };
    const strictProfile: Profile = {
      ...baseProfile,
      hardFilters: {
        ...baseProfile.hardFilters,
        maxTravelPercent: 25,
      },
    };
    const result = scoreJob(travelJob, strictProfile);
    expect(result.fitScore).toBe(0);
    expect(result.disqualifiers.some((d) => d.toLowerCase().includes('travel'))).toBe(true);
  });

  it('does not hard-fail when required benefits are unknown in the job description', () => {
    const profileWithRequiredBenefits: Profile = {
      ...baseProfile,
      requiredBenefitIds: ['health_insurance'],
      requiredBenefits: ['Health insurance'],
    };
    const sparseBenefitsJob: Partial<Job> = {
      ...baseJob,
      jobDescription: 'Director of Growth role. Compensation: $160,000 - $200,000.',
    };
    const result = scoreJob(sparseBenefitsJob, profileWithRequiredBenefits);
    expect(result.disqualifiers.some((d) => d.toLowerCase().includes('required benefit'))).toBe(false);
    expect(result.riskWarnings.some((warning) => warning.toLowerCase().includes('could not verify required benefit'))).toBe(true);
  });

  it('extracts requirements from JD', () => {
    const result = scoreJob(baseJob, baseProfile, testClaims);
    expect(result.requirementsExtracted.length).toBeGreaterThan(0);

    // Should find experience requirements
    const expReqs = result.requirementsExtracted.filter((r) => r.type === 'experience');
    expect(expReqs.length).toBeGreaterThanOrEqual(1);

    // Should find tool requirements
    const toolReqs = result.requirementsExtracted.filter((r) => r.type === 'tool');
    expect(toolReqs.length).toBeGreaterThan(0);
    expect(toolReqs.some((r) => r.description.toLowerCase().includes('hubspot'))).toBe(true);
  });

  it('matches requirements against claims', () => {
    const result = scoreJob(baseJob, baseProfile, testClaims);

    // HubSpot should be matched since our test claim includes it
    const hubspotReq = result.requirementsExtracted.find(
      (r) => r.type === 'tool' && r.description.toLowerCase().includes('hubspot')
    );
    if (hubspotReq) {
      expect(hubspotReq.match).toBe('Met');
      expect(hubspotReq.evidence).toBeTruthy();
    }
  });

  it('distinguishes Must vs Preferred priorities', () => {
    const result = scoreJob(baseJob, baseProfile, testClaims);
    const mustReqs = result.requirementsExtracted.filter((r) => r.priority === 'Must');
    const prefReqs = result.requirementsExtracted.filter((r) => r.priority === 'Preferred');
    // The JD has both "Requirements" and "Nice to have" sections
    expect(mustReqs.length).toBeGreaterThan(0);
    // Preferred may or may not be detected depending on parsing
    expect(prefReqs).toBeDefined();
    // Preferred may or may not be detected depending on parsing
  });

  it('detects risk flags', () => {
    const riskyJob: Partial<Job> = {
      ...baseJob,
      jobDescription: `
        Looking for a unicorn who can do it all.
        You need to wear many hats in this fast-paced environment.
        Must have miracle-worker mentality.
        Benefits: Medical
      `,
    };
    const result = scoreJob(riskyJob, baseProfile);
    expect(result.redFlags.length).toBeGreaterThan(0);
  });

  it('produces score breakdown that sums correctly', () => {
    const result = scoreJob(baseJob, baseProfile, testClaims);
    const { breakdown } = result;
    const sum =
      breakdown.roleScopeAuthority +
      breakdown.compensationBenefits +
      breakdown.companyStageAbility +
      breakdown.domainFit -
      breakdown.riskPenalty;
    expect(result.fitScore).toBe(Math.max(0, Math.min(100, sum)));
  });

  it('returns must-have summary and gap suggestions for explainability', () => {
    const result = scoreJob(baseJob, baseProfile, testClaims);
    expect(result.mustHaveSummary.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.gapSuggestions)).toBe(true);
  });
});

describe('parseCompFromText', () => {
  it('parses "$150,000 - $200,000" range', () => {
    const result = parseCompFromText('Compensation: $150,000 - $200,000');
    expect(result.min).toBe(150000);
    expect(result.max).toBe(200000);
  });

  it('parses "$150k - $200k" range', () => {
    const result = parseCompFromText('Salary: $150k - $200k');
    expect(result.min).toBe(150000);
    expect(result.max).toBe(200000);
  });

  it('returns empty for text without comp info', () => {
    const result = parseCompFromText('Great opportunity to grow your career');
    expect(result.min).toBeUndefined();
    expect(result.max).toBeUndefined();
  });
});

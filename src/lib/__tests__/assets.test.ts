// Unit + integration tests for asset generation
// Key focus: no placeholder leakage, correct context binding
import { describe, it, expect } from 'vitest';
import {
  validateContext,
  generateOutreachEmail,
  generateLinkedInConnect,
  generateCoverLetter,
  generateFollowUpEmail,
  generateGrowthMemo,
  generateApplicationAnswer,
} from '../assets';
import type { Job, Claim, ResearchBrief } from '../../types';

const testJob: Job = {
  id: 'j1',
  title: 'Director of Growth',
  company: 'Pepper',
  jobDescription: 'Lead growth strategy for Pepper...',
  stage: 'Scored',
  stageTimestamps: {},
  locationType: 'Remote',
  employmentType: 'Full-time',
  disqualifiers: [],
  reasonsToPursue: [],
  reasonsToPass: [],
  redFlags: [],
  requirementsExtracted: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const testClaims: Claim[] = [
  {
    id: 'c1',
    company: 'PreviousCo',
    role: 'Head of Marketing',
    startDate: 'Jan 2020',
    endDate: '',
    responsibilities: ['Led marketing team of 8'],
    tools: ['HubSpot', 'Salesforce'],
    outcomes: [
      { description: 'Grew revenue 150% YoY', metric: '150%', isNumeric: true, verified: false },
    ],
    createdAt: new Date().toISOString(),
  },
];

const testResearch: ResearchBrief = {
  companyOverview: 'Pepper is a fast-growing B2B SaaS platform for restaurant commerce.',
  competitors: 'Toast, Square, Clover',
  gtmChannels: 'Direct sales, partnerships, content marketing',
  createdAt: new Date().toISOString(),
};

// ============================================================
// Context validation
// ============================================================

describe('validateContext', () => {
  it('passes with all required fields', () => {
    const result = validateContext({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
    });
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('fails when job title is missing', () => {
    const result = validateContext({
      job: { company: 'TestCo' } as Partial<Job>,
      userName: 'Matt',
      claims: testClaims,
    });
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('job.title');
  });

  it('fails when userName is missing', () => {
    const result = validateContext({
      job: testJob,
      userName: '',
      claims: testClaims,
    });
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('userName');
  });

  it('warns when no claims provided', () => {
    const result = validateContext({
      job: testJob,
      userName: 'Matt',
      claims: [],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ============================================================
// No placeholder leakage (integration)
// ============================================================

describe('No placeholder leakage', () => {
  const allGenerators = [
    {
      name: 'Outreach Email',
      generate: () => generateOutreachEmail({
        job: testJob,
        userName: 'Matt',
        claims: testClaims,
        research: testResearch,
      }),
    },
    {
      name: 'LinkedIn Connect',
      generate: () => generateLinkedInConnect({
        job: testJob,
        userName: 'Matt',
        claims: testClaims,
      }),
    },
    {
      name: 'Cover Letter',
      generate: () => generateCoverLetter({
        job: testJob,
        userName: 'Matt',
        claims: testClaims,
        research: testResearch,
      }),
    },
    {
      name: 'Follow-up Email',
      generate: () => generateFollowUpEmail({
        job: testJob,
        userName: 'Matt',
      }),
    },
    {
      name: 'Growth Memo',
      generate: () => generateGrowthMemo({
        job: testJob,
        userName: 'Matt',
        claims: testClaims,
        research: testResearch,
      }),
    },
  ];

  for (const { name, generate } of allGenerators) {
    it(`${name}: no "Acme Corp" or "COMPANY_NAME" placeholder`, () => {
      const content = generate();
      expect(content).not.toContain('Acme Corp');
      expect(content).not.toContain('COMPANY_NAME');
      expect(content).not.toContain('[company]');
      expect(content).not.toContain('{{');
    });

    it(`${name}: contains the actual company name`, () => {
      const content = generate();
      expect(content).toContain('Pepper');
    });

    it(`${name}: uses userName parameter, not hardcoded name`, () => {
      // Generate with a different userName
      const customName = 'Alexandra';
      let content: string;
      switch (name) {
        case 'Outreach Email':
          content = generateOutreachEmail({ job: testJob, userName: customName, claims: testClaims });
          break;
        case 'Cover Letter':
          content = generateCoverLetter({ job: testJob, userName: customName, claims: testClaims });
          break;
        case 'Follow-up Email':
          content = generateFollowUpEmail({ job: testJob, userName: customName });
          break;
        case 'Growth Memo':
          content = generateGrowthMemo({ job: testJob, userName: customName, claims: testClaims });
          break;
        default:
          return; // LinkedIn Connect doesn't include userName in output
      }
      expect(content).toContain(customName);
    });
  }
});

// ============================================================
// Outreach Email specifics
// ============================================================

describe('generateOutreachEmail', () => {
  it('uses contact name in greeting when provided', () => {
    const email = generateOutreachEmail({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
      contactName: 'Sarah',
    });
    expect(email).toContain('Hi Sarah,');
  });

  it('uses generic greeting when no contact name', () => {
    const email = generateOutreachEmail({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
    });
    expect(email).toContain('Hi there,');
  });

  it('includes claim evidence when available', () => {
    const email = generateOutreachEmail({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
    });
    expect(email).toContain('PreviousCo');
  });

  it('prefers edited claimText over fallback outcome text', () => {
    const editedClaims: Claim[] = [
      {
        ...testClaims[0],
        claimText: 'Built a lifecycle engine that raised qualified pipeline by 35%',
        outcomes: [
          { description: 'Old parsed outcome should not be preferred', metric: '35%', isNumeric: true, verified: false },
        ],
      },
    ];

    const email = generateOutreachEmail({
      job: testJob,
      userName: 'Matt',
      claims: editedClaims,
    });

    expect(email).toContain('Built a lifecycle engine that raised qualified pipeline by 35%');
    expect(email).not.toContain('Old parsed outcome should not be preferred');
  });
});

// ============================================================
// LinkedIn Connect
// ============================================================

describe('generateLinkedInConnect', () => {
  it('stays within 300 character limit', () => {
    const note = generateLinkedInConnect({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
    });
    expect(note.length).toBeLessThanOrEqual(300);
  });
});

// ============================================================
// Application Answer Generator
// ============================================================

describe('generateApplicationAnswer', () => {
  it('generates an answer with sources', () => {
    const result = generateApplicationAnswer({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
      research: testResearch,
      question: 'Why are you interested in this role?',
    });
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThanOrEqual(0);
  });

  it('handles experience questions', () => {
    const result = generateApplicationAnswer({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
      question: 'Tell us about your experience with growth marketing',
    });
    expect(result.answer).toContain('PreviousCo');
  });

  it('handles salary questions professionally', () => {
    const result = generateApplicationAnswer({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
      question: 'What is your expected salary?',
    });
    expect(result.answer.toLowerCase()).toContain('compensation');
    // Should NOT contain a hard number
    expect(result.answer).not.toMatch(/\$\d{3}/);
  });

  it('contains actual company name in answer', () => {
    const result = generateApplicationAnswer({
      job: testJob,
      userName: 'Matt',
      claims: testClaims,
      question: 'Why this company?',
    });
    expect(result.answer).toContain('Pepper');
  });
});

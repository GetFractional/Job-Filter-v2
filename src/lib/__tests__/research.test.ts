import { describe, it, expect } from 'vitest';
import { generateResearchPrompt, parseResearchPaste } from '../research';
import type { Job } from '../../types';

const mockJob: Job = {
  id: 'test-1',
  title: 'Head of Growth',
  company: 'Pepper',
  locationType: 'Remote',
  employmentType: 'Full-time',
  jobDescription: 'We are a SaaS platform looking for a Head of Growth...',
  stage: 'Captured',
  stageTimestamps: {},
  disqualifiers: [],
  reasonsToPursue: [],
  reasonsToPass: [],
  redFlags: [],
  requirementsExtracted: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('generateResearchPrompt', () => {
  it('returns an object with id, label, and prompt fields', () => {
    const result = generateResearchPrompt(mockJob);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('prompt');
  });

  it('includes the job title in the prompt', () => {
    const result = generateResearchPrompt(mockJob);
    expect(result.prompt).toContain('Head of Growth');
  });

  it('includes the company name in the prompt', () => {
    const result = generateResearchPrompt(mockJob);
    expect(result.prompt).toContain('Pepper');
  });

  it('includes the company name in the label', () => {
    const result = generateResearchPrompt(mockJob);
    expect(result.label).toContain('Pepper');
  });

  it('includes companyContext in the prompt when provided', () => {
    const result = generateResearchPrompt(mockJob, {
      companyContext: 'the spice company',
    });
    expect(result.prompt).toContain('the spice company');
  });

  it('includes industry in the prompt when provided via context', () => {
    const result = generateResearchPrompt(mockJob, {
      industry: 'MarTech',
    });
    expect(result.prompt).toContain('MarTech');
  });

  it('includes hqLocation in the prompt when provided', () => {
    const result = generateResearchPrompt(mockJob, {
      hqLocation: 'Nashville, TN',
    });
    expect(result.prompt).toContain('Nashville, TN');
    expect(result.prompt).toContain('headquartered in Nashville, TN');
  });

  it('extracts industry from job description when context.industry is not given', () => {
    // mockJob JD contains "SaaS" so extractIndustry should return "SaaS / Software"
    const result = generateResearchPrompt(mockJob);
    expect(result.prompt).toContain('SaaS / Software');
  });

  it('prefers context.industry over extracted industry', () => {
    const result = generateResearchPrompt(mockJob, { industry: 'Fintech' });
    expect(result.prompt).toContain('Fintech');
    // Should NOT fall back to extracted SaaS / Software
    expect(result.prompt).not.toContain('SaaS / Software');
  });
});

describe('parseResearchPaste', () => {
  const structuredPaste = `
## COMPANY OVERVIEW
Pepper is a SaaS company founded in 2019 with ~200 employees.

## BUSINESS MODEL
Pepper generates revenue through B2B subscriptions. Estimated ARR is $30M.

## IDEAL CUSTOMER PROFILE
Mid-market companies with 100-500 employees in the tech sector.

## COMPETITORS
- SpiceCorp
- FlavorTech
- SeasonLabs

## GTM CHANNELS
Primarily inbound content marketing and partnerships.

## ORGANIZATION & LEADERSHIP
CEO is Jane Doe. This is a new Head of Growth role.

## COMPENSATION SIGNALS
Comparable roles pay $150K-$200K base plus equity.

## RISKS
Glassdoor reviews mention fast-paced culture. Recent Series B.

## INTERVIEW HYPOTHESES
1. The company may be shifting from founder-led sales to a scalable growth engine. Ask about current pipeline sources.
2. With a recent Series B, growth targets are likely aggressive. Probe for specific ARR goals.
3. The Head of Growth may need to build the team from scratch. Ask about current headcount and budget.
`;

  it('parses structured paste with section headers into correct fields', () => {
    const result = parseResearchPaste(structuredPaste);
    expect(result.companyOverview).toContain('Pepper is a SaaS company');
    expect(result.businessModel).toContain('B2B subscriptions');
    expect(result.icp).toContain('Mid-market companies');
    expect(result.competitors).toContain('SpiceCorp');
  });

  it('fills gtmChannels, orgLeadership, compSignals, and risks fields', () => {
    const result = parseResearchPaste(structuredPaste);
    expect(result.gtmChannels).toContain('inbound content marketing');
    expect(result.orgLeadership).toContain('Jane Doe');
    expect(result.compSignals).toContain('$150K-$200K');
    expect(result.risks).toContain('Glassdoor');
  });

  it('parses INTERVIEW HYPOTHESES into an array', () => {
    const result = parseResearchPaste(structuredPaste);
    expect(Array.isArray(result.interviewHypotheses)).toBe(true);
    expect(result.interviewHypotheses!.length).toBe(3);
    expect(result.interviewHypotheses![0]).toContain('founder-led sales');
  });

  it('returns a createdAt timestamp', () => {
    const result = parseResearchPaste(structuredPaste);
    expect(result.createdAt).toBeDefined();
    // Should be a valid ISO date string
    expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
  });

  it('preserves rawPasteContent', () => {
    const result = parseResearchPaste(structuredPaste);
    expect(result.rawPasteContent).toBe(structuredPaste);
  });

  it('falls back to keyword-based parsing when fewer than 3 structured sections found', () => {
    const unstructuredText = `
About the company:
Pepper is a growth-stage startup with revenue from SaaS subscriptions.

The compensation for this role is competitive at $160K base.

Risk concerns include recent leadership turnover.
`;
    const result = parseResearchPaste(unstructuredText);
    // Should still return a valid ResearchBrief
    expect(result.createdAt).toBeDefined();
    expect(result.rawPasteContent).toBe(unstructuredText);
  });
});

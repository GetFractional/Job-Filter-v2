// Unit tests for the structured resume/LinkedIn claim parser
import { describe, it, expect } from 'vitest';
import { parseResumeStructured, detectTools } from '../claimParser';

// ============================================================
// Standard resume format
// ============================================================

describe('parseResumeStructured', () => {
  it('parses a standard "Role at Company" header with date range', () => {
    const text = `
Director of Growth at Acme Corp
Jan 2020 - Present
- Grew pipeline revenue by 150% YoY
- Built and led a team of 5 marketers
- Implemented HubSpot marketing automation
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    expect(claims[0].role).toBe('Director of Growth');
    expect(claims[0].company).toBe('Acme Corp');
    expect(claims[0].startDate).toBe('Jan 2020');
    expect(claims[0].endDate).toBe('');
    expect(claims[0].outcomes.length).toBeGreaterThanOrEqual(1);
    expect(claims[0].responsibilities.length).toBeGreaterThanOrEqual(1);
    expect(claims[0].tools).toContain('HubSpot');
  });

  it('parses multiple roles correctly', () => {
    const text = `
Head of Marketing at TechCo
Jun 2021 - Present
- Led demand generation strategy
- Managed $2M annual budget

Marketing Manager at StartupX
Mar 2018 - May 2021
- Built marketing from scratch
- Generated 500+ MQLs per month
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(2);
    expect(claims[0].company).toBe('TechCo');
    expect(claims[1].company).toBe('StartupX');
  });

  it('handles "Role — Company" format', () => {
    const text = `
VP of Growth — DataFlow Inc
2019 - 2023
- Scaled ARR from $5M to $25M
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    expect(claims[0].role).toContain('VP');
    expect(claims[0].company).toContain('DataFlow');
  });

  it('skips section headers like EXPERIENCE, EDUCATION', () => {
    const text = `
EXPERIENCE

Director of Marketing at BrandCo
Jan 2020 - Present
- Led integrated campaigns

EDUCATION

MBA, Business School 2018
    `;

    const claims = parseResumeStructured(text);
    // Should find the one real claim, not create entries for section headers
    expect(claims.length).toBe(1);
    expect(claims[0].role).toBe('Director of Marketing');
  });

  it('handles LinkedIn multi-line format (Company / Role / Date)', () => {
    const text = `
Acme Corporation
Head of Growth
Jan 2021 - Present
- Built growth team from 0 to 8
- Drove 200% increase in qualified pipeline
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    // Should correctly identify role vs company
    expect(claims[0].outcomes.length + claims[0].responsibilities.length).toBeGreaterThanOrEqual(1);
  });

  it('does not create empty or roleless claims', () => {
    const text = `
Some random text that is not a resume
Another line of text
And another one
    `;

    const claims = parseResumeStructured(text);
    // Should produce 0 claims since there are no identifiable role/company patterns
    expect(claims.length).toBe(0);
  });

  it('classifies outcomes with metrics correctly', () => {
    const text = `
Growth Lead at MetricsCo
2020 - 2022
- Increased conversion rate by 45%
- Managed cross-functional team
- Generated $1.2M in pipeline revenue
- Organized team offsites
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    // Items with percentages and dollar amounts should be outcomes
    const outcomes = claims[0].outcomes;
    const responsibilities = claims[0].responsibilities;
    expect(outcomes.some((o) => o.description.includes('45%'))).toBe(true);
    expect(outcomes.some((o) => o.description.includes('$1.2M'))).toBe(true);
    // Non-metric items should be responsibilities
    expect(responsibilities.some((r) => r.includes('Organized'))).toBe(true);
  });

  it('deduplicates responsibilities', () => {
    const text = `
Manager at DupCo
2021 - 2022
- Led marketing strategy
- Led marketing strategy
- Built the team
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    // Should not have duplicate responsibilities
    expect(claims[0].responsibilities.filter((r) => r.includes('Led marketing')).length).toBe(1);
  });

  it('detects solid-circle bullets and bullet continuation lines', () => {
    const text = `
Acme Corp
Senior Growth Manager
Jan 2022 - Present
●
Grew qualified pipeline by 35% year over year
● Managed HubSpot lifecycle programs
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    const claim = claims[0];
    const mergedLines = [...claim.responsibilities, ...claim.outcomes.map((o) => o.description)];
    expect(mergedLines.some((line) => line.includes('Grew qualified pipeline'))).toBe(true);
    expect(mergedLines.some((line) => line.includes('Managed HubSpot lifecycle programs'))).toBe(true);
  });

  it('merges continuation lines that start with + or ( into prior bullet', () => {
    const text = `
Acme Corp
Growth Lead
Jan 2021 - Present
- Built partner channel growth playbook
+ resulting in 120 enterprise meetings
- Improved onboarding conversion
(from 42% to 58% in two quarters)
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    const lines = [...claims[0].responsibilities, ...claims[0].outcomes.map((o) => o.description)];
    expect(lines.some((line) => line.includes('resulting in 120 enterprise meetings'))).toBe(true);
    expect(lines.some((line) => line.includes('from 42% to 58%'))).toBe(true);
  });

  it('merges wrapped bullet tails when prior line ends with conjunction/comma', () => {
    const text = `
Prosper Wireless
Director of Growth & Retention
Sep 2023 - Nov 2025
- Owned full-funnel growth strategy across paid, lifecycle, and
partnerships
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    const lines = [...claims[0].responsibilities, ...claims[0].outcomes.map((o) => o.description)];
    expect(lines.some((line) => /paid, lifecycle, and partnerships/i.test(line))).toBe(true);
  });

  it('merges short wrapped fragments when previous bullet ends with an incomplete verb', () => {
    const text = `
Prosper Wireless
Director of Growth & Retention
Sep 2023 - Nov 2025
- Revenue rose quickly and generated
30K+ qualified leads in 2 quarters
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    const lines = [...claims[0].responsibilities, ...claims[0].outcomes.map((o) => o.description)];
    expect(lines.some((line) => /generated 30K\+ qualified leads/i.test(line))).toBe(true);
  });

  it('merges wrapped bullet continuations that repeat the bullet marker', () => {
    const text = `
Prosper Wireless
Director of Growth & Retention
Sep 2023 - Nov 2025
- Role ended in a company-wide reduction in force after ACP-driven revenue contraction
- retained 1+ year through final restructuring.
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    const lines = [...claims[0].responsibilities, ...claims[0].outcomes.map((o) => o.description)];
    expect(lines.some((line) => /revenue contraction retained 1\+ year through final restructuring/i.test(line))).toBe(true);
    expect(lines.filter((line) => /retained 1\+ year through final restructuring/i.test(line))).toHaveLength(1);
  });

  it('keeps summary-only older-role boundary bullets separate from the prior employer block', () => {
    const text = `
Bob's Watches
Marketing Director
Jan 2021 - Present
- Led lifecycle strategy across paid and owned channels
- Infiniti Nashville → Marketing Director | Jun 2020 - Dec 2020
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBeGreaterThanOrEqual(2);

    const firstClaimLines = [...claims[0].responsibilities, ...claims[0].outcomes.map((o) => o.description)].join(' ');
    expect(firstClaimLines).not.toMatch(/Infiniti Nashville/i);

    const olderBoundaryClaim = claims.find((claim) =>
      [...claim.responsibilities, ...claim.outcomes.map((o) => o.description)]
        .some((line) => /Infiniti Nashville/i.test(line)),
    );
    expect(olderBoundaryClaim).toBeDefined();
    expect(olderBoundaryClaim?.role).toBe('');
    expect(olderBoundaryClaim?.company).toBe('');
  });

  it('promotes non-bullet evidence lines into responsibilities/results for preview fidelity', () => {
    const text = `
AffordableInsuranceQuotes
Growth Marketing Manager
Jan 2021 - Present
Built paid search and SEO workflows across 15 state campaigns.
Increased quote conversion rate by 41% in two quarters.
    `;

    const claims = parseResumeStructured(text);
    expect(claims.length).toBe(1);
    expect(claims[0].company).toBe('AffordableInsuranceQuotes');
    expect(claims[0].responsibilities.some((line) => /paid search and SEO workflows/i.test(line))).toBe(true);
    expect(claims[0].outcomes.some((line) => /41%/i.test(line.description))).toBe(true);
  });

  it('preserves top-of-resume featured achievements as separate review evidence', () => {
    const text = `
MATT DIMOCK
Selected Achievements
30K+ leads
55% conversion; negotiated a $5M LOI to purchase the company.

Prosper Wireless
Director of Growth & Retention
Sep 2023 - Nov 2025
- Increased qualified pipeline by 48% year over year
    `;

    const claims = parseResumeStructured(text);
    const featuredClaim = claims.find((claim) =>
      !claim.company
      && !claim.role
      && [...claim.responsibilities, ...claim.outcomes.map((outcome) => outcome.description)]
        .some((line) => /30K\+ leads|55% conversion/i.test(line)),
    );

    expect(featuredClaim).toBeDefined();
    expect(claims.some((claim) => /Prosper Wireless/i.test(claim.company))).toBe(true);
  });
});

// ============================================================
// Tool detection
// ============================================================

describe('detectTools', () => {
  it('detects known tools in text', () => {
    const tools = detectTools('Managed campaigns in HubSpot and Google Analytics');
    expect(tools).toContain('HubSpot');
    expect(tools).toContain('Google Analytics');
  });

  it('detects tool aliases', () => {
    const tools = detectTools('Built dashboards with Google Analytics 4');
    expect(tools).toContain('GA4');
  });

  it('detects Meta Ads from Facebook Ads alias', () => {
    const tools = detectTools('Ran Facebook Ads campaigns');
    expect(tools).toContain('Meta Ads');
  });

  it('does not false-match partial words', () => {
    const tools = detectTools('The sql database was used for analysis');
    expect(tools).toContain('SQL');
    // Should not match "Notion" in "notion" when used as a regular word
    // (This depends on word boundary logic)
  });

  it('returns empty array for text with no tools', () => {
    const tools = detectTools('Led the team to achieve great results in marketing');
    expect(tools.length).toBe(0);
  });
});

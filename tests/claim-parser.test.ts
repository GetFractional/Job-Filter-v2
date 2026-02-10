import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeStructured, parsedClaimToImport } from '../src/lib/claimParser.ts';

test('parseResumeStructured extracts roles, dedupes tools/skills, and scores confidence', () => {
  const resume = `
VP of Growth at Pepper
Jan 2020 - Present
- Built lifecycle engine with HubSpot and Segment
- Built lifecycle engine with HubSpot and Segment
- Grew qualified pipeline 140% YoY

Director of Marketing - Atlas
2017 - 2019
- Launched demand gen with Salesforce
- Increased revenue by $2M
  `;

  const parsed = parseResumeStructured(resume);
  assert.equal(parsed.length, 2);

  const first = parsed[0];
  assert.equal(first.role, 'VP of Growth');
  assert.equal(first.company, 'Pepper');
  assert.equal(first.startDate, 'Jan 2020');
  assert.equal(first.endDate, '');
  assert.ok(first.responsibilities.length >= 1);
  assert.ok(first.skills.includes('Lifecycle Marketing'));
  assert.ok(first.tools.includes('HubSpot'));
  assert.ok(first.tools.includes('Segment'));
  assert.ok(first.outcomes.some((o) => /140%/.test(o.description)));
  assert.ok(first.confidence >= 0.75);
  assert.equal(first.verificationStatus, 'Approved');
});

test('parsedClaimToImport returns experience + linked atomic claim payloads', () => {
  const parsed = parseResumeStructured(`
Head of Growth at Nimbus
Jan 2021 - Present
- Built lifecycle automation in HubSpot
- Improved conversion by 32%
  `)[0];

  const payload = parsedClaimToImport(parsed);
  assert.equal(payload.experience.type, 'Experience');
  assert.equal(payload.experience.company, 'Nimbus');
  assert.ok((payload.experience.responsibilities || []).length >= 1);
  assert.equal(payload.experience.tools, undefined);
  assert.equal(payload.experience.outcomes, undefined);
  assert.equal(payload.experience.verificationStatus, 'Review Needed');
  assert.ok((payload.skillClaims || []).length >= 1);
  assert.ok(payload.skillClaims.every((claim) => claim.verificationStatus === 'Review Needed'));
  assert.ok(payload.toolClaims.some((claim) => claim.text === 'HubSpot'));
  assert.ok(payload.toolClaims.every((claim) => claim.verificationStatus === 'Review Needed'));
  assert.ok(payload.outcomeClaims.some((claim) => /32%/.test(claim.text || '')));
  assert.ok(payload.outcomeClaims.every((claim) => claim.verificationStatus === 'Review Needed'));
  assert.ok(typeof payload.experience.confidence === 'number');
});

test('parseResumeStructured does not infer SQL tool from sales-qualified lead context', () => {
  const parsed = parseResumeStructured(`
Senior Director of Growth at Pepper
Jan 2021 - Present
- Increased SQL conversion by 34% YoY through onboarding optimization
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].tools.includes('SQL'), false);
  assert.ok(parsed[0].outcomes.some((outcome) => /34%/i.test(outcome.description)));
});

test('parseResumeStructured handles role and company on separate lines without over-fragmenting', () => {
  const parsed = parseResumeStructured(`
EXPERIENCE
Pepper
Senior Director of Growth
2021 - Present
• Own GTM strategy and lifecycle
• Drove 120% increase in SQLs

Atlas
Director of Marketing
2018 - 2021
• Built demand gen engine
  `);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Senior Director of Growth');
  assert.equal(parsed[0].startDate, '2021');
  assert.equal(parsed[0].outcomes.length, 1);
  assert.equal(parsed[1].company, 'Atlas');
  assert.equal(parsed[1].role, 'Director of Marketing');
});

test('parseResumeStructured infers company-first delimiter format', () => {
  const parsed = parseResumeStructured(`
Pepper - Senior Director of Growth (2021 - Present)
- Owned lifecycle strategy
- Grew pipeline 100%
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Senior Director of Growth');
  assert.equal(parsed[0].startDate, '2021');
  assert.equal(parsed[0].endDate, '');
});

test('parseResumeStructured handles comma-delimited company-first headers', () => {
  const parsed = parseResumeStructured(`
Pepper, Head of Growth, 2021 - Present
- Owned strategy and lifecycle execution
- Increased qualified pipeline by 120%
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Head of Growth');
  assert.equal(parsed[0].startDate, '2021');
  assert.equal(parsed[0].endDate, '');
});

test('parseResumeStructured handles pipe-delimited headers with inline dates', () => {
  const parsed = parseResumeStructured(`
Pepper | Head of Growth | Jan 2021 - Present
- Built lifecycle strategy
- Increased revenue 3x
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Head of Growth');
  assert.equal(parsed[0].startDate, 'Jan 2021');
  assert.equal(parsed[0].endDate, '');
  assert.ok(parsed[0].outcomes.some((line) => /3x/i.test(line.description)));
});

test('parseResumeStructured treats comma-functional titles as role, not company', () => {
  const parsed = parseResumeStructured(`
Senior Director, Growth Marketing
Pepper
Jan 2021 - Present
- Led lifecycle strategy across HubSpot and Salesforce
- Increased pipeline by 145% YoY
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].role, 'Senior Director, Growth Marketing');
  assert.equal(parsed[0].company, 'Pepper');
  assert.ok(parsed[0].tools.includes('HubSpot'));
  assert.ok(parsed[0].tools.includes('Salesforce'));
});

test('parseResumeStructured splits consecutive role headers even without blank lines', () => {
  const parsed = parseResumeStructured(`
Pepper | Head of Growth | Jan 2021 - Present
- Led lifecycle strategy
- Increased pipeline by 120%
Atlas | Director of Marketing | Jan 2018 - Dec 2020
- Built demand gen engine
  `);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Head of Growth');
  assert.equal(parsed[1].company, 'Atlas');
  assert.equal(parsed[1].role, 'Director of Marketing');
});

test('parseResumeStructured ignores non-experience sections that look like skill lists', () => {
  const parsed = parseResumeStructured(`
Professional Experience

Pepper
Senior Director of Growth
2021 - Present
- Built lifecycle motion in HubSpot

Skills
Lifecycle Marketing, Demand Generation, GTM Strategy
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Senior Director of Growth');
});

test('parseResumeStructured merges fragmented blocks for the same role and company', () => {
  const parsed = parseResumeStructured(`
Pepper
Head of Growth
Jan 2020 - Present
- Built lifecycle strategy

Head of Growth at Pepper
Jan 2020 - Present
- Increased qualified pipeline by 140% YoY
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Head of Growth');
  assert.ok(parsed[0].responsibilities.some((line) => /lifecycle strategy/i.test(line)));
  assert.ok(parsed[0].outcomes.some((line) => /140%/i.test(line.description)));
});

test('parseResumeStructured keeps non-numeric achievement lines in experience bullets', () => {
  const parsed = parseResumeStructured(`
Head of Growth at Pepper
Jan 2021 - Present
- Launched lifecycle onboarding motion for enterprise pipeline
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].outcomes.length, 0);
  assert.ok(parsed[0].responsibilities.some((line) => /launched lifecycle onboarding/i.test(line)));
});

test('parseResumeStructured marks low-evidence claims as review needed', () => {
  const parsed = parseResumeStructured(`
Director of Marketing at Pepper
2022 - Present
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].verificationStatus, 'Review Needed');
  assert.ok(parsed[0].confidence < 0.82);
});

test('parseResumeStructured strips location noise from company headers', () => {
  const parsed = parseResumeStructured(`
Pepper, New York, NY | Senior Director of Growth Marketing | Jan 2021 - Present
- Led lifecycle strategy
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.equal(parsed[0].role, 'Senior Director of Growth Marketing');
});

test('parseResumeStructured merges near-duplicate role names for the same company and dates', () => {
  const parsed = parseResumeStructured(`
Pepper
Head of Growth
Jan 2020 - Present
- Built lifecycle strategy

Head of Growth Marketing at Pepper
Jan 2020 - Present
- Increased qualified pipeline by 140% YoY
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper');
  assert.ok(/head of growth/i.test(parsed[0].role));
  assert.ok(parsed[0].outcomes.some((line) => /140%/i.test(line.description)));
});

test('parseResumeStructured supports labeled role/company headers', () => {
  const parsed = parseResumeStructured(`
Company: Pepper Procurement
Role: Senior Director of Growth Marketing
Jan 2021 - Present
- Built lifecycle strategy in HubSpot and Salesforce
- Increased qualified pipeline by 145% YoY
  `);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].company, 'Pepper Procurement');
  assert.equal(parsed[0].role, 'Senior Director of Growth Marketing');
  assert.equal(parsed[0].included, true);
  assert.ok(parsed[0].tools.includes('HubSpot'));
  assert.ok(parsed[0].outcomes.some((line) => /145%/i.test(line.description)));
});

test('parseResumeStructured excludes incomplete role-only fragments by default', () => {
  const parsed = parseResumeStructured(`
Senior Director of Growth Marketing
2021 - Present
- Led lifecycle strategy
  `);

  assert.equal(parsed.length, 0);
});

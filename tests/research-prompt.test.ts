import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateResearchPrompt,
  parseResearchPaste,
  validateResearchCompanyMatch,
} from '../src/lib/research.ts';
import type { Job } from '../src/types/index.ts';

function baseJob(): Job {
  const now = new Date().toISOString();
  return {
    id: 'job-identity-1',
    title: 'Director of Growth',
    company: 'Pepper',
    locationType: 'Remote',
    employmentType: 'Full-time',
    jobDescription: 'Own lifecycle strategy and GTM planning for B2B SaaS.',
    stage: 'Captured',
    stageTimestamps: {},
    disqualifiers: [],
    reasonsToPursue: [],
    reasonsToPass: [],
    redFlags: [],
    requirementsExtracted: [],
    createdAt: now,
    updatedAt: now,
  };
}

test('generateResearchPrompt includes explicit company identity confirmation section', () => {
  const prompt = generateResearchPrompt(baseJob(), {
    companyContext: 'the B2B procurement SaaS company',
    hqLocation: 'New York, NY',
  });

  assert.ok(/## COMPANY IDENTITY CONFIRMATION/.test(prompt.prompt));
  assert.ok(/Confirm we have the right company entity/i.test(prompt.prompt));
  assert.ok(prompt.prompt.includes('Pepper (the B2B procurement SaaS company), headquartered in New York, NY'));
});

test('parseResearchPaste maps company identity confirmation into structured brief', () => {
  const parsed = parseResearchPaste(`
## COMPANY IDENTITY CONFIRMATION
Pepper is Pepper Procurement Inc. Primary site is pepper.com. HQ appears to be New York, NY.

## COMPANY OVERVIEW
Pepper is a procurement workflow platform for mid-market teams.

## BUSINESS MODEL
SaaS subscription with annual contracts.

## INTERVIEW HYPOTHESES
1. The growth team is still being built.
  `);

  assert.ok(parsed.companyIdentity);
  assert.ok(parsed.companyIdentity?.includes('Pepper Procurement Inc'));
  assert.ok(parsed.companyOverview?.includes('procurement workflow platform'));
  assert.ok(parsed.businessModel?.includes('SaaS subscription'));
  assert.equal(parsed.interviewHypotheses?.length, 1);
});

test('validateResearchCompanyMatch catches wrong-company research pastes', () => {
  const good = validateResearchCompanyMatch(
    '## COMPANY IDENTITY CONFIRMATION\nPepper is Pepper Procurement Inc.',
    'Pepper'
  );
  assert.equal(good.isMatch, true);
  assert.ok(good.confidence >= 0.45);

  const bad = validateResearchCompanyMatch(
    '## COMPANY IDENTITY CONFIRMATION\nAcme Corp is a logistics platform.',
    'Pepper'
  );
  assert.equal(bad.isMatch, false);
});

test('parseResearchPaste accepts fenced JSON payloads from Perplexity-style outputs', () => {
  const parsed = parseResearchPaste(`
Here is the structured output:

\`\`\`json
{
  "company_identity_confirmation": "Pepper Procurement Inc. (pepper.com), HQ New York, NY",
  "company_overview": "Pepper provides procurement workflow software for mid-market teams.",
  "business_model": "SaaS annual contracts with seat-based pricing.",
  "icp": "Operations and procurement leaders at 100-1000 employee companies.",
  "interview_hypotheses": [
    "The team is prioritizing activation before acquisition.",
    "The role will own cross-functional experimentation."
  ]
}
\`\`\`
  `);

  assert.ok(parsed.companyIdentity?.includes('Pepper Procurement Inc.'));
  assert.ok(parsed.companyOverview?.includes('procurement workflow software'));
  assert.ok(parsed.businessModel?.includes('seat-based pricing'));
  assert.ok(parsed.icp?.includes('procurement leaders'));
  assert.equal(parsed.interviewHypotheses?.length, 2);
});

test('parseResearchPaste tolerates nested JSON wrappers and trailing commas', () => {
  const parsed = parseResearchPaste(`
\`\`\`json
{
  "data": {
    "company_identity_confirmation": "Pepper Procurement Inc. (pepper.com), HQ New York, NY",
    "company_overview": "Pepper provides procurement workflow software for mid-market teams.",
    "business_model": "SaaS annual contracts",
    "interview_hypotheses": [
      "The role is expected to operationalize GTM process quickly.",
    ],
  }
}
\`\`\`
  `);

  assert.ok(parsed.companyIdentity?.includes('Pepper Procurement Inc.'));
  assert.ok(parsed.companyOverview?.includes('procurement workflow software'));
  assert.ok(parsed.businessModel?.includes('SaaS annual contracts'));
  assert.equal(parsed.interviewHypotheses?.length, 1);
});

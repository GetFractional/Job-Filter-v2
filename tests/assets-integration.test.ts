import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOutreachEmail,
  generateLinkedInConnect,
  generateCoverLetter,
  generateFollowUpEmail,
  generateGrowthMemo,
} from '../src/lib/assets.ts';
import { bindGenerationContext } from '../src/lib/generationContext.ts';
import { generateApplicationAnswer } from '../src/lib/applicationQa.ts';
import type { Claim, Job, ResearchBrief } from '../src/types/index.ts';

function makeJob(brief?: ResearchBrief): Job {
  const now = new Date().toISOString();
  return {
    id: 'job-pepper',
    title: 'Director of Growth',
    company: 'Pepper',
    locationType: 'Remote',
    employmentType: 'Full-time',
    jobDescription: 'Growth role focused on lifecycle and revenue operations.',
    stage: 'Captured',
    stageTimestamps: {},
    disqualifiers: [],
    reasonsToPursue: [],
    reasonsToPass: [],
    redFlags: [],
    requirementsExtracted: [],
    researchBrief: brief,
    createdAt: now,
    updatedAt: now,
  };
}

function makeApprovedClaims(): Claim[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'exp-1',
      type: 'Experience',
      text: 'Head of Growth at Nimbus',
      normalizedText: 'head of growth at nimbus',
      source: 'Resume',
      confidence: 0.9,
      verificationStatus: 'Approved',
      company: 'Nimbus',
      role: 'Head of Growth',
      startDate: 'Jan 2020',
      responsibilities: ['Built lifecycle funnel for B2B SaaS'],
      outcomes: [
        {
          description: 'Grew qualified pipeline by 140% YoY',
          metric: '140%',
          isNumeric: true,
          verified: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

test('asset templates bind to active job company and avoid placeholder leakage', () => {
  const brief: ResearchBrief = {
    companyOverview: 'Pepper sells procurement software for mid-market teams.',
    businessModel: 'SaaS subscription with annual contracts.',
    createdAt: new Date().toISOString(),
  };
  const job = makeJob(brief);
  const claims = makeApprovedClaims();

  const outputs = [
    generateOutreachEmail({ job, claims, research: brief }),
    generateLinkedInConnect({ job, claims }),
    generateCoverLetter({ job, claims, research: brief }),
    generateFollowUpEmail({ job }),
    generateGrowthMemo({ job, claims, research: brief }),
  ];

  for (const output of outputs) {
    assert.ok(output.includes('Pepper'));
    assert.ok(!/Acme Corp/i.test(output));
    assert.ok(!/Pepper recently Pepper's/i.test(output));
    assert.ok(!/\[Research .* to fill this section\]/i.test(output));
    assert.ok(!/\[Competitor analysis needed\]/i.test(output));
    assert.ok(!/\[GTM channel analysis needed\]/i.test(output));
  }
});

test('generation context gates assets and qa flows when required context is absent', () => {
  const jobWithoutResearch = makeJob();
  const claims = makeApprovedClaims();

  const missingResearch = bindGenerationContext({
    flow: 'assets',
    job: jobWithoutResearch,
    claims,
    requireApprovedClaims: true,
    requireResearch: true,
  });
  assert.equal(missingResearch.ok, false);
  if (missingResearch.ok) return;
  assert.ok(missingResearch.errors.some((error) => error.code === 'missing-research'));

  const ready = bindGenerationContext({
    flow: 'qa',
    job: makeJob({
      companyOverview: 'Pepper is a workflow platform for procurement teams.',
      createdAt: new Date().toISOString(),
    }),
    claims,
    requireApprovedClaims: true,
    requireResearch: true,
  });
  assert.equal(ready.ok, true);
  if (!ready.ok) return;

  const answer = generateApplicationAnswer('Why do you want this role?', ready.context);
  assert.ok(answer.answer.includes('Director of Growth'));
  assert.ok(answer.answer.includes('Pepper'));
  assert.ok(answer.trace.claimsSnapshotId.startsWith('claims:'));
  assert.ok(answer.trace.claimEvidence.length > 0);
});

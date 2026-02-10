import test from 'node:test';
import assert from 'node:assert/strict';
import { bindGenerationContext } from '../src/lib/generationContext.ts';
import type { Claim, Job } from '../src/types/index.ts';

function baseJob(): Partial<Job> {
  return {
    id: 'job-1',
    title: 'Director of Growth',
    company: 'Pepper',
  };
}

function approvedClaim(id: string): Claim {
  const now = new Date().toISOString();
  return {
    id,
    type: 'Experience',
    text: 'Head of Growth at Nimbus',
    normalizedText: 'head of growth at nimbus',
    source: 'Resume',
    confidence: 0.9,
    verificationStatus: 'Approved',
    company: 'Nimbus',
    role: 'Head of Growth',
    startDate: 'Jan 2020',
    createdAt: now,
    updatedAt: now,
  };
}

test('bindGenerationContext returns actionable errors when required context is missing', () => {
  const result = bindGenerationContext({
    flow: 'assets',
    job: { ...baseJob() },
    claims: [],
    requireApprovedClaims: true,
    requireResearch: true,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  const codes = result.errors.map((error) => error.code);
  assert.ok(codes.includes('missing-approved-claims'));
  assert.ok(codes.includes('missing-research'));
});

test('bindGenerationContext returns bound snapshot when context is complete', () => {
  const now = new Date().toISOString();
  const result = bindGenerationContext({
    flow: 'qa',
    job: {
      ...baseJob(),
      researchBrief: {
        companyOverview: 'Pepper provides B2B procurement software.',
        createdAt: now,
      },
    },
    claims: [approvedClaim('c-2'), approvedClaim('c-1')],
    requireApprovedClaims: true,
    requireResearch: true,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.context.company, 'Pepper');
  assert.equal(result.context.approvedClaims.length, 2);
  assert.ok(result.context.claimsSnapshotId.includes('c-1'));
  assert.ok(result.context.claimsSnapshotId.includes('c-2'));
  assert.ok(result.context.researchSnapshotId?.startsWith('research:'));
});

test('bindGenerationContext blocks generation when research appears tied to another company', () => {
  const result = bindGenerationContext({
    flow: 'assets',
    job: {
      ...baseJob(),
      researchBrief: {
        companyOverview: 'Acme Corp provides logistics software.',
        createdAt: new Date().toISOString(),
      },
    },
    claims: [approvedClaim('c-1')],
    requireApprovedClaims: true,
    requireResearch: true,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => error.code === 'mismatched-research-company'));
});

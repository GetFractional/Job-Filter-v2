import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ClaimValidationError,
  isExperienceAnchor,
  validateClaimContext,
} from '../src/lib/claimValidation.ts';
import type { Claim } from '../src/types/index.ts';

function makeClaim(overrides: Partial<Claim>): Claim {
  const now = new Date().toISOString();
  return {
    id: overrides.id || crypto.randomUUID(),
    type: overrides.type || 'Skill',
    text: overrides.text || 'Lifecycle Marketing',
    normalizedText: overrides.normalizedText || 'lifecycle marketing',
    source: overrides.source || 'Manual',
    confidence: overrides.confidence ?? 0.7,
    verificationStatus: overrides.verificationStatus || 'Review Needed',
    experienceId: overrides.experienceId,
    company: overrides.company,
    role: overrides.role,
    startDate: overrides.startDate,
    endDate: overrides.endDate,
    responsibilities: overrides.responsibilities,
    tools: overrides.tools,
    outcomes: overrides.outcomes,
    metric: overrides.metric,
    isNumeric: overrides.isNumeric,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  };
}

test('isExperienceAnchor returns true for canonical experience claims', () => {
  const experience = makeClaim({
    type: 'Experience',
    text: 'Director of Growth at Northstar',
    normalizedText: 'director of growth at northstar',
    role: 'Director of Growth',
    company: 'Northstar',
  });
  assert.equal(isExperienceAnchor(experience), true);
});

test('validateClaimContext blocks atomic claims when no experience anchor exists', () => {
  assert.throws(
    () =>
      validateClaimContext({
        type: 'Skill',
        claims: [],
        text: 'Lifecycle Marketing',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'missing-experience-anchor'
  );
});

test('validateClaimContext blocks missing experience links when anchors exist', () => {
  const experience = makeClaim({
    id: 'exp-1',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    role: 'Head of Growth',
    company: 'Pepper',
  });
  assert.throws(
    () =>
      validateClaimContext({
        type: 'Tool',
        claims: [experience],
        text: 'HubSpot',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'missing-experience-link'
  );
});

test('validateClaimContext accepts atomic claims when linked to a valid anchor', () => {
  const experience = makeClaim({
    id: 'exp-1',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    role: 'Head of Growth',
    company: 'Pepper',
  });

  assert.doesNotThrow(() =>
      validateClaimContext({
        type: 'Outcome',
        claims: [experience],
        experienceId: 'exp-1',
        text: 'Increased qualified pipeline by 120%',
      })
  );
});

test('validateClaimContext rejects stale experience links', () => {
  const experience = makeClaim({
    id: 'exp-1',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    role: 'Head of Growth',
    company: 'Pepper',
  });

  assert.throws(
    () =>
      validateClaimContext({
        type: 'Skill',
        claims: [experience],
        experienceId: 'exp-missing',
        text: 'Lifecycle Marketing',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'invalid-experience-link'
  );
});

test('validateClaimContext ignores current claim id when retyping an experience', () => {
  const experience = makeClaim({
    id: 'exp-1',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    role: 'Head of Growth',
    company: 'Pepper',
  });

  assert.throws(
    () =>
      validateClaimContext({
        type: 'Skill',
        claims: [experience],
        experienceId: 'exp-1',
        currentClaimId: 'exp-1',
        text: 'Lifecycle Marketing',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'missing-experience-anchor'
  );
});

test('validateClaimContext requires role and company for experience claims', () => {
  assert.throws(
    () =>
      validateClaimContext({
        type: 'Experience',
        claims: [],
        role: 'Head of Growth',
        company: '',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'missing-experience-identity'
  );
});

test('validateClaimContext requires claim text for atomic claim types', () => {
  const experience = makeClaim({
    id: 'exp-1',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    role: 'Head of Growth',
    company: 'Pepper',
  });

  assert.throws(
    () =>
      validateClaimContext({
        type: 'Skill',
        claims: [experience],
        experienceId: 'exp-1',
        text: '   ',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'missing-claim-text'
  );
});

test('validateClaimContext requires metric for approved outcomes', () => {
  const experience = makeClaim({
    id: 'exp-1',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    role: 'Head of Growth',
    company: 'Pepper',
  });

  assert.throws(
    () =>
      validateClaimContext({
        type: 'Outcome',
        claims: [experience],
        experienceId: 'exp-1',
        text: 'Increased pipeline quality',
        verificationStatus: 'Approved',
      }),
    (error) =>
      error instanceof ClaimValidationError && error.code === 'missing-approved-outcome-metric'
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExperienceBundles,
  claimReviewQueue,
  findDuplicateClaimGroups,
  groupClaimsByType,
} from '../src/lib/claimLedger.ts';
import type { Claim } from '../src/types/index.ts';

function seededClaims(): Claim[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'exp-1',
      type: 'Experience',
      text: 'Head of Growth at Pepper',
      normalizedText: 'head of growth at pepper',
      source: 'Resume',
      confidence: 0.85,
      verificationStatus: 'Approved',
      role: 'Head of Growth',
      company: 'Pepper',
      startDate: 'Jan 2021',
      responsibilities: ['Built lifecycle marketing engine'],
      outcomes: [
        {
          description: 'Increased qualified pipeline by 120% YoY',
          metric: '120%',
          isNumeric: true,
          verified: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'skill-1',
      type: 'Skill',
      text: 'Lifecycle Marketing',
      normalizedText: 'lifecycle marketing',
      source: 'Resume',
      confidence: 0.8,
      verificationStatus: 'Review Needed',
      experienceId: 'exp-1',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tool-1',
      type: 'Tool',
      text: 'HubSpot',
      normalizedText: 'hubspot',
      source: 'Resume',
      confidence: 0.9,
      verificationStatus: 'Review Needed',
      experienceId: 'exp-1',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'outcome-1',
      type: 'Outcome',
      text: 'Increased qualified pipeline by 120% YoY',
      normalizedText: 'increased qualified pipeline by 120% yoy',
      source: 'Resume',
      confidence: 0.7,
      verificationStatus: 'Review Needed',
      experienceId: 'exp-1',
      metric: '120%',
      isNumeric: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

test('buildExperienceBundles anchors claims into experience + four canonical categories', () => {
  const bundles = buildExperienceBundles(seededClaims());
  assert.equal(bundles.length, 1);
  const bundle = bundles[0];
  assert.equal(bundle.role, 'Head of Growth');
  assert.ok(bundle.skills.includes('Lifecycle Marketing'));
  assert.ok(bundle.tools.includes('HubSpot'));
  assert.ok(bundle.outcomes.some((outcome) => outcome.metric === '120%'));
  assert.equal(bundle.outcomes.length, 1);
});

test('buildExperienceBundles uses linked atomic claims as canonical evidence when present', () => {
  const now = new Date().toISOString();
  const claims = seededClaims();
  claims[0].tools = ['HubSpot'];
  claims[0].outcomes = [
    {
      description: 'Increased qualified pipeline by 120% YoY',
      metric: '120%',
      isNumeric: true,
      verified: true,
    },
  ];
  claims.push({
    id: 'tool-2',
    type: 'Tool',
    text: 'HubSpot',
    normalizedText: 'hubspot',
    source: 'Manual',
    confidence: 0.7,
    verificationStatus: 'Review Needed',
    experienceId: 'exp-1',
    createdAt: now,
    updatedAt: now,
  });
  const bundles = buildExperienceBundles(claims);
  assert.equal(bundles.length, 1);
  const bundle = bundles[0];
  assert.equal(bundle.tools.filter((tool) => tool === 'HubSpot').length, 1);
  assert.equal(bundle.outcomes.length, 1);
});

test('buildExperienceBundles falls back to legacy embedded outcomes/tools when no linked claim exists', () => {
  const now = new Date().toISOString();
  const claims: Claim[] = [
    {
      id: 'exp-legacy',
      type: 'Experience',
      text: 'Director of Growth at Atlas',
      normalizedText: 'director of growth at atlas',
      source: 'Resume',
      confidence: 0.8,
      verificationStatus: 'Review Needed',
      role: 'Director of Growth',
      company: 'Atlas',
      tools: ['Salesforce'],
      outcomes: [
        {
          description: 'Launched outbound motion in 60 days',
          isNumeric: false,
          verified: false,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
  const bundles = buildExperienceBundles(claims);
  assert.equal(bundles.length, 1);
  assert.ok(bundles[0].tools.includes('Salesforce'));
  assert.ok(bundles[0].outcomes.some((outcome) => /outbound motion/i.test(outcome.description)));
});

test('groupClaimsByType keeps canonical Skill/Tool/Experience/Outcome buckets', () => {
  const grouped = groupClaimsByType(seededClaims());
  assert.equal(grouped.Experience.length, 1);
  assert.equal(grouped.Skill.length, 1);
  assert.equal(grouped.Tool.length, 1);
  assert.equal(grouped.Outcome.length, 1);
});

test('claimReviewQueue returns review-needed claims sorted by confidence', () => {
  const queue = claimReviewQueue(seededClaims());
  assert.equal(queue.length, 3);
  assert.equal(queue[0].id, 'outcome-1');
  assert.equal(queue[1].id, 'skill-1');
  assert.equal(queue[2].id, 'tool-1');
});

test('findDuplicateClaimGroups groups atomic duplicates only within the same experience context', () => {
  const now = new Date().toISOString();
  const claims = seededClaims();
  claims.push({
    id: 'tool-dup',
    type: 'Tool',
    text: 'HubSpot',
    normalizedText: 'hubspot',
    source: 'Manual',
    confidence: 0.7,
    verificationStatus: 'Review Needed',
    experienceId: 'exp-1',
    createdAt: now,
    updatedAt: now,
  });
  claims.push({
    id: 'tool-other-exp',
    type: 'Tool',
    text: 'HubSpot',
    normalizedText: 'hubspot',
    source: 'Manual',
    confidence: 0.7,
    verificationStatus: 'Review Needed',
    experienceId: 'exp-2',
    createdAt: now,
    updatedAt: now,
  });

  const groups = findDuplicateClaimGroups(claims);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].type, 'Tool');
  assert.equal(groups[0].sourceIds.length, 1);
  assert.equal(groups[0].label, 'HubSpot');
});

test('findDuplicateClaimGroups identifies duplicate experience anchors by role+company+timeline', () => {
  const now = new Date().toISOString();
  const claims = seededClaims();
  claims.push({
    id: 'exp-dup',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    source: 'Resume',
    confidence: 0.75,
    verificationStatus: 'Review Needed',
    role: 'Head of Growth',
    company: 'Pepper',
    startDate: 'Jan 2021',
    createdAt: now,
    updatedAt: now,
  });

  const groups = findDuplicateClaimGroups(claims);
  const experienceGroup = groups.find((group) => group.type === 'Experience');
  assert.ok(experienceGroup);
  assert.equal(experienceGroup?.sourceIds.length, 1);
  assert.ok(/Head of Growth/i.test(experienceGroup?.label || ''));
});

test('findDuplicateClaimGroups does not merge same role/company with different timelines', () => {
  const now = new Date().toISOString();
  const claims = seededClaims();
  claims.push({
    id: 'exp-new-stint',
    type: 'Experience',
    text: 'Head of Growth at Pepper',
    normalizedText: 'head of growth at pepper',
    source: 'Resume',
    confidence: 0.8,
    verificationStatus: 'Review Needed',
    role: 'Head of Growth',
    company: 'Pepper',
    startDate: 'Jan 2024',
    createdAt: now,
    updatedAt: now,
  });

  const groups = findDuplicateClaimGroups(claims);
  const experienceGroup = groups.find((group) => group.type === 'Experience');
  assert.equal(experienceGroup, undefined);
});

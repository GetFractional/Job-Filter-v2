import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJobMatches, getFeedSources } from '../src/lib/jobFeed.ts';
import type { Job, Profile } from '../src/types/index.ts';

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'default',
    name: 'Test User',
    targetRoles: ['Director of Lifecycle Marketing', 'Head of Growth'],
    compFloor: 150000,
    compTarget: 180000,
    requiredBenefits: [],
    preferredBenefits: [],
    locationPreference: 'Remote preferred',
    disqualifiers: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function buildExistingJob(overrides: Partial<Job>): Job {
  return {
    id: 'job-1',
    title: 'Director of Lifecycle Marketing',
    company: 'Pepper',
    location: 'Remote (US)',
    locationType: 'Remote',
    employmentType: 'Full-time',
    jobDescription: 'Existing job description',
    stage: 'Captured',
    stageTimestamps: { Captured: '2026-01-10T00:00:00.000Z' },
    disqualifiers: [],
    reasonsToPursue: [],
    reasonsToPass: [],
    redFlags: [],
    requirementsExtracted: [],
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  };
}

test('buildJobMatches ranks relevant remote roles highest and filters existing jobs', () => {
  const profile = buildProfile();
  const existingJobs: Job[] = [buildExistingJob({})];

  const matches = buildJobMatches(profile, existingJobs, { source: 'all' });

  assert.ok(matches.length > 0);
  assert.ok(matches.every((match) => !(match.title === 'Director of Lifecycle Marketing' && match.company === 'Pepper')));
  assert.ok(matches[0].fitScore >= matches[matches.length - 1].fitScore);
  assert.ok(matches.some((match) => match.fitLabel === 'High'));
});

test('buildJobMatches supports query and source filters', () => {
  const profile = buildProfile({ targetRoles: ['Product Marketing'] });

  const leverOnly = buildJobMatches(profile, [], { source: 'Lever' });
  assert.ok(leverOnly.length > 0);
  assert.ok(leverOnly.every((match) => match.source === 'Lever'));

  const pepperQuery = buildJobMatches(profile, [], { query: 'pepper' });
  assert.equal(pepperQuery.length, 1);
  assert.equal(pepperQuery[0].company, 'Pepper');
});

test('getFeedSources includes all and provider labels', () => {
  const sources = getFeedSources();
  assert.ok(sources.includes('all'));
  assert.ok(sources.includes('Greenhouse'));
  assert.ok(sources.includes('Lever'));
});

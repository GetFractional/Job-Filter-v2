import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreJob } from '../src/lib/scoring.ts';
import type { Claim, Profile } from '../src/types/index.ts';

function baseProfile(): Profile {
  return {
    id: 'default',
    name: 'Matt',
    targetRoles: ['Director of Growth'],
    compFloor: 150000,
    compTarget: 180000,
    requiredBenefits: ['Medical'],
    preferredBenefits: ['401(k)'],
    locationPreference: 'Remote',
    disqualifiers: [],
    updatedAt: new Date().toISOString(),
  };
}

function seededClaims(): Claim[] {
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
      startDate: 'Jan 2012',
      endDate: 'Jan 2024',
      responsibilities: ['Owned lifecycle marketing strategy for B2B SaaS'],
      tools: ['HubSpot'],
      outcomes: [
        {
          description: 'Grew pipeline by 140% YoY',
          metric: '140%',
          isNumeric: true,
          verified: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tool-1',
      type: 'Tool',
      text: 'HubSpot',
      normalizedText: 'hubspot',
      source: 'Resume',
      confidence: 0.85,
      verificationStatus: 'Approved',
      experienceId: 'exp-1',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

test('scoreJob extracts structured requirements with years in proper columns and claim evidence mapping', () => {
  const result = scoreJob(
    {
      id: 'job-1',
      title: 'Director of Growth',
      company: 'Pepper',
      locationType: 'Remote',
      employmentType: 'Full-time',
      jobDescription: `
Requirements
- 10+ years of lifecycle marketing experience in B2B SaaS
- Must have HubSpot and Salesforce experience
- MBA preferred
      `,
      stage: 'Captured',
      stageTimestamps: {},
      disqualifiers: [],
      reasonsToPursue: [],
      reasonsToPass: [],
      redFlags: [],
      requirementsExtracted: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    baseProfile(),
    seededClaims()
  );

  const requirements = result.requirementsExtracted;
  assert.ok(requirements.length >= 3);

  const yearsReq = requirements.find((req) => req.type === 'experience' && req.yearsNeeded === 10);
  assert.ok(yearsReq);
  assert.ok(!yearsReq?.description.includes('10+ years'));
  assert.equal(yearsReq?.match, 'Met');
  assert.ok((yearsReq?.userEvidence || yearsReq?.evidence || '').includes('Nimbus'));
  assert.ok((yearsReq?.jdEvidence || '').includes('10+ years'));
  assert.equal(yearsReq?.gapSeverity, 'None');

  const hubspotReq = requirements.find((req) => req.type === 'tool' && /hubspot/i.test(req.description));
  assert.ok(hubspotReq);
  assert.equal(hubspotReq?.match, 'Met');

  const salesforceReq = requirements.find((req) => req.type === 'tool' && /salesforce/i.test(req.description));
  assert.ok(salesforceReq);
  assert.equal(salesforceReq?.match, 'Missing');
  assert.equal(salesforceReq?.gapSeverity, 'High');

  const lifecycleSkillReq = requirements.find(
    (req) => req.type === 'skill' && /lifecycle marketing/i.test(req.description)
  );
  assert.ok(lifecycleSkillReq);
  assert.equal(lifecycleSkillReq?.match, 'Met');
});

test('extractRequirements does not infer Segment tool from generic "segments" wording', () => {
  const result = scoreJob(
    {
      id: 'job-2',
      title: 'Senior Director of Growth Marketing',
      company: 'Pepper',
      locationType: 'Remote',
      employmentType: 'Full-time',
      jobDescription: `
Pepper is hiring a senior director of growth marketing to own lifecycle and demand generation strategy across SMB and enterprise segments.

Requirements
- 10+ years in B2B SaaS growth or demand generation
- Strong hands-on experience with HubSpot, Salesforce, and SQL
      `,
      stage: 'Captured',
      stageTimestamps: {},
      disqualifiers: [],
      reasonsToPursue: [],
      reasonsToPass: [],
      redFlags: [],
      requirementsExtracted: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    baseProfile(),
    seededClaims()
  );

  const segmentReq = result.requirementsExtracted.find((req) => req.type === 'tool' && /segment/i.test(req.description));
  assert.equal(segmentReq, undefined);

  const hubspotReq = result.requirementsExtracted.find((req) => req.type === 'tool' && /hubspot/i.test(req.description));
  assert.ok(hubspotReq);
});

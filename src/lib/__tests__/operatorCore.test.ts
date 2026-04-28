import { describe, expect, it } from 'vitest';
import {
  applyStoryApproval,
  applyStoryMetricMode,
  buildCoverLetterAssetContent,
  buildOperatorCoreState,
  buildOperatorReviewSummary,
  buildResumeAssetContent,
  canGenerateOperatorAssets,
} from '../operatorCore';
import type { Profile } from '../../types';

const timelineCompanies = [
  {
    id: 'company-1',
    company: 'Signal Labs',
    roles: [
      {
        id: 'role-1',
        title: 'Director of Growth',
        startDate: '2024-01',
        endDate: '',
        currentRole: true,
        responsibilities: [
          'Built role-based lane planning across lifecycle and paid channels.',
          'Partnered with product and sales on funnel instrumentation.',
        ],
        results: [
          'Increased qualified pipeline by 41% in two quarters.',
        ],
      },
    ],
  },
  {
    id: 'company-2',
    company: 'Northstar Health',
    roles: [
      {
        id: 'role-2',
        title: 'Growth Marketing Lead',
        startDate: '2021-01',
        endDate: '2023-12',
        currentRole: false,
        responsibilities: [
          'Owned campaign planning for multi-state acquisition programs.',
        ],
        results: [],
      },
    ],
  },
];

const profile: Profile = {
  id: 'default',
  name: 'Alex Morgan',
  firstName: 'Alex',
  lastName: 'Morgan',
  headline: 'Director of Growth',
  email: 'alex@example.com',
  phoneCountryCode: '+1',
  phoneNational: '(415) 555-1212',
  location: 'Austin, TX',
  linkedIn: 'https://linkedin.com/in/alexmorgan',
  website: 'https://alexmorgan.com',
  portfolio: '',
  targetRoles: ['Director of Growth'],
  skills: [],
  tools: [],
  compFloor: 0,
  compTarget: 0,
  requiredBenefits: [],
  preferredBenefits: [],
  locationPreference: '',
  disqualifiers: [],
  locationPreferences: [],
  willingToRelocate: false,
  requiredBenefitIds: [],
  preferredBenefitIds: [],
  hardFilters: {
    requiresVisaSponsorship: false,
    minBaseSalary: 0,
    maxOnsiteDaysPerWeek: 7,
    maxTravelPercent: 100,
    employmentTypes: [],
  },
  updatedAt: new Date().toISOString(),
};

describe('operatorCore', () => {
  it('builds lane and story state with softened metric defaults', () => {
    const state = buildOperatorCoreState({
      headline: 'Director of Growth',
      targetRoles: ['Director of Growth'],
      timelineCompanies,
    });

    expect(state.lanes[0]?.title).toBe('Director of Growth');
    expect(state.selectedLaneId).toBe(state.lanes[0]?.id);
    expect(state.stories.length).toBeGreaterThan(1);
    expect(state.stories.find((story) => story.hasNumericOutcome)?.metricMode).toBe('softened');
  });

  it('updates approval and review summary counts', () => {
    const initial = buildOperatorCoreState({
      headline: 'Director of Growth',
      targetRoles: ['Director of Growth'],
      timelineCompanies,
    });

    const firstStoryId = initial.stories[0]?.id ?? '';
    const nextStories = applyStoryApproval(initial.stories, firstStoryId, false);
    const summary = buildOperatorReviewSummary(nextStories);

    expect(summary.excludedCount).toBe(1);
    expect(summary.approvedCount).toBe(initial.stories.length - 1);
  });

  it('uses safe wording by default and exact wording when explicitly approved', () => {
    const initial = buildOperatorCoreState({
      headline: 'Director of Growth',
      targetRoles: ['Director of Growth'],
      timelineCompanies,
    });
    const lane = initial.lanes[0];
    const targetJob = {
      title: 'Director of Growth',
      company: 'Brightloop',
      url: '',
      location: 'Remote',
      jobDescription: 'Own growth strategy, lane targeting, and proof-grounded asset generation.',
    };

    const defaultResume = buildResumeAssetContent({
      profile,
      lane,
      targetJob,
      stories: initial.stories.filter((story) => story.approved),
    });
    expect(defaultResume).toContain('meaningfully');
    expect(defaultResume).not.toContain('41%');

    const numericStoryId = initial.stories.find((story) => story.hasNumericOutcome)?.id ?? '';
    const exactStories = applyStoryMetricMode(initial.stories, numericStoryId, 'exact');
    const exactResume = buildResumeAssetContent({
      profile,
      lane,
      targetJob,
      stories: exactStories.filter((story) => story.approved),
    });
    const coverLetter = buildCoverLetterAssetContent({
      profile,
      lane,
      targetJob,
      stories: exactStories.filter((story) => story.approved),
    });

    expect(exactResume).toContain('41%');
    expect(coverLetter).toContain('41%');
  });

  it('requires selected lane, job context, and approved stories before generation', () => {
    const validation = canGenerateOperatorAssets(
      {
        title: '',
        company: 'Brightloop',
        url: '',
        location: '',
        jobDescription: '',
      },
      [],
      null,
    );

    expect(validation.valid).toBe(false);
    expect(validation.missing).toEqual([
      'selected lane',
      'job title',
      'job context',
      'approved stories',
    ]);
  });
});

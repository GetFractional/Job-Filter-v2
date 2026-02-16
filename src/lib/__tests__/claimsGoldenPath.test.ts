import { describe, expect, it } from 'vitest';
import { parseClaimsImportText } from '../claimsImportPipeline';
import {
  createClaimReviewItems,
  reviewItemToClaimInput,
  type ClaimReviewItem,
} from '../claimsReview';
import { getAutoUsableClaims } from '../claimAutoUse';
import { createEmptyProfile } from '../profileState';
import { scoreJob } from '../scoring';
import { generateOutreachEmail } from '../assets';
import type { Claim, Job } from '../../types';

const RESUME_FIXTURE = `Head of Growth at Acme Corp
Jan 2021 - Present
- Led lifecycle marketing strategy across 4 channels
- Increased qualified pipeline by 40%
- Improved MQL to SQL conversion by 23%
- Reduced CAC by 18%
- Launched ABM targeting enterprise accounts
- Built weekly forecasting dashboard in Looker
- Implemented lead scoring model in HubSpot
- Partnered with product marketing on positioning
- Scaled outbound testing to 10 experiments per month
- Trained SDR team on messaging and qualification
- Improved onboarding conversion by 12%
- Automated reporting across Salesforce and GA4`;

function asClaim(item: ClaimReviewItem, index: number): Claim {
  const input = reviewItemToClaimInput(item);
  return {
    id: `claim-${index + 1}`,
    company: input.company || 'Acme Corp',
    role: input.role || 'Head of Growth',
    startDate: input.startDate || 'Jan 2021',
    endDate: input.endDate,
    claimText: input.claimText,
    rawSnippet: input.rawSnippet,
    reviewStatus: input.reviewStatus,
    autoUse: input.autoUse,
    metric: input.metric,
    responsibilities: input.responsibilities || [],
    outcomes: input.outcomes || [],
    tools: input.tools || [],
    createdAt: new Date().toISOString(),
  };
}

describe('claims golden path', () => {
  it('parses resume text into reviewable bullets, preserves edits, and feeds scoring/assets', () => {
    const parsed = parseClaimsImportText(RESUME_FIXTURE);
    const reviewItems = createClaimReviewItems(parsed);

    expect(reviewItems.length).toBeGreaterThan(10);

    const editedFirst = {
      ...reviewItems[0],
      claimText: 'Built lifecycle campaigns that improved qualified pipeline quality.',
      metricValue: '',
      metricUnit: '',
      metricContext: '',
      status: 'active' as const,
      autoUse: true,
    };
    const savedClaims = [editedFirst, ...reviewItems.slice(1)].map(asClaim);
    const autoUsableClaims = getAutoUsableClaims(savedClaims);

    const job: Job = {
      id: 'job-1',
      title: 'Director of Growth',
      company: 'Pipeline Labs',
      jobDescription: 'Own growth strategy, lifecycle, and funnel performance.',
      stage: 'Scored',
      stageTimestamps: {},
      locationType: 'Remote',
      employmentType: 'Full-time',
      disqualifiers: [],
      reasonsToPursue: [],
      reasonsToPass: [],
      redFlags: [],
      requirementsExtracted: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const score = scoreJob(job, createEmptyProfile(), autoUsableClaims);
    expect(score.fitScore).toBeGreaterThanOrEqual(0);

    const email = generateOutreachEmail({
      job,
      userName: 'Alex',
      claims: autoUsableClaims,
    });
    expect(email).toContain('Built lifecycle campaigns that improved qualified pipeline quality.');
  });
});

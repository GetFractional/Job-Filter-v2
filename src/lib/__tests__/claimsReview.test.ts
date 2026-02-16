import { describe, it, expect } from 'vitest';
import {
  createClaimReviewItems,
  regroupClaimReviewItems,
  splitReviewItem,
  reviewItemToClaimInput,
  type ClaimReviewItem,
} from '../claimsReview';
import type { ParsedClaim } from '../claimParser';

function makeParsedClaim(overrides: Partial<ParsedClaim> = {}): ParsedClaim {
  return {
    _key: 'claim-1',
    role: 'Head of Growth',
    company: 'Acme',
    startDate: 'Jan 2021',
    endDate: '',
    rawSnippet: 'Increased qualified pipeline by 40%',
    claimText: 'Increased qualified pipeline by 40%',
    metricValue: '40',
    metricUnit: '%',
    metricContext: 'qualified pipeline',
    reviewStatus: 'active',
    autoUse: true,
    responsibilities: [],
    tools: [],
    outcomes: [
      { description: 'Increased qualified pipeline by 40%', metric: '40%', isNumeric: true },
    ],
    included: true,
    ...overrides,
  };
}

describe('createClaimReviewItems', () => {
  it('marks conflicting metric values as conflict and disables auto-use', () => {
    const items = createClaimReviewItems([
      makeParsedClaim({ _key: 'claim-a', claimText: 'Increased qualified pipeline by 40%' }),
      makeParsedClaim({ _key: 'claim-b', claimText: 'Increased qualified pipeline by 20%', outcomes: [{ description: 'Increased qualified pipeline by 20%', metric: '20%', isNumeric: true }] }),
    ]);

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.status === 'conflict')).toBe(true);
    expect(items.every((item) => item.autoUse === false)).toBe(true);
  });

  it('marks missing core fields as needs_review', () => {
    const items = createClaimReviewItems([
      makeParsedClaim({ company: '', claimText: 'Built lifecycle program', outcomes: [], responsibilities: ['Built lifecycle program'] }),
    ]);

    expect(items[0].status).toBe('needs_review');
    expect(items[0].autoUse).toBe(false);
  });
});

describe('reviewItemToClaimInput', () => {
  it('maps edited review fields into claim payload for persistence', () => {
    const item: ClaimReviewItem = {
      id: 'item-1',
      company: 'Acme',
      role: 'Head of Growth',
      startDate: 'Jan 2021',
      endDate: '',
      timeframe: 'Jan 2021 - Present',
      rawSnippet: 'Raw text',
      claimText: 'Edited claim text',
      metricValue: '35',
      metricUnit: '%',
      metricContext: 'qualified pipeline',
      tools: ['HubSpot', 'Salesforce'],
      status: 'active',
      included: true,
      autoUse: true,
    };

    const claimInput = reviewItemToClaimInput(item);

    expect(claimInput.claimText).toBe('Edited claim text');
    expect(claimInput.rawSnippet).toBe('Raw text');
    expect(claimInput.metric?.value).toBe('35');
    expect(claimInput.autoUse).toBe(true);
    expect(claimInput.outcomes?.[0]?.description).toBe('Edited claim text');
    expect(claimInput.tools).toEqual(['HubSpot', 'Salesforce']);
  });

  it('recomputes status after inline edits', () => {
    const items: ClaimReviewItem[] = [
      {
        id: 'i1',
        company: '',
        role: 'Head of Growth',
        startDate: 'Jan 2021',
        endDate: '',
        timeframe: 'Jan 2021 - Present',
        rawSnippet: 'Raw text',
        claimText: 'Edited claim text',
        metricValue: '',
        metricUnit: '',
        metricContext: '',
        tools: [],
        status: 'active',
        included: true,
        autoUse: true,
      },
    ];

    const regrouped = regroupClaimReviewItems(items);
    expect(regrouped[0].status).toBe('needs_review');
    expect(regrouped[0].autoUse).toBe(false);
  });
});

describe('splitReviewItem', () => {
  it('splits multiline bullet text into individual bullets', () => {
    const item: ClaimReviewItem = {
      id: 'split-1',
      company: 'Acme',
      role: 'Head of Growth',
      startDate: 'Jan 2021',
      endDate: '',
      timeframe: 'Jan 2021 - Present',
      rawSnippet: '',
      claimText: `- Led lifecycle program across 4 channels
- Increased pipeline by 40%
- Improved MQL to SQL by 23%
- Reduced CAC by 18%
- Launched ABM for enterprise accounts
- Built weekly funnel dashboard
- Implemented lead scoring model
- Partnered with product marketing
- Scaled outbound experiment velocity
- Trained SDR team on new messaging
- Improved onboarding conversion by 12%
- Automated reporting with GA4`,
      metricValue: '',
      metricUnit: '',
      metricContext: '',
      tools: ['HubSpot'],
      status: 'active',
      included: true,
      autoUse: true,
    };

    const result = splitReviewItem(item);
    expect(result.reason).toBeUndefined();
    expect(result.items.length).toBeGreaterThan(10);
    expect(result.items[0].claimText).toContain('Led lifecycle program');
  });

  it('returns reason when no split boundary exists', () => {
    const item: ClaimReviewItem = {
      id: 'split-2',
      company: 'Acme',
      role: 'Head of Growth',
      startDate: 'Jan 2021',
      endDate: '',
      timeframe: 'Jan 2021 - Present',
      rawSnippet: '',
      claimText: 'Owned growth strategy with leadership accountability.',
      metricValue: '',
      metricUnit: '',
      metricContext: '',
      tools: [],
      status: 'active',
      included: true,
      autoUse: true,
    };

    const result = splitReviewItem(item);
    expect(result.items).toHaveLength(1);
    expect(result.reason).toContain('No bullet boundaries');
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from '../OnboardingWizard';
import type { ImportSession } from '../../../types';

const mockState: {
  jobs: unknown[];
  profile: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    targetRoles: string[];
    compFloor: number;
    compTarget: number;
    requiredBenefits: string[];
    preferredBenefits: string[];
    requiredBenefitIds: string[];
    preferredBenefitIds: string[];
    locationPreference: string;
    disqualifiers: string[];
    locationPreferences: unknown[];
    willingToRelocate: boolean;
    hardFilters: {
      requiresVisaSponsorship: boolean;
      minBaseSalary: number;
      maxOnsiteDaysPerWeek: number;
      maxTravelPercent: number;
      employmentTypes: string[];
    };
    updatedAt: string;
  };
  updateProfile: ReturnType<typeof vi.fn>;
  addClaim: ReturnType<typeof vi.fn>;
  importSession: ImportSession | null;
  setImportSession: ReturnType<typeof vi.fn>;
  hydrateImportSession: ReturnType<typeof vi.fn>;
} = {
  jobs: [],
  profile: {
    id: 'default',
    name: '',
    firstName: '',
    lastName: '',
    targetRoles: [],
    compFloor: 0,
    compTarget: 0,
    requiredBenefits: [],
    preferredBenefits: [],
    requiredBenefitIds: [],
    preferredBenefitIds: [],
    locationPreference: '',
    disqualifiers: [],
    locationPreferences: [],
    willingToRelocate: false,
    hardFilters: {
      requiresVisaSponsorship: false,
      minBaseSalary: 0,
      maxOnsiteDaysPerWeek: 5,
      maxTravelPercent: 100,
      employmentTypes: ['full_time_w2', 'contract', 'contract_to_hire', 'part_time', 'internship', 'temporary'],
    },
    updatedAt: new Date().toISOString(),
  },
  updateProfile: vi.fn(async () => {}),
  addClaim: vi.fn(async () => ({})),
  importSession: null,
  setImportSession: vi.fn(),
  hydrateImportSession: vi.fn(),
};

vi.mock('../../../store/useStore', () => ({
  useStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

describe('OnboardingWizard terminology guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.importSession = null;
  });

  it('shows explicit Approve & Save and Discard controls for parsed proof drafts', async () => {
    mockState.importSession = {
      id: 'session-1',
      mode: 'default',
      selectedMode: 'default',
      state: 'parsed',
      storage: 'localStorage',
      updatedAt: new Date().toISOString(),
      profileSuggestion: {
        targetRoles: [],
        skillHints: [],
        toolHints: [],
        locationHints: [],
      },
      diagnostics: {
        extractedTextLength: 42,
        detectedLinesCount: 3,
        bulletCandidatesCount: 1,
        bulletOnlyLineCount: 0,
        sectionHeadersDetected: 0,
        companyCandidatesDetected: 1,
        roleCandidatesDetected: 1,
        finalCompaniesCount: 1,
        rolesCount: 1,
        bulletsCount: 1,
        reasonCodes: [],
        previewLines: ['Acme', 'Growth Lead'],
        previewLinesWithNumbers: [{ line: 1, text: 'Acme' }],
      },
      draft: {
        companies: [
          {
            id: 'company-1',
            name: 'Acme',
            confidence: 0.9,
            status: 'active',
            sourceRefs: [],
            roles: [
              {
                id: 'role-1',
                title: 'Growth Lead',
                startDate: 'Jan 2020',
                endDate: 'Present',
                confidence: 0.88,
                status: 'active',
                sourceRefs: [],
                highlights: [
                  {
                    id: 'item-1',
                    type: 'highlight',
                    text: 'Built lifecycle engine',
                    confidence: 0.8,
                    status: 'active',
                    sourceRefs: [],
                  },
                ],
                outcomes: [],
                tools: [],
                skills: [],
              },
            ],
          },
        ],
      },
    };

    render(<OnboardingWizard onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Approve & Save/i })).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /^Discard$/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Discard$/i }));
    expect(mockState.setImportSession).toHaveBeenCalledWith(null);

    mockState.importSession = null;
  });

  it('starts onboarding with resume import after welcome', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Import Your Resume/i })).toBeTruthy();
    });
    expect(screen.queryByRole('heading', { name: /Your Profile/i })).toBeNull();
  });

  it('does not expose engineering jargon on the resume step', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Import Your Resume/i })).toBeTruthy();
    });

    const visibleText = document.body.textContent?.toLowerCase() || '';

    expect(/\\bclaims?\\b/.test(visibleText)).toBe(false);
    expect(/\\bbullets?\\b/.test(visibleText)).toBe(false);
    expect(/\\bnormalized\\b/.test(visibleText)).toBe(false);
    expect(/\\bautouse\\b/.test(visibleText)).toBe(false);
    expect(/claim ledger/.test(visibleText)).toBe(false);
    expect(visibleText.includes('parsed locally in your browser')).toBe(false);
    expect(visibleText.includes('all inputs share one parser')).toBe(false);
    expect(visibleText.includes('automatically choose the best parsing method')).toBe(false);
  });

  it('applies location rules by type in preferences', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import Your Resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring Preferences/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Remote/i }));
    expect(screen.getByText(/Remote roles do not need city or radius/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/City \(required\)/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /\+ Hybrid/i }));
    expect(screen.getByPlaceholderText(/City \(required\)/i)).toBeTruthy();
    expect(screen.getByText(/Radius \(miles\)/i)).toBeTruthy();
  });
});

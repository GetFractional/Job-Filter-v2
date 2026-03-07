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

describe('OnboardingWizard proof compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.importSession = null;
  });

  it('saves parsed draft using proof payload metadata and lineage fields', async () => {
    mockState.importSession = {
      id: 'session-proof',
      mode: 'default',
      selectedMode: 'default',
      state: 'parsed',
      storage: 'localStorage',
      updatedAt: new Date().toISOString(),
      sourceMeta: {
        inputKind: 'upload',
        fileName: 'resume.pdf',
        fileSizeBytes: 1024,
        mimeType: 'application/pdf',
      },
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
        previewLines: ['Normalized source line'],
        previewLinesWithNumbers: [{ line: 1, text: 'Normalized source line' }],
        rawPreviewLinesWithNumbers: [{ line: 1, text: 'Raw source line' }],
      },
      draft: {
        companies: [
          {
            id: 'company-1',
            name: 'Acme',
            confidence: 0.9,
            status: 'active',
            sourceRefs: [{ lineIndex: 0 }],
            roles: [
              {
                id: 'role-1',
                title: 'Growth Lead',
                startDate: 'Jan 2020',
                endDate: '',
                currentRole: true,
                confidence: 0.88,
                status: 'active',
                sourceRefs: [{ lineIndex: 0 }],
                highlights: [
                  {
                    id: 'item-1',
                    type: 'highlight',
                    text: 'Built lifecycle engine',
                    confidence: 0.8,
                    status: 'active',
                    sourceRefs: [{ lineIndex: 0 }],
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

    fireEvent.click(screen.getByRole('button', { name: /Approve & Save/i }));

    await waitFor(() => {
      expect(mockState.addClaim).toHaveBeenCalledTimes(1);
    });

    const payload = mockState.addClaim.mock.calls[0][0];
    expect(payload.status).toBe('active');
    expect(payload.autoUse).toBe(true);
    expect(payload.endDate).toBeUndefined();
    expect(payload.sourceMeta.importSessionId).toBe('session-proof');
    expect(payload.sourceMeta.parseMode).toBe('default');
    expect(payload.sourceMeta.sourceLineIndexes).toEqual([0]);
    expect(payload.sourceMeta.sourceSnippets).toEqual(['Normalized source line']);
    expect(payload.lineage.companyId).toBe('company-1');
    expect(payload.lineage.roleId).toBe('role-1');
  });
});

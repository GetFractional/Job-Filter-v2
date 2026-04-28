// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ProfileWorkspacePage } from '../ProfileWorkspacePage';
import { useStore } from '../../store/useStore';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

const mockUseStore = useStore as unknown as Mock;

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

const baseState = {
  profile: {
    name: 'Alex Morgan',
  },
};

function createSavedOperatorProfileState() {
  return {
    profile: {
      id: 'default',
      name: 'Jordan Lee',
      firstName: 'Jordan',
      lastName: 'Lee',
      headline: 'Director of Growth',
      email: 'jordan@example.com',
      phoneCountryCode: '+1',
      phoneNational: '(415) 555-1212',
      location: 'Austin, TX',
      linkedIn: 'https://linkedin.com/in/jordanlee',
      website: 'https://jordanlee.dev',
      portfolio: '',
      targetRoles: ['Director of Growth'],
      skills: [],
      tools: [],
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
        maxOnsiteDaysPerWeek: 7,
        maxTravelPercent: 100,
        employmentTypes: [],
      },
      digitalResume: {
        companies: [
          {
            id: 'company-1',
            name: 'Signal Labs',
            confidence: 1,
            status: 'active',
            sourceRefs: [],
            roles: [
              {
                id: 'role-1',
                title: 'Director of Growth',
                startDate: '2024-01',
                endDate: '',
                currentRole: true,
                confidence: 1,
                status: 'active',
                sourceRefs: [],
                highlights: [
                  {
                    id: 'highlight-1',
                    type: 'highlight',
                    text: 'Built role-based lane planning across lifecycle and paid channels.',
                    confidence: 1,
                    status: 'active',
                    sourceRefs: [],
                  },
                ],
                outcomes: [
                  {
                    id: 'outcome-1',
                    type: 'outcome',
                    text: 'Increased qualified pipeline by 41% in two quarters.',
                    confidence: 1,
                    status: 'active',
                    sourceRefs: [],
                  },
                ],
                tools: [],
                skills: [],
              },
            ],
          },
        ],
      },
      operatorCore: {
        lanes: [
          {
            id: 'lane-growth',
            title: 'Director of Growth',
            fitReasons: ['Matches saved profile truth.'],
            sourceRoleTitles: ['Director of Growth'],
          },
        ],
        selectedLaneId: 'lane-growth',
        stories: [
          {
            id: 'story-1',
            title: 'Signal Labs · Director of Growth',
            company: 'Signal Labs',
            role: 'Director of Growth',
            laneIds: ['lane-growth'],
            sourceRoleId: 'role-1',
            sourceCompanyId: 'company-1',
            challenge: 'Built role-based lane planning across lifecycle and paid channels.',
            actions: ['Built role-based lane planning across lifecycle and paid channels.'],
            outcome: 'Increased qualified pipeline by 41% in two quarters.',
            safeOutcome: 'Increased qualified pipeline by meaningfully in two quarters.',
            metricMode: 'softened',
            approved: true,
            hasNumericOutcome: true,
            proofNotes: ['Numeric result defaults to safer wording until explicitly approved.'],
          },
        ],
        assetBrief: {
          selectedLaneId: 'lane-growth',
          approvedStoryIds: ['story-1'],
          softenedStoryIds: ['story-1'],
          excludedStoryIds: [],
          targetJob: {
            title: 'Director of Growth',
            company: 'Brightloop',
            url: '',
            location: 'Remote',
            jobDescription: 'Run lane targeting and proof-safe asset generation.',
          },
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

function renderProfileRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile" element={<ProfileWorkspacePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfileWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    window.localStorage.clear();
    mockUseStore.mockImplementation((selector: (state: typeof baseState) => unknown) => selector(baseState));
  });

  it('defaults to setup mode for unknown query values', () => {
    renderProfileRoute('/profile?mode=unknown');

    expect(screen.getAllByText('Start Here').length).toBeGreaterThan(0);
    expect(screen.getByText('Turn your work history into assets that can open the right doors')).toBeTruthy();
  });

  it('honors valid mode query values', () => {
    renderProfileRoute('/profile?mode=complete');

    expect(screen.getAllByText('Start Here').length).toBeGreaterThan(0);
  });

  it('uses a fresh identity draft in setup mode instead of prefilled profile names', () => {
    renderProfileRoute('/profile?mode=setup');

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Last name/i) as HTMLInputElement).value).toBe('');
  });

  it('keeps stored profile identity available outside setup mode', () => {
    renderProfileRoute('/profile?mode=edit');

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Alex');
    expect((screen.getByLabelText(/Last name/i) as HTMLInputElement).value).toBe('Morgan');
  });

  it('supports fresh setup query flag to bypass stale local draft state', () => {
    window.localStorage.setItem('jf2-profile-workspace-draft:setup', JSON.stringify({
      version: 5,
      activeStep: 'details',
      selectedPath: 'manual',
      resumeUploadInitiated: false,
      detailsSaved: false,
      experienceConfirmed: false,
      identity: {
        firstName: 'Jordan',
        lastName: 'Lee',
        headline: '',
        email: '',
        phoneCountryCode: '+1',
        phoneNational: '',
        location: '',
        linkedIn: '',
        website: '',
        portfolio: '',
      },
      selectedFileName: null,
      selectedFileMeta: null,
      extractionStage: 'idle',
      extractionStarted: false,
      importError: null,
      timelineCompanies: [],
      revealedGroupCount: 0,
      prefillState: 'idle',
      prefillMessage: null,
    }));

    renderProfileRoute('/profile?mode=setup&fresh=1');

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Last name/i) as HTMLInputElement).value).toBe('');
  });

  it('fresh setup ignores saved profile operator state and starts at Start Here', () => {
    const savedState = createSavedOperatorProfileState();
    mockUseStore.mockImplementation((selector: (state: typeof savedState) => unknown) => selector(savedState));

    renderProfileRoute('/profile?mode=setup&fresh=1');

    expect(screen.getByText('Turn your work history into assets that can open the right doors')).toBeTruthy();
    expect(screen.queryByText('Enter a target job and generate reviewable assets')).toBeNull();
    expect(screen.queryByText('Review stories and proof safety')).toBeNull();
  });

  it('non-fresh setup can still hydrate saved operator state from the profile record', () => {
    const savedState = createSavedOperatorProfileState();
    mockUseStore.mockImplementation((selector: (state: typeof savedState) => unknown) => selector(savedState));

    renderProfileRoute('/profile?mode=setup');

    expect(screen.getByText('Enter a target job and generate reviewable assets')).toBeTruthy();
    expect((screen.getByLabelText('Job title') as HTMLInputElement).value).toBe('Director of Growth');
    expect((screen.getByLabelText('Company') as HTMLInputElement).value).toBe('Brightloop');
  });
});

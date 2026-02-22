import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from '../OnboardingWizard';

const mockState = {
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
  it('does not expose engineering jargon on the resume step', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Profile/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Import your resume/i })).toBeTruthy();
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
    await waitFor(() => expect(screen.getByRole('heading', { name: /Your Profile/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import your resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring preferences/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Remote/i }));
    expect(screen.getByText(/Remote roles do not need city or radius/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/City \(required\)/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /\+ Hybrid/i }));
    expect(screen.getByPlaceholderText(/City \(required\)/i)).toBeTruthy();
    expect(screen.getByText(/Radius \(miles\)/i)).toBeTruthy();
  });
});

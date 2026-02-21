import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from '../OnboardingWizard';

const mockState = {
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
    locationPreference: '',
    disqualifiers: [],
    locationPreferences: [],
    hardFilters: {
      requiresVisaSponsorship: false,
      minBaseSalary: 0,
      maxOnsiteDaysPerWeek: 5,
      maxTravelPercent: 100,
      employmentType: 'exclude_contract',
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
  });
});

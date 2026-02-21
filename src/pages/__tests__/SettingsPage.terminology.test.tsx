// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { SettingsPage } from '../SettingsPage';
import { useStore } from '../../store/useStore';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

const mockUseStore = useStore as unknown as Mock;

const state = {
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
  importSession: null,
  updateProfile: vi.fn(async () => {}),
  setImportSession: vi.fn(),
  hydrateImportSession: vi.fn(),
  refreshData: vi.fn(async () => {}),
};

describe('SettingsPage terminology guard', () => {
  it('keeps user-facing labels free of engineering jargon', () => {
    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Digital Resume/i }));

    const visibleText = document.body.textContent?.toLowerCase() || '';

    expect(/\bclaims?\b/.test(visibleText)).toBe(false);
    expect(/\bbullets?\b/.test(visibleText)).toBe(false);
    expect(/\bnormalized\b/.test(visibleText)).toBe(false);
    expect(/\bautouse\b/.test(visibleText)).toBe(false);
    expect(/claim ledger/.test(visibleText)).toBe(false);
  });
});

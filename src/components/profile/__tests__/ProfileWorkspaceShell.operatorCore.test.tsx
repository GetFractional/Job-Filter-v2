// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileWorkspaceShell } from '../ProfileWorkspaceShell';
import { useStore } from '../../../store/useStore';

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn(),
}));

const mockUseStore = vi.mocked(useStore);

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

const addJob = vi.fn(async () => ({ id: 'job-1' }));
const updateJob = vi.fn(async () => {});
const addAsset = vi.fn(async ({ type }: { type: string }) => ({
  id: type === 'Resume' ? 'asset-resume' : 'asset-cover-letter',
}));
const updateAsset = vi.fn(async () => {});
const updateProfile = vi.fn(async () => {});

const baseState = {
  profile: {
    id: 'default',
    name: '',
    firstName: '',
    lastName: '',
    targetRoles: [],
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
    updatedAt: new Date().toISOString(),
  },
  assets: [],
  addJob,
  updateJob,
  addAsset,
  updateAsset,
  updateProfile,
};

const initialIdentity = {
  firstName: '',
  lastName: '',
  headline: '',
  email: '',
  phoneCountryCode: '+1',
  phoneNational: '',
  location: '',
  linkedIn: '',
  website: '',
  portfolio: '',
};

describe('ProfileWorkspaceShell operator core flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    mockUseStore.mockImplementation((selector) => (
      (selector as unknown as (state: typeof baseState) => unknown)(baseState)
    ));
  });

  it('supports manual setup through lane selection, story review, and asset generation', async () => {
    render(
      <MemoryRouter>
        <ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.change(screen.getByLabelText(/Target title/i), { target: { value: 'Director of Growth' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.change(screen.getByLabelText(/Assign company|Company name/), { target: { value: 'Signal Labs' } });
    fireEvent.change(screen.getByLabelText('Role title'), { target: { value: 'Director of Growth' } });
    fireEvent.change(screen.getByLabelText('Start month'), { target: { value: '2024-01' } });
    fireEvent.click(screen.getByLabelText('Current role'));
    fireEvent.change(screen.getByPlaceholderText('Led weekly growth planning with sales and CS'), {
      target: { value: 'Built role-based lane planning across lifecycle and paid channels.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Increased qualified pipeline by 48%'), {
      target: { value: 'Increased qualified pipeline by 41% in two quarters.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm timeline' }));

    await waitFor(() => {
      expect(screen.getByText('Choose your role lane')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock lane and continue' }));

    await waitFor(() => {
      expect(screen.getByText('Review stories and proof safety')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock reviewed stories' }));

    await waitFor(() => {
      expect(screen.getByText('Enter a target job and generate reviewable assets')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Director of Growth' } });
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Brightloop' } });
    fireEvent.change(screen.getByLabelText('Minimum job context'), {
      target: { value: 'Run lane targeting, proof-safe asset generation, and operator workflows for the growth team.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate resume + cover letter' }));

    await waitFor(() => {
      expect(addJob).toHaveBeenCalledTimes(1);
      expect(addAsset).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Saved to the job workspace for continued review.')).toBeTruthy();
      expect(screen.getByText(/REVIEW BEFORE SEND/i)).toBeTruthy();
    });
  });

  it('restores operator-core progress and target-job inputs after reload', async () => {
    const view = render(
      <MemoryRouter>
        <ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.change(screen.getByLabelText(/Target title/i), { target: { value: 'Director of Growth' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.change(screen.getByLabelText(/Assign company|Company name/), { target: { value: 'Signal Labs' } });
    fireEvent.change(screen.getByLabelText('Role title'), { target: { value: 'Director of Growth' } });
    fireEvent.change(screen.getByLabelText('Start month'), { target: { value: '2024-01' } });
    fireEvent.click(screen.getByLabelText('Current role'));
    fireEvent.change(screen.getByPlaceholderText('Led weekly growth planning with sales and CS'), {
      target: { value: 'Built role-based lane planning across lifecycle and paid channels.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Increased qualified pipeline by 48%'), {
      target: { value: 'Increased qualified pipeline by 41% in two quarters.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm timeline' }));

    await waitFor(() => {
      expect(screen.getByText('Choose your role lane')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock lane and continue' }));
    await waitFor(() => {
      expect(screen.getByText('Review stories and proof safety')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock reviewed stories' }));
    await waitFor(() => {
      expect(screen.getByText('Enter a target job and generate reviewable assets')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Director of Growth' } });
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Brightloop' } });
    fireEvent.change(screen.getByLabelText('Minimum job context'), {
      target: { value: 'Run lane targeting, proof-safe asset generation, and operator workflows for the growth team.' },
    });

    view.unmount();

    render(
      <MemoryRouter>
        <ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Enter a target job and generate reviewable assets')).toBeTruthy();
    });
    expect((screen.getByLabelText('Job title') as HTMLInputElement).value).toBe('Director of Growth');
    expect((screen.getByLabelText('Company') as HTMLInputElement).value).toBe('Brightloop');
    expect((screen.getByLabelText('Minimum job context') as HTMLTextAreaElement).value)
      .toContain('proof-safe asset generation');
  });
});

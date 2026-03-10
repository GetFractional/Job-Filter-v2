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
});

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
    mockUseStore.mockImplementation((selector: (state: typeof baseState) => unknown) => selector(baseState));
  });

  it('defaults to setup mode for unknown query values', () => {
    renderProfileRoute('/profile?mode=unknown');

    expect(screen.getAllByText('Start Here').length).toBeGreaterThan(0);
    expect(screen.getByText('Build the profile behind every strong application')).toBeTruthy();
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
});

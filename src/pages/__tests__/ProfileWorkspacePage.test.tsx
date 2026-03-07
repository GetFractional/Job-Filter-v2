// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
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

    expect(screen.getByText('Setup mode')).toBeTruthy();
  });

  it('honors valid mode query values', () => {
    renderProfileRoute('/profile?mode=complete');

    expect(screen.getByText('Complete profile mode')).toBeTruthy();
  });
});

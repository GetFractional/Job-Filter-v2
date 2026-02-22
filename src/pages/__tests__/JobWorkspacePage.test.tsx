// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { JobWorkspacePage } from '../JobWorkspacePage';
import { useStore } from '../../store/useStore';
import type { Job } from '../../types';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

const mockUseStore = useStore as unknown as Mock;

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  title: 'Senior Growth Manager',
  company: 'Acme Corp',
  locationType: 'Unknown',
  employmentType: 'Full-time',
  jobDescription: 'JD',
  stage: 'Scored',
  stageTimestamps: { Scored: '2026-02-10T00:00:00.000Z' },
  fitScore: 43,
  fitLabel: 'Maybe',
  disqualifiers: [],
  reasonsToPursue: [],
  reasonsToPass: [],
  redFlags: [],
  requirementsExtracted: [],
  createdAt: '2026-02-10T00:00:00.000Z',
  updatedAt: '2026-02-10T00:00:00.000Z',
  ...overrides,
});

describe('JobWorkspacePage mobile overflow guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps tabs scrollable and content container clipped on x-axis', () => {
    const state = {
      jobs: [makeJob()],
      activeTab: 'requirements' as const,
      setActiveTab: vi.fn(),
      setSelectedJob: vi.fn(),
      scoreAndUpdateJob: vi.fn(),
      moveJobToStage: vi.fn(),
      updateJob: vi.fn(),
    };

    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(
      <MemoryRouter initialEntries={['/job/job-1']}>
        <Routes>
          <Route path="/job/:jobId" element={<JobWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    const tabsScroll = screen.getByTestId('job-tabs-scroll');
    const content = screen.getByTestId('job-tab-content');
    const requirementsTab = screen.getByRole('button', { name: 'Requirements' });

    expect(tabsScroll.className).toContain('overflow-x-auto');
    expect(content.className).toContain('overflow-x-hidden');
    expect(requirementsTab.className).toContain('shrink-0');
  });

  it('keeps user-facing terminology aligned to evidence language', () => {
    const state = {
      jobs: [makeJob({
        requirementsExtracted: [
          {
            type: 'experience' as const,
            description: 'Own growth strategy',
            priority: 'Must' as const,
            match: 'Missing' as const,
          },
        ],
      })],
      activeTab: 'score' as const,
      setActiveTab: vi.fn(),
      setSelectedJob: vi.fn(),
      scoreAndUpdateJob: vi.fn(),
      moveJobToStage: vi.fn(),
      updateJob: vi.fn(),
    };

    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(
      <MemoryRouter initialEntries={['/job/job-1']}>
        <Routes>
          <Route path="/job/:jobId" element={<JobWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    const visibleText = document.body.textContent?.toLowerCase() || '';
    expect(/\bclaims?\b/.test(visibleText)).toBe(false);
    expect(/\bbullets?\b/.test(visibleText)).toBe(false);
    expect(/\bnormalized\b/.test(visibleText)).toBe(false);
    expect(/\bautouse\b/.test(visibleText)).toBe(false);
  });

  it('opens the edit job modal from the score header', () => {
    const state = {
      jobs: [makeJob()],
      activeTab: 'score' as const,
      setActiveTab: vi.fn(),
      setSelectedJob: vi.fn(),
      scoreAndUpdateJob: vi.fn(),
      moveJobToStage: vi.fn(),
      updateJob: vi.fn(),
    };

    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(
      <MemoryRouter initialEntries={['/job/job-1']}>
        <Routes>
          <Route path="/job/:jobId" element={<JobWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit job details')).toBeTruthy();
  });
});

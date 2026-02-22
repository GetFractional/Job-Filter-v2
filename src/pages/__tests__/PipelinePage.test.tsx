// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PipelinePage } from '../PipelinePage';
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
  stage: 'Closed Won',
  stageTimestamps: { 'Closed Won': '2026-02-10T00:00:00.000Z' },
  disqualifiers: [],
  reasonsToPursue: [],
  reasonsToPass: [],
  redFlags: [],
  requirementsExtracted: [],
  createdAt: '2026-02-10T00:00:00.000Z',
  updatedAt: '2026-02-10T00:00:00.000Z',
  ...overrides,
});

describe('PipelinePage stage transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides manual stage controls on pipeline cards', () => {
    const moveJobToStage = vi.fn();
    const state = {
      jobs: [makeJob()],
      moveJobToStage,
    };

    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>
    );

    expect(screen.queryByTitle('Move to stage')).toBeNull();
    expect(screen.getByText('Open job for stage actions')).toBeTruthy();
    expect(moveJobToStage).not.toHaveBeenCalled();
  });

  it('uses score-based fit labels consistently', () => {
    const state = {
      jobs: [
        makeJob({ id: 'job-high', title: 'High Fit', fitScore: 70, fitLabel: 'Maybe' }),
        makeJob({ id: 'job-mid', title: 'Mid Fit', fitScore: 55, fitLabel: 'Pass' }),
      ],
      moveJobToStage: vi.fn(),
    };

    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Pursue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Maybe').length).toBeGreaterThan(0);
  });
});

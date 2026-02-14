// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
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

  it('uses moveJobToStage for card stage changes (guarded path)', () => {
    const moveJobToStage = vi.fn();
    const updateJob = vi.fn();
    const state = {
      jobs: [makeJob()],
      moveJobToStage,
      updateJob,
    };

    mockUseStore.mockImplementation((selector: (store: typeof state) => unknown) => selector(state));

    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>
    );

    const selector = screen.getByTitle('Move to stage');
    fireEvent.change(selector, { target: { value: 'Closed Lost' } });

    expect(moveJobToStage).toHaveBeenCalledWith('job-1', 'Closed Lost');
    expect(updateJob).not.toHaveBeenCalled();
  });
});

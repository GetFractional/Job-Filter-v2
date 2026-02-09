import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeFunnelMetrics, computeBottleneckMetrics } from '../metrics';
import type { Job, Activity } from '../../types';

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: overrides.id ?? 'job-1',
    title: 'Growth Manager',
    company: 'TestCo',
    locationType: 'Remote',
    employmentType: 'Full-time',
    jobDescription: 'Test JD',
    stage: overrides.stage ?? 'Captured',
    stageTimestamps: overrides.stageTimestamps ?? {},
    disqualifiers: [],
    reasonsToPursue: [],
    reasonsToPass: [],
    redFlags: [],
    requirementsExtracted: [],
    fitScore: overrides.fitScore,
    fitLabel: overrides.fitLabel,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    ...overrides,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: overrides.id ?? 'act-1',
    channel: 'Email',
    direction: overrides.direction ?? 'Outbound',
    content: 'Test content',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('computeFunnelMetrics', () => {
  it('returns correct totalCaptured count', () => {
    const jobs = [makeJob({ id: 'j1' }), makeJob({ id: 'j2' }), makeJob({ id: 'j3' })];
    const result = computeFunnelMetrics(jobs, []);
    expect(result.totalCaptured).toBe(3);
  });

  it('returns 0 pursueRate when no scored jobs exist', () => {
    const jobs = [makeJob({ fitLabel: undefined, fitScore: undefined })];
    const result = computeFunnelMetrics(jobs, []);
    expect(result.pursueRate).toBe(0);
  });

  it('calculates correct pursueRate when there are scored jobs', () => {
    const jobs = [
      makeJob({ id: 'j1', fitLabel: 'Pursue' }),
      makeJob({ id: 'j2', fitLabel: 'Maybe' }),
      makeJob({ id: 'j3', fitLabel: 'Pass' }),
      makeJob({ id: 'j4', fitLabel: 'Pursue' }),
    ];
    const result = computeFunnelMetrics(jobs, []);
    // 2 Pursue out of 4 scored = 0.5
    expect(result.pursueRate).toBe(0.5);
  });

  it('returns correct outreachVolume from outbound activities', () => {
    const activities = [
      makeActivity({ id: 'a1', direction: 'Outbound' }),
      makeActivity({ id: 'a2', direction: 'Outbound' }),
      makeActivity({ id: 'a3', direction: 'Inbound' }),
    ];
    const result = computeFunnelMetrics([], activities);
    expect(result.outreachVolume).toBe(2);
  });

  it('pipelineByStage counts jobs per stage correctly', () => {
    const jobs = [
      makeJob({ id: 'j1', stage: 'Captured' }),
      makeJob({ id: 'j2', stage: 'Captured' }),
      makeJob({ id: 'j3', stage: 'Scored' }),
      makeJob({ id: 'j4', stage: 'Interviewing' }),
    ];
    const result = computeFunnelMetrics(jobs, []);
    expect(result.pipelineByStage['Captured']).toBe(2);
    expect(result.pipelineByStage['Scored']).toBe(1);
    expect(result.pipelineByStage['Interviewing']).toBe(1);
    expect(result.pipelineByStage['Offer']).toBe(0);
  });

  it('returns 0 for all rates with empty arrays', () => {
    const result = computeFunnelMetrics([], []);
    expect(result.totalCaptured).toBe(0);
    expect(result.pursueRate).toBe(0);
    expect(result.outreachVolume).toBe(0);
    expect(result.responseRate).toBe(0);
    expect(result.screenRate).toBe(0);
    expect(result.interviewRate).toBe(0);
    expect(result.offerRate).toBe(0);
  });
});

describe('computeBottleneckMetrics', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty stalledJobs when all jobs are recently updated', () => {
    const jobs = [
      makeJob({ id: 'j1', updatedAt: new Date().toISOString() }),
      makeJob({ id: 'j2', updatedAt: new Date().toISOString() }),
    ];
    const result = computeBottleneckMetrics(jobs);
    expect(result.stalledJobs).toHaveLength(0);
  });

  it('returns stalled jobs when updatedAt is 6+ days ago', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const jobs = [
      makeJob({ id: 'j1', stage: 'Captured', updatedAt: sixDaysAgo }),
      makeJob({ id: 'j2', stage: 'Scored', updatedAt: new Date().toISOString() }),
    ];
    const result = computeBottleneckMetrics(jobs);
    expect(result.stalledJobs).toHaveLength(1);
    expect(result.stalledJobs[0].id).toBe('j1');
  });

  it('excludes Closed Won and Closed Lost from stalled detection', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const jobs = [
      makeJob({ id: 'j1', stage: 'Closed Won', updatedAt: sixDaysAgo }),
      makeJob({ id: 'j2', stage: 'Closed Lost', updatedAt: sixDaysAgo }),
      makeJob({ id: 'j3', stage: 'Captured', updatedAt: sixDaysAgo }),
    ];
    const result = computeBottleneckMetrics(jobs);
    // Only j3 should be stalled; Closed Won/Lost are excluded
    expect(result.stalledJobs).toHaveLength(1);
    expect(result.stalledJobs[0].id).toBe('j3');
  });

  it('medianTimeInStage returns 0 for stages with no jobs', () => {
    const result = computeBottleneckMetrics([]);
    expect(result.medianTimeInStage['Offer']).toBe(0);
    expect(result.medianTimeInStage['Captured']).toBe(0);
    expect(result.medianTimeInStage['Interviewing']).toBe(0);
  });
});

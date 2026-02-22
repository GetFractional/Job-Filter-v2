// Job Filter v2 — Dashboard Metrics Calculations
// Pure functions that compute metrics from raw data.

import { differenceInDays, differenceInHours, startOfWeek, subWeeks, isAfter } from 'date-fns';
import type { Job, Activity, PipelineStage, FunnelMetrics, BottleneckMetrics } from '../types';
import { PIPELINE_STAGES } from '../types';
import { getEffectiveFitLabel } from './scoreBands';

// ============================================================
// Executive Dashboard Metrics
// ============================================================

export function computeFunnelMetrics(jobs: Job[], activities: Activity[]): FunnelMetrics {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  // Pipeline counts by stage
  const pipelineByStage = {} as Record<PipelineStage, number>;
  for (const stage of PIPELINE_STAGES) {
    pipelineByStage[stage] = 0;
  }
  for (const job of jobs) {
    pipelineByStage[job.stage] = (pipelineByStage[job.stage] || 0) + 1;
  }

  // Captured this week / last week
  const capturedThisWeek = jobs.filter((j) => {
    const ts = j.stageTimestamps['Captured'];
    return ts && isAfter(new Date(ts), thisWeekStart);
  }).length;

  const capturedLastWeek = jobs.filter((j) => {
    const ts = j.stageTimestamps['Captured'];
    return ts && isAfter(new Date(ts), lastWeekStart) && !isAfter(new Date(ts), thisWeekStart);
  }).length;

  // Pursue rate
  const scoredJobs = jobs.filter((j) => j.fitScore !== undefined || j.fitLabel);
  const pursueJobs = scoredJobs.filter((j) => getEffectiveFitLabel(j.fitScore, j.fitLabel) === 'Pursue');
  const pursueRate = scoredJobs.length > 0 ? pursueJobs.length / scoredJobs.length : 0;

  // Outreach volume (activities with direction Outbound)
  const outboundActivities = activities.filter((a) => a.direction === 'Outbound');
  const outreachVolume = outboundActivities.length;

  // Response rate
  const jobsWithOutreach = new Set(outboundActivities.map((a) => a.jobId).filter(Boolean));
  const jobsWithResponse = new Set(
    activities
      .filter((a) => a.direction === 'Inbound' || a.outcome === 'Reply Received')
      .map((a) => a.jobId)
      .filter(Boolean)
  );
  const responseRate =
    jobsWithOutreach.size > 0 ? jobsWithResponse.size / jobsWithOutreach.size : 0;

  // Screen rate (jobs that reached Response/Screen or beyond)
  const screenStages: PipelineStage[] = ['Response/Screen', 'Interviewing', 'Offer', 'Negotiation', 'Closed Won'];
  const screenedJobs = jobs.filter((j) => screenStages.includes(j.stage));
  const screenRate = jobsWithOutreach.size > 0 ? screenedJobs.length / jobsWithOutreach.size : 0;

  // Interview rate
  const interviewStages: PipelineStage[] = ['Interviewing', 'Offer', 'Negotiation', 'Closed Won'];
  const interviewedJobs = jobs.filter((j) => interviewStages.includes(j.stage));
  const interviewRate =
    jobsWithOutreach.size > 0 ? interviewedJobs.length / jobsWithOutreach.size : 0;

  // Offer rate
  const offerStages: PipelineStage[] = ['Offer', 'Negotiation', 'Closed Won'];
  const offeredJobs = jobs.filter((j) => offerStages.includes(j.stage));
  const offerRate = jobsWithOutreach.size > 0 ? offeredJobs.length / jobsWithOutreach.size : 0;

  return {
    totalCaptured: jobs.length,
    pursueRate,
    outreachVolume,
    responseRate,
    screenRate,
    interviewRate,
    offerRate,
    pipelineByStage,
    capturedThisWeek,
    capturedLastWeek,
  };
}

// ============================================================
// Bottleneck Dashboard Metrics
// ============================================================

export function computeBottleneckMetrics(jobs: Job[]): BottleneckMetrics {
  const now = new Date();

  // Conversion by stage transition
  const conversionByStage: Record<string, number> = {};
  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const fromStage = PIPELINE_STAGES[i];
    const toStage = PIPELINE_STAGES[i + 1];
    const fromCount = jobs.filter((j) => {
      const ts = j.stageTimestamps[fromStage];
      return ts !== undefined;
    }).length;
    const toCount = jobs.filter((j) => {
      const ts = j.stageTimestamps[toStage];
      return ts !== undefined;
    }).length;
    const key = `${fromStage} → ${toStage}`;
    conversionByStage[key] = fromCount > 0 ? toCount / fromCount : 0;
  }

  // Median time in stage (hours)
  const medianTimeInStage = {} as Record<PipelineStage, number>;
  for (const stage of PIPELINE_STAGES) {
    const times: number[] = [];
    for (const job of jobs) {
      const enteredTs = job.stageTimestamps[stage];
      if (!enteredTs) continue;

      // Find next stage timestamp
      const stageIndex = PIPELINE_STAGES.indexOf(stage);
      let exitTs: string | undefined;
      for (let i = stageIndex + 1; i < PIPELINE_STAGES.length; i++) {
        if (job.stageTimestamps[PIPELINE_STAGES[i]]) {
          exitTs = job.stageTimestamps[PIPELINE_STAGES[i]];
          break;
        }
      }

      if (exitTs) {
        times.push(differenceInHours(new Date(exitTs), new Date(enteredTs)));
      } else if (job.stage === stage) {
        // Still in this stage
        times.push(differenceInHours(now, new Date(enteredTs)));
      }
    }

    times.sort((a, b) => a - b);
    medianTimeInStage[stage] = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;
  }

  // Stalled jobs (no activity in 5+ days and not closed)
  const closedStages: PipelineStage[] = ['Closed Won', 'Closed Lost'];
  const stalledJobs = jobs.filter((j) => {
    if (closedStages.includes(j.stage)) return false;
    const lastUpdate = new Date(j.updatedAt);
    return differenceInDays(now, lastUpdate) >= 5;
  });

  return {
    conversionByStage,
    medianTimeInStage,
    stalledJobs,
  };
}

// ============================================================
// Template Performance Metrics
// ============================================================

export interface TemplatePerformance {
  templateId: string;
  usageCount: number;
  responseCount: number;
  responseRate: number;
  screenCount: number;
  interviewCount: number;
}

export function computeTemplatePerformance(
  activities: Activity[],
  jobs: Job[]
): TemplatePerformance[] {
  const templateMap = new Map<string, { uses: number; responses: number; screens: number; interviews: number }>();

  for (const activity of activities) {
    if (!activity.templateId || activity.direction !== 'Outbound') continue;

    const stats = templateMap.get(activity.templateId) || { uses: 0, responses: 0, screens: 0, interviews: 0 };
    stats.uses++;

    // Check if the job progressed
    if (activity.jobId) {
      const job = jobs.find((j) => j.id === activity.jobId);
      if (job) {
        const responseStages: PipelineStage[] = ['Response/Screen', 'Interviewing', 'Offer', 'Negotiation', 'Closed Won'];
        if (responseStages.includes(job.stage)) stats.responses++;
        const interviewStages: PipelineStage[] = ['Interviewing', 'Offer', 'Negotiation', 'Closed Won'];
        if (interviewStages.includes(job.stage)) stats.interviews++;
        const screenStages: PipelineStage[] = ['Response/Screen', 'Interviewing', 'Offer', 'Negotiation', 'Closed Won'];
        if (screenStages.includes(job.stage)) stats.screens++;
      }
    }

    templateMap.set(activity.templateId, stats);
  }

  return Array.from(templateMap.entries()).map(([templateId, stats]) => ({
    templateId,
    usageCount: stats.uses,
    responseCount: stats.responses,
    responseRate: stats.uses > 0 ? stats.responses / stats.uses : 0,
    screenCount: stats.screens,
    interviewCount: stats.interviews,
  }));
}

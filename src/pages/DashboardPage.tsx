import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Send,
  MessageSquare,
  Target,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { computeFunnelMetrics, computeBottleneckMetrics } from '../lib/metrics';
import { PIPELINE_STAGES } from '../types';
import type { FunnelMetrics, BottleneckMetrics } from '../types';

interface Recommendation {
  id: string;
  title: string;
  detail: string;
  tone: 'brand' | 'amber' | 'green' | 'red';
}

function buildRecommendations(funnel: FunnelMetrics, bottleneck: BottleneckMetrics): Recommendation[] {
  const recs: Recommendation[] = [];

  if (funnel.capturedThisWeek < 3) {
    recs.push({
      id: 'sourcing',
      title: 'Increase weekly sourcing',
      detail: 'Capture at least 3 qualified jobs this week to keep downstream conversion stable.',
      tone: 'brand',
    });
  }

  if (funnel.responseRate < 0.15) {
    recs.push({
      id: 'response',
      title: 'Raise response rate',
      detail: 'Refresh outreach copy with stronger proof points and personalize by role hypothesis.',
      tone: 'amber',
    });
  }

  if (bottleneck.stalledJobs.length > 0) {
    recs.push({
      id: 'stalled',
      title: `Clear stalled jobs (${bottleneck.stalledJobs.length})`,
      detail: 'Schedule follow-ups or close lost roles so your active pipeline reflects reality.',
      tone: 'red',
    });
  }

  if (funnel.pursueRate >= 0.4 && funnel.responseRate >= 0.2 && bottleneck.stalledJobs.length === 0) {
    recs.push({
      id: 'healthy',
      title: 'Pipeline health is strong',
      detail: 'Double down on top channels and move high-fit roles to assets this week.',
      tone: 'green',
    });
  }

  return recs.slice(0, 3);
}

export function DashboardPage() {
  const jobs = useStore((s) => s.jobs);
  const activities = useStore((s) => s.activities);
  const [tab, setTab] = useState<'executive' | 'bottleneck'>('executive');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [nowTimestamp] = useState(() => Date.now());

  const sourceOptions = useMemo(() => {
    const values = new Set<string>();
    for (const job of jobs) {
      const source = (job.source || '').trim();
      if (source) values.add(source);
    }
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const roleOptions = useMemo(() => {
    const values = new Set<string>();
    for (const job of jobs) {
      const title = (job.title || '').trim();
      if (title) values.add(title);
    }
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const locationOptions = useMemo(() => {
    const values = new Set<string>();
    for (const job of jobs) {
      const location = (job.location || '').trim();
      if (location) values.add(location);
    }
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const rangeCutoffMs = useMemo(() => {
    if (timeRange === 'all') return 0;
    const days = timeRange === '7d' ? 7 : 30;
    return nowTimestamp - days * 24 * 60 * 60 * 1000;
  }, [timeRange, nowTimestamp]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (sourceFilter !== 'all' && (job.source || '') !== sourceFilter) return false;
      if (roleFilter !== 'all' && (job.title || '') !== roleFilter) return false;
      if (locationFilter !== 'all' && (job.location || '') !== locationFilter) return false;
      if (rangeCutoffMs > 0 && new Date(job.updatedAt).getTime() < rangeCutoffMs) return false;
      return true;
    });
  }, [jobs, sourceFilter, roleFilter, locationFilter, rangeCutoffMs]);

  const filteredJobIds = useMemo(() => new Set(filteredJobs.map((job) => job.id)), [filteredJobs]);
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (activity.jobId && !filteredJobIds.has(activity.jobId)) return false;
      if (rangeCutoffMs > 0 && new Date(activity.createdAt).getTime() < rangeCutoffMs) return false;
      return true;
    });
  }, [activities, filteredJobIds, rangeCutoffMs]);

  const funnel = useMemo(() => computeFunnelMetrics(filteredJobs, filteredActivities), [filteredJobs, filteredActivities]);
  const bottleneck = useMemo(() => computeBottleneckMetrics(filteredJobs), [filteredJobs]);
  const recommendations = useMemo(() => buildRecommendations(funnel, bottleneck), [funnel, bottleneck]);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
          <BarChart3 size={24} className="text-brand-600" />
        </div>
        <h2 className="text-h2 text-neutral-900 mb-1">No data yet</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">
          Add jobs to your pipeline to see executive and bottleneck metrics.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-capture-modal'))}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
        >
          <Briefcase size={16} />
          Add a Job
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="surface-card rounded-2xl p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1">Dashboard</p>
            <h1 className="text-h1 text-neutral-900">Executive summary and bottlenecks</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Focus on the next moves that materially change response and interview conversion.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="metric-chip">Pursue Rate {Math.round(funnel.pursueRate * 100)}%</span>
            <span className="metric-chip">Response Rate {Math.round(funnel.responseRate * 100)}%</span>
            <span className="metric-chip">Stalled {bottleneck.stalledJobs.length}</span>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-4 grid gap-2.5 md:grid-cols-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {rec.tone === 'green' ? (
                    <CheckCircle2 size={14} className="text-green-600" />
                  ) : rec.tone === 'red' ? (
                    <AlertTriangle size={14} className="text-red-600" />
                  ) : rec.tone === 'amber' ? (
                    <Sparkles size={14} className="text-amber-600" />
                  ) : (
                    <ArrowUpRight size={14} className="text-brand-600" />
                  )}
                  <p className="text-xs font-semibold text-neutral-800">{rec.title}</p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{rec.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => setTab('executive')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'executive'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <BarChart3 size={14} />
          Executive
        </button>
        <button
          onClick={() => setTab('bottleneck')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'bottleneck'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <AlertTriangle size={14} />
          Bottleneck
        </button>
      </div>

      <div className="surface-card rounded-2xl p-4 lg:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Time Range</label>
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as '7d' | '30d' | 'all')}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Source</label>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source === 'all' ? 'All sources' : source}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Role Title</label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All role titles' : role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Location</label>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location === 'all' ? 'All locations' : location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {tab === 'executive' ? (
        <ExecutiveTab funnel={funnel} bottleneck={bottleneck} jobs={filteredJobs} activities={filteredActivities} />
      ) : (
        <BottleneckTab bottleneck={bottleneck} nowTimestamp={nowTimestamp} />
      )}
    </div>
  );
}

function ExecutiveTab({
  funnel,
  bottleneck,
  jobs,
  activities,
}: {
  funnel: FunnelMetrics;
  bottleneck: BottleneckMetrics;
  jobs: ReturnType<typeof useStore.getState>['jobs'];
  activities: ReturnType<typeof useStore.getState>['activities'];
}) {
  const weekDelta = funnel.capturedThisWeek - funnel.capturedLastWeek;
  const benchmarks: Record<string, number> = {
    'Discovered → Captured': 0.7,
    'Captured → Scored': 0.75,
    'Scored → Researched': 0.65,
    'Researched → Assets Ready': 0.5,
    'Assets Ready → Outreach Sent': 0.6,
    'Outreach Sent → Response/Screen': 0.22,
    'Response/Screen → Interviewing': 0.45,
    'Interviewing → Offer': 0.25,
  };

  const sourcePerformance = useMemo(() => {
    const bySource = new Map<
      string,
      { jobs: number; outreachJobs: Set<string>; responseJobs: Set<string>; interviewJobs: Set<string> }
    >();
    const activitiesByJobId = new Map<string, ReturnType<typeof useStore.getState>['activities']>();

    for (const activity of activities) {
      if (!activity.jobId) continue;
      const existing = activitiesByJobId.get(activity.jobId) || [];
      existing.push(activity);
      activitiesByJobId.set(activity.jobId, existing);
    }

    for (const job of jobs) {
      const key = (job.source || 'Unknown').trim() || 'Unknown';
      const sourceStats =
        bySource.get(key) ||
        {
          jobs: 0,
          outreachJobs: new Set<string>(),
          responseJobs: new Set<string>(),
          interviewJobs: new Set<string>(),
        };
      sourceStats.jobs += 1;

      const jobActivities = activitiesByJobId.get(job.id) || [];
      const hasOutbound = jobActivities.some((activity) => activity.direction === 'Outbound');
      const hasResponse = jobActivities.some(
        (activity) =>
          activity.direction === 'Inbound' ||
          activity.outcome === 'Reply Received' ||
          activity.outcome === 'Call Scheduled' ||
          activity.outcome === 'Screen Scheduled'
      );
      const isInterviewingOrBeyond = ['Interviewing', 'Offer', 'Negotiation', 'Closed Won'].includes(job.stage);

      if (hasOutbound) sourceStats.outreachJobs.add(job.id);
      if (hasResponse) sourceStats.responseJobs.add(job.id);
      if (isInterviewingOrBeyond) sourceStats.interviewJobs.add(job.id);

      bySource.set(key, sourceStats);
    }

    return Array.from(bySource.entries())
      .map(([source, stats]) => {
        const outreachBase = stats.outreachJobs.size;
        return {
          source,
          jobs: stats.jobs,
          applyRate: stats.jobs > 0 ? outreachBase / stats.jobs : 0,
          responseRate: outreachBase > 0 ? stats.responseJobs.size / outreachBase : 0,
          interviewRate: outreachBase > 0 ? stats.interviewJobs.size / outreachBase : 0,
        };
      })
      .sort((a, b) => b.responseRate - a.responseRate);
  }, [jobs, activities]);

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Captured This Week" value={funnel.capturedThisWeek} delta={weekDelta} icon={<Briefcase size={14} className="text-brand-500" />} />
        <MetricCard
          label="Pursue Rate"
          value={`${Math.round(funnel.pursueRate * 100)}%`}
          icon={<Target size={14} className="text-green-500" />}
        />
        <MetricCard
          label="Outreach Volume"
          value={funnel.outreachVolume}
          icon={<Send size={14} className="text-blue-500" />}
        />
        <MetricCard
          label="Response Rate"
          value={`${Math.round(funnel.responseRate * 100)}%`}
          icon={<MessageSquare size={14} className="text-violet-500" />}
        />
      </div>

      <MetricCard label="Pipeline Inventory" value={funnel.totalCaptured} icon={<Layers size={14} className="text-amber-500" />} />

      {/* Captured Trend */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Captured Trend</h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900">{funnel.capturedThisWeek}</p>
            <p className="text-[11px] text-neutral-500 font-medium">This Week</p>
          </div>
          <div className="text-center text-neutral-300">
            <ArrowRight size={20} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-400">{funnel.capturedLastWeek}</p>
            <p className="text-[11px] text-neutral-500 font-medium">Last Week</p>
          </div>
          {weekDelta !== 0 && (
            <div className={`ml-auto flex items-center gap-1 text-sm font-semibold ${
              weekDelta > 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {weekDelta > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {weekDelta > 0 ? '+' : ''}{weekDelta}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Pipeline by Stage (Count)</h3>
          <div className="space-y-2">
            {PIPELINE_STAGES.filter((s) => s !== 'Closed Lost').map((stage) => {
              const count = funnel.pipelineByStage[stage] || 0;
              const maxCount = Math.max(...Object.values(funnel.pipelineByStage), 1);
              const width = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0);

              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500 w-24 truncate text-right shrink-0">{stage}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full flex items-center justify-end pr-1.5 transition-all duration-500"
                      style={{ width: `${width}%`, minWidth: count > 0 ? '24px' : '0' }}
                    >
                      {count > 0 && (
                        <span className="text-[9px] text-white font-bold">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Conversion by Stage (%)</h3>
          <div className="space-y-2.5">
            {Object.entries(bottleneck.conversionByStage).map(([transition, rate]) => {
              const benchmark = benchmarks[transition];
              const pct = Math.round(rate * 100);
              const benchmarkPct = benchmark ? Math.round(benchmark * 100) : null;
              const isAbove = benchmark !== undefined ? rate >= benchmark : rate >= 0.4;
              return (
                <div key={transition} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-600 truncate">{transition}</span>
                    <span className={`text-[11px] font-bold ${isAbove ? 'text-green-700' : 'text-amber-700'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isAbove ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.max(pct, rate > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  {benchmarkPct !== null && (
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Benchmark: {benchmarkPct}% ({isAbove ? 'above' : 'below'})
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Conversion Snapshot</h3>
        <div className="space-y-2.5">
          {[
            { label: 'Screen Rate', value: funnel.screenRate },
            { label: 'Interview Rate', value: funnel.interviewRate },
            { label: 'Offer Rate', value: funnel.offerRate },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{label}</span>
              <span className="text-sm font-bold text-neutral-900">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Source Performance</h3>
        {sourcePerformance.length === 0 ? (
          <p className="text-xs text-neutral-500">No source data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500">
                  <th className="py-2 text-left font-semibold uppercase tracking-wider">Source</th>
                  <th className="py-2 text-right font-semibold uppercase tracking-wider">Jobs</th>
                  <th className="py-2 text-right font-semibold uppercase tracking-wider">Apply %</th>
                  <th className="py-2 text-right font-semibold uppercase tracking-wider">Response %</th>
                  <th className="py-2 text-right font-semibold uppercase tracking-wider">Interview %</th>
                </tr>
              </thead>
              <tbody>
                {sourcePerformance.map((row) => (
                  <tr key={row.source} className="border-b border-neutral-50 last:border-b-0">
                    <td className="py-2 text-neutral-700">{row.source}</td>
                    <td className="py-2 text-right font-medium text-neutral-900">{row.jobs}</td>
                    <td className="py-2 text-right text-neutral-700">{Math.round(row.applyRate * 100)}%</td>
                    <td className="py-2 text-right text-neutral-700">{Math.round(row.responseRate * 100)}%</td>
                    <td className="py-2 text-right text-neutral-700">{Math.round(row.interviewRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BottleneckTab({
  bottleneck,
  nowTimestamp,
}: {
  bottleneck: BottleneckMetrics;
  nowTimestamp: number;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Stage Conversion Funnel */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Stage Conversion Funnel</h3>
        <div className="space-y-2">
          {Object.entries(bottleneck.conversionByStage).map(([transition, rate]) => {
            const pct = Math.round(rate * 100);
            const barColor = rate > 0.5 ? 'bg-green-500' : rate > 0.2 ? 'bg-amber-500' : 'bg-red-400';
            return (
              <div key={transition} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-600 truncate max-w-[70%]">{transition}</span>
                  <span className={`text-[11px] font-bold ${
                    rate > 0.5 ? 'text-green-700' : rate > 0.2 ? 'text-amber-700' : 'text-red-600'
                  }`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.max(pct, rate > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time in Stage Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Median Time in Stage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase pb-2">Stage</th>
                <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase pb-2">Median</th>
                <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase pb-2 w-12">Status</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_STAGES.filter((s) => bottleneck.medianTimeInStage[s] > 0).map((stage) => {
                const hours = bottleneck.medianTimeInStage[stage];
                const display = hours > 48 ? `${Math.round(hours / 24)}d` : `${Math.round(hours)}h`;
                const isLong = hours > 120;
                const isMedium = hours > 48 && !isLong;

                return (
                  <tr key={stage} className="border-b border-neutral-50">
                    <td className="py-2 text-xs text-neutral-700">{stage}</td>
                    <td className="py-2 text-right text-xs font-semibold text-neutral-900">{display}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isLong ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stalled Jobs */}
      {bottleneck.stalledJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={12} className="text-amber-600" />
            </div>
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Stalled Jobs ({bottleneck.stalledJobs.length})
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 mb-3">No activity in 5+ days</p>
          <div className="space-y-2">
            {bottleneck.stalledJobs.map((job) => {
              const daysSince = Math.floor((nowTimestamp - new Date(job.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/job/${job.id}`)}
                  className="w-full text-left bg-amber-50/50 rounded-lg border border-amber-100 p-3 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{job.title}</p>
                      <p className="text-xs text-neutral-500">{job.company}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                        {job.stage}
                      </span>
                      <p className="text-[11px] text-red-500 font-medium mt-0.5 flex items-center gap-0.5 justify-end">
                        <Clock size={9} />
                        {daysSince}d stalled
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: number | string;
  delta?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 mb-0.5 ${
            delta > 0 ? 'text-green-600' : 'text-red-500'
          }`}>
            {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  );
}

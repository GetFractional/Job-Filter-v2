import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  Send,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  DollarSign,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { STAGE_CATEGORIES } from '../types';
import type { Job, FitLabel, PipelineStage } from '../types';
import { getEffectiveFitLabel, getFitLabelText } from '../lib/scoreBands';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

function formatComp(job: Job): string | null {
  if (job.compRange) return job.compRange;
  if (job.compMin && job.compMax) {
    return `$${Math.round(job.compMin / 1000)}k - $${Math.round(job.compMax / 1000)}k`;
  }
  if (job.compMin) return `$${Math.round(job.compMin / 1000)}k+`;
  if (job.compMax) return `up to $${Math.round(job.compMax / 1000)}k`;
  return null;
}

function formatLocation(job: Job): string | null {
  const parts: string[] = [];
  if (job.location) parts.push(job.location);
  if (job.locationType && job.locationType !== 'Unknown') parts.push(job.locationType);
  return parts.length > 0 ? parts.join(' · ') : null;
}

const NEXT_ACTION: Record<PipelineStage, string> = {
  Discovered: 'Score this job',
  Captured: 'Score this job',
  Scored: 'Run research',
  Researched: 'Generate assets',
  'Assets Ready': 'Send outreach',
  'Outreach Sent': 'Follow up',
  'Response/Screen': 'Schedule interview',
  Interviewing: 'Prep for next round',
  Offer: 'Review terms',
  Negotiation: 'Close the deal',
  'Closed Won': 'Celebrate',
  'Closed Lost': 'Retrospect',
};

function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const scoreA = a.fitScore ?? -1;
    const scoreB = b.fitScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const FIT_LABEL_STYLES: Record<FitLabel, string> = {
  Pursue: 'text-green-700 bg-green-50 ring-1 ring-green-200',
  Maybe: 'text-amber-700 bg-amber-50 ring-1 ring-amber-200',
  Pass: 'text-red-600 bg-red-50 ring-1 ring-red-200',
};

const SCORE_COLOR = (score: number | undefined, label: FitLabel | undefined): string => {
  const normalized = getEffectiveFitLabel(score, label);
  if (!normalized) return 'text-neutral-400';
  if (normalized === 'Pursue') return 'text-green-700';
  if (normalized === 'Maybe') return 'text-amber-600';
  return 'text-red-600';
};

const CATEGORY_META: Record<string, { ring: string; badge: string; dot: string }> = {
  Sourcing: {
    ring: 'ring-blue-200',
    badge: 'text-blue-700 bg-blue-50 ring-1 ring-blue-200',
    dot: 'bg-blue-400',
  },
  Qualification: {
    ring: 'ring-violet-200',
    badge: 'text-violet-700 bg-violet-50 ring-1 ring-violet-200',
    dot: 'bg-violet-400',
  },
  Conversion: {
    ring: 'ring-amber-200',
    badge: 'text-amber-700 bg-amber-50 ring-1 ring-amber-200',
    dot: 'bg-amber-400',
  },
  Revenue: {
    ring: 'ring-green-200',
    badge: 'text-green-700 bg-green-50 ring-1 ring-green-200',
    dot: 'bg-green-400',
  },
};

// ---------------------------------------------------------------------------
// Job Card (dense)
// ---------------------------------------------------------------------------

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const comp = formatComp(job);
  const loc = formatLocation(job);
  const action = NEXT_ACTION[job.stage];
  const fitLabel = getEffectiveFitLabel(job.fitScore, job.fitLabel);
  const fitLabelText = getFitLabelText(fitLabel);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="w-full text-left bg-white rounded-md border border-neutral-200 px-3 py-2 hover:border-brand-300 hover:shadow-sm transition-all group cursor-pointer"
    >
      {/* Row 1: Title + fit badge + chevron */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[13px] font-semibold text-neutral-900 truncate leading-tight">
          {job.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {fitLabel && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-px rounded ${FIT_LABEL_STYLES[fitLabel]}`}
            >
              {fitLabelText}
            </span>
          )}
          <ChevronRight
            size={14}
            className="text-neutral-300 group-hover:text-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Row 2: Company + score + time */}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-neutral-500 truncate">{job.company}</span>
        {job.fitScore !== undefined && (
          <span className={`text-[11px] font-bold tabular-nums ${SCORE_COLOR(job.fitScore, fitLabel)}`}>
            {job.fitScore}
          </span>
        )}
        <span className="text-[10px] text-neutral-400 flex items-center gap-0.5 ml-auto shrink-0">
          <Clock size={9} />
          {formatTimeAgo(job.updatedAt)}
        </span>
      </div>

      {/* Row 3: Location + comp (conditional) */}
      {(loc || comp) && (
        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
          {loc && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin size={10} className="shrink-0 text-neutral-400" />
              {loc}
            </span>
          )}
          {comp && (
            <span className="flex items-center gap-0.5 shrink-0">{comp}</span>
          )}
        </div>
      )}

      {/* Row 4: Next action */}
      <div className="flex items-center justify-between mt-1.5">
        {action && (
          <div className="flex items-center gap-1 text-[10px] font-medium text-brand-600 opacity-70 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={10} />
            <span>{action}</span>
          </div>
        )}
        <span className="text-[10px] text-neutral-400 ml-auto">Open job for stage actions</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PipelinePage() {
  const navigate = useNavigate();
  const jobs = useStore((s) => s.jobs);

  // ---- Computed stats ----
  const stats = useMemo(() => {
    const pursueCount = jobs.filter((job) => getEffectiveFitLabel(job.fitScore, job.fitLabel) === 'Pursue').length;
    const maybeCount = jobs.filter((job) => getEffectiveFitLabel(job.fitScore, job.fitLabel) === 'Maybe').length;
    const outreachStages: PipelineStage[] = [
      'Outreach Sent',
      'Response/Screen',
      'Interviewing',
    ];
    const activeOutreach = jobs.filter((j) => outreachStages.includes(j.stage)).length;
    const interviewCount = jobs.filter((j) => j.stage === 'Interviewing').length;
    const offerCount = jobs.filter(
      (j) => j.stage === 'Offer' || j.stage === 'Negotiation'
    ).length;
    const avgScore =
      jobs.filter((j) => j.fitScore !== undefined).length > 0
        ? Math.round(
            jobs.reduce((sum, j) => sum + (j.fitScore ?? 0), 0) /
              jobs.filter((j) => j.fitScore !== undefined).length
          )
        : null;

    return { total: jobs.length, pursueCount, maybeCount, activeOutreach, interviewCount, offerCount, avgScore };
  }, [jobs]);

  // ---- Jobs by stage, sorted ----
  const jobsByStage = useMemo(() => {
    const map = new Map<PipelineStage, Job[]>();
    for (const job of jobs) {
      const existing = map.get(job.stage) || [];
      existing.push(job);
      map.set(job.stage, existing);
    }
    // Sort each stage bucket
    for (const [stage, bucket] of map) {
      map.set(stage, sortJobs(bucket));
    }
    return map;
  }, [jobs]);

  // ---- Empty state ----
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
          <Briefcase size={24} className="text-brand-600" />
        </div>
        <h2 className="text-h2 text-neutral-900 mb-1">No jobs yet</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">
          Start building your pipeline by capturing your first job opportunity.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-capture-modal'))}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Add Your First Job
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900 leading-none">Pipeline</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {stats.total} job{stats.total !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-capture-modal'))}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm cursor-pointer"
        >
          <Plus size={14} />
          Add Job
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Stats row — compact horizontal strip */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-stretch gap-2 overflow-x-auto">
        <StatChip icon={<Briefcase size={13} />} label="Total" value={stats.total} />
        <StatChip
          icon={<Target size={13} className="text-green-600" />}
          label="Pursue"
          value={stats.pursueCount}
          valueClass="text-green-700"
        />
        <StatChip
          icon={<Zap size={13} className="text-amber-500" />}
          label="Maybe"
          value={stats.maybeCount}
          valueClass="text-amber-700"
        />
        <StatChip
          icon={<Send size={13} className="text-brand-500" />}
          label="Outreach"
          value={stats.activeOutreach}
          valueClass="text-brand-700"
        />
        <StatChip
          icon={<TrendingUp size={13} className="text-violet-500" />}
          label="Interviews"
          value={stats.interviewCount}
          valueClass="text-violet-700"
        />
        {stats.offerCount > 0 && (
          <StatChip
            icon={<DollarSign size={13} className="text-green-600" />}
            label="Offers"
            value={stats.offerCount}
            valueClass="text-green-700"
          />
        )}
        {stats.avgScore !== null && (
          <StatChip
            icon={<Target size={13} className="text-neutral-400" />}
            label="Avg Score"
            value={stats.avgScore}
            valueClass={SCORE_COLOR(stats.avgScore, getEffectiveFitLabel(stats.avgScore, undefined))}
          />
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Pipeline columns — desktop: horizontal scroll, mobile: stacked */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {Object.entries(STAGE_CATEGORIES).map(([category, stages]) => {
          const categoryJobs = stages.flatMap((s) => jobsByStage.get(s) || []);
          const meta = CATEGORY_META[category];

          return (
            <section
              key={category}
              className={`bg-neutral-50/60 rounded-lg border border-neutral-200 ${meta.ring} p-3 min-w-0`}
            >
              {/* Category header */}
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  {category}
                </h3>
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-px rounded ${meta.badge}`}
                >
                  {categoryJobs.length}
                </span>
              </div>

              {/* Stages within category */}
              <div className="space-y-3">
                {stages.map((stage) => {
                  const stageJobs = jobsByStage.get(stage);
                  if (!stageJobs || stageJobs.length === 0) return null;

                  return (
                    <div key={stage}>
                      {/* Stage label */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        <span className="text-[11px] font-semibold text-neutral-600">
                          {stage}
                        </span>
                        <span className="text-[10px] text-neutral-400 tabular-nums">
                          {stageJobs.length}
                        </span>
                      </div>

                      {/* Job cards */}
                      <div className="space-y-1.5">
                        {stageJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => navigate(`/job/${job.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Empty category hint */}
                {categoryJobs.length === 0 && (
                  <p className="text-[11px] text-neutral-400 italic py-4 text-center">
                    No jobs in {category.toLowerCase()} yet
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat chip component
// ---------------------------------------------------------------------------

function StatChip({
  icon,
  label,
  value,
  valueClass = 'text-neutral-900',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 shrink-0">
      <span className="text-neutral-400">{icon}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-base font-bold tabular-nums leading-none ${valueClass}`}>
          {value}
        </span>
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}

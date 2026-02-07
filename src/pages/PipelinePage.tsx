import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Send, ChevronRight, Plus, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { STAGE_CATEGORIES } from '../types';
import type { Job, FitLabel, PipelineStage } from '../types';

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

const FIT_LABEL_STYLES: Record<FitLabel, string> = {
  Pursue: 'text-green-700 bg-green-50 border border-green-200',
  Maybe: 'text-amber-700 bg-amber-50 border border-amber-200',
  Pass: 'text-red-700 bg-red-50 border border-red-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  Sourcing: 'text-blue-700 bg-blue-50 border-blue-200',
  Qualification: 'text-violet-700 bg-violet-50 border-violet-200',
  Conversion: 'text-amber-700 bg-amber-50 border-amber-200',
  Revenue: 'text-green-700 bg-green-50 border-green-200',
};

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:shadow-md hover:border-neutral-300 active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-neutral-900 truncate">{job.title}</h4>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{job.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.fitLabel && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${FIT_LABEL_STYLES[job.fitLabel]}`}>
              {job.fitLabel}
            </span>
          )}
          <ChevronRight size={16} className="text-neutral-300" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2.5">
        <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
          {job.stage}
        </span>
        {job.fitScore !== undefined && (
          <span className="text-[10px] font-medium text-neutral-400">
            Score: {job.fitScore}
          </span>
        )}
        <span className="text-[10px] text-neutral-400 flex items-center gap-0.5 ml-auto">
          <Clock size={10} />
          {formatTimeAgo(job.updatedAt)}
        </span>
      </div>
    </button>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const jobs = useStore((s) => s.jobs);

  const stats = useMemo(() => {
    const pursueCount = jobs.filter((j) => j.fitLabel === 'Pursue').length;
    const outreachStages: PipelineStage[] = ['Outreach Sent', 'Response/Screen', 'Interviewing'];
    const activeOutreach = jobs.filter((j) => outreachStages.includes(j.stage)).length;
    return { total: jobs.length, pursueCount, activeOutreach };
  }, [jobs]);

  const jobsByStage = useMemo(() => {
    const map = new Map<PipelineStage, Job[]>();
    for (const job of jobs) {
      const existing = map.get(job.stage) || [];
      existing.push(job);
      map.set(job.stage, existing);
    }
    return map;
  }, [jobs]);

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase size={28} className="text-brand-600" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">No jobs yet</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">
          Start building your pipeline by capturing your first job opportunity.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-capture-modal'))}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 active:bg-brand-800 shadow-sm"
        >
          <Plus size={16} />
          Add Your First Job
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Briefcase size={14} className="text-neutral-400" />
          </div>
          <p className="text-xl font-bold text-neutral-900">{stats.total}</p>
          <p className="text-[10px] text-neutral-500 font-medium">Total Jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-green-500" />
          </div>
          <p className="text-xl font-bold text-green-700">{stats.pursueCount}</p>
          <p className="text-[10px] text-neutral-500 font-medium">Pursue</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Send size={14} className="text-brand-500" />
          </div>
          <p className="text-xl font-bold text-brand-700">{stats.activeOutreach}</p>
          <p className="text-[10px] text-neutral-500 font-medium">Active Outreach</p>
        </div>
      </div>

      {/* Stage Categories */}
      {Object.entries(STAGE_CATEGORIES).map(([category, stages]) => {
        const categoryJobs = stages.flatMap((stage) => jobsByStage.get(stage) || []);
        if (categoryJobs.length === 0) return null;

        return (
          <section key={category}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{category}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[category]}`}>
                {categoryJobs.length}
              </span>
            </div>

            {stages.map((stage) => {
              const stageJobs = jobsByStage.get(stage);
              if (!stageJobs || stageJobs.length === 0) return null;

              return (
                <div key={stage} className="mb-3">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                    <span className="text-xs font-medium text-neutral-600">{stage}</span>
                    <span className="text-[10px] text-neutral-400">{stageJobs.length}</span>
                  </div>
                  <div className="space-y-2 pl-1">
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
          </section>
        );
      })}
    </div>
  );
}

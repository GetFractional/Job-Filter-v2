import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Plus,
  Clock,
  ClipboardPaste,
  Link2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PIPELINE_STAGES } from '../types';
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

const STAGE_TONES: Record<PipelineStage, string> = {
  Discovered: 'bg-slate-100 text-slate-700 border-slate-200',
  Captured: 'bg-blue-50 text-blue-700 border-blue-200',
  Scored: 'bg-violet-50 text-violet-700 border-violet-200',
  Researched: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Assets Ready': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Outreach Sent': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Response/Screen': 'bg-lime-50 text-lime-700 border-lime-200',
  Interviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  Offer: 'bg-green-50 text-green-700 border-green-200',
  Negotiation: 'bg-teal-50 text-teal-700 border-teal-200',
  'Closed Won': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Closed Lost': 'bg-red-50 text-red-700 border-red-200',
};

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const fitScoreLabel = job.fitScore !== undefined ? `${job.fitScore}` : '—';
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-neutral-200/85 bg-white/95 px-3.5 py-3 shadow-sm hover:border-neutral-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-neutral-900 truncate">{job.title}</h4>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{job.company}</p>
        </div>
        <ChevronRight size={16} className="text-neutral-300 shrink-0" />
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Stage</p>
          <p className="text-xs font-semibold text-neutral-700 truncate">{job.stage}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Fit Score</p>
          <p className="text-xs font-semibold text-neutral-700">{fitScoreLabel}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {job.fitLabel && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${FIT_LABEL_STYLES[job.fitLabel]}`}>
            {job.fitLabel}
          </span>
        )}
        <span className="text-[11px] text-neutral-400 flex items-center gap-0.5 ml-auto">
          <Clock size={10} />
          {formatTimeAgo(job.updatedAt)}
        </span>
      </div>
    </button>
  );
}

function QuickCaptureCard({
  title,
  detail,
  icon,
  buttonLabel,
  onClick,
}: {
  title: string;
  detail: string;
  icon: ReactNode;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="surface-card rounded-xl p-4">
      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-2.5">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="text-xs text-neutral-500 mt-1 mb-3 leading-relaxed">{detail}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
      >
        {buttonLabel}
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobs = useStore((s) => s.jobs);
  const assets = useStore((s) => s.assets);
  const scoreJobsBulk = useStore((s) => s.scoreJobsBulk);
  const [clipboardHint, setClipboardHint] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<'all' | PipelineStage>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState(searchParams.get('q') || '');
  const [rescoring, setRescoring] = useState(false);

  useEffect(() => {
    setSearchFilter(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchFilter(value);
    const nextParams = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) nextParams.set('q', trimmed);
    else nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const openCapture = useCallback((focus?: 'title' | 'url' | 'jd', prefillJd?: string) => {
    window.dispatchEvent(
      new CustomEvent('open-capture-modal', {
        detail: {
          focus: focus || 'title',
          prefillJd,
        },
      })
    );
  }, []);

  const handleClipboardCapture = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setClipboardHint('Clipboard is empty. Copy selected JD text first.');
        return;
      }
      openCapture('jd', text.trim());
      setClipboardHint(`Imported ${Math.min(text.trim().split(/\s+/).length, 999)} words from clipboard.`);
      window.setTimeout(() => setClipboardHint(null), 2400);
    } catch {
      setClipboardHint('Clipboard access blocked. Paste into the modal manually.');
      window.setTimeout(() => setClipboardHint(null), 2400);
    }
  }, [openCapture]);

  const handleBulkRescore = useCallback(async () => {
    setRescoring(true);
    try {
      await scoreJobsBulk();
    } finally {
      setRescoring(false);
    }
  }, [scoreJobsBulk]);

  const stageCounts = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    const counts: Record<PipelineStage, number> = PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage] = 0;
      return acc;
    }, {} as Record<PipelineStage, number>);
    for (const job of jobs) {
      if (sourceFilter !== 'all' && (job.source || '') !== sourceFilter) continue;
      if (query) {
        const haystack = `${job.title} ${job.company} ${job.source || ''} ${job.location || ''}`.toLowerCase();
        if (!haystack.includes(query)) continue;
      }
      counts[job.stage] += 1;
    }
    return counts;
  }, [jobs, sourceFilter, searchFilter]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      const value = (job.source || '').trim();
      if (value) set.add(value);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const totalVisibleCount = useMemo(
    () => Object.values(stageCounts).reduce((total, count) => total + count, 0),
    [stageCounts]
  );

  const filteredJobs = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return jobs.filter((job) => {
      if (stageFilter !== 'all' && job.stage !== stageFilter) return false;
      if (sourceFilter !== 'all' && (job.source || '') !== sourceFilter) return false;
      if (query) {
        const haystack = `${job.title} ${job.company} ${job.source || ''} ${job.location || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [jobs, stageFilter, sourceFilter, searchFilter]);

  const jobsByStage = useMemo(() => {
    const map = new Map<PipelineStage, Job[]>();
    for (const job of filteredJobs) {
      const existing = map.get(job.stage) || [];
      existing.push(job);
      map.set(job.stage, existing);
    }
    return map;
  }, [filteredJobs]);

  const stats = useMemo(() => {
    const pursueCount = jobs.filter((job) => job.fitLabel === 'Pursue').length;
    const outreachStages: PipelineStage[] = ['Outreach Sent', 'Response/Screen', 'Interviewing'];
    const activeOutreach = jobs.filter((job) => outreachStages.includes(job.stage)).length;
    const needsScoring = jobs.filter((job) => job.stage === 'Captured' && job.fitScore === undefined).length;
    const needsResearch = jobs.filter((job) => job.fitLabel !== 'Pass' && !job.researchBrief).length;
    const approvedAssets = assets.filter((asset) => asset.approved).length;
    return {
      total: jobs.length,
      pursueCount,
      activeOutreach,
      needsScoring,
      needsResearch,
      approvedAssets,
    };
  }, [jobs, assets]);

  const topCandidate = useMemo(() => {
    if (jobs.length === 0) return null;
    const sorted = [...jobs].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    return sorted[0];
  }, [jobs]);

  if (jobs.length === 0) {
    return (
      <div className="space-y-5">
        <div className="surface-card rounded-2xl px-5 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1.5">Pipeline</p>
              <h1 className="text-h1 text-neutral-900">Start your first opportunity</h1>
              <p className="text-sm text-neutral-600 mt-1 max-w-xl">
                Capture a job in under a minute. Paste the JD, paste a listing URL, or bring selected text directly from clipboard.
              </p>
            </div>
            <button
              onClick={() => openCapture('title')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Add First Job
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <QuickCaptureCard
            title="Paste full JD"
            detail="Best quality scoring and requirement extraction. Start with this for serious roles."
            icon={<FileText size={16} />}
            buttonLabel="Open JD Capture"
            onClick={() => openCapture('jd')}
          />
          <QuickCaptureCard
            title="Paste listing URL"
            detail="Drop a link first, then complete title and company details in the modal."
            icon={<Link2 size={16} />}
            buttonLabel="Open URL Capture"
            onClick={() => openCapture('url')}
          />
          <QuickCaptureCard
            title="Quick Clipboard Capture"
            detail="Copy selected job text from another tab, then import instantly with one click."
            icon={<ClipboardPaste size={16} />}
            buttonLabel="Import Clipboard"
            onClick={handleClipboardCapture}
          />
        </div>

        {clipboardHint && (
          <div className="surface-muted rounded-xl px-3.5 py-2.5 text-xs text-neutral-600 flex items-center gap-2">
            <AlertTriangle size={13} className="text-neutral-500" />
            {clipboardHint}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="surface-card rounded-2xl p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1">Pipeline</p>
            <h1 className="text-h1 text-neutral-900">Opportunity command center</h1>
            <p className="text-sm text-neutral-600 mt-1">Move from capture to outreach with less clicking and clearer stage control.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openCapture('jd')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus size={14} />
              Add Job
            </button>
            <button
              onClick={handleClipboardCapture}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <ClipboardPaste size={13} />
              Clipboard Capture
            </button>
            <button
              onClick={handleBulkRescore}
              disabled={rescoring}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {rescoring ? (
                <span className="h-3 w-3 rounded-full border border-neutral-300 border-t-neutral-700 animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              Bulk Re-score
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 mt-4">
          <div className="surface-muted rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-neutral-900">{stats.total}</p>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Total Jobs</p>
          </div>
          <div className="surface-muted rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-green-700">{stats.pursueCount}</p>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Pursue</p>
          </div>
          <div className="surface-muted rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-brand-700">{stats.activeOutreach}</p>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Outreach Active</p>
          </div>
          <div className="surface-muted rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-amber-700">{stats.needsScoring}</p>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Need Score</p>
          </div>
          <div className="surface-muted rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-brand-700">{stats.needsResearch}</p>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Need Research</p>
          </div>
          <div className="surface-muted rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-green-700">{stats.approvedAssets}</p>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Assets Ready</p>
          </div>
        </div>
      </div>

      {topCandidate && (
        <div className="surface-card rounded-2xl p-4 lg:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Counsel</p>
              <h2 className="text-h3 text-neutral-900">Best current bet: {topCandidate.title} at {topCandidate.company}</h2>
            </div>
            <button
              onClick={() => navigate(`/job/${topCandidate.id}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Open Workspace
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50/70 p-3">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-green-700 mb-1.5">Reasons to Pursue</p>
              {topCandidate.reasonsToPursue.length > 0 ? (
                <ul className="space-y-1">
                  {topCandidate.reasonsToPursue.slice(0, 3).map((reason) => (
                    <li key={reason} className="text-xs text-green-800">- {reason}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-green-800">No strong pursue signals recorded yet.</p>
              )}
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">Recommendation</p>
              <p className="text-3xl font-bold text-neutral-900">{topCandidate.fitScore ?? '—'}</p>
              <p className="text-xs text-neutral-500 mb-2">Fit score</p>
              {topCandidate.fitLabel ? (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${FIT_LABEL_STYLES[topCandidate.fitLabel]}`}>
                  {topCandidate.fitLabel}
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                  Not scored
                </span>
              )}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-700 mb-1.5">Risks to Consider</p>
              {topCandidate.redFlags.length > 0 || topCandidate.reasonsToPass.length > 0 ? (
                <ul className="space-y-1">
                  {[...topCandidate.redFlags, ...topCandidate.reasonsToPass].slice(0, 3).map((risk) => (
                    <li key={risk} className="text-xs text-amber-800">- {risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-800">No major risks flagged yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="surface-card rounded-2xl p-4 lg:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-neutral-600 min-w-[260px]">
            <div className="relative w-full max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search title, company, source..."
                className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-700"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Source</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source === 'all' ? 'All Sources' : source}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStageFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
              stageFilter === 'all'
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All ({totalVisibleCount})
          </button>
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                stageFilter === stage
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : `${STAGE_TONES[stage]}`
              }`}
            >
              {stage} ({stageCounts[stage]})
            </button>
          ))}
        </div>
      </div>

      {clipboardHint && (
        <div className="surface-muted rounded-xl px-3.5 py-2.5 text-xs text-neutral-600 flex items-center gap-2">
          <AlertTriangle size={13} className="text-neutral-500" />
          {clipboardHint}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center">
          <Target size={20} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-600">No jobs match the current filters.</p>
          <p className="text-xs text-neutral-400 mt-1">Change stage/source/search filters or add a new job.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(stageFilter === 'all' ? PIPELINE_STAGES : [stageFilter]).map((stage) => {
            const stageJobs = jobsByStage.get(stage);
            if (!stageJobs || stageJobs.length === 0) return null;
            return (
              <section key={stage} className="surface-card rounded-2xl p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${STAGE_TONES[stage]}`}>
                      {stage}
                    </span>
                    <span className="text-xs text-neutral-500">{stageJobs.length} job{stageJobs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <ShieldCheck size={11} />
                    Auto-stage enabled
                  </span>
                </div>
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  {stageJobs.map((job) => (
                    <JobCard key={job.id} job={job} onClick={() => navigate(`/job/${job.id}`)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

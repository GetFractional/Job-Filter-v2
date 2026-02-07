import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Search,
  FileText,
  Users,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  ListChecks,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PIPELINE_STAGES } from '../types';
import type { FitLabel, PipelineStage } from '../types';
import { ResearchTab } from '../components/research/ResearchTab';
import { AssetsTab } from '../components/assets/AssetsTab';
import { CRMTab } from '../components/crm/CRMTab';

const FIT_LABEL_STYLES: Record<FitLabel, string> = {
  Pursue: 'text-green-700 bg-green-50 border border-green-200',
  Maybe: 'text-amber-700 bg-amber-50 border border-amber-200',
  Pass: 'text-red-700 bg-red-50 border border-red-200',
};

const FIT_LABEL_RING_COLORS: Record<FitLabel, string> = {
  Pursue: 'stroke-green-500',
  Maybe: 'stroke-amber-500',
  Pass: 'stroke-red-500',
};

const TABS = [
  { id: 'score' as const, label: 'Score', icon: Target },
  { id: 'research' as const, label: 'Research', icon: Search },
  { id: 'assets' as const, label: 'Assets', icon: FileText },
  { id: 'crm' as const, label: 'CRM', icon: Users },
];

function ScoreDial({ score, label }: { score: number; label: FitLabel }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = FIT_LABEL_RING_COLORS[label];

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-neutral-100" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-neutral-900">{score}</span>
        <span className="text-xs text-neutral-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600">{label}</span>
        <span className="text-xs font-semibold text-neutral-700">{value}/{max}</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function JobWorkspacePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const jobs = useStore((s) => s.jobs);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setSelectedJob = useStore((s) => s.setSelectedJob);
  const scoreAndUpdateJob = useStore((s) => s.scoreAndUpdateJob);
  const moveJobToStage = useStore((s) => s.moveJobToStage);

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);

  useEffect(() => {
    if (jobId) setSelectedJob(jobId);
    return () => setSelectedJob(null);
  }, [jobId, setSelectedJob]);

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <AlertTriangle size={32} className="text-neutral-300 mb-3" />
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Job not found</h2>
        <p className="text-sm text-neutral-500 mb-4">This job may have been deleted.</p>
        <button
          onClick={() => navigate('/pipeline')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Pipeline
        </button>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.indexOf(job.stage);
  const nextStage: PipelineStage | null =
    currentStageIndex < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[currentStageIndex + 1] : null;
  const prevStage: PipelineStage | null =
    currentStageIndex > 0 ? PIPELINE_STAGES[currentStageIndex - 1] : null;

  const handleRescore = async () => {
    if (jobId) await scoreAndUpdateJob(jobId);
  };

  const handleAdvanceStage = async () => {
    if (jobId && nextStage) await moveJobToStage(jobId, nextStage);
  };

  const handleRevertStage = async () => {
    if (jobId && prevStage) await moveJobToStage(jobId, prevStage);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/pipeline')}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-neutral-900 truncate">{job.title}</h2>
            <p className="text-xs text-neutral-500 truncate">{job.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-8">
          {job.fitLabel && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${FIT_LABEL_STYLES[job.fitLabel]}`}>
              {job.fitLabel}
            </span>
          )}
          <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
            {job.stage}
          </span>
          {job.fitScore !== undefined && (
            <span className="text-[11px] text-neutral-400 ml-auto">Score: {job.fitScore}</span>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-neutral-200 px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'text-brand-600 border-brand-600'
                    : 'text-neutral-500 border-transparent hover:text-neutral-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'score' && (
          <div className="py-4 space-y-6">
            {/* Score Dial */}
            {job.fitScore !== undefined && job.fitLabel ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm text-center">
                <ScoreDial score={job.fitScore} label={job.fitLabel} />
                <div className="mt-3">
                  <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${FIT_LABEL_STYLES[job.fitLabel]}`}>
                    {job.fitLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target size={24} className="text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500 mb-3">
                  {job.jobDescription
                    ? 'Job has not been scored yet.'
                    : 'Add a job description to enable scoring.'}
                </p>
                {job.jobDescription && (
                  <button
                    onClick={handleRescore}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
                  >
                    <Target size={14} />
                    Score Now
                  </button>
                )}
              </div>
            )}

            {/* Disqualifiers */}
            {job.disqualifiers.length > 0 && (
              <div className="bg-white rounded-lg border border-red-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <XCircle size={14} />
                  Disqualifiers
                </h4>
                <ul className="space-y-1.5">
                  {job.disqualifiers.map((d, i) => (
                    <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reasons to Pursue */}
            {job.reasonsToPursue.length > 0 && (
              <div className="bg-white rounded-lg border border-green-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Reasons to Pursue
                </h4>
                <ul className="space-y-1.5">
                  {job.reasonsToPursue.map((r, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-green-400 mt-2 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reasons to Pass */}
            {job.reasonsToPass.length > 0 && (
              <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Reasons to Pass
                </h4>
                <ul className="space-y-1.5">
                  {job.reasonsToPass.map((r, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {job.redFlags.length > 0 && (
              <div className="bg-white rounded-lg border border-red-100 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Flag size={14} />
                  Red Flags
                </h4>
                <ul className="space-y-1.5">
                  {job.redFlags.map((f, i) => (
                    <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-300 mt-2 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements Extracted */}
            {job.requirementsExtracted.length > 0 && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ListChecks size={14} />
                  Requirements Extracted
                </h4>
                <div className="space-y-2">
                  {job.requirementsExtracted.map((req, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                        req.type === 'skill' ? 'bg-blue-50 text-blue-700' :
                        req.type === 'experience' ? 'bg-purple-50 text-purple-700' :
                        req.type === 'tool' ? 'bg-cyan-50 text-cyan-700' :
                        req.type === 'education' ? 'bg-orange-50 text-orange-700' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {req.type}
                      </span>
                      <span className="text-neutral-700">{req.description}</span>
                      {req.yearsNeeded && (
                        <span className="text-[11px] text-neutral-400 ml-auto shrink-0">{req.yearsNeeded}+ yrs</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            {job.fitScore !== undefined && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">Score Breakdown</h4>
                <div className="space-y-3">
                  <BreakdownBar label="Role Scope & Authority" value={job.fitScore ? Math.round(job.fitScore * 0.3) : 0} max={30} color="bg-brand-500" />
                  <BreakdownBar label="Compensation & Benefits" value={job.fitScore ? Math.round(job.fitScore * 0.25) : 0} max={25} color="bg-green-500" />
                  <BreakdownBar label="Company Stage" value={job.fitScore ? Math.round(job.fitScore * 0.2) : 0} max={20} color="bg-violet-500" />
                  <BreakdownBar label="Domain Fit" value={job.fitScore ? Math.round(job.fitScore * 0.15) : 0} max={15} color="bg-cyan-500" />
                  <BreakdownBar label="Risk Penalty" value={job.redFlags.length * 2} max={10} color="bg-red-400" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {job.jobDescription && (
                <button
                  onClick={handleRescore}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm"
                >
                  <RefreshCw size={14} />
                  Re-score
                </button>
              )}

              <div className="flex gap-3">
                {prevStage && (
                  <button
                    onClick={handleRevertStage}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 shadow-sm"
                  >
                    <ArrowLeft size={14} />
                    {prevStage}
                  </button>
                )}
                {nextStage && (
                  <button
                    onClick={handleAdvanceStage}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
                  >
                    {nextStage}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'research' && <div className="py-4"><ResearchTab job={job} /></div>}
        {activeTab === 'assets' && <div className="py-4"><AssetsTab job={job} /></div>}
        {activeTab === 'crm' && <div className="py-4"><CRMTab job={job} /></div>}
      </div>
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Search,
  FileText,
  Users,
  MessageSquareText,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  ListChecks,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PIPELINE_STAGES } from '../types';
import type { FitLabel, PipelineStage, Requirement, RequirementMatch } from '../types';
import { ResearchTab } from '../components/research/ResearchTab';
import { AssetsTab } from '../components/assets/AssetsTab';
import { CRMTab } from '../components/crm/CRMTab';
import { QATab } from '../components/qa/QATab';

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

const MATCH_STYLES: Record<RequirementMatch, { bg: string; text: string; label: string }> = {
  Met: { bg: 'bg-green-50', text: 'text-green-700', label: 'Met' },
  Partial: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Partial' },
  Missing: { bg: 'bg-red-50', text: 'text-red-700', label: 'Missing' },
};

const TYPE_STYLES: Record<string, string> = {
  experience: 'bg-purple-50 text-purple-700',
  skill: 'bg-blue-50 text-blue-700',
  tool: 'bg-cyan-50 text-cyan-700',
  education: 'bg-orange-50 text-orange-700',
  certification: 'bg-rose-50 text-rose-700',
  other: 'bg-neutral-100 text-neutral-600',
};

const TABS = [
  { id: 'score' as const, label: 'Score', icon: Target },
  { id: 'research' as const, label: 'Research', icon: Search },
  { id: 'assets' as const, label: 'Assets', icon: FileText },
  { id: 'crm' as const, label: 'CRM', icon: Users },
  { id: 'qa' as const, label: 'Q&A', icon: MessageSquareText },
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

function RequirementsMatrix({ requirements }: { requirements: Requirement[] }) {
  if (requirements.length === 0) return null;

  const metCount = requirements.filter((r) => r.match === 'Met').length;
  const partialCount = requirements.filter((r) => r.match === 'Partial').length;
  const missingCount = requirements.filter((r) => r.match === 'Missing').length;
  const mustRequirements = requirements.filter((r) => r.priority === 'Must');
  const mustMet = mustRequirements.filter((r) => r.match === 'Met').length;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
          <ListChecks size={14} />
          Requirements Match
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md font-medium">
            {metCount} met
          </span>
          {partialCount > 0 && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md font-medium">
              {partialCount} partial
            </span>
          )}
          {missingCount > 0 && (
            <span className="text-[11px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md font-medium">
              {missingCount} missing
            </span>
          )}
        </div>
      </div>

      {/* Must-have coverage bar */}
      {mustRequirements.length > 0 && (
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-600">Must-have coverage</span>
            <span className="text-[11px] font-bold text-neutral-700">
              {mustMet}/{mustRequirements.length}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                mustMet === mustRequirements.length ? 'bg-green-500' :
                mustMet >= mustRequirements.length * 0.5 ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${(mustMet / mustRequirements.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-20">Type</th>
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider">Requirement</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-14">Yrs</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-20">Priority</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-20">Match</th>
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, i) => {
              const matchStyle = MATCH_STYLES[req.match];
              const typeStyle = TYPE_STYLES[req.type] || TYPE_STYLES.other;
              return (
                <tr
                  key={i}
                  className={`border-b border-neutral-50 last:border-b-0 ${
                    req.match === 'Missing' && req.priority === 'Must' ? 'bg-red-50/30' : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${typeStyle}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-800 font-medium">{req.description}</td>
                  <td className="px-3 py-2 text-center text-neutral-500">
                    {req.yearsNeeded ? `${req.yearsNeeded}+` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                      req.priority === 'Must'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${matchStyle.bg} ${matchStyle.text}`}>
                      {matchStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500 max-w-[200px] truncate" title={req.evidence}>
                    {req.evidence || (
                      <span className="text-neutral-300 italic">
                        {req.match === 'Missing' ? 'No matching claim' : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

  const breakdown = job.scoreBreakdown;

  return (
    <div className="flex flex-col h-full">
      {/* Header — compact, with action buttons above fold */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pipeline')}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900 truncate">{job.title}</h2>
              {job.fitLabel && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${FIT_LABEL_STYLES[job.fitLabel]}`}>
                  {job.fitLabel} {job.fitScore !== undefined && job.fitScore}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-neutral-500 truncate">{job.company}</p>
              <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
                {job.stage}
              </span>
            </div>
          </div>

          {/* Action buttons — always visible above fold */}
          <div className="flex items-center gap-2 shrink-0">
            {job.jobDescription && (
              <button
                onClick={handleRescore}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100"
                title="Re-score this job"
              >
                <RefreshCw size={12} />
                Score
              </button>
            )}
            {prevStage && (
              <button
                onClick={handleRevertStage}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
                title={`Move back to ${prevStage}`}
              >
                <ChevronLeft size={12} />
                {prevStage.length > 12 ? prevStage.slice(0, 10) + '...' : prevStage}
              </button>
            )}
            {nextStage && (
              <button
                onClick={handleAdvanceStage}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                title={`Advance to ${nextStage}`}
              >
                {nextStage.length > 12 ? nextStage.slice(0, 10) + '...' : nextStage}
                <ChevronRight size={12} />
              </button>
            )}
          </div>
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
                  <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-md ${FIT_LABEL_STYLES[job.fitLabel]}`}>
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

            {/* Requirements Match Matrix */}
            <RequirementsMatrix requirements={job.requirementsExtracted} />

            {/* Score Breakdown */}
            {job.fitScore !== undefined && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">Score Breakdown</h4>
                <div className="space-y-3">
                  <BreakdownBar
                    label="Role Scope & Authority"
                    value={breakdown?.roleScopeAuthority ?? Math.round(job.fitScore * 0.3)}
                    max={30}
                    color="bg-brand-500"
                  />
                  <BreakdownBar
                    label="Compensation & Benefits"
                    value={breakdown?.compensationBenefits ?? Math.round(job.fitScore * 0.25)}
                    max={25}
                    color="bg-green-500"
                  />
                  <BreakdownBar
                    label="Company Stage"
                    value={breakdown?.companyStageAbility ?? Math.round(job.fitScore * 0.2)}
                    max={20}
                    color="bg-violet-500"
                  />
                  <BreakdownBar
                    label="Domain Fit"
                    value={breakdown?.domainFit ?? Math.round(job.fitScore * 0.15)}
                    max={15}
                    color="bg-cyan-500"
                  />
                  <BreakdownBar
                    label="Risk Penalty"
                    value={breakdown?.riskPenalty ?? job.redFlags.length * 2}
                    max={10}
                    color="bg-red-400"
                  />
                </div>
              </div>
            )}

            {/* Actions are now in the header (above fold) */}
          </div>
        )}

        {activeTab === 'research' && <div className="py-4"><ResearchTab job={job} /></div>}
        {activeTab === 'assets' && <div className="py-4"><AssetsTab job={job} /></div>}
        {activeTab === 'crm' && <div className="py-4"><CRMTab job={job} /></div>}
        {activeTab === 'qa' && <div className="py-4"><QATab job={job} /></div>}
      </div>
    </div>
  );
}

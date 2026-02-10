import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Search,
  FileText,
  MessageSquareText,
  Users,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PIPELINE_STAGES } from '../types';
import type { FitLabel, PipelineStage, Requirement, RequirementMatch } from '../types';
import { ResearchTab } from '../components/research/ResearchTab';
import { AssetsTab } from '../components/assets/AssetsTab';
import { ApplicationQATab } from '../components/qa/ApplicationQATab';
import { CRMTab } from '../components/crm/CRMTab';

const FIT_LABEL_STYLES: Record<FitLabel, string> = {
  Pursue: 'text-green-700 bg-green-50 border border-green-200',
  Maybe: 'text-amber-700 bg-amber-50 border border-amber-200',
  Pass: 'text-red-700 bg-red-50 border border-red-200',
};

const WORKSPACE_STAGE_STYLES: Record<PipelineStage, string> = {
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

const GAP_SEVERITY_STYLES: Record<'None' | 'Low' | 'Medium' | 'High', string> = {
  None: 'bg-green-50 text-green-700',
  Low: 'bg-blue-50 text-blue-700',
  Medium: 'bg-amber-50 text-amber-700',
  High: 'bg-red-50 text-red-700',
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
  { id: 'requirements' as const, label: 'Role Needs', icon: ListChecks },
  { id: 'research' as const, label: 'Research', icon: Search },
  { id: 'assets' as const, label: 'Assets', icon: FileText },
  { id: 'qa' as const, label: 'Q&A', icon: MessageSquareText },
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

function RequirementsMatrix({
  requirements,
  onChange,
}: {
  requirements: Requirement[];
  onChange: (nextRequirements: Requirement[]) => Promise<void> | void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Requirement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...requirements[index] });
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditingIndex(null);
    setIsCreating(true);
    setDraft({
      type: 'other',
      description: '',
      priority: 'Preferred',
      match: 'Missing',
      jdEvidence: '',
      userEvidence: '',
      gapSeverity: 'Medium',
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft(null);
    setIsCreating(false);
  };

  const saveDraft = async () => {
    if (!draft || !draft.description.trim()) return;
    setSaving(true);
    try {
      const normalizedDraft: Requirement = {
        ...draft,
        description: draft.description.trim(),
        jdEvidence: (draft.jdEvidence || '').trim() || undefined,
        userEvidence: (draft.userEvidence || '').trim() || undefined,
        evidence: (draft.userEvidence || draft.evidence || '').trim() || undefined,
        yearsNeeded: draft.yearsNeeded && draft.yearsNeeded > 0 ? draft.yearsNeeded : undefined,
      };
      if (isCreating) {
        await onChange([...requirements, normalizedDraft]);
      } else if (editingIndex !== null) {
        const next = [...requirements];
        next[editingIndex] = normalizedDraft;
        await onChange(next);
      }
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const removeRequirement = async (index: number) => {
    const next = requirements.filter((_, rowIndex) => rowIndex !== index);
    await onChange(next);
    if (editingIndex === index) {
      cancelEdit();
    }
  };

  if (requirements.length === 0) return null;

  const metCount = requirements.filter((r) => r.match === 'Met').length;
  const partialCount = requirements.filter((r) => r.match === 'Partial').length;
  const missingCount = requirements.filter((r) => r.match === 'Missing').length;
  const mustRequirements = requirements.filter((r) => r.priority === 'Must');
  const mustMet = mustRequirements.filter((r) => r.match === 'Met').length;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
          <ListChecks size={14} />
          Role Needs Match
        </h4>
        <div className="flex items-center gap-2 flex-wrap justify-end">
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
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <Plus size={11} />
            Add Need
          </button>
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
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider">Need</th>
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-24">Category</th>
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider">Evidence from JD</th>
              <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wider">Your Evidence</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-20">Match</th>
              <th className="text-center px-3 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-20">Gap</th>
              <th className="text-right px-3 py-2 font-semibold text-neutral-500 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, i) => {
              const matchStyle = MATCH_STYLES[req.match];
              const typeStyle = TYPE_STYLES[req.type] || TYPE_STYLES.other;
              const gapSeverity = req.gapSeverity || (req.match === 'Met' ? 'None' : req.match === 'Partial' ? 'Medium' : 'High');
              const userEvidence = req.userEvidence || req.evidence;
              return (
                <tr
                  key={i}
                  className={`border-b border-neutral-50 last:border-b-0 ${
                    req.match === 'Missing' && req.priority === 'Must' ? 'bg-red-50/30' : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    <p className="text-neutral-800 font-medium">{req.description}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                        req.priority === 'Must' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {req.priority}
                      </span>
                      {req.yearsNeeded ? (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {req.yearsNeeded}+ yrs
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${typeStyle}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600 max-w-[240px]">
                    {req.jdEvidence ? (
                      <p className="line-clamp-2" title={req.jdEvidence}>{req.jdEvidence}</p>
                    ) : (
                      <span className="text-neutral-300 italic">No direct JD quote</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-neutral-600 max-w-[240px]">
                    {userEvidence ? (
                      <p className="line-clamp-2" title={userEvidence}>{userEvidence}</p>
                    ) : (
                      <span className="text-neutral-300 italic">No matching claim</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${matchStyle.bg} ${matchStyle.text}`}>
                      {matchStyle.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${GAP_SEVERITY_STYLES[gapSeverity]}`}>
                      {gapSeverity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => startEdit(i)}
                        className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50"
                      >
                        <Pencil size={11} />
                        Edit
                      </button>
                      <button
                        onClick={() => removeRequirement(i)}
                        className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50 hover:text-red-600"
                      >
                        <Trash2 size={11} />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            {isCreating ? 'Add Need' : 'Edit Need'}
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-[11px] text-neutral-500 mb-1 block">Need</label>
              <input
                value={draft.description}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                placeholder="Requirement description"
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Category</label>
              <select
                value={draft.type}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, type: event.target.value as Requirement['type'] } : prev))}
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              >
                <option value="skill">Skill</option>
                <option value="tool">Tool</option>
                <option value="experience">Experience</option>
                <option value="education">Education</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Priority</label>
              <select
                value={draft.priority}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, priority: event.target.value as Requirement['priority'] } : prev))}
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              >
                <option value="Must">Must</option>
                <option value="Preferred">Preferred</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Years Needed</label>
              <input
                type="number"
                min={0}
                value={draft.yearsNeeded || ''}
                onChange={(event) =>
                  setDraft((prev) => {
                    if (!prev) return prev;
                    const value = parseInt(event.target.value, 10);
                    return { ...prev, yearsNeeded: Number.isNaN(value) ? undefined : Math.max(0, value) };
                  })
                }
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Match</label>
              <select
                value={draft.match}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, match: event.target.value as Requirement['match'] } : prev))}
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              >
                <option value="Met">Met</option>
                <option value="Partial">Partial</option>
                <option value="Missing">Missing</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 mb-1 block">Gap Severity</label>
              <select
                value={draft.gapSeverity || 'Medium'}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, gapSeverity: event.target.value as Requirement['gapSeverity'] } : prev))
                }
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              >
                <option value="None">None</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] text-neutral-500 mb-1 block">JD Evidence</label>
              <textarea
                value={draft.jdEvidence || ''}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, jdEvidence: event.target.value } : prev))}
                rows={2}
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] text-neutral-500 mb-1 block">Your Evidence</label>
              <textarea
                value={draft.userEvidence || ''}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, userEvidence: event.target.value } : prev))}
                rows={2}
                className="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={saveDraft}
              disabled={saving || !draft.description.trim()}
              className="rounded bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isCreating ? 'Add Need' : 'Save Need'}
            </button>
          </div>
        </div>
      )}
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
  const updateJob = useStore((s) => s.updateJob);

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);

  useEffect(() => {
    if (jobId) setSelectedJob(jobId);
    return () => setSelectedJob(null);
  }, [jobId, setSelectedJob]);

  const handleRequirementsChange = useCallback(async (nextRequirements: Requirement[]) => {
    if (!jobId) return;
    await updateJob(jobId, {
      requirementsExtracted: nextRequirements,
    });
  }, [jobId, updateJob]);

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

  const handleRescore = async () => {
    if (jobId) await scoreAndUpdateJob(jobId);
  };

  const breakdown = job.scoreBreakdown;
  const requirements = job.requirementsExtracted || [];
  const metRequirements = requirements.filter((req) => req.match === 'Met').length;
  const missingRequirements = requirements.filter((req) => req.match === 'Missing').length;
  const partialRequirements = requirements.filter((req) => req.match === 'Partial').length;

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
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${WORKSPACE_STAGE_STYLES[job.stage]}`}>
            {job.stage}
          </span>
        </div>
      </div>

      <div className="bg-white border-b border-neutral-200 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {PIPELINE_STAGES.map((stage) => {
            const stageIndex = PIPELINE_STAGES.indexOf(stage);
            const currentIndex = PIPELINE_STAGES.indexOf(job.stage);
            const isCurrent = stage === job.stage;
            const isCompleted = stageIndex < currentIndex;
            return (
              <span
                key={stage}
                className={`text-[11px] px-2 py-0.5 rounded-md border ${
                  isCurrent
                    ? `${WORKSPACE_STAGE_STYLES[stage]}`
                    : isCompleted
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                }`}
              >
                {stage}
              </span>
            );
          })}
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

      {/* Primary Action Strip (kept above fold across tabs) */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {job.jobDescription && (
            <button
              onClick={handleRescore}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw size={12} />
              Re-score
            </button>
          )}
          <span className="text-[11px] text-neutral-500">
            Stage changes are now auto-driven by scoring, research, assets, and CRM activity.
          </span>
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

            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-white rounded-lg border border-green-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Reasons to Pursue
                </h4>
                {job.reasonsToPursue.length > 0 ? (
                  <ul className="space-y-1.5">
                    {job.reasonsToPursue.map((reason, index) => (
                      <li key={`${reason}-${index}`} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-green-400 mt-2 shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-700">No pursue rationale recorded yet.</p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm text-center">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Recommendation
                </h4>
                <p className="text-3xl font-bold text-neutral-900">{job.fitScore ?? '—'}</p>
                <p className="text-xs text-neutral-500 mb-2">Fit score</p>
                {job.fitLabel ? (
                  <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md ${FIT_LABEL_STYLES[job.fitLabel]}`}>
                    {job.fitLabel}
                  </span>
                ) : (
                  <span className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                    Not Scored
                  </span>
                )}
              </div>

              <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Risks to Consider
                </h4>
                {[...job.reasonsToPass, ...job.redFlags].length > 0 ? (
                  <ul className="space-y-1.5">
                    {[...job.reasonsToPass, ...job.redFlags].map((risk, index) => (
                      <li key={`${risk}-${index}`} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-amber-700">No major risks flagged yet.</p>
                )}
              </div>
            </div>

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

            {/* Requirements Summary */}
            {requirements.length > 0 && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ListChecks size={14} />
                      Role Needs
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      {metRequirements} met, {partialRequirements} partial, {missingRequirements} missing
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('requirements')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Open Role Needs
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

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

          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="py-4 space-y-4">
            {requirements.length > 0 ? (
              <RequirementsMatrix requirements={requirements} onChange={handleRequirementsChange} />
            ) : (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm text-center">
                <ListChecks size={20} className="text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500 mb-2">
                  Role needs appear after scoring.
                </p>
                <button
                  onClick={handleRescore}
                  disabled={!job.jobDescription}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <Target size={12} />
                  Re-score to Extract Role Needs
                </button>
                <button
                  onClick={() =>
                    handleRequirementsChange([
                      {
                        type: 'other',
                        description: 'Custom need',
                        priority: 'Preferred',
                        match: 'Missing',
                        gapSeverity: 'Medium',
                      },
                    ])
                  }
                  className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <Plus size={12} />
                  Add Manually
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'research' && <div className="py-4"><ResearchTab job={job} /></div>}
        {activeTab === 'assets' && <div className="py-4"><AssetsTab job={job} /></div>}
        {activeTab === 'qa' && <div className="py-4"><ApplicationQATab job={job} /></div>}
        {activeTab === 'crm' && <div className="py-4"><CRMTab job={job} /></div>}
      </div>
    </div>
  );
}

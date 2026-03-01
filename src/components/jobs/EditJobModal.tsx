import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { EmploymentType, Job, JobScoringInputs, JobStageHint, LocationType } from '../../types';

const LOCATION_TYPES: LocationType[] = ['Remote', 'Hybrid', 'In-person', 'Unknown'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-time', 'Contract', 'Part-time', 'Freelance', 'Unknown'];
const STAGE_HINT_OPTIONS: Array<{ value: JobStageHint; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'seed', label: 'Seed / Pre-seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c_plus', label: 'Series C+' },
  { value: 'public', label: 'Public company' },
  { value: 'profitable_private', label: 'Profitable private' },
];

interface EditJobModalProps {
  open: boolean;
  job: Job;
  onClose: () => void;
  onSave: (updates: Partial<Job>, options: { rescore: boolean }) => Promise<void>;
}

function parseNumberInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed.replace(/[^\d]/g, ''));
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function listToMultiline(values: string[]): string {
  return values.join('\n');
}

function multilineToList(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function deriveScoringInputs(job: Job): JobScoringInputs {
  if (job.scoringInputs) {
    return {
      mustHaveRequirements: [...(job.scoringInputs.mustHaveRequirements ?? [])],
      experienceRequirements: [...(job.scoringInputs.experienceRequirements ?? [])],
      skills: [...(job.scoringInputs.skills ?? [])],
      tools: [...(job.scoringInputs.tools ?? [])],
      benefits: [...(job.scoringInputs.benefits ?? [])],
      stageHint: job.scoringInputs.stageHint ?? 'unknown',
    };
  }

  const mustHaveRequirements = (job.requirementsExtracted ?? [])
    .filter((requirement) => requirement.priority === 'Must')
    .map((requirement) => requirement.description)
    .filter(Boolean);
  const experienceRequirements = (job.requirementsExtracted ?? [])
    .filter((requirement) => requirement.type === 'experience')
    .map((requirement) => requirement.description)
    .filter(Boolean);
  const skills = (job.requirementsExtracted ?? [])
    .filter((requirement) => requirement.type === 'skill')
    .map((requirement) => requirement.description)
    .filter(Boolean);
  const tools = (job.requirementsExtracted ?? [])
    .filter((requirement) => requirement.type === 'tool')
    .map((requirement) => requirement.description)
    .filter(Boolean);
  const stageHint = /seed-stage|seed stage/i.test(
    [...(job.disqualifiers ?? []), ...(job.riskWarnings ?? [])].join(' ')
  )
    ? 'seed'
    : 'unknown';

  return {
    mustHaveRequirements,
    experienceRequirements,
    skills,
    tools,
    benefits: [],
    stageHint,
  };
}

export function EditJobModal({ open, job, onClose, onSave }: EditJobModalProps) {
  const [title, setTitle] = useState(job.title);
  const [company, setCompany] = useState(job.company);
  const [location, setLocation] = useState(job.location ?? '');
  const [locationType, setLocationType] = useState<LocationType>(job.locationType);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(job.employmentType);
  const [compRange, setCompRange] = useState(job.compRange ?? '');
  const [compMin, setCompMin] = useState(job.compMin !== undefined ? String(job.compMin) : '');
  const [compMax, setCompMax] = useState(job.compMax !== undefined ? String(job.compMax) : '');
  const [jobDescription, setJobDescription] = useState(job.jobDescription);
  const [mustHaveRequirements, setMustHaveRequirements] = useState('');
  const [experienceRequirements, setExperienceRequirements] = useState('');
  const [skills, setSkills] = useState('');
  const [tools, setTools] = useState('');
  const [benefits, setBenefits] = useState('');
  const [stageHint, setStageHint] = useState<JobStageHint>('unknown');
  const [submitting, setSubmitting] = useState<'save' | 'rescore' | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(job.title);
    setCompany(job.company);
    setLocation(job.location ?? '');
    setLocationType(job.locationType);
    setEmploymentType(job.employmentType);
    setCompRange(job.compRange ?? '');
    setCompMin(job.compMin !== undefined ? String(job.compMin) : '');
    setCompMax(job.compMax !== undefined ? String(job.compMax) : '');
    setJobDescription(job.jobDescription);
    const derived = deriveScoringInputs(job);
    setMustHaveRequirements(listToMultiline(derived.mustHaveRequirements));
    setExperienceRequirements(listToMultiline(derived.experienceRequirements));
    setSkills(listToMultiline(derived.skills));
    setTools(listToMultiline(derived.tools));
    setBenefits(listToMultiline(derived.benefits));
    setStageHint(derived.stageHint ?? 'unknown');
  }, [open, job]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent, rescore: boolean) => {
    event.preventDefault();
    if (!title.trim() || !company.trim()) return;

    setSubmitting(rescore ? 'rescore' : 'save');
    try {
      await onSave({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        locationType,
        employmentType,
        compRange: compRange.trim() || undefined,
        compMin: parseNumberInput(compMin),
        compMax: parseNumberInput(compMax),
        jobDescription: jobDescription.trim(),
        scoringInputs: {
          mustHaveRequirements: multilineToList(mustHaveRequirements),
          experienceRequirements: multilineToList(experienceRequirements),
          skills: multilineToList(skills),
          tools: multilineToList(tools),
          benefits: multilineToList(benefits),
          stageHint,
        },
      }, { rescore });
      onClose();
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full md:max-w-2xl bg-white rounded-t-lg md:rounded-lg shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Edit job details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Job title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Company</label>
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Location</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Location type</label>
              <select
                value={locationType}
                onChange={(event) => setLocationType(event.target.value as LocationType)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                {LOCATION_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Employment type</label>
              <select
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                {EMPLOYMENT_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Compensation min</label>
              <input
                type="text"
                inputMode="numeric"
                value={compMin}
                onChange={(event) => setCompMin(event.target.value)}
                placeholder="120000"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Compensation max</label>
              <input
                type="text"
                inputMode="numeric"
                value={compMax}
                onChange={(event) => setCompMax(event.target.value)}
                placeholder="180000"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">Compensation text</label>
            <input
              value={compRange}
              onChange={(event) => setCompRange(event.target.value)}
              placeholder="$120k-$180k + bonus (optional)"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Scoring inputs</h3>
            <p className="text-[11px] text-neutral-500">
              Update extracted requirements, skills, and company stage before scoring.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Must-have requirements</label>
                <textarea
                  value={mustHaveRequirements}
                  onChange={(event) => setMustHaveRequirements(event.target.value)}
                  rows={5}
                  placeholder={'One per line\n8+ years in growth marketing'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Experience requirements</label>
                <textarea
                  value={experienceRequirements}
                  onChange={(event) => setExperienceRequirements(event.target.value)}
                  rows={5}
                  placeholder={'One per line\nPeople leadership for 5+ years'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Skills</label>
                <textarea
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                  rows={4}
                  placeholder={'One per line\nLifecycle marketing'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Tools</label>
                <textarea
                  value={tools}
                  onChange={(event) => setTools(event.target.value)}
                  rows={4}
                  placeholder={'One per line\nHubSpot'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Benefits</label>
                <textarea
                  value={benefits}
                  onChange={(event) => setBenefits(event.target.value)}
                  rows={4}
                  placeholder={'One per line\nHealth insurance'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Company stage</label>
              <select
                value={stageHint}
                onChange={(event) => setStageHint(event.target.value as JobStageHint)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                {STAGE_HINT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">Job description</label>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
            />
          </div>
        </form>

        <div className="px-5 py-4 border-t border-neutral-100 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="sm:flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(event) => handleSubmit(event, false)}
            disabled={submitting !== null}
            className="sm:flex-1 px-4 py-2 border border-brand-200 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-100 disabled:opacity-50"
          >
            {submitting === 'save' ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={(event) => handleSubmit(event, true)}
            disabled={submitting !== null}
            className="sm:flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting === 'rescore' ? 'Saving...' : 'Save and Re-score'}
          </button>
        </div>
      </div>
    </div>
  );
}

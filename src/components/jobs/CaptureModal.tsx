import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, Building2, Link, MapPin, FileText, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { LocationType } from '../../types';

const LOCATION_TYPES: LocationType[] = ['Remote', 'Hybrid', 'In-person', 'Unknown'];

const SOURCE_OPTIONS = ['LinkedIn', 'Indeed', 'Glassdoor', 'Referral', 'Company Site', 'AngelList', 'Other'];
const CUSTOM_SOURCE_VALUE = '__custom_source__';

type CaptureOpenDetail = {
  focus?: 'title' | 'url' | 'jd';
  prefillJd?: string;
};

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractCaptureHintsFromJd(rawText: string): { title?: string; company?: string } {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean)
    .slice(0, 16);

  let title: string | undefined;
  let company: string | undefined;

  for (const line of lines) {
    const roleMatch = line.match(/^(?:job title|title|role|position)\s*:\s*(.+)$/i);
    if (roleMatch && !title) title = normalizeLine(roleMatch[1]);

    const companyMatch = line.match(/^(?:company|employer|organization)\s*:\s*(.+)$/i);
    if (companyMatch && !company) company = normalizeLine(companyMatch[1]);

    if (title && company) return { title, company };
  }

  for (const line of lines) {
    const atMatch = line.match(/^(.{3,80})\s+at\s+(.{2,80})$/i);
    if (atMatch) {
      const candidateTitle = normalizeLine(atMatch[1]);
      const candidateCompany = normalizeLine(atMatch[2]);
      if (!title && /\b(manager|director|head|lead|vp|chief|specialist|analyst|engineer|marketer)\b/i.test(candidateTitle)) {
        title = candidateTitle;
      }
      if (!company) company = candidateCompany;
      if (title && company) return { title, company };
    }
  }

  for (const line of lines) {
    if (!title && /\b(manager|director|head|lead|vp|chief|specialist|analyst|engineer|marketer)\b/i.test(line)) {
      title = line.replace(/^[-*•]\s*/, '');
    }
    if (!company) {
      const aboutMatch = line.match(/^(?:about|join)\s+(.{2,80})$/i);
      if (aboutMatch) company = normalizeLine(aboutMatch[1]);
    }
    if (title && company) break;
  }

  return { title, company };
}

export function CaptureModal() {
  const navigate = useNavigate();
  const addJob = useStore((s) => s.addJob);
  const jobs = useStore((s) => s.jobs);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('Unknown');
  const [jobDescription, setJobDescription] = useState('');
  const [source, setSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [preferredFocus, setPreferredFocus] = useState<'title' | 'url' | 'jd'>('title');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for custom event to open
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<CaptureOpenDetail>;
      const detail = customEvent.detail || {};
      setPreferredFocus(detail.focus || 'title');
      if (detail.prefillJd?.trim()) {
        const prefillJd = detail.prefillJd.trim();
        setJobDescription(prefillJd);
        const hints = extractCaptureHintsFromJd(prefillJd);
        if (hints.title) {
          setTitle((prev) => (prev.trim() ? prev : hints.title || prev));
        }
        if (hints.company) {
          setCompany((prev) => (prev.trim() ? prev : hints.company || prev));
        }
      }
      setOpen(true);
    };
    window.addEventListener('open-capture-modal', handler as EventListener);
    return () => window.removeEventListener('open-capture-modal', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (preferredFocus === 'url') {
        urlInputRef.current?.focus();
        return;
      }
      if (preferredFocus === 'jd') {
        jdTextareaRef.current?.focus();
        return;
      }
      titleInputRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open, preferredFocus]);

  const resetForm = useCallback(() => {
    setTitle('');
    setCompany('');
    setUrl('');
    setLocation('');
    setLocationType('Unknown');
    setJobDescription('');
    setSource('');
    setCustomSource('');
  }, []);

  const availableSources = useMemo(() => {
    const set = new Set<string>(SOURCE_OPTIONS);
    for (const job of jobs) {
      const value = (job.source || '').trim();
      if (value) set.add(value);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const handleClose = useCallback(() => {
    setOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    setSubmitting(true);
    try {
      const resolvedSource =
        source === CUSTOM_SOURCE_VALUE
          ? customSource.trim() || undefined
          : source.trim() || undefined;
      const job = await addJob({
        title: title.trim(),
        company: company.trim(),
        url: url.trim() || undefined,
        location: location.trim() || undefined,
        locationType,
        jobDescription: jobDescription.trim(),
        source: resolvedSource,
      });

      handleClose();
      navigate(`/job/${job.id}`);
    } catch (err) {
      console.error('Failed to add job:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        style={{ animation: 'fadeIn 200ms ease-out' }}
      />

      {/* Modal / Drawer */}
      <div
        className="relative w-full md:max-w-lg bg-white rounded-t-lg md:rounded-lg shadow-2xl max-h-[92vh] flex flex-col"
        style={{ animation: 'scaleIn 200ms ease-out' }}
      >
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Add New Job</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Fast paths: paste full JD for best scoring, or start from a listing URL.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Job Title */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Briefcase size={14} className="text-neutral-400" />
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VP of Growth"
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Company */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Building2 size={14} className="text-neutral-400" />
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Pepper"
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Job URL */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Link size={14} className="text-neutral-400" />
              Job URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Location row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
                <MapPin size={14} className="text-neutral-400" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {LOCATION_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Globe size={14} className="text-neutral-400" />
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">Select source...</option>
              {availableSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={CUSTOM_SOURCE_VALUE}>+ Add new source</option>
            </select>
            {source === CUSTOM_SOURCE_VALUE && (
              <input
                type="text"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="Enter source name"
                className="mt-2 w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <FileText size={14} className="text-neutral-400" />
              Job Description
              <span className="text-xs text-neutral-400 font-normal ml-1">(required for scoring)</span>
            </label>
            <textarea
              ref={jdTextareaRef}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!title.trim() || !company.trim() || submitting}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              'Add Job'
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

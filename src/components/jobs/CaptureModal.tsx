import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, Building2, Link, MapPin, FileText, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { LocationType } from '../../types';

const LOCATION_TYPES: LocationType[] = ['Remote', 'Hybrid', 'In-person', 'Unknown'];

const SOURCE_OPTIONS = ['LinkedIn', 'Indeed', 'Glassdoor', 'Referral', 'Company Site', 'AngelList', 'Other'];

export function CaptureModal() {
  const navigate = useNavigate();
  const addJob = useStore((s) => s.addJob);

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

  // Listen for custom event to open
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-capture-modal', handler);
    return () => window.removeEventListener('open-capture-modal', handler);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setCompany('');
    setUrl('');
    setLocation('');
    setLocationType('Unknown');
    setJobDescription('');
    setSource('');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    setSubmitting(true);
    try {
      const job = await addJob({
        title: title.trim(),
        company: company.trim(),
        url: url.trim() || undefined,
        location: location.trim() || undefined,
        locationType,
        jobDescription: jobDescription.trim(),
        source: source.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={handleClose}
      />

      {/* Modal / Drawer */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col animate-[slideUp_300ms_ease-out] sm:animate-[scaleIn_200ms_ease-out]">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Add New Job</h2>
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
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VP of Growth"
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
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
              placeholder="e.g. Acme Corp"
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Job URL */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Link size={14} className="text-neutral-400" />
              Job URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
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
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
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
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
            >
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Job Description */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <FileText size={14} className="text-neutral-400" />
              Job Description
              <span className="text-xs text-neutral-400 font-normal ml-1">(required for scoring)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!title.trim() || !company.trim() || submitting}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

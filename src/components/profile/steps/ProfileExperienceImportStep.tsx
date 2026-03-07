import { useRef } from 'react';

const SEQUENCE = [
  'Companies',
  'Roles and dates',
  'Responsibilities',
  'Results',
  'Skills and tools',
];

interface ProfileExperienceImportStepProps {
  selectedFileName: string | null;
  isImporting: boolean;
  importComplete: boolean;
  onFileSelected: (file: File) => void;
  onStartExtraction: () => void;
  onStartManually: () => void;
  onBack: () => void;
}

export function ProfileExperienceImportStep({
  selectedFileName,
  isImporting,
  importComplete,
  onFileSelected,
  onStartExtraction,
  onStartManually,
  onBack,
}: ProfileExperienceImportStepProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-[var(--shadow-panel)]">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Confirm your experience</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        We&apos;ll pull in companies, roles, dates, responsibilities, results, and likely skills. Then you&apos;ll confirm what&apos;s right.
      </p>
      <button
        type="button"
        onClick={onStartManually}
        className="mt-2 inline-flex text-sm font-medium text-[var(--text-secondary)] underline decoration-[var(--color-accent-500)] underline-offset-4 hover:text-[var(--text-primary)]"
      >
        No resume? Start manually
      </button>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">What we confirm next</p>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="experience-sequence">
          {SEQUENCE.map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf"
          className="hidden"
          aria-label="Resume file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onFileSelected(file);
          }}
        />

        {!selectedFileName && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-primary rounded-[var(--radius-control)] px-5 py-2.5 text-sm"
          >
            Build from my resume
          </button>
        )}

        {selectedFileName && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Selected file: <span className="font-semibold text-[var(--text-primary)]">{selectedFileName}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-ghost rounded-[var(--radius-control)] px-4 py-2 text-sm"
              >
                Choose another file
              </button>
              <button
                type="button"
                onClick={onStartExtraction}
                disabled={isImporting}
                className="btn-primary rounded-[var(--radius-control)] px-5 py-2.5 text-sm"
              >
                {isImporting ? 'Extracting...' : 'Start extraction'}
              </button>
            </div>
          </div>
        )}
      </div>

      {importComplete && !isImporting && (
        <p className="mt-3 text-sm text-[var(--status-success-text)]">
          Extraction shell complete. Compare versions and detailed confirmation steps are coming next.
        </p>
      )}

      <div className="mt-6">
        <button type="button" onClick={onBack} className="btn-ghost rounded-[var(--radius-control)] px-4 py-2 text-sm">
          Back
        </button>
      </div>
    </section>
  );
}

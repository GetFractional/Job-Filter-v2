import { FileText } from 'lucide-react';

export type ExtractionBuildStage =
  | 'idle'
  | 'extracting_text'
  | 'mapping_timeline'
  | 'assembling_preview'
  | 'ready'
  | 'error';

interface ProfileExperienceImportStepProps {
  selectedPath: 'resume' | 'manual' | null;
  selectedFileName: string | null;
  selectedFileMeta: string | null;
  needsFileReselection: boolean;
  extractionStage: ExtractionBuildStage;
  importError: string | null;
  onRetryExtraction: () => void;
  onBack: () => void;
}

const CHECKLIST = [
  'Confirm company names first, so your timeline foundation is accurate.',
  'Confirm role titles and dates next, including current role status.',
  'Confirm responsibilities and results, then keep the skills and tools you want to reuse.',
];

const STAGE_LABELS: Record<ExtractionBuildStage, string> = {
  idle: 'Waiting for resume extraction',
  extracting_text: 'Reading resume content',
  mapping_timeline: 'Mapping companies, roles, and dates',
  assembling_preview: 'Building your live timeline preview',
  ready: 'Timeline ready for confirmation',
  error: 'Extraction needs attention',
};

const STAGE_PROGRESS: Record<ExtractionBuildStage, number> = {
  idle: 4,
  extracting_text: 24,
  mapping_timeline: 58,
  assembling_preview: 84,
  ready: 100,
  error: 100,
};

export function ProfileExperienceImportStep({
  selectedPath,
  selectedFileName,
  selectedFileMeta,
  needsFileReselection,
  extractionStage,
  importError,
  onRetryExtraction,
  onBack,
}: ProfileExperienceImportStepProps) {
  const isResumePath = selectedPath === 'resume';
  const stageCopy = STAGE_LABELS[extractionStage];
  const isProcessing = extractionStage === 'extracting_text'
    || extractionStage === 'mapping_timeline'
    || extractionStage === 'assembling_preview';

  return (
    <section className="workspace-panel rounded-[26px] p-7">
      <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Confirm your experience</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
        Review your extracted companies, roles, dates, responsibilities, and results. This timeline powers trusted downstream assets.
      </p>

      <div className="mt-6 rounded-[18px] border border-white/70 bg-white/74 p-4 shadow-[0_16px_36px_rgba(16,26,21,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Guided flow</p>
        <ol className="mt-2 space-y-1.5">
          {CHECKLIST.map((item, index) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-bg)] text-[11px] font-semibold text-[var(--text-primary)]">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {!isResumePath && (
        <div className="mt-5 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Manual setup path selected on Start Here</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            You skipped resume import, so this section stays manual for now. Continue building your profile details and experience directly.
          </p>
        </div>
      )}

      {isResumePath && (
        <div className="mt-5 space-y-4 rounded-[18px] border border-[var(--border-subtle)] bg-white/92 p-5 shadow-[0_18px_30px_rgba(15,24,20,0.09)]">
          <div className="flex min-w-0 items-center gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3.5 py-3">
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2">
              <FileText size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {selectedFileName || 'No resume file attached'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {selectedFileMeta || 'Upload from Start Here to begin extraction.'}
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Extraction status</p>
              <p className="text-xs font-medium text-[var(--text-secondary)]">{stageCopy}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${extractionStage === 'error' ? 'bg-red-500' : 'bg-[var(--color-brand-600)]'}`}
                style={{ width: `${STAGE_PROGRESS[extractionStage]}%` }}
              />
            </div>
            {isProcessing && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                We are processing your resume in the background while you finish details.
              </p>
            )}
            {extractionStage === 'ready' && (
              <p className="mt-2 text-xs text-[var(--status-success-text)]">
                Timeline extraction finished. You can now confirm the structured experience below.
              </p>
            )}
            {needsFileReselection && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                After refresh, go back to Start Here and upload the file again to resume extraction.
              </p>
            )}
            {extractionStage === 'error' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-xs text-[var(--status-danger-text)]">
                  Extraction paused before completion.
                </p>
                <button type="button" onClick={onRetryExtraction} className="workspace-btn-secondary">
                  Retry extraction
                </button>
                <p className="text-xs text-[var(--text-secondary)]">Need a different file? Go back to Start Here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {importError && (
        <p className="mt-3 rounded-[var(--radius-control)] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
          {importError}
        </p>
      )}

      <div className="mt-7">
        <button type="button" onClick={onBack} className="workspace-btn-secondary">
          Back
        </button>
      </div>
    </section>
  );
}

import { useRef } from 'react';
import { FileUp, RefreshCcw, Sparkles } from 'lucide-react';

export type StartHerePrefillState = 'idle' | 'prefilling' | 'ready' | 'error';

interface ProfileIntroStepProps {
  selectedPath: 'resume' | 'manual' | null;
  selectedFileName: string | null;
  selectedFileMeta: string | null;
  prefillState: StartHerePrefillState;
  prefillMessage: string | null;
  canReset: boolean;
  onResumeFileSelected: (file: File) => void;
  onStartManually: () => void;
  onResetFlow: () => void;
}

const VALUE_POINTS = [
  'Target multiple roles without starting from scratch',
  'Create and test tailored applications faster',
  'Keep every asset grounded in facts you approve',
  'Go from opportunity to application in minutes, not hours',
];

function prefillStateLabel(state: StartHerePrefillState): string {
  if (state === 'prefilling') return 'Reading resume for detail prefill...';
  if (state === 'ready') return 'Resume uploaded and details prefill is ready.';
  if (state === 'error') return 'We could not prefill details from that file.';
  return '';
}

export function ProfileIntroStep({
  selectedPath,
  selectedFileName,
  selectedFileMeta,
  prefillState,
  prefillMessage,
  canReset,
  onResumeFileSelected,
  onStartManually,
  onResetFlow,
}: ProfileIntroStepProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stateLabel = prefillMessage ?? prefillStateLabel(prefillState);

  return (
    <section className="workspace-panel p-6 sm:p-7" aria-labelledby="profile-start-here-heading">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Start Here</p>
        <span className="rounded-full border border-[var(--border-subtle)] bg-white/82 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
          Takes About 6 Minutes
        </span>
      </div>
      <h1
        id="profile-start-here-heading"
        className="mt-3 text-[clamp(1.58rem,2.05vw,2.12rem)] leading-[1.12] font-[600] text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Turn your work history into assets that can open the right doors
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
        Upload your resume or build from scratch. Job Filter organizes your experience into tailored resumes, cover letters, and outreach you can create faster, with details you can trust.
      </p>

      <div className="mt-6">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-secondary)]">
          <Sparkles size={12} aria-hidden />
          What this unlocks
        </p>
        <div className="space-y-2.5">
          {VALUE_POINTS.map((point, index) => (
            <div
              key={point}
              className="flex items-center gap-3 rounded-[14px] border border-white/70 bg-white/78 px-4 py-3 shadow-[0_10px_20px_rgba(10,26,20,0.05)]"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-bg)] text-xs font-semibold text-[var(--text-primary)]">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-[var(--text-primary)]">{point}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 space-y-3 rounded-[20px] border border-white/70 bg-white/72 p-4 shadow-[0_18px_30px_rgba(14,23,20,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Choose your setup path</p>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-label="Start Here resume file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onResumeFileSelected(file);
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`workspace-btn-primary ${selectedPath === 'resume' ? 'workspace-btn-selected' : ''}`}
          >
            <FileUp size={15} aria-hidden />
            Build from my resume
          </button>
          <button
            type="button"
            onClick={onStartManually}
            className={`workspace-btn-secondary ${selectedPath === 'manual' ? 'workspace-btn-selected' : ''}`}
          >
            No resume? Start manually
          </button>
          {canReset && (
            <button type="button" onClick={onResetFlow} className="workspace-btn-tertiary">
              <RefreshCcw size={14} aria-hidden />
              Reset flow
            </button>
          )}
        </div>

        {selectedFileName && (
          <div className="rounded-[14px] border border-[var(--border-subtle)] bg-white/80 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedFileName}</p>
            {selectedFileMeta && <p className="text-xs text-[var(--text-secondary)]">{selectedFileMeta}</p>}
          </div>
        )}

        {stateLabel && (
          <p className="text-xs text-[var(--text-secondary)]" role={prefillState === 'error' ? 'alert' : undefined}>
            {stateLabel}
          </p>
        )}
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { buildOperatorReviewSummary } from '../../../lib/operatorCore';
import type { OperatorLane, OperatorStory, OperatorTargetJob } from '../../../types';

interface ProfileAssetGenerationStepProps {
  selectedLane: OperatorLane | null;
  stories: OperatorStory[];
  targetJob: OperatorTargetJob;
  generationError: string | null;
  isGenerating: boolean;
  generatedResumeContent: string;
  generatedCoverLetterContent: string;
  generatedJobId?: string;
  onTargetJobChange: (updates: Partial<OperatorTargetJob>) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export function ProfileAssetGenerationStep({
  selectedLane,
  stories,
  targetJob,
  generationError,
  isGenerating,
  generatedResumeContent,
  generatedCoverLetterContent,
  generatedJobId,
  onTargetJobChange,
  onBack,
  onGenerate,
}: ProfileAssetGenerationStepProps) {
  const reviewSummary = buildOperatorReviewSummary(stories);

  return (
    <section className="workspace-panel p-6 lg:p-7">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Enter a target job and generate reviewable assets</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
        This is the first usable operator slice: one lane, reviewed stories, safer proof handling, then a lightweight job intake that generates a resume and cover letter you can inspect before anything is sent.
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Selected lane</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{selectedLane?.title ?? 'No lane selected'}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Approved stories: {reviewSummary.approvedCount} · Softened metrics: {reviewSummary.softenedCount} · Excluded stories: {reviewSummary.excludedCount}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Job title
              <input
                type="text"
                value={targetJob.title}
                onChange={(event) => onTargetJobChange({ title: event.target.value })}
                placeholder="Director of Growth"
                className="workspace-input mt-1.5"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Company
              <input
                type="text"
                value={targetJob.company}
                onChange={(event) => onTargetJobChange({ company: event.target.value })}
                placeholder="Example Co"
                className="workspace-input mt-1.5"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Location
              <input
                type="text"
                value={targetJob.location}
                onChange={(event) => onTargetJobChange({ location: event.target.value })}
                placeholder="Remote or Austin, TX"
                className="workspace-input mt-1.5"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Job link
              <input
                type="url"
                value={targetJob.url}
                onChange={(event) => onTargetJobChange({ url: event.target.value })}
                placeholder="https://company.com/jobs/role"
                className="workspace-input mt-1.5"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Minimum job context
            <textarea
              value={targetJob.jobDescription}
              onChange={(event) => onTargetJobChange({ jobDescription: event.target.value })}
              placeholder="Paste the core responsibilities, must-have requirements, and what success looks like in this role."
              className="workspace-input mt-1.5 min-h-[180px] resize-y"
            />
          </label>

          <div className="rounded-[16px] border border-[var(--border-subtle)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Review-before-send</p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>These drafts only use approved stories.</li>
              <li>Softened metric language stays intact unless you approved exact wording.</li>
              <li>No auto-send. Final review is still required before you use any asset.</li>
            </ul>
          </div>

          {generationError && (
            <div className="rounded-[14px] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-3 text-sm text-[var(--status-danger-text)]">
              {generationError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="workspace-btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              className="workspace-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? 'Generating drafts...' : 'Generate resume + cover letter'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <AssetPreviewCard
            title="Resume draft"
            content={generatedResumeContent}
          />
          <AssetPreviewCard
            title="Cover letter draft"
            content={generatedCoverLetterContent}
          />

          {generatedJobId && (
            <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4 text-sm text-[var(--text-secondary)]">
              Saved to the job workspace for continued review.
              <div className="mt-3">
                <Link to={`/job/${generatedJobId}`} className="workspace-btn-secondary inline-flex">
                  Open job workspace
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AssetPreviewCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-white p-4 shadow-[0_12px_30px_rgba(9,21,17,0.06)]">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-[14px] bg-[var(--surface-bg)] p-4 text-xs leading-6 text-[var(--text-secondary)]">
        {content || 'Generated draft will appear here after you add a target job and run the slice.'}
      </pre>
    </div>
  );
}

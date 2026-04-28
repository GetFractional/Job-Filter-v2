import { buildOperatorReviewSummary } from '../../../lib/operatorCore';
import type { OperatorLane, OperatorStory, OperatorStoryMetricMode } from '../../../types';

interface ProfileStoryReviewStepProps {
  selectedLane: OperatorLane | null;
  stories: OperatorStory[];
  onApprovedChange: (storyId: string, approved: boolean) => void;
  onMetricModeChange: (storyId: string, metricMode: OperatorStoryMetricMode) => void;
  onBack: () => void;
  onContinue: () => void;
}

const METRIC_MODE_LABELS: Record<OperatorStoryMetricMode, string> = {
  plain: 'Use reviewed wording',
  softened: 'Use safer wording',
  exact: 'Use exact wording',
};

export function ProfileStoryReviewStep({
  selectedLane,
  stories,
  onApprovedChange,
  onMetricModeChange,
  onBack,
  onContinue,
}: ProfileStoryReviewStepProps) {
  const reviewSummary = buildOperatorReviewSummary(stories);
  const relevantStories = selectedLane
    ? stories.filter((story) => story.laneIds.includes(selectedLane.id))
    : stories;
  const fallbackStories = relevantStories.length > 0 ? relevantStories : stories;

  return (
    <section className="workspace-panel p-6 lg:p-7">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Review stories and proof safety</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
        Guided storytelling is first-class here. Approve the stories this lane can use, then decide whether numeric outcomes should stay exact or be softened for safer downstream drafting.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <SummaryStat label="Approved" value={reviewSummary.approvedCount} />
        <SummaryStat label="Softened" value={reviewSummary.softenedCount} />
        <SummaryStat label="Exact" value={reviewSummary.exactCount} />
        <SummaryStat label="Excluded" value={reviewSummary.excludedCount} />
      </div>

      <div className="mt-5 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Trust architecture</p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
          <li>Review before send stays visible here. Nothing downstream is auto-sent.</li>
          <li>Unsupported or excluded stories stay out of generated assets.</li>
          <li>Numeric claims default to safer wording until you approve exact phrasing.</li>
        </ul>
      </div>

      <div className="mt-5 space-y-3">
        {fallbackStories.map((story) => (
          <article key={story.id} className="rounded-[18px] border border-[var(--border-subtle)] bg-white p-4 shadow-[0_12px_30px_rgba(9,21,17,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{story.title}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{story.company} · {story.role}</p>
              </div>
              <label className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={story.approved}
                  onChange={(event) => onApprovedChange(story.id, event.target.checked)}
                />
                Eligible for generation
              </label>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-3">
                <StoryBlock label="Challenge" value={story.challenge} />
                <div className="rounded-[14px] bg-[var(--surface-muted)] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Actions</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
                    {story.actions.map((action) => (
                      <li key={`${story.id}-${action}`}>• {action}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <StoryBlock label="Original outcome" value={story.outcome} />
                <StoryBlock label="Safer wording" value={story.safeOutcome} />
                <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3 py-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Metric handling
                    <select
                      aria-label={`Metric handling for ${story.title}`}
                      value={story.metricMode}
                      onChange={(event) => onMetricModeChange(story.id, event.target.value as OperatorStoryMetricMode)}
                      className="workspace-input mt-2"
                    >
                      <option value="plain">{METRIC_MODE_LABELS.plain}</option>
                      <option value="softened">{METRIC_MODE_LABELS.softened}</option>
                      <option value="exact">{METRIC_MODE_LABELS.exact}</option>
                    </select>
                  </label>
                  <div className="mt-3 space-y-1.5">
                    {story.proofNotes.map((note) => (
                      <p key={`${story.id}-${note}`} className="text-xs text-[var(--text-secondary)]">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="workspace-btn-secondary">
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={reviewSummary.approvedCount === 0}
          className="workspace-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Lock reviewed stories
        </button>
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-[var(--border-subtle)] bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function StoryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[var(--surface-muted)] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{value}</p>
    </div>
  );
}

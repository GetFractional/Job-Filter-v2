import type { OperatorLane } from '../../../types';

interface ProfileLaneSelectionStepProps {
  lanes: OperatorLane[];
  selectedLaneId: string | null;
  onSelectLane: (laneId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ProfileLaneSelectionStep({
  lanes,
  selectedLaneId,
  onSelectLane,
  onBack,
  onContinue,
}: ProfileLaneSelectionStepProps) {
  return (
    <section className="workspace-panel p-6 lg:p-7">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Choose your role lane</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
        Job Filter starts with profile truth so the rest of the search can run through the right lane. Pick the title direction that should drive story selection and target-job intake.
      </p>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {lanes.map((lane) => {
          const selected = lane.id === selectedLaneId;
          return (
            <button
              key={lane.id}
              type="button"
              onClick={() => onSelectLane(lane.id)}
              className={`rounded-[18px] border p-4 text-left transition ${
                selected
                  ? 'border-[var(--color-brand-300)] bg-[var(--surface-bg)] shadow-[0_16px_34px_rgba(10,22,18,0.12)]'
                  : 'border-[var(--border-subtle)] bg-white hover:border-[var(--color-brand-300)]'
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{lane.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {lane.sourceRoleTitles.length > 0
                      ? `Closest profile anchors: ${lane.sourceRoleTitles.slice(0, 3).join(', ')}`
                      : 'Use this if it best reflects the roles you want in your search lanes.'}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${selected ? 'bg-[var(--color-brand-700)] text-white' : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}>
                  {selected ? 'Selected' : 'Available'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {lane.fitReasons.map((reason) => (
                  <p key={`${lane.id}-${reason}`} className="rounded-[12px] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                    {reason}
                  </p>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="workspace-btn-secondary">
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedLaneId}
          className="workspace-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Lock lane and continue
        </button>
      </div>
    </section>
  );
}

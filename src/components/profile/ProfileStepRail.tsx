import type { ProfileWorkspaceSectionId } from '../../types';

export interface ProfileWorkspaceStep {
  id: ProfileWorkspaceSectionId;
  label: string;
  description: string;
  enabled: boolean;
}

interface ProfileStepRailProps {
  steps: ProfileWorkspaceStep[];
  activeStep: ProfileWorkspaceSectionId;
  onStepChange: (stepId: ProfileWorkspaceSectionId) => void;
  completionPercent: number;
}

function StepButton({
  step,
  active,
  onClick,
}: {
  step: ProfileWorkspaceStep;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!step.enabled}
      className={`w-full rounded-[var(--radius-control)] border px-3 py-2.5 text-left transition ${
        active
          ? 'border-brand-600 bg-[var(--accent-soft)] text-[var(--text-primary)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-bg)] text-[var(--text-secondary)]'
      } ${step.enabled ? 'hover:border-brand-400 hover:text-[var(--text-primary)]' : 'cursor-not-allowed opacity-60'}`}
      aria-current={active ? 'step' : undefined}
    >
      <p className="text-sm font-semibold">{step.label}</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{step.description}</p>
      {!step.enabled && <p className="mt-1 text-[11px] font-medium text-[var(--color-accent-700)]">Coming next</p>}
    </button>
  );
}

export function ProfileStepRail({
  steps,
  activeStep,
  onStepChange,
  completionPercent,
}: ProfileStepRailProps) {
  return (
    <>
      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-4 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4 shadow-[var(--shadow-soft)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Profile Progress</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{completionPercent}% complete</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
              style={{ width: `${completionPercent}%` }}
              aria-hidden
            />
          </div>
          <div className="space-y-2">
            {steps.map((step) => (
              <StepButton
                key={step.id}
                step={step}
                active={step.id === activeStep}
                onClick={() => onStepChange(step.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      <div className="xl:hidden">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {steps.map((step) => {
            const active = step.id === activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => step.enabled && onStepChange(step.id)}
                disabled={!step.enabled}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  active
                    ? 'border-brand-600 bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-bg)] text-[var(--text-secondary)]'
                } ${step.enabled ? '' : 'opacity-55'}`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { ProfileWorkspaceSectionId } from '../../types';

export type ProfileWorkspaceStepStatus = 'pending' | 'in_progress' | 'completed';

export interface ProfileWorkspaceStep {
  id: ProfileWorkspaceSectionId;
  label: string;
  description: string;
  status: ProfileWorkspaceStepStatus;
  available: boolean;
}

interface ProfileStepRailProps {
  steps: ProfileWorkspaceStep[];
  activeStep: ProfileWorkspaceSectionId;
  completionPercent: number;
  onStepChange: (stepId: ProfileWorkspaceSectionId) => void;
}

const STATUS_COPY: Record<ProfileWorkspaceStepStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
};

function statusBadgeClass(status: ProfileWorkspaceStepStatus): string {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status === 'in_progress') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
  return 'border-slate-300 bg-slate-100 text-slate-600';
}

function StatusIcon({ status }: { status: ProfileWorkspaceStepStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 size={16} className="text-emerald-600" aria-hidden />;
  }
  if (status === 'in_progress') {
    return <CircleDot size={16} className="text-blue-600" aria-hidden />;
  }
  return <Circle size={16} className="text-slate-400" aria-hidden />;
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
      disabled={!step.available}
      data-testid={`step-${step.id}`}
      className={`w-full rounded-[16px] border px-3.5 py-3 text-left transition ${
        active
          ? 'border-[var(--color-brand-500)] bg-white/95 shadow-[0_12px_26px_rgba(15,24,20,0.08)]'
          : 'border-white/50 bg-white/70'
      } ${step.available ? 'hover:border-[var(--color-brand-400)] hover:bg-white/90' : 'cursor-not-allowed opacity-70'}`}
      aria-current={active ? 'step' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon status={step.status} />
          <p className="text-sm font-semibold text-[var(--text-primary)]">{step.label}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(step.status)}`}>
          {STATUS_COPY[step.status]}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{step.description}</p>
    </button>
  );
}

export function ProfileStepRail({
  steps,
  activeStep,
  completionPercent,
  onStepChange,
}: ProfileStepRailProps) {
  const [isCompactListOpen, setIsCompactListOpen] = useState(false);

  return (
    <>
      <aside className="hidden 2xl:block">
        <div className="workspace-glass sticky top-4 space-y-4 rounded-[22px] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Profile progress</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{completionPercent}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
            <div className="h-full rounded-full bg-[var(--color-brand-600)] transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="space-y-2">
            {steps.map((step) => (
              <StepButton key={step.id} step={step} active={step.id === activeStep} onClick={() => onStepChange(step.id)} />
            ))}
          </div>
        </div>
      </aside>

      <div className="2xl:hidden">
        <div className="workspace-glass mb-4 rounded-[18px] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Profile progress</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{completionPercent}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
            <div className="h-full rounded-full bg-[var(--color-brand-600)] transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsCompactListOpen((previous) => !previous)}
              className="workspace-btn-secondary w-full justify-between"
              aria-expanded={isCompactListOpen}
              aria-controls="profile-step-compact-list"
            >
              <span>{isCompactListOpen ? 'Hide step list' : 'Show step list'}</span>
              <span className="text-xs text-[var(--text-muted)]">{isCompactListOpen ? '−' : '+'}</span>
            </button>
          </div>
          {isCompactListOpen && (
            <div id="profile-step-compact-list" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => {
                const active = step.id === activeStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => step.available && onStepChange(step.id)}
                    disabled={!step.available}
                    className={`rounded-[12px] border px-3 py-2 text-left text-xs font-medium ${
                      active
                        ? 'border-[var(--color-brand-500)] bg-white text-[var(--text-primary)] shadow-[0_8px_14px_rgba(16,30,24,0.12)]'
                        : 'border-[var(--border-subtle)] bg-white/75 text-[var(--text-secondary)]'
                    } ${step.available ? 'hover:border-[var(--color-brand-300)]' : 'opacity-60'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={step.status} />
                      <span>{step.label}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-[var(--text-muted)]">{STATUS_COPY[step.status]}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

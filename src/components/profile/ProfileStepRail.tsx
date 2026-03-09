import { type ComponentType } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  CircleDot,
  Layers3,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import type { ProfileWorkspaceSectionId } from '../../types';

export type ProfileWorkspaceStepStatus = 'pending' | 'in_progress' | 'completed';

export interface ProfileWorkspaceStep {
  id: ProfileWorkspaceSectionId;
  label: string;
  description?: string;
  status: ProfileWorkspaceStepStatus;
  available: boolean;
}

interface ProfileStepRailProps {
  steps: ProfileWorkspaceStep[];
  activeStep: ProfileWorkspaceSectionId;
  onStepChange: (stepId: ProfileWorkspaceSectionId) => void;
}

const STATUS_COPY: Record<ProfileWorkspaceStepStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
};

const STEP_ICON_BY_ID: Record<ProfileWorkspaceSectionId, ComponentType<{ size?: number; className?: string }>> = {
  start_here: Sparkles,
  details: UserRound,
  experience: BriefcaseBusiness,
  skills: Wrench,
  extras: Layers3,
  preferences: SlidersHorizontal,
};

function statusChipClass(status: ProfileWorkspaceStepStatus): string {
  if (status === 'completed') return 'border-emerald-300 text-emerald-700 bg-emerald-50';
  if (status === 'in_progress') return 'border-sky-300 text-sky-700 bg-sky-50';
  return 'border-[var(--border-subtle)] text-[var(--text-muted)] bg-white/75';
}

function StatusIcon({ status }: { status: ProfileWorkspaceStepStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 size={12} className="text-emerald-600" aria-hidden />;
  }
  if (status === 'in_progress') {
    return <CircleDot size={12} className="text-sky-600" aria-hidden />;
  }
  return <Circle size={12} className="text-slate-400" aria-hidden />;
}

function stepButtonClass(active: boolean): string {
  const activeClass = active
    ? 'border-[var(--color-brand-300)] bg-white text-[var(--text-primary)] shadow-[0_10px_22px_rgba(15,24,20,0.12)]'
    : 'border-[var(--border-subtle)] bg-white/80 text-[var(--text-secondary)]';

  return `flex min-w-0 w-full items-center gap-2 rounded-[12px] border px-2 py-2 transition hover:border-[var(--color-brand-300)] hover:bg-white ${activeClass}`;
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
  const Icon = STEP_ICON_BY_ID[step.id];
  const statusLabel = STATUS_COPY[step.status];
  const title = `${step.label} · ${statusLabel}${step.description ? ` · ${step.description}` : ''}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!step.available}
      data-testid={`step-${step.id}`}
      data-status={step.status}
      data-active={active ? 'true' : 'false'}
      title={title}
      className={`${stepButtonClass(active)} ${step.available ? '' : 'cursor-not-allowed opacity-55'}`}
      aria-current={active ? 'step' : undefined}
      aria-label={title}
    >
      <span className={`relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${statusChipClass(step.status)}`}>
        <Icon size={15} aria-hidden />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-[1px] shadow-[0_4px_10px_rgba(13,24,20,0.12)]">
          <StatusIcon status={step.status} />
        </span>
      </span>
      <span className="min-w-0 text-left">
        <span className="block break-words text-[11px] font-semibold leading-4 text-[var(--text-primary)]">
          {step.label}
        </span>
        <span className="block text-[10px] leading-4 text-[var(--text-muted)]">
          {statusLabel}
        </span>
      </span>
    </button>
  );
}

export function ProfileStepRail({
  steps,
  activeStep,
  onStepChange,
}: ProfileStepRailProps) {
  return (
    <nav aria-label="Profile setup steps" className="w-full">
      <div id="profile-step-list" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step) => (
          <StepButton
            key={step.id}
            step={step}
            active={step.id === activeStep}
            onClick={() => onStepChange(step.id)}
          />
        ))}
      </div>
    </nav>
  );
}

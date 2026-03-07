import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProfileWorkspaceMode, ProfileWorkspaceSectionId } from '../../types';
import { ProfilePreviewPane } from './ProfilePreviewPane';
import { ProfileStepRail, type ProfileWorkspaceStep } from './ProfileStepRail';
import { ProfileDetailsStep, type ProfileIdentityDraft } from './steps/ProfileDetailsStep';
import { ProfileExperienceImportStep } from './steps/ProfileExperienceImportStep';
import { ProfileIntroStep } from './steps/ProfileIntroStep';

interface ProfileWorkspaceShellProps {
  mode: ProfileWorkspaceMode;
  initialIdentity: ProfileIdentityDraft;
}

const STEP_CONFIG: ProfileWorkspaceStep[] = [
  {
    id: 'intro',
    label: 'Intro',
    description: 'Start with the profile foundation',
    enabled: true,
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Identity and contact basics',
    enabled: true,
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Confirm your career timeline',
    enabled: true,
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Curate skills and tools',
    enabled: false,
  },
  {
    id: 'extras',
    label: 'Extras',
    description: 'Summary, education, certifications',
    enabled: false,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Targeting and scoring preferences',
    enabled: false,
  },
];

const MODE_LABELS: Record<ProfileWorkspaceMode, string> = {
  setup: 'Setup mode',
  edit: 'Edit mode',
  complete: 'Complete profile mode',
};

export function ProfileWorkspaceShell({ mode, initialIdentity }: ProfileWorkspaceShellProps) {
  const [activeStep, setActiveStep] = useState<ProfileWorkspaceSectionId>('intro');
  const [visitedSteps, setVisitedSteps] = useState<ProfileWorkspaceSectionId[]>(['intro']);
  const [identity, setIdentity] = useState<ProfileIdentityDraft>(initialIdentity);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [manualModeEnabled, setManualModeEnabled] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const importTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (importTimerRef.current !== null) {
        window.clearTimeout(importTimerRef.current);
      }
    };
  }, []);

  const completionPercent = useMemo(() => {
    const activeSteps = STEP_CONFIG.filter((step) => step.enabled).map((step) => step.id);
    const completedCount = activeSteps.filter((stepId) => visitedSteps.includes(stepId)).length;
    return Math.round((completedCount / activeSteps.length) * 100);
  }, [visitedSteps]);

  const handleStartExtraction = () => {
    if (!selectedFileName || isImporting) return;

    if (importTimerRef.current !== null) {
      window.clearTimeout(importTimerRef.current);
    }
    setImportComplete(false);
    setIsImporting(true);
    importTimerRef.current = window.setTimeout(() => {
      setIsImporting(false);
      setImportComplete(true);
      importTimerRef.current = null;
    }, 2200);
  };

  const handleStepChange = (nextStep: ProfileWorkspaceSectionId) => {
    setActiveStep(nextStep);
    setVisitedSteps((previous) => (previous.includes(nextStep) ? previous : [...previous, nextStep]));
  };

  const renderActiveStep = () => {
    if (activeStep === 'intro') {
      return (
        <ProfileIntroStep
          onBuildFromResume={() => handleStepChange('experience')}
          onStartManually={() => {
            setManualModeEnabled(true);
            handleStepChange('details');
          }}
        />
      );
    }

    if (activeStep === 'details') {
      return (
        <ProfileDetailsStep
          value={identity}
          onChange={setIdentity}
          onBack={() => handleStepChange('intro')}
          onContinue={() => handleStepChange('experience')}
        />
      );
    }

    if (activeStep === 'experience') {
      return (
        <ProfileExperienceImportStep
          selectedFileName={selectedFileName}
          isImporting={isImporting}
          importComplete={importComplete}
          onFileSelected={(file) => {
            setSelectedFileName(file.name);
            setImportComplete(false);
          }}
          onStartExtraction={handleStartExtraction}
          onStartManually={() => setManualModeEnabled(true)}
          onBack={() => handleStepChange('details')}
        />
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-[1560px] px-4 pb-8 pt-5 lg:px-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Profile Workspace</p>
          <p className="text-sm text-[var(--text-secondary)]">Build and confirm the profile that grounds every generated asset.</p>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          {MODE_LABELS[mode]}
        </span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(560px,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <ProfileStepRail
          steps={STEP_CONFIG}
          activeStep={activeStep}
          onStepChange={handleStepChange}
          completionPercent={completionPercent}
        />

        <div className="space-y-4">
          {manualModeEnabled && (
            <p className="rounded-[var(--radius-control)] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-3 py-2 text-xs text-[var(--status-success-text)]">
              Manual profile mode is enabled. Continue in this workspace even if you skip resume import.
            </p>
          )}
          {renderActiveStep()}
        </div>

        <div className="hidden lg:block">
          <ProfilePreviewPane activeStep={activeStep} identity={identity} isImporting={isImporting} />
        </div>
      </div>

      <div className="mt-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePreviewOpen((previous) => !previous)}
          className="w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
        >
          {mobilePreviewOpen ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      {mobilePreviewOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[65vh] overflow-y-auto rounded-t-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--app-bg)] p-4 shadow-[var(--shadow-panel)] lg:hidden">
          <ProfilePreviewPane activeStep={activeStep} identity={identity} isImporting={isImporting} />
        </div>
      )}
    </div>
  );
}

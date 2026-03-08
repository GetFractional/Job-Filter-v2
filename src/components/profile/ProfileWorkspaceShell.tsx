import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { ClaimsImportExtractionDiagnostics } from '../../lib/claimsImportPipeline';
import { extractClaimsImportTextWithMetrics, validateClaimsImportFile } from '../../lib/claimsImportPipeline';
import { buildBestImportDraftFromText } from '../../lib/importDraftBuilder';
import { inferProfilePrefillSuggestion } from '../../lib/profileInference';
import type { ImportDraft, ProfileWorkspaceMode, ProfileWorkspaceSectionId } from '../../types';
import {
  ProfilePreviewPane,
  type ExperienceTimelineCompanyPreview,
} from './ProfilePreviewPane';
import {
  ProfileStepRail,
  type ProfileWorkspaceStep,
  type ProfileWorkspaceStepStatus,
} from './ProfileStepRail';
import {
  ProfileDetailsStep,
  type ProfileIdentityDraft,
} from './steps/ProfileDetailsStep';
import {
  ProfileExperienceImportStep,
  type ExtractionBuildStage,
} from './steps/ProfileExperienceImportStep';
import { ProfileIntroStep, type StartHerePrefillState } from './steps/ProfileIntroStep';
import { formatNationalPhoneInput } from './steps/profilePhone';

interface ProfileWorkspaceShellProps {
  mode: ProfileWorkspaceMode;
  initialIdentity: ProfileIdentityDraft;
}

type SelectedPath = 'resume' | 'manual' | null;

interface ResumeContactPrefill {
  email?: string;
  linkedIn?: string;
  website?: string;
  location?: string;
}

interface ResumeComputationCache {
  fileSignature: string;
  extractionText: string;
  extractionDiagnostics: ClaimsImportExtractionDiagnostics;
  draft: ImportDraft;
  groups: ExperienceTimelineCompanyPreview[];
  suggestion: ReturnType<typeof inferProfilePrefillSuggestion>;
  contactPrefill: ResumeContactPrefill;
}

interface PersistedWorkspaceDraft {
  version: number;
  activeStep: ProfileWorkspaceSectionId;
  selectedPath: SelectedPath;
  resumeUploadInitiated: boolean;
  detailsSaved: boolean;
  identity: ProfileIdentityDraft;
  selectedFileName: string | null;
  selectedFileMeta: string | null;
  extractionStage: ExtractionBuildStage;
  extractionStarted: boolean;
  importError: string | null;
  extractionGroups: ExperienceTimelineCompanyPreview[];
  revealedGroupCount: number;
  prefillState: StartHerePrefillState;
  prefillMessage: string | null;
}

const WORKSPACE_DRAFT_VERSION = 2;
const WORKSPACE_DRAFT_STORAGE_PREFIX = 'jf2-profile-workspace-draft';
const EXTRACTION_TIMEOUT_MS = 30_000;
const STEP_ORDER: ProfileWorkspaceSectionId[] = [
  'start_here',
  'details',
  'experience',
  'skills',
  'extras',
  'preferences',
];

const STEP_DEFINITIONS: Array<{
  id: ProfileWorkspaceSectionId;
  label: string;
  description: string;
  supportsInPacket: boolean;
}> = [
  {
    id: 'start_here',
    label: 'Start Here',
    description: 'Choose your setup path',
    supportsInPacket: true,
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Identity and contact basics',
    supportsInPacket: true,
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Confirm companies, roles, and dates',
    supportsInPacket: true,
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Curate reusable skills and tools',
    supportsInPacket: false,
  },
  {
    id: 'extras',
    label: 'Extras',
    description: 'Summary, education, and certifications',
    supportsInPacket: false,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Targeting and scoring settings',
    supportsInPacket: false,
  },
];

const IN_PROGRESS_EXTRACTION_STAGES = new Set<ExtractionBuildStage>([
  'extracting_text',
  'mapping_timeline',
  'assembling_preview',
]);

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const LINKEDIN_RE = /\b(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)]+/i;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s)]+\b/gi;

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined'
    && typeof window.localStorage !== 'undefined'
    && typeof window.localStorage.getItem === 'function'
    && typeof window.localStorage.setItem === 'function';
}

function getWorkspaceDraftKey(mode: ProfileWorkspaceMode): string {
  return `${WORKSPACE_DRAFT_STORAGE_PREFIX}:${mode}`;
}

function readWorkspaceDraft(draftKey: string): PersistedWorkspaceDraft | null {
  if (!canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceDraft>;
    if (parsed.version !== WORKSPACE_DRAFT_VERSION) return null;
    if (!parsed.identity || typeof parsed.identity !== 'object') return null;
    if (!parsed.activeStep || !STEP_ORDER.includes(parsed.activeStep)) return null;

    const safeExtractionStage = IN_PROGRESS_EXTRACTION_STAGES.has(parsed.extractionStage as ExtractionBuildStage)
      ? 'idle'
      : (parsed.extractionStage ?? 'idle');

    return {
      version: WORKSPACE_DRAFT_VERSION,
      activeStep: parsed.activeStep,
      selectedPath: parsed.selectedPath ?? null,
      resumeUploadInitiated: Boolean(parsed.resumeUploadInitiated),
      detailsSaved: Boolean(parsed.detailsSaved),
      identity: parsed.identity as ProfileIdentityDraft,
      selectedFileName: parsed.selectedFileName ?? null,
      selectedFileMeta: parsed.selectedFileMeta ?? null,
      extractionStage: safeExtractionStage,
      extractionStarted: Boolean(parsed.extractionStarted),
      importError: parsed.importError ?? null,
      extractionGroups: Array.isArray(parsed.extractionGroups) ? parsed.extractionGroups : [],
      revealedGroupCount: Math.max(0, Number(parsed.revealedGroupCount ?? 0)),
      prefillState: parsed.prefillState ?? 'idle',
      prefillMessage: parsed.prefillMessage ?? null,
    };
  } catch {
    return null;
  }
}

function writeWorkspaceDraft(draftKey: string, draft: PersistedWorkspaceDraft): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(draftKey, JSON.stringify(draft));
}

function removeWorkspaceDraft(draftKey: string): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(draftKey);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatFileMeta(file: File): string {
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  const format = file.type || file.name.split('.').pop()?.toUpperCase() || 'File';
  return `${sizeKb} KB · ${format}`;
}

function fileSignature(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function toRoleDateRange(startDate?: string, endDate?: string, currentRole?: boolean): string {
  if (startDate && (endDate || currentRole)) {
    return `${startDate} - ${currentRole || !endDate ? 'Present' : endDate}`;
  }
  if (startDate) return `${startDate} - Present`;
  if (endDate) return `Ends ${endDate}`;
  return 'Date range not confirmed';
}

function toExperiencePreviewGroups(draft: ImportDraft): ExperienceTimelineCompanyPreview[] {
  return draft.companies
    .filter((company) => company.roles.length > 0)
    .slice(0, 6)
    .map((company) => ({
      id: company.id,
      company: company.name || 'Unassigned company',
      roles: company.roles.slice(0, 4).map((role) => ({
        id: role.id,
        title: role.title || 'Role title needs review',
        dateRange: toRoleDateRange(role.startDate, role.endDate, role.currentRole),
      })),
    }));
}

function createDelay(
  timersRef: MutableRefObject<number[]>,
  ms: number,
): Promise<void> {
  return new Promise((resolve) => {
    const timerId = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((id) => id !== timerId);
      resolve();
    }, ms);
    timersRef.current.push(timerId);
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: number | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

function normalizeLinkedIn(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function extractContactPrefill(text: string, locationHints: string[]): ResumeContactPrefill {
  const email = text.match(EMAIL_RE)?.[0];
  const linkedInMatch = text.match(LINKEDIN_RE)?.[0];
  const urls = Array.from(text.matchAll(URL_RE), (match) => match[0]);
  const website = urls.find((candidate) => !/linkedin\.com/i.test(candidate));
  const locationHint = locationHints.find((hint) => !/^(remote|hybrid|onsite)$/i.test(hint));

  return {
    email: email?.trim(),
    linkedIn: linkedInMatch ? normalizeLinkedIn(linkedInMatch.trim()) : undefined,
    website: website?.trim(),
    location: locationHint?.trim(),
  };
}

function applyPrefillIdentity(
  identity: ProfileIdentityDraft,
  suggestion: ReturnType<typeof inferProfilePrefillSuggestion>,
  contactPrefill: ResumeContactPrefill,
): ProfileIdentityDraft {
  const firstRole = suggestion.targetRoles.find((role) => role.trim().length > 0);

  return {
    ...identity,
    firstName: identity.firstName || suggestion.firstName || '',
    lastName: identity.lastName || suggestion.lastName || '',
    headline: identity.headline || firstRole || '',
    email: identity.email || contactPrefill.email || '',
    location: identity.location || contactPrefill.location || '',
    linkedIn: identity.linkedIn || contactPrefill.linkedIn || '',
    website: identity.website || contactPrefill.website || '',
    phoneNational: identity.phoneNational
      ? identity.phoneNational
      : formatNationalPhoneInput(identity.phoneNational, identity.phoneCountryCode),
  };
}

function defaultPersistedDraft(
  initialIdentity: ProfileIdentityDraft,
): PersistedWorkspaceDraft {
  return {
    version: WORKSPACE_DRAFT_VERSION,
    activeStep: 'start_here',
    selectedPath: null,
    resumeUploadInitiated: false,
    detailsSaved: false,
    identity: initialIdentity,
    selectedFileName: null,
    selectedFileMeta: null,
    extractionStage: 'idle',
    extractionStarted: false,
    importError: null,
    extractionGroups: [],
    revealedGroupCount: 0,
    prefillState: 'idle',
    prefillMessage: null,
  };
}

export function ProfileWorkspaceShell({ mode, initialIdentity }: ProfileWorkspaceShellProps) {
  const draftKey = useMemo(() => getWorkspaceDraftKey(mode), [mode]);
  const restoredDraft = useMemo(() => readWorkspaceDraft(draftKey), [draftKey]);
  const fallbackDraft = useMemo(() => defaultPersistedDraft(initialIdentity), [initialIdentity]);
  const initialDraft = restoredDraft ?? fallbackDraft;

  const [activeStep, setActiveStep] = useState<ProfileWorkspaceSectionId>(initialDraft.activeStep);
  const [selectedPath, setSelectedPath] = useState<SelectedPath>(initialDraft.selectedPath);
  const [resumeUploadInitiated, setResumeUploadInitiated] = useState(initialDraft.resumeUploadInitiated);
  const [detailsSaved, setDetailsSaved] = useState(initialDraft.detailsSaved);
  const [identity, setIdentity] = useState<ProfileIdentityDraft>(initialDraft.identity);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(initialDraft.selectedFileName);
  const [selectedFileMeta, setSelectedFileMeta] = useState<string | null>(initialDraft.selectedFileMeta);
  const [extractionStage, setExtractionStage] = useState<ExtractionBuildStage>(initialDraft.extractionStage);
  const [extractionStarted, setExtractionStarted] = useState(initialDraft.extractionStarted);
  const [importError, setImportError] = useState<string | null>(initialDraft.importError);
  const [extractionGroups, setExtractionGroups] = useState<ExperienceTimelineCompanyPreview[]>(initialDraft.extractionGroups);
  const [revealedGroupCount, setRevealedGroupCount] = useState(initialDraft.revealedGroupCount);
  const [prefillState, setPrefillState] = useState<StartHerePrefillState>(initialDraft.prefillState);
  const [prefillMessage, setPrefillMessage] = useState<string | null>(initialDraft.prefillMessage);

  const extractionRunIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const mountedRef = useRef(true);
  const resumeCacheRef = useRef<ResumeComputationCache | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current = [];
    };
  }, []);

  const detailsRequiredFieldsValid = useMemo(
    () => identity.firstName.trim().length > 0 && identity.lastName.trim().length > 0 && isValidEmail(identity.email),
    [identity.email, identity.firstName, identity.lastName],
  );

  const completionByStep = useMemo<Record<ProfileWorkspaceSectionId, boolean>>(
    () => ({
      start_here: selectedPath === 'manual' || (selectedPath === 'resume' && resumeUploadInitiated),
      details: detailsSaved && detailsRequiredFieldsValid,
      experience: extractionStage === 'ready' || (selectedPath === 'manual' && detailsSaved),
      skills: false,
      extras: false,
      preferences: false,
    }),
    [
      detailsRequiredFieldsValid,
      detailsSaved,
      extractionStage,
      resumeUploadInitiated,
      selectedPath,
    ],
  );

  const stepAvailability = useMemo<Record<ProfileWorkspaceSectionId, boolean>>(
    () => ({
      start_here: true,
      details: completionByStep.start_here || completionByStep.details || completionByStep.experience || activeStep === 'details',
      experience: completionByStep.details || completionByStep.experience || activeStep === 'experience',
      skills: false,
      extras: false,
      preferences: false,
    }),
    [activeStep, completionByStep.details, completionByStep.experience, completionByStep.start_here],
  );

  const firstIncompleteAvailableStep = useMemo(
    () => STEP_DEFINITIONS.find((step) => step.supportsInPacket && stepAvailability[step.id] && !completionByStep[step.id])?.id ?? null,
    [completionByStep, stepAvailability],
  );

  const completionPercent = useMemo(() => {
    const completedCount = STEP_ORDER.filter((stepId) => completionByStep[stepId]).length;
    return Math.round((completedCount / STEP_ORDER.length) * 100);
  }, [completionByStep]);

  const stepItems = useMemo<ProfileWorkspaceStep[]>(
    () => STEP_DEFINITIONS.map((definition) => {
      let status: ProfileWorkspaceStepStatus = 'pending';
      if (completionByStep[definition.id]) {
        status = 'completed';
      } else if (definition.supportsInPacket && stepAvailability[definition.id] && firstIncompleteAvailableStep === definition.id) {
        status = 'in_progress';
      }

      return {
        id: definition.id,
        label: definition.label,
        description: definition.description,
        status,
        available: definition.supportsInPacket && stepAvailability[definition.id],
      };
    }),
    [completionByStep, firstIncompleteAvailableStep, stepAvailability],
  );

  const canResetFlow = useMemo(
    () => selectedPath !== null
      || detailsSaved
      || extractionStarted
      || extractionGroups.length > 0
      || Boolean(selectedFileName),
    [detailsSaved, extractionGroups.length, extractionStarted, selectedFileName, selectedPath],
  );

  const persistableDraft = useMemo<PersistedWorkspaceDraft>(
    () => ({
      version: WORKSPACE_DRAFT_VERSION,
      activeStep,
      selectedPath,
      resumeUploadInitiated,
      detailsSaved,
      identity,
      selectedFileName,
      selectedFileMeta,
      extractionStage: IN_PROGRESS_EXTRACTION_STAGES.has(extractionStage) ? 'idle' : extractionStage,
      extractionStarted,
      importError,
      extractionGroups,
      revealedGroupCount,
      prefillState: prefillState === 'prefilling' ? 'idle' : prefillState,
      prefillMessage,
    }),
    [
      activeStep,
      detailsSaved,
      extractionGroups,
      extractionStage,
      extractionStarted,
      identity,
      importError,
      prefillMessage,
      prefillState,
      resumeUploadInitiated,
      revealedGroupCount,
      selectedFileMeta,
      selectedFileName,
      selectedPath,
    ],
  );

  useEffect(() => {
    writeWorkspaceDraft(draftKey, persistableDraft);
  }, [draftKey, persistableDraft]);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  const resetExtractionProgress = () => {
    extractionRunIdRef.current += 1;
    clearTimers();
    setExtractionStage('idle');
    setExtractionStarted(false);
    setImportError(null);
    setExtractionGroups([]);
    setRevealedGroupCount(0);
  };

  const applyIdentity = (nextIdentity: ProfileIdentityDraft) => {
    setIdentity(nextIdentity);
    setDetailsSaved(false);
  };

  const computeResumeData = async (
    file: File,
    timeoutLabel: string,
  ): Promise<ResumeComputationCache> => {
    const signature = fileSignature(file);
    if (resumeCacheRef.current?.fileSignature === signature) {
      return resumeCacheRef.current;
    }

    const extraction = await withTimeout(
      extractClaimsImportTextWithMetrics(file),
      EXTRACTION_TIMEOUT_MS,
      timeoutLabel,
    );

    const parsed = buildBestImportDraftFromText(extraction.text, {
      extractionDiagnostics: extraction.diagnostics,
    });

    const suggestion = inferProfilePrefillSuggestion(parsed.diagnostics, parsed.draft);
    const contactPrefill = extractContactPrefill(extraction.text, suggestion.locationHints);
    const groups = toExperiencePreviewGroups(parsed.draft);

    const computation: ResumeComputationCache = {
      fileSignature: signature,
      extractionText: extraction.text,
      extractionDiagnostics: extraction.diagnostics,
      draft: parsed.draft,
      groups,
      suggestion,
      contactPrefill,
    };

    resumeCacheRef.current = computation;
    return computation;
  };

  const runResumeExtractionPipeline = async (file: File) => {
    const runId = extractionRunIdRef.current + 1;
    extractionRunIdRef.current = runId;
    clearTimers();

    setExtractionStarted(true);
    setImportError(null);
    setExtractionGroups([]);
    setRevealedGroupCount(0);
    setPrefillState('prefilling');
    setPrefillMessage('Uploading and extracting your resume now. We will prefill details where possible.');
    setExtractionStage('extracting_text');

    try {
      const computation = await computeResumeData(
        file,
        'Resume extraction timed out before preview build could finish. Please try again.',
      );
      if (!mountedRef.current || runId !== extractionRunIdRef.current) return;

      setIdentity((previous) => applyPrefillIdentity(previous, computation.suggestion, computation.contactPrefill));
      setDetailsSaved(false);
      setPrefillState('ready');
      setPrefillMessage('Details were prefilled from your uploaded resume where we had confident matches.');

      setExtractionStage('mapping_timeline');
      await createDelay(timersRef, 180);
      if (!mountedRef.current || runId !== extractionRunIdRef.current) return;

      setExtractionGroups(computation.groups);
      setExtractionStage('assembling_preview');

      if (computation.groups.length === 0) {
        await createDelay(timersRef, 260);
      } else {
        for (let index = 1; index <= computation.groups.length; index += 1) {
          if (!mountedRef.current || runId !== extractionRunIdRef.current) return;
          await createDelay(timersRef, 190);
          if (!mountedRef.current || runId !== extractionRunIdRef.current) return;
          setRevealedGroupCount(index);
        }
      }

      if (!mountedRef.current || runId !== extractionRunIdRef.current) return;
      setExtractionStage('ready');
    } catch (error) {
      if (!mountedRef.current || runId !== extractionRunIdRef.current) return;
      const message = error instanceof Error ? error.message : 'Extraction failed. Try a different resume file.';
      setImportError(message);
      setPrefillState('error');
      setPrefillMessage(message);
      setExtractionStage('error');
    }
  };

  const handleResumeFileSelection = (file: File, source: 'start_here' | 'experience') => {
    const validationError = validateClaimsImportFile(file);
    if (validationError) {
      setSelectedPath('resume');
      setResumeUploadInitiated(false);
      setSelectedFile(null);
      setSelectedFileName(null);
      setSelectedFileMeta(null);
      setPrefillState('error');
      setPrefillMessage(validationError);
      setImportError(validationError);
      setExtractionStage('error');
      return;
    }

    setSelectedPath('resume');
    setResumeUploadInitiated(true);
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setSelectedFileMeta(formatFileMeta(file));
    setImportError(null);
    resetExtractionProgress();
    if (source === 'start_here') {
      setActiveStep('details');
    }
    void runResumeExtractionPipeline(file);
  };

  const handleStepChange = (stepId: ProfileWorkspaceSectionId) => {
    const target = stepItems.find((step) => step.id === stepId);
    if (!target?.available) return;
    setActiveStep(stepId);
  };

  const handleResetFlow = () => {
    extractionRunIdRef.current += 1;
    clearTimers();
    resumeCacheRef.current = null;
    removeWorkspaceDraft(draftKey);

    const reset = defaultPersistedDraft(initialIdentity);
    setActiveStep(reset.activeStep);
    setSelectedPath(reset.selectedPath);
    setResumeUploadInitiated(reset.resumeUploadInitiated);
    setDetailsSaved(reset.detailsSaved);
    setIdentity(reset.identity);
    setSelectedFile(null);
    setSelectedFileName(reset.selectedFileName);
    setSelectedFileMeta(reset.selectedFileMeta);
    setExtractionStage(reset.extractionStage);
    setExtractionStarted(reset.extractionStarted);
    setImportError(reset.importError);
    setExtractionGroups(reset.extractionGroups);
    setRevealedGroupCount(reset.revealedGroupCount);
    setPrefillState(reset.prefillState);
    setPrefillMessage(reset.prefillMessage);
  };

  const renderActiveStep = () => {
    if (activeStep === 'start_here') {
      return (
        <ProfileIntroStep
          selectedPath={selectedPath}
          selectedFileName={selectedFileName}
          selectedFileMeta={selectedFileMeta}
          prefillState={prefillState}
          prefillMessage={prefillMessage}
          canReset={canResetFlow}
          onResumeFileSelected={(file) => handleResumeFileSelection(file, 'start_here')}
          onStartManually={() => {
            extractionRunIdRef.current += 1;
            clearTimers();
            setSelectedPath('manual');
            setResumeUploadInitiated(false);
            setSelectedFile(null);
            setSelectedFileName(null);
            setSelectedFileMeta(null);
            setImportError(null);
            setExtractionStarted(false);
            setExtractionStage('idle');
            setExtractionGroups([]);
            setRevealedGroupCount(0);
            setPrefillState('idle');
            setPrefillMessage('Manual path selected. You can continue setup without importing a resume.');
            setActiveStep('details');
          }}
          onResetFlow={handleResetFlow}
        />
      );
    }

    if (activeStep === 'details') {
      return (
        <ProfileDetailsStep
          value={identity}
          detailsSaved={detailsSaved}
          prefillMessage={prefillState === 'ready' ? prefillMessage : null}
          onChange={applyIdentity}
          onBack={() => setActiveStep('start_here')}
          onContinue={() => {
            if (!detailsRequiredFieldsValid) return;
            setDetailsSaved(true);
            setActiveStep('experience');
          }}
        />
      );
    }

    if (activeStep === 'experience') {
      return (
        <ProfileExperienceImportStep
          selectedPath={selectedPath}
          selectedFileName={selectedFileName}
          selectedFileMeta={selectedFileMeta}
          needsFileReselection={Boolean(selectedPath === 'resume' && selectedFileName && !selectedFile && extractionStage !== 'ready')}
          extractionStage={extractionStage}
          importError={importError}
          onRetryExtraction={() => {
            if (!selectedFile) {
              setImportError('Re-select your resume file to retry extraction.');
              setExtractionStage('error');
              return;
            }
            void runResumeExtractionPipeline(selectedFile);
          }}
          onBack={() => setActiveStep('details')}
        />
      );
    }

    return (
      <section className="workspace-panel rounded-[26px] p-7">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Coming next</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This section is in the next packet. Your current progress stays saved in this workspace flow.
        </p>
      </section>
    );
  };

  return (
    <div data-profile-mode={mode} className="mx-auto w-full max-w-[1820px] overflow-x-clip px-4 pb-8 pt-4 lg:px-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] 2xl:grid-cols-[280px_minmax(0,1fr)_minmax(420px,560px)]">
        <div className="min-w-0 lg:col-span-2 2xl:col-span-1">
          <ProfileStepRail
            steps={stepItems}
            activeStep={activeStep}
            completionPercent={completionPercent}
            onStepChange={handleStepChange}
          />
        </div>

        <div className="min-w-0">{renderActiveStep()}</div>

        <div className="min-w-0">
          <ProfilePreviewPane
            activeStep={activeStep}
            identity={identity}
            extractionStage={extractionStage}
            extractionGroups={extractionGroups}
            revealedGroupCount={revealedGroupCount}
          />
        </div>
      </div>
    </div>
  );
}

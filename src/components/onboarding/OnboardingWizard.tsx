import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  MapPin,
  Rocket,
  Settings2,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  type ClaimsImportExtractionDiagnostics,
  extractClaimsImportTextWithMetrics,
  getClaimsImportAcceptValue,
  validateClaimsImportFile,
} from '../../lib/claimsImportPipeline';
import { buildImportDraftFromText, hasUsableImportDraft } from '../../lib/importDraftBuilder';
import { inferProfilePrefillSuggestion } from '../../lib/profileInference';
import { getImportSessionStorageNotice } from '../../lib/importSessionStorage';
import type {
  Claim,
  ImportDraft,
  ImportDraftRole,
  ImportItemStatus,
  ImportSession,
  SegmentationMode,
} from '../../types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'profile' | 'resume' | 'preferences' | 'ready';

const STEPS: { id: Step; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'profile', label: 'Profile' },
  { id: 'resume', label: 'Resume' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'ready', label: 'Ready' },
];

const SEGMENTATION_MODES: { id: SegmentationMode; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'newlines', label: 'Newlines' },
  { id: 'bullets', label: 'List markers' },
  { id: 'headings', label: 'Headings' },
];

function statusLabel(status: ImportItemStatus): string {
  if (status === 'accepted') return 'Accepted';
  if (status === 'needs_attention') return 'Needs attention';
  return 'Rejected';
}

function statusClassName(status: ImportItemStatus): string {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'needs_attention') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

function countDraftItems(draft: ImportDraft): { companies: number; roles: number; highlights: number; outcomes: number } {
  return draft.companies.reduce(
    (acc, company) => {
      acc.companies += 1;
      acc.roles += company.roles.length;
      for (const role of company.roles) {
        acc.highlights += role.highlights.length;
        acc.outcomes += role.outcomes.length;
      }
      return acc;
    },
    { companies: 0, roles: 0, highlights: 0, outcomes: 0 },
  );
}

function toClaimPayload(role: ImportDraftRole, companyName: string): Partial<Claim> | null {
  const acceptedHighlights = role.highlights
    .filter((item) => item.status === 'accepted')
    .map((item) => item.text.trim())
    .filter(Boolean);

  const acceptedOutcomes = role.outcomes
    .filter((item) => item.status === 'accepted')
    .map((item) => ({
      description: item.text.trim(),
      metric: item.metric,
      isNumeric: item.metric ? true : /\d/.test(item.text),
      verified: false,
    }))
    .filter((item) => item.description);

  const acceptedTools = role.tools
    .filter((item) => item.status === 'accepted')
    .map((item) => item.text.trim())
    .filter(Boolean);

  if (acceptedHighlights.length === 0 && acceptedOutcomes.length === 0 && acceptedTools.length === 0) {
    return null;
  }

  return {
    role: role.title,
    company: companyName,
    startDate: role.startDate,
    endDate: role.endDate,
    responsibilities: acceptedHighlights,
    tools: acceptedTools,
    outcomes: acceptedOutcomes,
  };
}

function createParsedSession(
  mode: SegmentationMode,
  draft: ImportDraft,
  diagnostics: ImportSession['diagnostics'],
  profileSuggestion: ImportSession['profileSuggestion'],
): ImportSession {
  return {
    id: crypto.randomUUID(),
    mode,
    draft,
    diagnostics,
    profileSuggestion,
    state: 'parsed',
    updatedAt: new Date().toISOString(),
    storage: 'localStorage',
  };
}

function ChipInput({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addDraft = () => {
    const value = draft.trim();
    if (!value) return;
    if (values.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addDraft();
    }

    if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-neutral-700 mb-1.5 block">{label}</label>
      <div className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 text-xs px-2.5 py-1"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="text-brand-600 hover:text-brand-800"
                aria-label={`Remove ${value}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
          placeholder={placeholder}
          className="w-full border-0 p-0 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const addClaim = useStore((s) => s.addClaim);
  const importSession = useStore((s) => s.importSession);
  const setImportSession = useStore((s) => s.setImportSession);
  const hydrateImportSession = useStore((s) => s.hydrateImportSession);

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(profile?.firstName || profile?.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile?.lastName || profile?.name.split(' ').slice(1).join(' ') || '');
  const [targetRoles, setTargetRoles] = useState(profile?.targetRoles || []);

  const [compFloor, setCompFloor] = useState(profile?.compFloor ? profile.compFloor.toString() : '');
  const [compTarget, setCompTarget] = useState(profile?.compTarget ? profile.compTarget.toString() : '');
  const [locationPref, setLocationPref] = useState(profile?.locationPreference || '');
  const [disqualifiers, setDisqualifiers] = useState(profile?.disqualifiers?.join('\n') || '');

  const [resumeText, setResumeText] = useState('');
  const [extractionDiagnostics, setExtractionDiagnostics] = useState<ClaimsImportExtractionDiagnostics | null>(null);
  const [parseMode, setParseMode] = useState<SegmentationMode>(importSession?.mode || 'default');
  const [importedClaimsCount, setImportedClaimsCount] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  useEffect(() => {
    hydrateImportSession();
  }, [hydrateImportSession]);

  useEffect(() => {
    if (!importSession) {
      setStorageNotice(null);
      return;
    }

    setParseMode(importSession.mode);
    setStorageNotice(getImportSessionStorageNotice(importSession.storage));
  }, [importSession]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const draftCounts = useMemo(
    () => (importSession ? countDraftItems(importSession.draft) : { companies: 0, roles: 0, highlights: 0, outcomes: 0 }),
    [importSession],
  );
  const showImportDebug =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debugImport') === '1';

  const hasUsableDraft = importSession ? hasUsableImportDraft(importSession.draft) : false;
  const draftItemCount = draftCounts.highlights + draftCounts.outcomes;
  const parseLooksCollapsed = importSession
    ? (importSession.diagnostics.mappingStage?.finalItemsCount ?? draftItemCount) < 10
    : false;

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        targetRoles,
      });
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, targetRoles, updateProfile]);

  const handleSavePreferences = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        compFloor: parseInt(compFloor, 10) || 0,
        compTarget: parseInt(compTarget, 10) || 0,
        locationPreference: locationPref.trim(),
        disqualifiers: disqualifiers.split('\n').map((line) => line.trim()).filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }, [compFloor, compTarget, locationPref, disqualifiers, updateProfile]);

  const handleApplySuggestions = useCallback(() => {
    if (!importSession) return;

    const suggestion = importSession.profileSuggestion;
    if (suggestion.firstName) setFirstName((prev) => prev || suggestion.firstName || '');
    if (suggestion.lastName) setLastName((prev) => prev || suggestion.lastName || '');

    if (suggestion.targetRoles.length > 0) {
      const merged = [...new Set([...targetRoles, ...suggestion.targetRoles])];
      setTargetRoles(merged);
    }

    if (suggestion.locationHints.length > 0 && !locationPref.trim()) {
      setLocationPref(suggestion.locationHints[0]);
    }

    if (suggestion.compensation?.floor && !compFloor.trim()) {
      setCompFloor(String(suggestion.compensation.floor));
    }

    if (suggestion.compensation?.target && !compTarget.trim()) {
      setCompTarget(String(suggestion.compensation.target));
    }

    setSuggestionsDismissed(true);
  }, [compFloor, compTarget, importSession, locationPref, targetRoles]);

  const handleParseResume = useCallback(() => {
    if (!resumeText.trim()) {
      setFileImportError('Paste text or upload a file before parsing.');
      return;
    }

    const result = buildImportDraftFromText(resumeText, {
      mode: parseMode,
      extractionDiagnostics: extractionDiagnostics || undefined,
    });
    const suggestion = inferProfilePrefillSuggestion(result.diagnostics, result.draft);
    const session = createParsedSession(parseMode, result.draft, result.diagnostics, suggestion);

    setImportSession(session);
    const persisted = useStore.getState().importSession;
    setStorageNotice(persisted ? getImportSessionStorageNotice(persisted.storage) : null);

    setSuggestionsDismissed(false);
    setImportedClaimsCount(0);
    setFileImportError(null);
  }, [extractionDiagnostics, parseMode, resumeText, setImportSession]);

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateClaimsImportFile(file);
    if (validationError) {
      setFileImportError(validationError);
      setSelectedFileName(null);
      return;
    }

    setReadingFile(true);
    setFileImportError(null);
    setSelectedFileName(file.name);

    try {
      const extraction = await extractClaimsImportTextWithMetrics(file);
      setResumeText(extraction.text);
      setExtractionDiagnostics(extraction.diagnostics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read the selected file.';
      setFileImportError(message);
      setSelectedFileName(null);
      setExtractionDiagnostics(null);
    } finally {
      setReadingFile(false);
    }
  }, []);

  const handleSaveParsedDraft = useCallback(async () => {
    if (!importSession || importSession.state === 'saved') return;

    setSaving(true);

    try {
      let imported = 0;
      for (const company of importSession.draft.companies) {
        for (const role of company.roles) {
          const payload = toClaimPayload(role, company.name);
          if (!payload) continue;
          await addClaim(payload);
          imported += 1;
        }
      }

      const nextSession: ImportSession = {
        ...importSession,
        state: 'saved',
        updatedAt: new Date().toISOString(),
      };
      setImportSession(nextSession);
      setImportedClaimsCount(imported);
    } finally {
      setSaving(false);
    }
  }, [addClaim, importSession, setImportSession]);

  const handleDiscardDraft = useCallback(() => {
    setImportSession(null);
    setImportedClaimsCount(0);
    setSuggestionsDismissed(false);
    setExtractionDiagnostics(null);
  }, [setImportSession]);

  const handleResetImport = useCallback(() => {
    setImportSession(null);
    setResumeText('');
    setParseMode('default');
    setImportedClaimsCount(0);
    setSelectedFileName(null);
    setFileImportError(null);
    setSuggestionsDismissed(false);
    setStorageNotice(null);
    setExtractionDiagnostics(null);
  }, [setImportSession]);

  const markSkipped = useCallback(() => {
    if (!importSession) return;
    setImportSession({
      ...importSession,
      state: 'skipped',
      updatedAt: new Date().toISOString(),
    });
  }, [importSession, setImportSession]);

  const canContinueFromResume = !resumeText.trim()
    ? importSession?.state === 'saved' || importSession?.state === 'skipped'
    : importSession?.state === 'saved' || importSession?.state === 'skipped';

  const handleNext = async () => {
    if (step === 'profile') {
      await handleSaveProfile();
    }

    if (step === 'resume') {
      if (!importSession || importSession.state === 'skipped') {
        if (resumeText.trim()) {
          handleParseResume();
          return;
        }
      }

      if (importSession?.state === 'parsed') {
        await handleSaveParsedDraft();
        return;
      }

      if (!canContinueFromResume) {
        return;
      }
    }

    if (step === 'preferences') {
      await handleSavePreferences();
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex].id);
    }
  };

  const handleSkip = () => {
    if (step === 'resume') {
      if (importSession?.state !== 'saved') {
        markSkipped();
      }
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    } else {
      onComplete();
    }
  };

  const missingRequiredPrefs = !compFloor.trim() || !locationPref.trim();

  const primaryLabel = useMemo(() => {
    if (step === 'ready') return "Let's Go";
    if (step === 'resume') {
      if (importSession?.state === 'parsed') return 'Approve & Save';
      if (!importSession && resumeText.trim()) return 'Parse & Review';
      if (importSession?.state === 'saved' || importSession?.state === 'skipped') return 'Continue';
      return 'Parse & Review';
    }
    return 'Continue';
  }, [importSession, resumeText, step]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < stepIndex
                      ? 'bg-emerald-500 text-white'
                      : i === stepIndex
                        ? 'bg-brand-600 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {i < stepIndex ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-1 ${i < stepIndex ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={`text-[11px] font-medium ${s.id === step ? 'text-brand-600' : 'text-neutral-400'}`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {step === 'welcome' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Rocket size={36} className="text-brand-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-3">Welcome to Job Filter</h1>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-8 leading-relaxed">
                Build your digital resume, prioritize high-fit opportunities, and generate application assets faster.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Briefcase size={18} className="text-emerald-600" />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-600">Company-first Resume</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Sparkles size={18} className="text-brand-600" />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-600">Score + Gaps</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Rocket size={18} className="text-blue-600" />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-600">Assets + Tracking</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">This setup should take about 2 minutes.</p>
            </div>
          )}

          {step === 'profile' && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Your Profile</h2>
                  <p className="text-xs text-neutral-500">Use your preferred name and target roles.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <ChipInput
                label="Target roles"
                values={targetRoles}
                onChange={setTargetRoles}
                placeholder="Add a role and press Enter"
              />
            </div>
          )}

          {step === 'resume' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Import your resume</h2>
                    <p className="text-xs text-neutral-500">Upload PDF, DOCX, TXT, or paste text. All inputs share one parser.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                  <p>Your resume is parsed locally in your browser by default.</p>
                  <p className="mt-1">AI-assisted parsing, if enabled later, requires explicit opt-in.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                    <Upload size={13} />
                    {readingFile ? 'Reading file...' : 'Upload PDF, DOCX, or TXT'}
                    <input
                      type="file"
                      accept={getClaimsImportAcceptValue()}
                      onChange={handleImportFile}
                      className="sr-only"
                    />
                  </label>
                  {selectedFileName && <span className="text-[11px] text-neutral-500 truncate">{selectedFileName}</span>}
                </div>

                {fileImportError && <p className="text-xs text-red-600">{fileImportError}</p>}

                <textarea
                  value={resumeText}
                  onChange={(event) => {
                    setResumeText(event.target.value);
                    setSelectedFileName(null);
                    setExtractionDiagnostics(null);
                  }}
                  placeholder="Paste your resume text if you prefer manual input"
                  rows={10}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-neutral-500 mt-1">Segmentation mode:</span>
                  {SEGMENTATION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setParseMode(mode.id)}
                      className={`px-3 py-1.5 text-xs rounded-full border ${
                        parseMode === mode.id
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleParseResume}
                    disabled={!resumeText.trim() || readingFile}
                    className="px-3 py-1.5 text-xs rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {importSession ? 'Retry parse' : 'Parse now'}
                  </button>
                </div>
              </div>

              {importSession && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">Import draft</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {draftCounts.companies} companies, {draftCounts.roles} roles, {draftCounts.highlights} highlights, {draftCounts.outcomes} outcomes
                      </p>
                      {storageNotice && <p className="text-xs text-amber-700 mt-1">{storageNotice}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50"
                      >
                        Discard draft
                      </button>
                      <button
                        type="button"
                        onClick={handleResetImport}
                        className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50"
                      >
                        Reset import
                      </button>
                    </div>
                  </div>

                  {importSession.profileSuggestion && !suggestionsDismissed && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                      <p className="font-medium">Suggested profile updates from your import</p>
                      <ul className="mt-1 space-y-1 text-blue-700">
                        {importSession.profileSuggestion.firstName || importSession.profileSuggestion.lastName ? (
                          <li>
                            Name: {importSession.profileSuggestion.firstName || '...'} {importSession.profileSuggestion.lastName || '...'}
                          </li>
                        ) : null}
                        {importSession.profileSuggestion.targetRoles.length > 0 ? (
                          <li>Target roles: {importSession.profileSuggestion.targetRoles.slice(0, 3).join(', ')}</li>
                        ) : null}
                        {importSession.profileSuggestion.locationHints.length > 0 ? (
                          <li>Location hints: {importSession.profileSuggestion.locationHints.join(', ')}</li>
                        ) : null}
                      </ul>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplySuggestions}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Apply suggestions
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuggestionsDismissed(true)}
                          className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {hasUsableDraft ? (
                    <div className="space-y-3">
                      {importSession.draft.companies.map((company) => (
                        <div key={company.id} className="rounded-lg border border-neutral-200 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-neutral-900">{company.name}</h4>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusClassName(company.status)}`}>
                              {statusLabel(company.status)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {company.roles.map((role) => (
                              <div key={role.id} className="rounded-md border border-neutral-100 p-2.5 bg-neutral-50">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-neutral-800">{role.title}</p>
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusClassName(role.status)}`}>
                                    {statusLabel(role.status)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  {role.startDate || 'No start date'}
                                  {role.endDate ? ` - ${role.endDate}` : role.startDate ? ' - Present' : ''}
                                </p>
                                {(role.highlights.length > 0 || role.outcomes.length > 0) && (
                                  <ul className="mt-2 text-xs text-neutral-700 space-y-1">
                                    {role.highlights.slice(0, 2).map((item) => (
                                      <li key={item.id}>• {item.text}</li>
                                    ))}
                                    {role.outcomes.slice(0, 2).map((item) => (
                                      <li key={item.id}>• {item.text}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">No structured draft yet</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Try another segmentation mode, upload a different format, or skip and continue manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parseLooksCollapsed && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      We imported {draftCounts.companies} companies, {draftCounts.roles} roles, and {draftItemCount} highlights/outcomes.
                      If this looks incomplete, retry parsing with another segmentation mode, or create from scratch and continue.
                    </div>
                  )}

                  {showImportDebug && (
                    <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-700 space-y-2">
                      <p className="font-semibold text-neutral-800">Import Debug (dev-only)</p>
                      <p>
                        Extraction: pages={importSession.diagnostics.extractionStage?.pageCount ?? 'n/a'}, chars={importSession.diagnostics.extractionStage?.extractedChars ?? 'n/a'}, lines={importSession.diagnostics.extractionStage?.detectedLinesCount ?? 'n/a'}, list-candidates={importSession.diagnostics.extractionStage?.bulletCandidatesCount ?? 'n/a'}
                      </p>
                      <p>
                        Segmentation: mode={importSession.diagnostics.mode ?? parseMode}, lines={importSession.diagnostics.segmentationStage?.detectedLinesCount ?? importSession.diagnostics.detectedLinesCount}, list-candidates={importSession.diagnostics.segmentationStage?.bulletCandidatesCount ?? importSession.diagnostics.bulletCandidatesCount}
                      </p>
                      <p>
                        Mapping: company-candidates={importSession.diagnostics.mappingStage?.companyCandidatesCount ?? importSession.diagnostics.companyCandidatesDetected}, role-candidates={importSession.diagnostics.mappingStage?.roleCandidatesCount ?? importSession.diagnostics.roleCandidatesDetected}, timeframe-candidates={importSession.diagnostics.mappingStage?.timeframeCandidatesCount ?? importSession.diagnostics.timeframeCandidatesCount ?? 0}, final={importSession.diagnostics.finalCompaniesCount} companies / {importSession.diagnostics.rolesCount} roles / {importSession.diagnostics.mappingStage?.finalItemsCount ?? importSession.diagnostics.bulletsCount} items
                      </p>
                      <p>
                        Top bullet glyphs: {(importSession.diagnostics.topBulletGlyphs ?? importSession.diagnostics.segmentationStage?.topBulletGlyphs ?? [])
                          .map((entry) => `${entry.glyph}:${entry.count}`)
                          .join(', ') || 'none'}
                      </p>
                      <p>Reason codes: {importSession.diagnostics.reasonCodes.join(', ') || 'none'}</p>
                      <div className="max-h-56 overflow-y-auto rounded border border-neutral-200 bg-white p-2 font-mono text-[11px] text-neutral-700">
                        {(importSession.diagnostics.previewLinesWithNumbers ?? []).map((line) => (
                          <div key={line.line}>{line.line}. {line.text}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importedClaimsCount > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                      Saved {importedClaimsCount} role record{importedClaimsCount !== 1 ? 's' : ''} to your evidence ledger.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'preferences' && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Settings2 size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Scoring preferences</h2>
                  <p className="text-xs text-neutral-500">Add constraints so scoring prioritizes the right opportunities.</p>
                </div>
              </div>

              {missingRequiredPrefs && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">Set compensation floor and location preference for better scoring quality.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                    <DollarSign size={14} className="text-neutral-400" /> Compensation floor
                  </label>
                  <input
                    type="number"
                    value={compFloor}
                    onChange={(event) => setCompFloor(event.target.value)}
                    placeholder="150000"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                    <DollarSign size={14} className="text-neutral-400" /> Compensation target
                  </label>
                  <input
                    type="number"
                    value={compTarget}
                    onChange={(event) => setCompTarget(event.target.value)}
                    placeholder="180000"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                  <MapPin size={14} className="text-neutral-400" /> Location preference
                </label>
                <input
                  type="text"
                  value={locationPref}
                  onChange={(event) => setLocationPref(event.target.value)}
                  placeholder="Remote preferred, hybrid in Nashville"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Disqualifiers (one per line)</label>
                <textarea
                  value={disqualifiers}
                  onChange={(event) => setDisqualifiers(event.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check size={36} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-3">You’re all set</h1>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-8 leading-relaxed">
                Your profile and digital resume are ready. Capture a job and start scoring immediately.
              </p>
              <div className="bg-white rounded-lg border border-neutral-200 p-4 text-left max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">Quick start</h4>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                    Click <span className="font-medium text-neutral-800">+ Add Job</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                    Paste the job description for scoring and gap analysis
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                    Generate assets using verified evidence
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step !== 'welcome' && step !== 'ready' && (
              <button onClick={handleSkip} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700">
                Skip
              </button>
            )}
            <button
              onClick={step === 'ready' ? onComplete : handleNext}
              disabled={saving || readingFile}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {primaryLabel}
                  {step === 'ready' ? <Rocket size={14} /> : <ChevronRight size={14} />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

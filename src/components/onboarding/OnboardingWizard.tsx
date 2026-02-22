import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
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
import { DigitalResumeBuilder } from '../resume/DigitalResumeBuilder';
import {
  type ClaimsImportExtractionDiagnostics,
  extractClaimsImportTextWithMetrics,
  getClaimsImportAcceptValue,
  validateClaimsImportFile,
} from '../../lib/claimsImportPipeline';
import { buildBestImportDraftFromText, buildImportDraftFromText, hasUsableImportDraft } from '../../lib/importDraftBuilder';
import { inferProfilePrefillSuggestion } from '../../lib/profileInference';
import {
  applyGlobalRelocationPreference,
  createLocationPreference,
  DEFAULT_HARD_FILTERS,
  EMPLOYMENT_TYPE_OPTIONS,
  locationPreferenceFromHint,
  sanitizeHardFilters,
  sanitizeLocationPreferences,
  summarizeLocationPreferences,
  STANDARD_RADIUS_MILES,
} from '../../lib/profilePreferences';
import { getImportSessionStorageNotice } from '../../lib/importSessionStorage';
import { BUILD_INFO } from '../../lib/buildInfo';
import {
  BENEFITS_CATALOG,
  benefitIdsToLabels,
  legacyBenefitsToIds,
  sanitizeBenefitIds,
  searchBenefitCatalog,
} from '../../lib/benefitsCatalog';
import type {
  Claim,
  HardFilters,
  ImportDraft,
  ImportDraftRole,
  ImportSession,
  LocationPreference,
  ParseReasonCode,
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

const SEGMENTATION_MODE_ORDER: SegmentationMode[] = ['default', 'newlines', 'bullets', 'headings'];
const LOW_QUALITY_REASON_CODES = new Set<ParseReasonCode>([
  'FILTERED_ALL',
  'LAYOUT_COLLAPSE',
  'ROLE_DETECT_FAIL',
  'COMPANY_DETECT_FAIL',
]);

interface SuggestionSelectionState {
  firstName: boolean;
  lastName: boolean;
  targetRoles: boolean;
  locationHints: boolean;
  compensationFloor: boolean;
  compensationTarget: boolean;
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

function hasProfileSuggestions(session: ImportSession | null): boolean {
  if (!session) return false;
  const suggestion = session.profileSuggestion;
  return Boolean(
    suggestion.firstName
    || suggestion.lastName
    || suggestion.targetRoles.length > 0
    || suggestion.locationHints.length > 0
    || suggestion.compensation?.floor
    || suggestion.compensation?.target,
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
  draft: ImportDraft,
  diagnostics: ImportSession['diagnostics'],
  profileSuggestion: ImportSession['profileSuggestion'],
  sourceMeta?: ImportSession['sourceMeta'],
): ImportSession {
  const selectedMode = diagnostics.selectedMode ?? diagnostics.mode ?? 'default';
  const itemsCount = diagnostics.mappingStage?.finalItemsCount ?? diagnostics.bulletsCount;
  const hasCollapseCode = diagnostics.reasonCodes.some((code) => LOW_QUALITY_REASON_CODES.has(code));

  return {
    id: crypto.randomUUID(),
    mode: selectedMode,
    selectedMode,
    lowQuality: itemsCount < 20 || hasCollapseCode,
    troubleshootAvailableModes: SEGMENTATION_MODE_ORDER,
    sourceMeta,
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

function BenefitCatalogPicker({
  label,
  selectedIds,
  onChange,
}: {
  label: string;
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const suggestions = useMemo(() => searchBenefitCatalog(query, selectedIds, 10), [query, selectedIds]);

  const selectedItems = selectedIds
    .map((id) => BENEFITS_CATALOG.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 mb-1 block">{label}</label>
      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5">
              {item.label}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((id) => id !== item.id))}
                className="text-neutral-500 hover:text-neutral-800"
                aria-label={`Remove ${item.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search benefits..."
          className="w-full border-0 p-0 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
        />
        {suggestions.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-md border border-neutral-100 bg-neutral-50 p-1">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange([...selectedIds, item.id]);
                  setQuery('');
                }}
                className="w-full rounded px-2 py-1 text-left text-xs text-neutral-700 hover:bg-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
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

  const [compTarget, setCompTarget] = useState(profile?.compTarget ? profile.compTarget.toString() : '');
  const [requiredBenefitIds, setRequiredBenefitIds] = useState<string[]>(
    sanitizeBenefitIds(profile?.requiredBenefitIds?.length ? profile.requiredBenefitIds : legacyBenefitsToIds(profile?.requiredBenefits)),
  );
  const [preferredBenefitIds, setPreferredBenefitIds] = useState<string[]>(
    sanitizeBenefitIds(profile?.preferredBenefitIds?.length ? profile.preferredBenefitIds : legacyBenefitsToIds(profile?.preferredBenefits)),
  );
  const [locationPreferences, setLocationPreferences] = useState<LocationPreference[]>(
    profile?.locationPreferences?.length ? profile.locationPreferences : [],
  );
  const [willingToRelocate, setWillingToRelocate] = useState(
    Boolean(profile?.willingToRelocate || profile?.locationPreferences?.some((entry) => entry.willingToRelocate)),
  );
  const [hardFilters, setHardFilters] = useState<HardFilters>(
    sanitizeHardFilters({
      ...DEFAULT_HARD_FILTERS,
      ...(profile?.hardFilters ?? {}),
      minBaseSalary: profile?.hardFilters?.minBaseSalary ?? profile?.compFloor ?? 0,
    }),
  );
  const [preferenceErrors, setPreferenceErrors] = useState<string[]>([]);

  const [resumeText, setResumeText] = useState('');
  const [extractionDiagnostics, setExtractionDiagnostics] = useState<ClaimsImportExtractionDiagnostics | null>(null);
  const [importedClaimsCount, setImportedClaimsCount] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [suggestionSelections, setSuggestionSelections] = useState<SuggestionSelectionState>({
    firstName: true,
    lastName: true,
    targetRoles: true,
    locationHints: true,
    compensationFloor: true,
    compensationTarget: true,
  });
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [debugReportNotice, setDebugReportNotice] = useState<string | null>(null);

  useEffect(() => {
    hydrateImportSession();
  }, [hydrateImportSession]);

  useEffect(() => {
    if (!importSession) {
      setStorageNotice(null);
      return;
    }

    setStorageNotice(getImportSessionStorageNotice(importSession.storage));
  }, [importSession]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const fullDraftCounts = useMemo(
    () => (importSession ? countDraftItems(importSession.draft) : { companies: 0, roles: 0, highlights: 0, outcomes: 0 }),
    [importSession],
  );
  const hasVisibleDraft = importSession ? hasUsableImportDraft(importSession.draft) : false;
  const hasCollapseCode = importSession
    ? importSession.diagnostics.reasonCodes.some((code) => LOW_QUALITY_REASON_CODES.has(code))
    : false;
  const parseLooksLowQuality = importSession
    ? (importSession.diagnostics.mappingStage?.finalItemsCount ?? fullDraftCounts.highlights + fullDraftCounts.outcomes) < 20 || hasCollapseCode
    : false;
  const bulletDotCount = importSession
    ? (importSession.diagnostics.topBulletGlyphs ?? []).find((entry) => entry.glyph === '•')?.count ?? 0
    : 0;
  const bulletCircleCount = importSession
    ? (importSession.diagnostics.topBulletGlyphs ?? []).find((entry) => entry.glyph === '●')?.count ?? 0
    : 0;
  const showSuggestionCard = !suggestionsDismissed && hasProfileSuggestions(importSession);

  useEffect(() => {
    if (!importSession) return;
    setSuggestionSelections({
      firstName: Boolean(importSession.profileSuggestion.firstName),
      lastName: Boolean(importSession.profileSuggestion.lastName),
      targetRoles: importSession.profileSuggestion.targetRoles.length > 0,
      locationHints: importSession.profileSuggestion.locationHints.length > 0,
      compensationFloor: Boolean(importSession.profileSuggestion.compensation?.floor),
      compensationTarget: Boolean(importSession.profileSuggestion.compensation?.target),
    });
  }, [importSession?.id]);

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

  const handleSavePreferences = useCallback(async (): Promise<boolean> => {
    const errors: string[] = [];
    if (hardFilters.minBaseSalary < 0) errors.push('Minimum base salary must be 0 or higher.');
    if (hardFilters.maxOnsiteDaysPerWeek < 0 || hardFilters.maxOnsiteDaysPerWeek > 5) {
      errors.push('Max onsite days per week must be between 0 and 5.');
    }
    if (hardFilters.maxTravelPercent < 0 || hardFilters.maxTravelPercent > 100) {
      errors.push('Max travel percent must be between 0 and 100.');
    }
    if (hardFilters.employmentTypes.length === 0) {
      errors.push('Select at least one employment type.');
    }

    if (locationPreferences.length === 0) {
      errors.push('Add at least one location preference.');
    }

    locationPreferences.forEach((preference, index) => {
      if (preference.type === 'Remote') {
        return;
      }

      if (!preference.city?.trim()) {
        errors.push(`Location preference ${index + 1}: city is required for ${preference.type.toLowerCase()} roles.`);
      }

      if (preference.radiusMiles === undefined || Number.isNaN(preference.radiusMiles)) {
        errors.push(`Location preference ${index + 1}: radius is required for ${preference.type.toLowerCase()} roles.`);
      } else if (preference.radiusMiles < 1 || preference.radiusMiles > 500) {
        errors.push(`Location preference ${index + 1}: radius must be between 1 and 500 miles.`);
      }
    });

    if (errors.length > 0) {
      setPreferenceErrors(errors);
      return false;
    }

    const normalizedHardFilters = sanitizeHardFilters(hardFilters);
    const normalizedLocations = applyGlobalRelocationPreference(
      sanitizeLocationPreferences(locationPreferences),
      willingToRelocate,
    );
    const normalizedRequiredBenefits = sanitizeBenefitIds(requiredBenefitIds);
    const normalizedPreferredBenefits = sanitizeBenefitIds(preferredBenefitIds);

    setSaving(true);
    try {
      await updateProfile({
        compFloor: normalizedHardFilters.minBaseSalary,
        compTarget: parseInt(compTarget, 10) || 0,
        locationPreference: summarizeLocationPreferences(normalizedLocations),
        disqualifiers: [],
        locationPreferences: normalizedLocations,
        willingToRelocate,
        hardFilters: normalizedHardFilters,
        requiredBenefitIds: normalizedRequiredBenefits,
        preferredBenefitIds: normalizedPreferredBenefits,
        requiredBenefits: benefitIdsToLabels(normalizedRequiredBenefits),
        preferredBenefits: benefitIdsToLabels(normalizedPreferredBenefits),
      });
      setPreferenceErrors([]);
      return true;
    } finally {
      setSaving(false);
    }
  }, [
    compTarget,
    hardFilters,
    locationPreferences,
    preferredBenefitIds,
    requiredBenefitIds,
    updateProfile,
    willingToRelocate,
  ]);

  const handleApplySuggestions = useCallback(() => {
    if (!importSession) return;

    const suggestion = importSession.profileSuggestion;
    if (suggestionSelections.firstName && suggestion.firstName) {
      setFirstName((prev) => prev || suggestion.firstName || '');
    }
    if (suggestionSelections.lastName && suggestion.lastName) {
      setLastName((prev) => prev || suggestion.lastName || '');
    }

    if (suggestionSelections.targetRoles && suggestion.targetRoles.length > 0) {
      const merged = [...new Set([...targetRoles, ...suggestion.targetRoles])];
      setTargetRoles(merged);
    }

    if (suggestionSelections.locationHints && suggestion.locationHints.length > 0 && locationPreferences.length === 0) {
      setLocationPreferences([locationPreferenceFromHint(suggestion.locationHints[0])]);
    }

    if (suggestionSelections.compensationFloor && suggestion.compensation?.floor && hardFilters.minBaseSalary <= 0) {
      setHardFilters((prev) => ({ ...prev, minBaseSalary: suggestion.compensation?.floor ?? prev.minBaseSalary }));
    }

    if (suggestionSelections.compensationTarget && suggestion.compensation?.target && !compTarget.trim()) {
      setCompTarget(String(suggestion.compensation.target));
    }

    setSuggestionsDismissed(true);
  }, [
    compTarget,
    hardFilters.minBaseSalary,
    importSession,
    locationPreferences.length,
    suggestionSelections.compensationFloor,
    suggestionSelections.compensationTarget,
    suggestionSelections.firstName,
    suggestionSelections.lastName,
    suggestionSelections.locationHints,
    suggestionSelections.targetRoles,
    targetRoles,
  ]);

  const addLocationPreference = useCallback((type: LocationPreference['type']) => {
    setLocationPreferences((prev) => [...prev, createLocationPreference(type)]);
  }, []);

  const updateLocationPreference = useCallback((id: string, updates: Partial<LocationPreference>) => {
    setLocationPreferences((prev) => prev.map((preference) => (
      preference.id === id
        ? {
            ...preference,
            ...updates,
            city: (updates.type ?? preference.type) === 'Remote' ? '' : (updates.city ?? preference.city),
            radiusMiles: (updates.type ?? preference.type) === 'Remote'
              ? undefined
              : (updates.radiusMiles ?? preference.radiusMiles),
          }
        : preference
    )));
  }, []);

  const removeLocationPreference = useCallback((id: string) => {
    setLocationPreferences((prev) => prev.filter((preference) => preference.id !== id));
  }, []);

  const handleParseResume = useCallback((forcedMode?: SegmentationMode) => {
    if (!resumeText.trim()) {
      setFileImportError('Paste text or upload a file before parsing.');
      return;
    }

    const result = forcedMode
      ? buildImportDraftFromText(resumeText, {
          mode: forcedMode,
          extractionDiagnostics: extractionDiagnostics || undefined,
        })
      : buildBestImportDraftFromText(resumeText, {
          extractionDiagnostics: extractionDiagnostics || undefined,
        });
    const suggestion = inferProfilePrefillSuggestion(result.diagnostics, result.draft);
    const sourceMeta = selectedFileMeta
      ? {
          inputKind: 'upload' as const,
          fileName: selectedFileMeta.name,
          fileSizeBytes: selectedFileMeta.size,
          mimeType: selectedFileMeta.type || undefined,
        }
      : {
          inputKind: 'paste' as const,
          fileSizeBytes: new Blob([resumeText]).size,
        };
    const session = createParsedSession(result.draft, result.diagnostics, suggestion, sourceMeta);

    setImportSession(session);
    const persisted = useStore.getState().importSession;
    setStorageNotice(persisted ? getImportSessionStorageNotice(persisted.storage) : null);

    setSuggestionsDismissed(false);
    setShowAllStatuses(false);
    setImportedClaimsCount(0);
    setDebugReportNotice(null);
    setFileImportError(null);
    setTroubleshootOpen(false);
  }, [extractionDiagnostics, resumeText, selectedFileMeta, setImportSession]);

  const handleTryAnotherMethod = useCallback(() => {
    if (!importSession || !resumeText.trim()) return;

    const currentMode = importSession.selectedMode ?? importSession.mode ?? 'default';
    const candidateModes = (importSession.diagnostics.candidateModes ?? [])
      .map((candidate) => candidate.mode)
      .filter((mode, index, list) => list.indexOf(mode) === index);
    const modeOrder = [...candidateModes, ...SEGMENTATION_MODE_ORDER];
    const nextMode = modeOrder.find((mode) => mode !== currentMode);

    if (!nextMode) return;
    handleParseResume(nextMode);
  }, [handleParseResume, importSession, resumeText]);

  const handleCopyDebugReport = useCallback(async () => {
    if (!importSession) return;

    const report = {
      build: {
        sha: BUILD_INFO.buildSha,
        env: BUILD_INFO.appEnv,
        schemaVersion: BUILD_INFO.schemaVersion,
      },
      source: {
        inputKind: importSession.sourceMeta?.inputKind ?? (selectedFileMeta ? 'upload' : 'paste'),
        fileName: importSession.sourceMeta?.fileName ?? selectedFileMeta?.name ?? '(pasted text)',
        fileSizeBytes: importSession.sourceMeta?.fileSizeBytes ?? selectedFileMeta?.size ?? new Blob([resumeText]).size,
      },
      parseSummary: {
        pageCount: importSession.diagnostics.pageCount ?? null,
        extractedChars: importSession.diagnostics.extractedTextLength,
        detectedLinesCount: importSession.diagnostics.detectedLinesCount,
        bulletCandidatesCount: importSession.diagnostics.bulletCandidatesCount,
        bulletOnlyLineCount: importSession.diagnostics.bulletOnlyLineCount,
        bulletGlyphCounts: {
          '•': bulletDotCount,
          '●': bulletCircleCount,
        },
        selectedMode: importSession.selectedMode ?? importSession.mode,
        candidateScores: (importSession.diagnostics.candidateModes ?? []).map((candidate) => ({
          mode: candidate.mode,
          score: Number(candidate.score.toFixed(2)),
          counts: candidate.counts,
          reasonCodes: candidate.reasonCodes,
        })),
        reasonCodes: importSession.diagnostics.reasonCodes,
      },
      counts: {
        total: fullDraftCounts,
      },
      generatedAt: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setDebugReportNotice('Debug report copied');
      window.setTimeout(() => setDebugReportNotice(null), 2500);
    } catch {
      setDebugReportNotice('Copy failed');
      window.setTimeout(() => setDebugReportNotice(null), 2500);
    }
  }, [
    bulletCircleCount,
    bulletDotCount,
    fullDraftCounts,
    importSession,
    resumeText,
    selectedFileMeta,
  ]);

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateClaimsImportFile(file);
    if (validationError) {
      setFileImportError(validationError);
      setSelectedFileName(null);
      setSelectedFileMeta(null);
      return;
    }

    setImportSession(null);
    setReadingFile(true);
    setFileImportError(null);
    setSelectedFileName(file.name);
    setSelectedFileMeta({ name: file.name, size: file.size, type: file.type });
    setImportedClaimsCount(0);
    setSuggestionsDismissed(false);
    setTroubleshootOpen(false);
    setShowAllStatuses(false);
    setDebugReportNotice(null);

    try {
      const extraction = await extractClaimsImportTextWithMetrics(file);
      setResumeText(extraction.text);
      setExtractionDiagnostics(extraction.diagnostics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read the selected file.';
      setFileImportError(message);
      setSelectedFileName(null);
      setSelectedFileMeta(null);
      setExtractionDiagnostics(null);
    } finally {
      setReadingFile(false);
    }
  }, [setImportSession]);

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
      await updateProfile({
        digitalResume: importSession.draft,
      });
      setImportedClaimsCount(imported);
    } finally {
      setSaving(false);
    }
  }, [addClaim, importSession, setImportSession, updateProfile]);

  const handleDiscardDraft = useCallback(() => {
    setImportSession(null);
    setResumeText('');
    setImportedClaimsCount(0);
    setSelectedFileName(null);
    setSelectedFileMeta(null);
    setFileImportError(null);
    setSuggestionsDismissed(false);
    setStorageNotice(null);
    setExtractionDiagnostics(null);
    setTroubleshootOpen(false);
    setShowAllStatuses(false);
    setDebugReportNotice(null);
  }, [setImportSession]);

  const handleResetImport = useCallback(() => {
    setImportSession(null);
    setResumeText('');
    setImportedClaimsCount(0);
    setSelectedFileName(null);
    setSelectedFileMeta(null);
    setReadingFile(false);
    setFileImportError(null);
    setSuggestionsDismissed(false);
    setStorageNotice(null);
    setExtractionDiagnostics(null);
    setTroubleshootOpen(false);
    setShowAllStatuses(false);
    setDebugReportNotice(null);
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
        const nextIndex = stepIndex + 1;
        if (nextIndex < STEPS.length) {
          setStep(STEPS[nextIndex].id);
        } else {
          onComplete();
        }
        return;
      }

      if (!canContinueFromResume) {
        return;
      }
    }

    if (step === 'preferences') {
      const saved = await handleSavePreferences();
      if (!saved) return;
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
    if (step !== 'resume') return;

    if (importSession?.state !== 'saved') {
      markSkipped();
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    } else {
      onComplete();
    }
  };

  const hasInvalidRequiredLocation = locationPreferences.some((preference) => (
    preference.type !== 'Remote' && (!preference.city?.trim() || !preference.radiusMiles)
  ));
  const missingRequiredPrefs = (
    hardFilters.minBaseSalary <= 0
    || hardFilters.employmentTypes.length === 0
    || locationPreferences.length === 0
    || hasInvalidRequiredLocation
  );

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
                    <p className="text-xs text-neutral-500">Upload PDF, DOCX, TXT, or paste text, then continue to review and edit.</p>
                  </div>
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
                    setImportSession(null);
                    setResumeText(event.target.value);
                    setSelectedFileName(null);
                    setSelectedFileMeta(null);
                    setExtractionDiagnostics(null);
                    setImportedClaimsCount(0);
                    setSuggestionsDismissed(false);
                    setTroubleshootOpen(false);
                    setShowAllStatuses(false);
                    setDebugReportNotice(null);
                  }}
                  placeholder="Paste your resume text if you prefer manual input"
                  rows={10}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <p className="text-[11px] text-neutral-500">
                  Parsed locally in your browser. AI parsing requires explicit opt-in.
                </p>
              </div>

              {importSession && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">Import draft</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {fullDraftCounts.companies} companies, {fullDraftCounts.roles} roles, {fullDraftCounts.highlights} highlights, {fullDraftCounts.outcomes} outcomes
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
                        Reset import session
                      </button>
                    </div>
                  </div>

                  {showSuggestionCard && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                      <p className="font-medium">Suggested (review): profile updates from your import</p>
                      <p className="mt-1 text-blue-700">Choose which fields to apply. Existing values are preserved unless empty.</p>
                      <div className="mt-2 space-y-1.5 text-blue-700">
                        {(importSession.profileSuggestion.firstName || importSession.profileSuggestion.lastName) && (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={suggestionSelections.firstName || suggestionSelections.lastName}
                              onChange={(event) => setSuggestionSelections((prev) => ({
                                ...prev,
                                firstName: event.target.checked,
                                lastName: event.target.checked,
                              }))}
                            />
                            Set first and last name to {importSession.profileSuggestion.firstName || '...'} {importSession.profileSuggestion.lastName || '...'}
                          </label>
                        )}
                        {importSession.profileSuggestion.targetRoles.length > 0 && (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={suggestionSelections.targetRoles}
                              onChange={(event) => setSuggestionSelections((prev) => ({ ...prev, targetRoles: event.target.checked }))}
                            />
                            Add target roles: {importSession.profileSuggestion.targetRoles.slice(0, 3).join(', ')}
                          </label>
                        )}
                        {importSession.profileSuggestion.locationHints.length > 0 && (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={suggestionSelections.locationHints}
                              onChange={(event) => setSuggestionSelections((prev) => ({ ...prev, locationHints: event.target.checked }))}
                            />
                            Add location hint: {importSession.profileSuggestion.locationHints.join(', ')}
                          </label>
                        )}
                        {(importSession.profileSuggestion.compensation?.floor || importSession.profileSuggestion.compensation?.target) && (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={suggestionSelections.compensationFloor || suggestionSelections.compensationTarget}
                              onChange={(event) => setSuggestionSelections((prev) => ({
                                ...prev,
                                compensationFloor: event.target.checked,
                                compensationTarget: event.target.checked,
                              }))}
                            />
                            Suggest compensation
                            {importSession.profileSuggestion.compensation?.floor ? ` floor ${importSession.profileSuggestion.compensation.floor}` : ''}
                            {importSession.profileSuggestion.compensation?.target ? ` target ${importSession.profileSuggestion.compensation.target}` : ''}
                          </label>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplySuggestions}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Apply selected
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

                  {hasVisibleDraft ? (
                    <DigitalResumeBuilder
                      draft={importSession.draft}
                      showAllStatuses={showAllStatuses}
                      onShowAllStatusesChange={setShowAllStatuses}
                      onDraftChange={(nextDraft) => {
                        setImportedClaimsCount(0);
                        setImportSession({
                          ...importSession,
                          draft: nextDraft,
                          updatedAt: new Date().toISOString(),
                        });
                      }}
                    />
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">No structured draft yet</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Open Troubleshoot to try another method, upload a different format, or skip and continue manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parseLooksLowQuality && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      We imported {fullDraftCounts.companies} companies, {fullDraftCounts.roles} roles, and {fullDraftCounts.highlights + fullDraftCounts.outcomes} highlights/outcomes.
                      If this looks incomplete, open Troubleshoot, try another method, or continue manually.
                    </div>
                  )}

                  <div className="rounded-lg border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setTroubleshootOpen((open) => !open)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Troubleshoot
                      {troubleshootOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {troubleshootOpen && (
                      <div className="border-t border-neutral-200 p-3 space-y-3 text-xs text-neutral-700">
                        <p className="font-semibold text-neutral-800">Parse Summary</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>pageCount: {importSession.diagnostics.pageCount ?? 'n/a'}</div>
                          <div>extractedChars: {importSession.diagnostics.extractedTextLength}</div>
                          <div>detectedLinesCount: {importSession.diagnostics.detectedLinesCount}</div>
                          <div>bulletCandidatesCount: {importSession.diagnostics.bulletCandidatesCount}</div>
                          <div>glyph(•): {bulletDotCount}</div>
                          <div>glyph(●): {bulletCircleCount}</div>
                          <div>bulletOnlyLineCount: {importSession.diagnostics.bulletOnlyLineCount}</div>
                          <div>mode: {importSession.selectedMode ?? importSession.mode}</div>
                          <div>companies: {fullDraftCounts.companies}</div>
                          <div>roles: {fullDraftCounts.roles}</div>
                          <div>highlights: {fullDraftCounts.highlights}</div>
                          <div>outcomes: {fullDraftCounts.outcomes}</div>
                        </div>
                        <div>
                          reasonCodes: {importSession.diagnostics.reasonCodes.length > 0 ? importSession.diagnostics.reasonCodes.join(', ') : 'none'}
                        </div>
                        {importSession.diagnostics.candidateModes && importSession.diagnostics.candidateModes.length > 0 && (
                          <div>
                            <p className="font-medium text-neutral-800 mb-1">Candidate methods</p>
                            <ul className="space-y-1">
                              {importSession.diagnostics.candidateModes.map((candidate) => (
                                <li key={candidate.mode} className="text-neutral-600">
                                  {candidate.mode}: score {candidate.score.toFixed(1)}, {candidate.counts.companies} companies, {candidate.counts.roles} roles, {candidate.counts.items} items
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {parseLooksLowQuality && (
                          <button
                            type="button"
                            onClick={handleTryAnotherMethod}
                            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          >
                            Try another method
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyDebugReport}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          >
                            <Copy size={13} />
                            Copy debug report
                          </button>
                          {debugReportNotice && <span className="text-[11px] text-neutral-500">{debugReportNotice}</span>}
                        </div>
                        <div className="rounded border border-neutral-200 bg-white p-2 font-mono text-[11px] text-neutral-700 max-h-56 overflow-y-auto">
                          {(importSession.diagnostics.previewLinesWithNumbers ?? []).map((line) => (
                            <div key={line.line}>
                              {line.line}. {line.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Add minimum settings before continuing: base salary, at least one location preference, and at least one employment type.
                  </p>
                </div>
              )}

              {preferenceErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs font-semibold text-red-700">Please fix the following:</p>
                  <ul className="mt-1 space-y-1 text-xs text-red-700 list-disc pl-4">
                    {preferenceErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-neutral-400" /> Location preferences
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={willingToRelocate}
                    onChange={(event) => setWillingToRelocate(event.target.checked)}
                  />
                  Willing to relocate
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addLocationPreference('Remote')}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                  >
                    + Remote
                  </button>
                  <button
                    type="button"
                    onClick={() => addLocationPreference('Hybrid')}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                  >
                    + Hybrid
                  </button>
                  <button
                    type="button"
                    onClick={() => addLocationPreference('Onsite')}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                  >
                    + Onsite
                  </button>
                </div>

                <div className="space-y-2">
                  {locationPreferences.length === 0 && (
                    <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                      No locations added yet. Add at least one preference.
                    </p>
                  )}
                  {locationPreferences.map((preference) => (
                    <div key={preference.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2">
                        <select
                          value={preference.type}
                          onChange={(event) => updateLocationPreference(preference.id, {
                            type: event.target.value as LocationPreference['type'],
                            radiusMiles: event.target.value === 'Remote' ? undefined : (preference.radiusMiles ?? 25),
                          })}
                          className="px-3 py-2 pr-10 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </select>
                        {preference.type === 'Remote' ? (
                          <div className="rounded-lg border border-dashed border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
                            Remote roles do not require city or radius.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
                            <input
                              type="text"
                              value={preference.city ?? ''}
                              onChange={(event) => updateLocationPreference(preference.id, { city: event.target.value })}
                              placeholder="City (required)"
                              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                            />
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-600">Radius (miles)</label>
                              <select
                                value={
                                  preference.radiusMiles && STANDARD_RADIUS_MILES.includes(preference.radiusMiles as (typeof STANDARD_RADIUS_MILES)[number])
                                    ? String(preference.radiusMiles)
                                    : (preference.radiusMiles ? 'custom' : '')
                                }
                                onChange={(event) => {
                                  const value = event.target.value;
                                  if (!value) {
                                    updateLocationPreference(preference.id, { radiusMiles: undefined });
                                    return;
                                  }
                                  if (value === 'custom') {
                                    updateLocationPreference(preference.id, { radiusMiles: preference.radiusMiles ?? 25 });
                                    return;
                                  }
                                  updateLocationPreference(preference.id, { radiusMiles: Number(value) });
                                }}
                                className="w-full px-3 py-2 pr-10 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                              >
                                <option value="">Select radius</option>
                                {STANDARD_RADIUS_MILES.map((miles) => (
                                  <option key={miles} value={miles}>{miles} miles</option>
                                ))}
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeLocationPreference(preference.id)}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100"
                        >
                          Remove
                        </button>
                      </div>

                      {preference.type !== 'Remote'
                        && preference.radiusMiles !== undefined
                        && !STANDARD_RADIUS_MILES.includes(preference.radiusMiles as (typeof STANDARD_RADIUS_MILES)[number]) && (
                        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 items-center">
                          <label className="text-[11px] font-medium text-neutral-600">Custom radius (miles)</label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={preference.radiusMiles ?? ''}
                            onChange={(event) => updateLocationPreference(preference.id, {
                              radiusMiles: event.target.value ? Number(event.target.value) : undefined,
                            })}
                            placeholder="Enter miles"
                            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-3">
                <div className="text-sm font-medium text-neutral-800">Hard filters</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block flex items-center gap-1.5">
                      <DollarSign size={12} className="text-neutral-400" /> Minimum base salary
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hardFilters.minBaseSalary}
                      onChange={(event) => setHardFilters((prev) => ({ ...prev, minBaseSalary: Number(event.target.value) || 0 }))}
                      placeholder="150000"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block flex items-center gap-1.5">
                      <DollarSign size={12} className="text-neutral-400" /> Compensation target
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={compTarget}
                      onChange={(event) => setCompTarget(event.target.value)}
                      placeholder="180000"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Employment types</label>
                    <div className="rounded-lg border border-neutral-200 bg-white p-2 flex flex-wrap gap-1.5">
                      {EMPLOYMENT_TYPE_OPTIONS.map((option) => {
                        const selected = hardFilters.employmentTypes.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setHardFilters((prev) => ({
                              ...prev,
                              employmentTypes: selected
                                ? prev.employmentTypes.filter((id) => id !== option.id)
                                : [...prev.employmentTypes, option.id],
                            }))}
                            className={`rounded-full px-2.5 py-1 text-[11px] border ${
                              selected
                                ? 'border-brand-300 bg-brand-50 text-brand-700'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Max onsite days per week</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={hardFilters.maxOnsiteDaysPerWeek}
                      onChange={(event) => setHardFilters((prev) => ({ ...prev, maxOnsiteDaysPerWeek: Number(event.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Max travel percent</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hardFilters.maxTravelPercent}
                      onChange={(event) => setHardFilters((prev) => ({ ...prev, maxTravelPercent: Number(event.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-neutral-500">
                  <input
                    type="checkbox"
                    checked={hardFilters.requiresVisaSponsorship}
                    onChange={(event) => setHardFilters((prev) => ({ ...prev, requiresVisaSponsorship: event.target.checked }))}
                  />
                  Require visa sponsorship (optional hard filter)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BenefitCatalogPicker
                  label="Required benefits"
                  selectedIds={requiredBenefitIds}
                  onChange={setRequiredBenefitIds}
                />
                <BenefitCatalogPicker
                  label="Preferred benefits"
                  selectedIds={preferredBenefitIds}
                  onChange={setPreferredBenefitIds}
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
            {step === 'resume' && (
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

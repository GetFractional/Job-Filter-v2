import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
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
  Info,
  MapPin,
  Plus,
  Rocket,
  Settings2,
  Sparkles,
  Upload,
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
import { UI_TERMS } from '../../lib/terminology';
import {
  BENEFITS_CATALOG,
  benefitIdsToLabels,
  legacyBenefitsToIds,
  sanitizeBenefitIds,
  searchBenefitCatalog,
} from '../../lib/benefitsCatalog';
import { getCityTypeaheadOptions, loadRecentCities, saveRecentCity } from '../../lib/cityOptions';
import type {
  Claim,
  HardFilters,
  ImportDraft,
  ImportDraftRole,
  ImportSession,
  JobFeed,
  LocationPreference,
  ParseReasonCode,
  SegmentationMode,
} from '../../types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'import' | 'review' | 'preferences' | 'feeds';

const STEPS: { id: Step; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'import', label: 'Import' },
  { id: 'review', label: 'Review' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'feeds', label: 'Job Feeds' },
];

const SEGMENTATION_MODE_ORDER: SegmentationMode[] = ['default', 'newlines', 'bullets', 'headings'];
const LOW_QUALITY_REASON_CODES = new Set<ParseReasonCode>([
  'FILTERED_ALL',
  'LAYOUT_COLLAPSE',
  'ROLE_DETECT_FAIL',
  'COMPANY_DETECT_FAIL',
]);

function parseIntegerInput(value: string): number {
  const digitsOnly = value.replace(/[^\d]/g, '');
  return digitsOnly ? Number.parseInt(digitsOnly, 10) : 0;
}

function formatIntegerInput(value: number): string {
  if (!value || Number.isNaN(value) || value <= 0) return '';
  return value.toLocaleString();
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

function createJobFeed(role: string): JobFeed {
  const normalizedRole = role.trim().replace(/\s+/g, ' ');
  return {
    id: `feed-${crypto.randomUUID()}`,
    key: normalizeRoleValue(normalizedRole),
    role: normalizedRole,
    active: true,
  };
}

function normalizeRoleValue(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = normalized
    .split(' ')
    .filter(Boolean)
    .map((token) => {
      if (token === 'head') return 'director';
      if (token === 'vp' || token === 'vice') return 'vice-president';
      return token;
    })
    .filter((token) => !['of', 'the', 'and', 'for', 'in', 'at', 'to'].includes(token))
    .sort();

  return tokens.join(' ');
}

function dedupeJobFeeds(feeds: JobFeed[]): JobFeed[] {
  const seen = new Set<string>();
  const deduped: JobFeed[] = [];

  for (const feed of feeds) {
    const role = feed.role.trim();
    if (!role) continue;
    const key = feed.key || normalizeRoleValue(role);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...feed,
      key,
      role,
    });
  }

  return deduped;
}

function deriveFeedsFromRoles(roles: string[]): JobFeed[] {
  return dedupeJobFeeds(roles.filter((role) => role.trim()).map((role) => createJobFeed(role)));
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
  const jobs = useStore((s) => s.jobs);
  const importSession = useStore((s) => s.importSession);
  const setImportSession = useStore((s) => s.setImportSession);
  const hydrateImportSession = useStore((s) => s.hydrateImportSession);

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(profile?.firstName || profile?.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile?.lastName || profile?.name.split(' ').slice(1).join(' ') || '');
  const [targetRoles, setTargetRoles] = useState(profile?.targetRoles || []);
  const [targetRoleDraft, setTargetRoleDraft] = useState('');
  const [jobFeeds, setJobFeeds] = useState<JobFeed[]>(
    profile?.jobFeeds?.length ? dedupeJobFeeds(profile.jobFeeds) : deriveFeedsFromRoles(profile?.targetRoles || []),
  );
  const [jobFeedInput, setJobFeedInput] = useState('');
  const [skills, setSkills] = useState(profile?.skills ?? []);
  const [tools, setTools] = useState(profile?.tools ?? []);

  const [compTarget, setCompTarget] = useState(profile?.compTarget ? profile.compTarget.toLocaleString() : '');
  const [requiredBenefitIds, setRequiredBenefitIds] = useState<string[]>(
    sanitizeBenefitIds(profile?.requiredBenefitIds?.length ? profile.requiredBenefitIds : legacyBenefitsToIds(profile?.requiredBenefits)),
  );
  const [preferredBenefitIds] = useState<string[]>(
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
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [recentCities, setRecentCities] = useState<string[]>(() => loadRecentCities());
  const [debugReportNotice, setDebugReportNotice] = useState<string | null>(null);
  const [locationSuggestionApplied, setLocationSuggestionApplied] = useState(false);

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

  useEffect(() => {
    setJobFeeds((previous) => {
      const existingRoles = new Set(previous.map((feed) => normalizeRoleValue(feed.role)));
      const next = [...previous];
      for (const role of targetRoles) {
        const normalized = normalizeRoleValue(role);
        if (!normalized || existingRoles.has(normalized)) continue;
        next.push(createJobFeed(role));
        existingRoles.add(normalized);
      }
      return dedupeJobFeeds(next);
    });
  }, [targetRoles]);

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
  const hasLocationSuggestions = Boolean(importSession?.profileSuggestion.locationHints.length);
  const bulletDotCount = importSession
    ? (importSession.diagnostics.topBulletGlyphs ?? []).find((entry) => entry.glyph === '•')?.count ?? 0
    : 0;
  const bulletCircleCount = importSession
    ? (importSession.diagnostics.topBulletGlyphs ?? []).find((entry) => entry.glyph === '●')?.count ?? 0
    : 0;

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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        targetRoles,
        skills,
        tools,
        compFloor: normalizedHardFilters.minBaseSalary,
        compTarget: parseIntegerInput(compTarget),
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
    lastName,
    locationPreferences,
    preferredBenefitIds,
    firstName,
    requiredBenefitIds,
    skills,
    targetRoles,
    tools,
    updateProfile,
    willingToRelocate,
  ]);

  const addJobFeed = useCallback(() => {
    const role = jobFeedInput.trim();
    if (!role) return;

    setJobFeeds((previous) => dedupeJobFeeds([createJobFeed(role), ...previous]));
    setPreferenceErrors([]);
    setJobFeedInput('');
  }, [jobFeedInput]);

  const handleSaveJobFeeds = useCallback(async (): Promise<boolean> => {
    const normalizedFeeds = dedupeJobFeeds(jobFeeds).filter((feed) => feed.role.trim());
    if (normalizedFeeds.length === 0 || normalizedFeeds.every((feed) => !feed.active)) {
      return false;
    }

    setSaving(true);
    try {
      await updateProfile({
        jobFeeds: normalizedFeeds,
      });
      setJobFeeds(normalizedFeeds);
      return true;
    } finally {
      setSaving(false);
    }
  }, [jobFeeds, updateProfile]);

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

  const rememberCity = useCallback((city: string) => {
    const next = saveRecentCity(city);
    setRecentCities(next);
  }, []);

  const addTargetRole = useCallback(() => {
    const value = targetRoleDraft.trim();
    if (!value) return;
    setTargetRoles((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setTargetRoleDraft('');
  }, [targetRoleDraft]);

  const removeTargetRole = useCallback((value: string) => {
    setTargetRoles((prev) => prev.filter((entry) => entry !== value));
  }, []);

  const applyLocationSuggestions = useCallback(() => {
    if (!importSession) return;
    const locationHints = importSession.profileSuggestion.locationHints;
    if (locationHints.length === 0) return;
    setLocationPreferences((prev) => {
      if (prev.length > 0) return prev;
      return locationHints.slice(0, 3).map((hint) => locationPreferenceFromHint(hint));
    });
    setLocationSuggestionApplied(true);
  }, [importSession]);

  const applyParsedSuggestions = useCallback((session: ImportSession) => {
    const suggestion = session.profileSuggestion;

    setFirstName((prev) => prev || suggestion.firstName || '');
    setLastName((prev) => prev || suggestion.lastName || '');

    if (suggestion.targetRoles.length > 0) {
      setTargetRoles((prev) => [...new Set([...prev, ...suggestion.targetRoles])]);
    }

    if (suggestion.skillHints.length > 0) {
      setSkills((prev) => [...new Set([...prev, ...suggestion.skillHints])]);
    }

    if (suggestion.toolHints.length > 0) {
      setTools((prev) => [...new Set([...prev, ...suggestion.toolHints])]);
    }

    setLocationSuggestionApplied(false);

    if (suggestion.compensation?.floor) {
      setHardFilters((prev) => (
        prev.minBaseSalary > 0
          ? prev
          : { ...prev, minBaseSalary: suggestion.compensation?.floor ?? prev.minBaseSalary }
      ));
    }

    if (suggestion.compensation?.target) {
      setCompTarget((prev) => prev.trim() ? prev : formatIntegerInput(suggestion.compensation?.target ?? 0));
    }
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
    applyParsedSuggestions(session);
    const persisted = useStore.getState().importSession;
    setStorageNotice(persisted ? getImportSessionStorageNotice(persisted.storage) : null);

    setShowAllStatuses(false);
    setImportedClaimsCount(0);
    setDebugReportNotice(null);
    setFileImportError(null);
    setTroubleshootOpen(false);
    setLocationSuggestionApplied(false);
  }, [applyParsedSuggestions, extractionDiagnostics, resumeText, selectedFileMeta, setImportSession]);

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
    setTroubleshootOpen(false);
    setShowAllStatuses(false);
    setDebugReportNotice(null);
    setLocationSuggestionApplied(false);

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

  const handleStartOver = useCallback(() => {
    setImportSession(null);
    setResumeText('');
    setImportedClaimsCount(0);
    setSelectedFileName(null);
    setSelectedFileMeta(null);
    setReadingFile(false);
    setFileImportError(null);
    setStorageNotice(null);
    setExtractionDiagnostics(null);
    setTroubleshootOpen(false);
    setShowAllStatuses(false);
    setDebugReportNotice(null);
    setLocationSuggestionApplied(false);
  }, [setImportSession]);

  const markSkipped = useCallback(() => {
    if (!importSession) return;
    setImportSession({
      ...importSession,
      state: 'skipped',
      updatedAt: new Date().toISOString(),
    });
  }, [importSession, setImportSession]);

  const handleNext = async () => {
    if (step === 'import') {
      if (!resumeText.trim()) {
        setFileImportError('Upload a resume or paste text before parsing, or skip for now.');
        return;
      }

      handleParseResume();
      setStep('review');
      return;
    }

    if (step === 'review') {
      if (!importSession || importSession.state === 'skipped') {
        setStep('preferences');
        return;
      }

      if (importSession.state === 'parsed') {
        await handleSaveParsedDraft();
        setStep('preferences');
        return;
      }

      if (importSession.state === 'saved') {
        setStep('preferences');
        return;
      }

      return;
    }

    if (step === 'preferences') {
      const saved = await handleSavePreferences();
      if (!saved) return;
      setStep('feeds');
      return;
    }

    if (step === 'feeds') {
      const saved = await handleSaveJobFeeds();
      if (!saved) {
        setPreferenceErrors(['Add at least one active job feed before continuing.']);
        return;
      }
      setPreferenceErrors([]);
      if (!hasNoJobs) {
        onComplete();
        return;
      }
      handleAddJobManually();
      return;
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
    if (step !== 'import' && step !== 'review') return;

    if (importSession?.state && importSession.state !== 'saved') {
      markSkipped();
    }
    setStep('preferences');
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

  const hasNoJobs = jobs.length === 0;

  const handleAddJobManually = useCallback(() => {
    onComplete();
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-capture-modal'));
    }, 0);
  }, [onComplete]);

  const primaryLabel = useMemo(() => {
    if (step === 'import') {
      return 'Parse & Review';
    }
    if (step === 'review') {
      if (importSession?.state === 'parsed') return 'Approve & Save';
      if (importSession?.state === 'saved' || importSession?.state === 'skipped') return 'Continue';
      return 'Continue';
    }
    if (step === 'feeds') {
      return hasNoJobs ? 'Add a Job to Score' : 'Browse Jobs';
    }
    return 'Continue';
  }, [hasNoJobs, importSession, step]);

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

          {(step === 'import' || step === 'review') && (
            <div className="space-y-4">
              {step === 'import' && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-semibold text-neutral-900">Import Resume</h2>
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-200 text-neutral-500"
                          title={"We’ll use your resume to build your Digital Resume. You can edit everything before saving. AI features (later) require opt-in."}
                          aria-label="Import details"
                        >
                          <Info size={12} />
                        </span>
                      </div>
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
                      setTroubleshootOpen(false);
                      setShowAllStatuses(false);
                      setDebugReportNotice(null);
                    }}
                    placeholder="Paste your resume text if you prefer manual input"
                    rows={10}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              )}

              {step === 'review' && !importSession && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">No import draft yet</p>
                      <p className="text-xs text-amber-700 mt-1">Go back to Import Resume, parse your content, then continue to review.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 'review' && importSession && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">Digital Resume Review</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {fullDraftCounts.companies} companies, {fullDraftCounts.roles} roles, {fullDraftCounts.highlights} {UI_TERMS.accountabilityPlural.toLowerCase()}, {fullDraftCounts.outcomes} outcomes
                      </p>
                      {storageNotice && <p className="text-xs text-amber-700 mt-1">{storageNotice}</p>}
                      {(importSession.profileSuggestion.firstName
                        || importSession.profileSuggestion.lastName
                        || importSession.profileSuggestion.targetRoles.length > 0
                        || importSession.profileSuggestion.locationHints.length > 0) && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Added suggested profile details where fields were empty. You can edit everything before saving.
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1">
                        Needs attention means we are not fully confident the item is correct, review those entries before saving.
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleStartOver}
                        className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50"
                      >
                        Start Over
                      </button>
                      <p className="text-[11px] text-neutral-500">Clears parsed draft, import text, and diagnostics.</p>
                    </div>
                  </div>

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
                          <p className="text-xs text-amber-700 mt-1">Open Troubleshoot to try another method, upload a different format, or skip and continue manually.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parseLooksLowQuality && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      We imported {fullDraftCounts.companies} companies, {fullDraftCounts.roles} roles, and {fullDraftCounts.highlights + fullDraftCounts.outcomes} {UI_TERMS.accountabilityPlural.toLowerCase()}/outcomes.
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
                          <div>{UI_TERMS.accountabilityPlural.toLowerCase()}: {fullDraftCounts.highlights}</div>
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
                  <h2 className="text-lg font-semibold text-neutral-900">Scoring Preferences</h2>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder={importSession?.profileSuggestion.firstName || 'First name'}
                    className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder={importSession?.profileSuggestion.lastName || 'Last name'}
                    className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Target Roles</label>
                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {targetRoles.map((role) => (
                      <span key={role} className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 text-xs px-2.5 py-1">
                        {role}
                        <button
                          type="button"
                          onClick={() => removeTargetRole(role)}
                          className="text-brand-700 hover:text-brand-900"
                          aria-label={`Remove target role ${role}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={targetRoleDraft}
                    onChange={(event) => setTargetRoleDraft(event.target.value)}
                    onBlur={addTargetRole}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addTargetRole();
                      }
                    }}
                    placeholder="Add a role and press Enter"
                    className="w-full border-0 p-0 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-neutral-400" /> Location preferences
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
                  <button
                    type="button"
                    onClick={() => setWillingToRelocate((prev) => !prev)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      willingToRelocate
                        ? 'border-brand-300 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    + Willing to relocate
                  </button>
                  {hasLocationSuggestions && locationPreferences.length === 0 && (
                    <button
                      type="button"
                      onClick={applyLocationSuggestions}
                      className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-700 hover:bg-brand-100"
                    >
                      Apply suggested locations
                    </button>
                  )}
                </div>

                {locationSuggestionApplied && (
                  <p className="text-[11px] text-neutral-500">
                    Applied location suggestions from your resume. Edit or remove anything that looks off.
                  </p>
                )}

                <div className="space-y-2">
                  {locationPreferences.length === 0 && (
                    <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                      Add at least one location preference.
                    </p>
                  )}
                  {locationPreferences.map((preference) => {
                    const cityListId = `onboarding-city-options-${preference.id}`;
                    const cityOptions = getCityTypeaheadOptions(preference.city ?? '', recentCities);
                    const usesCustomRadius = preference.radiusMiles !== undefined
                      && !STANDARD_RADIUS_MILES.includes(preference.radiusMiles as (typeof STANDARD_RADIUS_MILES)[number]);

                    return (
                      <div key={preference.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr_170px_auto] gap-2 items-end">
                          <div>
                            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Mode</label>
                            <select
                              value={preference.type}
                              onChange={(event) => updateLocationPreference(preference.id, {
                                type: event.target.value as LocationPreference['type'],
                                radiusMiles: event.target.value === 'Remote' ? undefined : (preference.radiusMiles ?? 25),
                              })}
                              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                            >
                              <option value="Remote">Remote</option>
                              <option value="Hybrid">Hybrid</option>
                              <option value="Onsite">Onsite</option>
                            </select>
                          </div>

                          {preference.type === 'Remote' ? (
                            <div className="sm:col-span-2 rounded-lg border border-dashed border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-500 h-10 flex items-center">
                              Remote roles do not need city or radius.
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-[11px] font-medium text-neutral-600 mb-1 block">City</label>
                                <input
                                  type="text"
                                  list={cityListId}
                                  value={preference.city ?? ''}
                                  onChange={(event) => updateLocationPreference(preference.id, { city: event.target.value })}
                                  onBlur={() => rememberCity(preference.city ?? '')}
                                  placeholder="City (required)"
                                  className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                                />
                                <datalist id={cityListId}>
                                  {cityOptions.map((option, index) => (
                                    <option key={`${option}-${index}`} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </datalist>
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Radius (miles)</label>
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
                                  className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                                >
                                  <option value="">Select radius</option>
                                  {STANDARD_RADIUS_MILES.map((miles) => (
                                    <option key={miles} value={miles}>{miles} miles</option>
                                  ))}
                                  <option value="custom">Custom</option>
                                </select>
                              </div>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => removeLocationPreference(preference.id)}
                            className="h-10 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-600 hover:bg-neutral-100"
                          >
                            Remove
                          </button>
                        </div>

                        {preference.type !== 'Remote' && usesCustomRadius && (
                          <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-2 items-center">
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
                              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-3">
                <div className="text-sm font-medium text-neutral-800">Hard Filters</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block flex items-center gap-1.5">
                      <DollarSign size={12} className="text-neutral-400" /> Minimum base salary
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hardFilters.minBaseSalary > 0 ? hardFilters.minBaseSalary.toLocaleString() : ''}
                      onChange={(event) => setHardFilters((prev) => ({
                        ...prev,
                        minBaseSalary: parseIntegerInput(event.target.value),
                      }))}
                      placeholder="150,000"
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block flex items-center gap-1.5">
                      <DollarSign size={12} className="text-neutral-400" /> Compensation target
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={compTarget}
                      onChange={(event) => setCompTarget(formatIntegerInput(parseIntegerInput(event.target.value)))}
                      placeholder="180,000"
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Employment types</label>
                    <div className="rounded-lg border border-neutral-200 bg-white p-2 flex flex-wrap gap-1.5 min-h-10">
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
                      onChange={(event) => setHardFilters((prev) => ({
                        ...prev,
                        maxOnsiteDaysPerWeek: event.target.value === ''
                          ? DEFAULT_HARD_FILTERS.maxOnsiteDaysPerWeek
                          : Math.max(0, Math.min(5, Number(event.target.value))),
                      }))}
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Max travel percent</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hardFilters.maxTravelPercent === DEFAULT_HARD_FILTERS.maxTravelPercent ? '' : hardFilters.maxTravelPercent}
                      onChange={(event) => setHardFilters((prev) => ({
                        ...prev,
                        maxTravelPercent: event.target.value === ''
                          ? DEFAULT_HARD_FILTERS.maxTravelPercent
                          : Number(event.target.value),
                      }))}
                      placeholder="100"
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHardFilters((prev) => ({ ...prev, requiresVisaSponsorship: !prev.requiresVisaSponsorship }))}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
                    hardFilters.requiresVisaSponsorship
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  I will need visa sponsorship
                </button>
              </div>

              <BenefitCatalogPicker
                label="Required Benefits"
                selectedIds={requiredBenefitIds}
                onChange={setRequiredBenefitIds}
              />
              <p className="text-[11px] text-neutral-500">
                If a job does not list benefits, we treat benefits as unknown instead of an automatic fail.
              </p>
            </div>
          )}

          {step === 'feeds' && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Briefcase size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Job Feeds</h2>
                  <p className="text-xs text-neutral-500">
                    Feeds are role-based job lists. We&apos;ll use them to organize jobs and alerts.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={jobFeedInput}
                  onChange={(event) => setJobFeedInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addJobFeed();
                    }
                  }}
                  placeholder="Add a role feed"
                  className="h-10 min-w-[220px] flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={addJobFeed}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <Plus size={13} />
                  Add Feed
                </button>
              </div>

              {preferenceErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <ul className="text-xs text-red-700 list-disc pl-4 space-y-1">
                    {preferenceErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {jobFeeds.length === 0 && (
                <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  Add at least one role feed to organize your job search.
                </p>
              )}

              <div className="space-y-2">
                {jobFeeds.map((feed) => (
                  <div key={feed.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <input
                      type="text"
                      value={feed.role}
                      onChange={(event) => {
                        const role = event.target.value;
                        setPreferenceErrors([]);
                        setJobFeeds((previous) => previous.map((entry) => (
                          entry.id === feed.id ? { ...entry, role } : entry
                        )));
                      }}
                      placeholder="Role name"
                      className="h-10 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreferenceErrors([]);
                        setJobFeeds((previous) => previous.map((entry) => (
                          entry.id === feed.id ? { ...entry, active: !entry.active } : entry
                        )));
                      }}
                      className={`h-10 rounded-lg border px-3 text-xs font-medium ${
                        feed.active
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {feed.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreferenceErrors([]);
                        setJobFeeds((previous) => previous.filter((entry) => entry.id !== feed.id));
                      }}
                      className="h-10 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
            {(step === 'import' || step === 'review') && (
              <button onClick={handleSkip} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700">
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
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
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

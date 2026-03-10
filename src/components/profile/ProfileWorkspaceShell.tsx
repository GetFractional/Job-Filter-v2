import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ClaimsImportExtractionDiagnostics } from '../../lib/claimsImportPipeline';
import { extractClaimsImportTextWithMetrics, validateClaimsImportFile } from '../../lib/claimsImportPipeline';
import { buildBestImportDraftFromText, isLikelySuspiciousCompanyName } from '../../lib/importDraftBuilder';
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
import { canConfirmProfileDetails } from './steps/profileDetailsValidation';
import {
  ProfileExperienceImportStep,
  type ExperienceTimelineCompanyDraft,
  type ExtractionBuildStage,
} from './steps/ProfileExperienceImportStep';
import { ProfileIntroStep, type StartHerePrefillState } from './steps/ProfileIntroStep';
import { DEFAULT_PHONE_COUNTRY_CODE, extractPhonePrefillFromText } from './steps/profilePhone';

interface ProfileWorkspaceShellProps {
  mode: ProfileWorkspaceMode;
  initialIdentity: ProfileIdentityDraft;
  forceFreshSetup?: boolean;
}

type SelectedPath = 'resume' | 'manual' | null;

interface ResumeContactPrefill {
  email?: string;
  linkedIn?: string;
  website?: string;
  location?: string;
  phoneCountryCode?: string;
  phoneNational?: string;
}

interface ResumeComputationCache {
  fileSignature: string;
  extractionText: string;
  extractionDiagnostics: ClaimsImportExtractionDiagnostics;
  draft: ImportDraft;
  timelineCompanies: ExperienceTimelineCompanyDraft[];
  suggestion: ReturnType<typeof inferProfilePrefillSuggestion>;
  contactPrefill: ResumeContactPrefill;
}

interface PersistedWorkspaceDraft {
  version: number;
  activeStep: ProfileWorkspaceSectionId;
  selectedPath: SelectedPath;
  resumeUploadInitiated: boolean;
  detailsSaved: boolean;
  experienceConfirmed: boolean;
  identity: ProfileIdentityDraft;
  selectedFileName: string | null;
  selectedFileMeta: string | null;
  extractionStage: ExtractionBuildStage;
  extractionStarted: boolean;
  importError: string | null;
  timelineCompanies: ExperienceTimelineCompanyDraft[];
  revealedGroupCount: number;
  prefillState: StartHerePrefillState;
  prefillMessage: string | null;
}

const WORKSPACE_DRAFT_VERSION = 5;
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
    description: 'Choose setup path',
    supportsInPacket: true,
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Identity and contact',
    supportsInPacket: true,
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Timeline confirmation',
    supportsInPacket: true,
  },
  {
    id: 'skills',
    label: 'Skills & Tools',
    description: 'Skills and tools',
    supportsInPacket: false,
  },
  {
    id: 'extras',
    label: 'Extras',
    description: 'Summary and credentials',
    supportsInPacket: false,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Targeting settings',
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
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTH_BY_LABEL = new Map(MONTH_LABELS.map((label, index) => [label.toLowerCase(), String(index + 1).padStart(2, '0')]));
const ROLE_NOISE_RE = /^(remote|hybrid|onsite|on-site|in office|n\/a|na|unassigned|unspecified role)$/i;
const LOCATION_FRAGMENT_RE = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}(?:,\s*[A-Z]{2})?$/;
const LOCATION_CITY_STATE_RE = /^[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3},\s*[A-Z]{2}$/;
const METRIC_LINE_RE = /(?:[$€£]\s?\d|\b\d+(?:[.,]\d+)?%|\b\d+[kKmMbB]\b)/;
const VERB_OR_SENTENCE_RE = /\b(led|built|launched|improved|increased|reduced|managed|scaled|drove|created|implemented|delivered|grew|generated|owned|optimized|negotiated)\b/i;
const PRESENT_RE = /^(present|current|now)$/i;
const ROLE_KEYWORD_RE = /\b(director|manager|lead|head|vp|vice president|president|engineer|analyst|specialist|coordinator|officer|chief|consultant|marketing|growth|sales|operations|product)\b/i;
const DATE_LOCATION_COMPANY_FRAGMENT_RE = /^[A-Z]{2}\s*[|/,]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}$/i;
const URL_OR_CONTACT_RE = /(@|https?:\/\/|www\.)/i;
const COMPANY_ENTITY_HINT_RE = /\b(inc|corp|llc|ltd|group|company|co\.|media|software|labs|systems|agency|partners)\b/i;
const COMPANY_WEB_BRAND_RE = /\b[a-z0-9][a-z0-9.'’&-]*\.(?:com|io|ai|co|net|org)\b/i;
const COMPANY_NAME_SHAPE_RE = /^[A-Z][A-Za-z0-9&.'’-]*(?:\s+[A-Z][A-Za-z0-9&.'’-]*){0,5}$/;
const CONTINUATION_TRAILING_RE = /([,(/:+&-]|\b(and|or|to|for|with|across|including|through|via|from|plus|of|in|on|by|into|over|under|between|generated|resulting))$/i;

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined'
    && typeof window.localStorage !== 'undefined'
    && typeof window.localStorage.getItem === 'function'
    && typeof window.localStorage.setItem === 'function';
}

function getWorkspaceDraftKey(mode: ProfileWorkspaceMode): string {
  return `${WORKSPACE_DRAFT_STORAGE_PREFIX}:${mode}`;
}

function normalizePersistedTimeline(rawValue: unknown): ExperienceTimelineCompanyDraft[] {
  if (!Array.isArray(rawValue)) return [];

  return rawValue.flatMap((companyValue) => {
    if (!companyValue || typeof companyValue !== 'object') return [];
    const company = companyValue as Partial<ExperienceTimelineCompanyDraft>;
    const rawRoles = Array.isArray(company.roles) ? company.roles : [];
    const roles = rawRoles.flatMap((roleValue) => {
      if (!roleValue || typeof roleValue !== 'object') return [];
      const role = roleValue as Partial<ExperienceTimelineCompanyDraft['roles'][number]>;
      return [{
        id: role.id ?? createTimelineId('role'),
        title: role.title ?? '',
        startDate: role.startDate ?? '',
        endDate: role.endDate ?? '',
        currentRole: Boolean(role.currentRole),
        responsibilities: Array.isArray(role.responsibilities) ? role.responsibilities : [''],
        results: Array.isArray(role.results) ? role.results : [''],
      }];
    });

    const unresolvedPlacement = Boolean(company.unresolvedPlacement);
    return [{
      id: company.id ?? createTimelineId('company'),
      company: company.company ?? '',
      needsReview: Boolean(company.needsReview),
      unresolvedPlacement,
      unresolvedKind: unresolvedPlacement
        ? (company.unresolvedKind === 'featured_proof' ? 'featured_proof' : 'generic')
        : undefined,
      roles: roles.length > 0 ? roles : [{
        id: createTimelineId('role'),
        title: '',
        startDate: '',
        endDate: '',
        currentRole: false,
        responsibilities: [''],
        results: [''],
      }],
    }];
  });
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
    const parsedIdentity = parsed.identity as Partial<ProfileIdentityDraft>;

    const safeExtractionStage = IN_PROGRESS_EXTRACTION_STAGES.has(parsed.extractionStage as ExtractionBuildStage)
      ? 'idle'
      : (parsed.extractionStage ?? 'idle');

    return {
      version: WORKSPACE_DRAFT_VERSION,
      activeStep: parsed.activeStep,
      selectedPath: parsed.selectedPath ?? null,
      resumeUploadInitiated: Boolean(parsed.resumeUploadInitiated),
      detailsSaved: Boolean(parsed.detailsSaved),
      experienceConfirmed: Boolean(parsed.experienceConfirmed),
      identity: {
        firstName: parsedIdentity.firstName ?? '',
        lastName: parsedIdentity.lastName ?? '',
        headline: parsedIdentity.headline ?? '',
        email: parsedIdentity.email ?? '',
        phoneCountryCode: parsedIdentity.phoneCountryCode ?? DEFAULT_PHONE_COUNTRY_CODE,
        phoneNational: parsedIdentity.phoneNational ?? '',
        location: parsedIdentity.location ?? '',
        linkedIn: parsedIdentity.linkedIn ?? '',
        website: parsedIdentity.website ?? '',
        portfolio: parsedIdentity.portfolio ?? '',
      },
      selectedFileName: parsed.selectedFileName ?? null,
      selectedFileMeta: parsed.selectedFileMeta ?? null,
      extractionStage: safeExtractionStage,
      extractionStarted: Boolean(parsed.extractionStarted),
      importError: parsed.importError ?? null,
      timelineCompanies: normalizePersistedTimeline(parsed.timelineCompanies),
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

function formatFileMeta(file: File): string {
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  const format = file.type || file.name.split('.').pop()?.toUpperCase() || 'File';
  return `${sizeKb} KB · ${format}`;
}

function fileSignature(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function createTimelineId(prefix: 'company' | 'role'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toMonthInputValue(rawValue?: string): string {
  if (!rawValue) return '';
  const trimmed = rawValue.trim();
  if (!trimmed || PRESENT_RE.test(trimmed)) return '';

  const normalizedIsoMatch = trimmed.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (normalizedIsoMatch) {
    return `${normalizedIsoMatch[1]}-${normalizedIsoMatch[2]}`;
  }

  const monthYearMatch = trimmed.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})$/i);
  if (!monthYearMatch) return '';
  const monthNumber = MONTH_BY_LABEL.get(monthYearMatch[1].slice(0, 3).toLowerCase());
  if (!monthNumber) return '';
  return `${monthYearMatch[2]}-${monthNumber}`;
}

function toMonthSortValue(rawValue?: string): number {
  if (!rawValue) return -1;
  const match = rawValue.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return -1;
  return Number(match[1]) * 12 + Number(match[2]);
}

function formatMonthYearForPreview(value: string): string {
  const match = value.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return value.trim();
  const month = MONTH_LABELS[Number(match[2]) - 1];
  return `${month} ${match[1]}`;
}

function toRoleDateRange(startDate?: string, endDate?: string, currentRole?: boolean): string {
  const formattedStart = startDate ? formatMonthYearForPreview(startDate) : '';
  const formattedEnd = endDate ? formatMonthYearForPreview(endDate) : '';

  if (formattedStart && currentRole) {
    return `${formattedStart} - Present`;
  }
  if (formattedStart && formattedEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }
  if (formattedStart) return `${formattedStart} - End date needed`;
  if (formattedEnd) return `Ends ${formattedEnd}`;
  return 'Date range not confirmed';
}

function isUnusableRoleTitle(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized === 'unassigned' || normalized === 'unspecified role';
}

function isLikelyRoleNoise(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (ROLE_NOISE_RE.test(trimmed)) return true;
  if (LOCATION_FRAGMENT_RE.test(trimmed) && !ROLE_KEYWORD_RE.test(trimmed)) return true;
  if (METRIC_LINE_RE.test(trimmed) && !ROLE_KEYWORD_RE.test(trimmed)) return true;
  if (VERB_OR_SENTENCE_RE.test(trimmed) && !ROLE_KEYWORD_RE.test(trimmed)) return true;
  if (trimmed.includes(';')) return true;
  return false;
}

function isLikelyNoiseCompanyName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.toLowerCase() === 'unassigned') return true;
  if (URL_OR_CONTACT_RE.test(trimmed)) return true;
  if (DATE_LOCATION_COMPANY_FRAGMENT_RE.test(trimmed)) return true;
  if (METRIC_LINE_RE.test(trimmed) && !COMPANY_ENTITY_HINT_RE.test(trimmed)) {
    return true;
  }
  if (VERB_OR_SENTENCE_RE.test(trimmed) && !COMPANY_ENTITY_HINT_RE.test(trimmed) && trimmed.split(/\s+/).length >= 6) {
    return true;
  }
  if (trimmed.includes(';')) return true;
  const looksLikeNamedCompany = COMPANY_ENTITY_HINT_RE.test(trimmed)
    || COMPANY_WEB_BRAND_RE.test(trimmed)
    || COMPANY_NAME_SHAPE_RE.test(trimmed);
  if (isLikelySuspiciousCompanyName(trimmed)) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    const canStillBeNamedCompany = words.length > 0
      && words.length <= 6
      && trimmed.length <= 64
      && !/\b(?:19|20)\d{2}\b/.test(trimmed)
      && !VERB_OR_SENTENCE_RE.test(trimmed);
    if (!looksLikeNamedCompany && !canStillBeNamedCompany) return true;
  }
  return false;
}

function toEvidenceLines(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => !ROLE_NOISE_RE.test(value))
    .slice(0, 20);
}

function buildTimelineReviewFlag(company: ExperienceTimelineCompanyDraft): boolean {
  return Boolean(company.unresolvedPlacement)
    || !company.company.trim()
    || company.roles.length === 0
    || company.roles.some((role) => !role.title.trim() || !role.startDate.trim() || (!role.currentRole && !role.endDate.trim()));
}

function isLikelyLocationHint(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!LOCATION_CITY_STATE_RE.test(trimmed)) return false;
  if (ROLE_KEYWORD_RE.test(trimmed)) return false;
  return true;
}

// eslint-disable-next-line react-refresh/only-export-components
export function toTimelineCompanies(draft: ImportDraft): ExperienceTimelineCompanyDraft[] {
  const mappedCompanies = draft.companies
    .filter((company) => company.roles.length > 0)
    .map((company) => {
      const roles = company.roles
        .map((role) => {
          const title = role.title?.trim() || '';
          const normalizedTitle = isUnusableRoleTitle(title) || isLikelyRoleNoise(title) ? '' : title;
          const normalizedStart = toMonthInputValue(role.startDate);
          const normalizedEnd = role.currentRole ? '' : toMonthInputValue(role.endDate);
          const responsibilities = toEvidenceLines(role.highlights.map((item) => item.text));
          const results = toEvidenceLines(role.outcomes.map((item) => item.text));
          const trailingResponsibility = responsibilities[responsibilities.length - 1]?.trim();
          const leadingResult = results[0]?.trim();
          if (
            trailingResponsibility
            && leadingResult
            && CONTINUATION_TRAILING_RE.test(trailingResponsibility)
            && /^[$€£]?\d/.test(leadingResult)
          ) {
            results[0] = `${trailingResponsibility} ${leadingResult}`.replace(/\s+/g, ' ').trim();
            responsibilities.pop();
          }
          const hasStructuredDate = Boolean(normalizedStart || normalizedEnd || role.currentRole);
          const hasEvidence = responsibilities.length > 0 || results.length > 0;

          if (!normalizedTitle && !hasStructuredDate && !hasEvidence) {
            return null;
          }

          return {
            id: role.id || createTimelineId('role'),
            title: normalizedTitle,
            startDate: normalizedStart,
            endDate: normalizedEnd,
            currentRole: Boolean(role.currentRole),
            responsibilities: responsibilities.length > 0 ? responsibilities : [''],
            results: results.length > 0 ? results : [''],
          };
        })
        .filter((role): role is NonNullable<typeof role> => Boolean(role));

      const hasStrongRoleAnchor = roles.some((role) => {
        const hasTitle = role.title.trim().length > 0;
        const hasDate = role.startDate.trim().length > 0 || role.endDate.trim().length > 0 || role.currentRole;
        return hasTitle && hasDate;
      });
      const hasEvidenceLines = roles.some((role) =>
        role.responsibilities.some((line) => line.trim().length > 0)
        || role.results.some((line) => line.trim().length > 0));
      const suspiciousCompanyName = isLikelyNoiseCompanyName(company.name);
      const unresolvedPlacement = !company.name.trim()
        || (suspiciousCompanyName && !(hasStrongRoleAnchor && hasEvidenceLines));
      const featuredProofOnly = unresolvedPlacement && roles.every((role) => {
        const title = role.title.trim().toLowerCase();
        return title === 'featured achievements' || title === 'featured proof';
      });

      const nextCompany: ExperienceTimelineCompanyDraft = {
        id: company.id || createTimelineId('company'),
        company: unresolvedPlacement ? '' : company.name.trim(),
        unresolvedPlacement,
        unresolvedKind: unresolvedPlacement
          ? (featuredProofOnly ? 'featured_proof' : 'generic')
          : undefined,
        needsReview: true,
        roles: roles.length > 0 ? roles : [{
          id: createTimelineId('role'),
          title: '',
          startDate: '',
          endDate: '',
          currentRole: false,
          responsibilities: [''],
          results: [''],
        }],
      };

      return {
        ...nextCompany,
        needsReview: buildTimelineReviewFlag(nextCompany),
      };
    });

  return mappedCompanies
    .map((company, index) => ({
      company,
      index,
      hasCurrentRole: company.roles.some((role) => role.currentRole),
      latestEndSortValue: company.roles.reduce(
        (maximum, role) => Math.max(maximum, toMonthSortValue(role.endDate)),
        -1,
      ),
      latestStartSortValue: company.roles.reduce(
        (maximum, role) => Math.max(maximum, toMonthSortValue(role.startDate)),
        -1,
      ),
    }))
    .sort((a, b) => {
      if (a.hasCurrentRole !== b.hasCurrentRole) return a.hasCurrentRole ? -1 : 1;
      if (a.latestEndSortValue !== b.latestEndSortValue) {
        return b.latestEndSortValue - a.latestEndSortValue;
      }
      if (a.latestStartSortValue !== b.latestStartSortValue) {
        return b.latestStartSortValue - a.latestStartSortValue;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.company);
}

function toExperiencePreviewGroups(companies: ExperienceTimelineCompanyDraft[]): ExperienceTimelineCompanyPreview[] {
  return companies
    .filter((company) => company.roles.length > 0)
    .map((company) => ({
      id: company.id,
      company: company.unresolvedPlacement
        ? (company.unresolvedKind === 'featured_proof'
          ? 'Featured proof (assign company)'
          : 'Unresolved placement (assign company)')
        : (company.company.trim() || 'Company needs review'),
      roles: company.roles.map((role) => ({
        id: role.id,
        title: role.title.trim() || 'Role title needs review',
        dateRange: toRoleDateRange(role.startDate, role.endDate, role.currentRole),
        responsibilities: role.responsibilities.map((line) => line.trim()).filter(Boolean),
        results: role.results.map((line) => line.trim()).filter(Boolean),
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
  const locationHint = locationHints.find((hint) => isLikelyLocationHint(hint));
  const phone = extractPhonePrefillFromText(text);

  return {
    email: email?.trim(),
    linkedIn: linkedInMatch ? normalizeLinkedIn(linkedInMatch.trim()) : undefined,
    website: website?.trim(),
    location: locationHint?.trim(),
    phoneCountryCode: phone.phoneCountryCode,
    phoneNational: phone.phoneNational,
  };
}

function applyPrefillIdentity(
  identity: ProfileIdentityDraft,
  suggestion: ReturnType<typeof inferProfilePrefillSuggestion>,
  contactPrefill: ResumeContactPrefill,
): ProfileIdentityDraft {
  const firstRole = suggestion.targetRoles.find((role) => !isUnusableRoleTitle(role));

  return {
    ...identity,
    firstName: identity.firstName || suggestion.firstName || '',
    lastName: identity.lastName || suggestion.lastName || '',
    headline: identity.headline || firstRole || '',
    email: identity.email || contactPrefill.email || '',
    location: identity.location || contactPrefill.location || '',
    linkedIn: identity.linkedIn || contactPrefill.linkedIn || '',
    website: identity.website || contactPrefill.website || '',
    phoneCountryCode: identity.phoneNational
      ? identity.phoneCountryCode
      : (contactPrefill.phoneCountryCode ?? identity.phoneCountryCode),
    phoneNational: identity.phoneNational
      ? identity.phoneNational
      : (contactPrefill.phoneNational ?? ''),
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
    experienceConfirmed: false,
    identity: initialIdentity,
    selectedFileName: null,
    selectedFileMeta: null,
    extractionStage: 'idle',
    extractionStarted: false,
    importError: null,
    timelineCompanies: [],
    revealedGroupCount: 0,
    prefillState: 'idle',
    prefillMessage: null,
  };
}

export function ProfileWorkspaceShell({ mode, initialIdentity, forceFreshSetup = false }: ProfileWorkspaceShellProps) {
  const draftKey = useMemo(() => getWorkspaceDraftKey(mode), [mode]);
  const shouldBypassRestoredDraft = mode === 'setup' && forceFreshSetup;
  const restoredDraft = useMemo(
    () => (shouldBypassRestoredDraft ? null : readWorkspaceDraft(draftKey)),
    [draftKey, shouldBypassRestoredDraft],
  );
  const fallbackDraft = useMemo(() => defaultPersistedDraft(initialIdentity), [initialIdentity]);
  const initialDraft = restoredDraft ?? fallbackDraft;

  const [activeStep, setActiveStep] = useState<ProfileWorkspaceSectionId>(initialDraft.activeStep);
  const [selectedPath, setSelectedPath] = useState<SelectedPath>(initialDraft.selectedPath);
  const [resumeUploadInitiated, setResumeUploadInitiated] = useState(initialDraft.resumeUploadInitiated);
  const [detailsSaved, setDetailsSaved] = useState(initialDraft.detailsSaved);
  const [experienceConfirmed, setExperienceConfirmed] = useState(initialDraft.experienceConfirmed);
  const [identity, setIdentity] = useState<ProfileIdentityDraft>(initialDraft.identity);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(initialDraft.selectedFileName);
  const [selectedFileMeta, setSelectedFileMeta] = useState<string | null>(initialDraft.selectedFileMeta);
  const [extractionStage, setExtractionStage] = useState<ExtractionBuildStage>(initialDraft.extractionStage);
  const [extractionStarted, setExtractionStarted] = useState(initialDraft.extractionStarted);
  const [importError, setImportError] = useState<string | null>(initialDraft.importError);
  const [timelineCompanies, setTimelineCompanies] = useState<ExperienceTimelineCompanyDraft[]>(initialDraft.timelineCompanies);
  const [revealedGroupCount, setRevealedGroupCount] = useState(initialDraft.revealedGroupCount);
  const [prefillState, setPrefillState] = useState<StartHerePrefillState>(initialDraft.prefillState);
  const [prefillMessage, setPrefillMessage] = useState<string | null>(initialDraft.prefillMessage);
  const [stepPathCollapsed, setStepPathCollapsed] = useState(false);

  const extractionRunIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const mountedRef = useRef(true);
  const resumeCacheRef = useRef<ResumeComputationCache | null>(null);
  const workspaceRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!shouldBypassRestoredDraft) return;
    removeWorkspaceDraft(draftKey);
  }, [draftKey, shouldBypassRestoredDraft]);

  const detailsRequiredFieldsValid = useMemo(
    () => canConfirmProfileDetails(identity),
    [identity],
  );

  const completionByStep = useMemo<Record<ProfileWorkspaceSectionId, boolean>>(
    () => ({
      start_here: selectedPath === 'manual' || (selectedPath === 'resume' && resumeUploadInitiated),
      details: detailsSaved && detailsRequiredFieldsValid,
      experience: experienceConfirmed,
      skills: false,
      extras: false,
      preferences: false,
    }),
    [
      detailsRequiredFieldsValid,
      detailsSaved,
      experienceConfirmed,
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

  const previewGroups = useMemo(
    () => toExperiencePreviewGroups(timelineCompanies),
    [timelineCompanies],
  );
  const activeStepDefinition = STEP_DEFINITIONS.find((step) => step.id === activeStep);

  const canResetFlow = useMemo(
    () => selectedPath !== null
      || detailsSaved
      || experienceConfirmed
      || extractionStarted
      || timelineCompanies.length > 0
      || Boolean(selectedFileName),
    [detailsSaved, experienceConfirmed, extractionStarted, selectedFileName, selectedPath, timelineCompanies.length],
  );

  const persistableDraft = useMemo<PersistedWorkspaceDraft>(
    () => ({
      version: WORKSPACE_DRAFT_VERSION,
      activeStep,
      selectedPath,
      resumeUploadInitiated,
      detailsSaved,
      experienceConfirmed,
      identity,
      selectedFileName,
      selectedFileMeta,
      extractionStage: IN_PROGRESS_EXTRACTION_STAGES.has(extractionStage) ? 'idle' : extractionStage,
      extractionStarted,
      importError,
      timelineCompanies,
      revealedGroupCount,
      prefillState: prefillState === 'prefilling' ? 'idle' : prefillState,
      prefillMessage,
    }),
    [
      activeStep,
      detailsSaved,
      experienceConfirmed,
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
      timelineCompanies,
    ],
  );

  useEffect(() => {
    writeWorkspaceDraft(draftKey, persistableDraft);
  }, [draftKey, persistableDraft]);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  const scrollWorkspaceToTop = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    workspaceRootRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  };

  const resetExtractionProgress = () => {
    extractionRunIdRef.current += 1;
    clearTimers();
    setExtractionStage('idle');
    setExtractionStarted(false);
    setImportError(null);
    setTimelineCompanies([]);
    setExperienceConfirmed(false);
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
    const timelineCompanies = toTimelineCompanies(parsed.draft);

    const computation: ResumeComputationCache = {
      fileSignature: signature,
      extractionText: extraction.text,
      extractionDiagnostics: extraction.diagnostics,
      draft: parsed.draft,
      timelineCompanies,
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
    setTimelineCompanies([]);
    setExperienceConfirmed(false);
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

      setTimelineCompanies(computation.timelineCompanies);
      setExtractionStage('assembling_preview');

      if (computation.timelineCompanies.length === 0) {
        await createDelay(timersRef, 260);
      } else {
        for (let index = 1; index <= computation.timelineCompanies.length; index += 1) {
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

  const handleResumeFileSelection = (file: File) => {
    const validationError = validateClaimsImportFile(file);
    if (validationError) {
      setSelectedPath('resume');
      setResumeUploadInitiated(false);
      setSelectedFileName(null);
      setSelectedFileMeta(null);
      setPrefillState('error');
      setPrefillMessage(validationError);
      setImportError(validationError);
      setExperienceConfirmed(false);
      setExtractionStage('error');
      return;
    }

    setSelectedPath('resume');
    setResumeUploadInitiated(true);
    setSelectedFileName(file.name);
    setSelectedFileMeta(formatFileMeta(file));
    setImportError(null);
    resetExtractionProgress();
    setActiveStep('details');
    scrollWorkspaceToTop();
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
    setExperienceConfirmed(reset.experienceConfirmed);
    setIdentity(reset.identity);
    setSelectedFileName(reset.selectedFileName);
    setSelectedFileMeta(reset.selectedFileMeta);
    setExtractionStage(reset.extractionStage);
    setExtractionStarted(reset.extractionStarted);
    setImportError(reset.importError);
    setTimelineCompanies(reset.timelineCompanies);
    setRevealedGroupCount(reset.revealedGroupCount);
    setPrefillState(reset.prefillState);
    setPrefillMessage(reset.prefillMessage);
  };

  const applyTimelineCompanies = (nextCompanies: ExperienceTimelineCompanyDraft[]) => {
    setTimelineCompanies(nextCompanies);
    setExperienceConfirmed(false);
    if (extractionStage === 'ready') {
      setRevealedGroupCount(nextCompanies.length);
    }
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
          onResumeFileSelected={handleResumeFileSelection}
          onStartManually={() => {
            extractionRunIdRef.current += 1;
            clearTimers();
            setSelectedPath('manual');
            setResumeUploadInitiated(false);
            setSelectedFileName(null);
            setSelectedFileMeta(null);
            setImportError(null);
            setExtractionStarted(false);
            setExtractionStage('idle');
            setTimelineCompanies([]);
            setExperienceConfirmed(false);
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
            scrollWorkspaceToTop();
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
          extractionStage={extractionStage}
          importError={importError}
          timelineCompanies={timelineCompanies}
          experienceConfirmed={experienceConfirmed}
          onTimelineChange={applyTimelineCompanies}
          onConfirmTimeline={() => {
            setExperienceConfirmed(true);
            scrollWorkspaceToTop();
          }}
          onBack={() => setActiveStep('details')}
          deletePreferenceStorageKey={`jf2-profile-delete-confirm:${mode}`}
        />
      );
    }

    return (
      <section className="workspace-panel p-6 sm:p-7">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Coming next</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This section is in the next packet. Your current progress stays saved in this workspace flow.
        </p>
      </section>
    );
  };

  return (
    <div
      ref={workspaceRootRef}
      data-profile-mode={mode}
      className="relative w-full pb-8 pt-1 sm:pt-2"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-90 [background-image:radial-gradient(circle_at_1px_1px,rgba(229,231,235,0.96)_1px,transparent_0),linear-gradient(180deg,rgba(255,255,255,0.36),rgba(236,243,240,0.7))] [background-size:20px_20px,100%_100%]"
      />
      <header className="profile-workspace-glass mb-4 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Profile workspace</p>
            {stepPathCollapsed && (
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {activeStepDefinition?.label ?? 'Current step'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="rounded-full border border-[var(--border-subtle)] bg-white/84 px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
              {completionPercent}% complete
            </p>
            <button
              type="button"
              onClick={() => setStepPathCollapsed((previous) => !previous)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white/82 text-[var(--text-secondary)] hover:border-[var(--color-brand-300)] hover:text-[var(--text-primary)]"
              aria-label={stepPathCollapsed ? 'Expand step path' : 'Collapse step path'}
              aria-expanded={!stepPathCollapsed}
              aria-controls="profile-step-list"
            >
              {stepPathCollapsed ? <ChevronDown size={14} aria-hidden /> : <ChevronUp size={14} aria-hidden />}
            </button>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-[rgba(62,75,69,0.16)] bg-white/65">
          <div
            className="h-full rounded-full bg-[linear-gradient(180deg,#2F6D5C_0%,#235246_100%)]"
            style={{ width: `${completionPercent}%` }}
            aria-hidden
          />
        </div>
        {!stepPathCollapsed && (
          <div className="mt-3">
            <ProfileStepRail
              steps={stepItems}
              activeStep={activeStep}
              onStepChange={handleStepChange}
            />
          </div>
        )}
      </header>

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row">
        <div className="min-w-0 lg:basis-[58%] lg:flex-[1_1_58%]">{renderActiveStep()}</div>
        <div className="min-w-0 lg:basis-[42%] lg:flex-[1_1_42%]">
          <ProfilePreviewPane
            activeStep={activeStep}
            identity={identity}
            extractionStage={extractionStage}
            extractionGroups={previewGroups}
            revealedGroupCount={revealedGroupCount}
          />
        </div>
      </div>
    </div>
  );
}

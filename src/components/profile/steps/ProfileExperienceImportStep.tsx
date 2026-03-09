import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export type ExtractionBuildStage =
  | 'idle'
  | 'extracting_text'
  | 'mapping_timeline'
  | 'assembling_preview'
  | 'ready'
  | 'error';

export interface ExperienceTimelineRoleDraft {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  currentRole: boolean;
  responsibilities: string[];
  results: string[];
}

export interface ExperienceTimelineCompanyDraft {
  id: string;
  company: string;
  needsReview: boolean;
  unresolvedPlacement?: boolean;
  roles: ExperienceTimelineRoleDraft[];
}

interface ProfileExperienceImportStepProps {
  selectedPath: 'resume' | 'manual' | null;
  selectedFileName: string | null;
  selectedFileMeta: string | null;
  extractionStage: ExtractionBuildStage;
  importError: string | null;
  timelineCompanies: ExperienceTimelineCompanyDraft[];
  experienceConfirmed: boolean;
  onTimelineChange: (companies: ExperienceTimelineCompanyDraft[]) => void;
  onConfirmTimeline: () => void;
  onBack: () => void;
  deletePreferenceStorageKey?: string;
}

const CONFIRMATION_CHECKLIST = [
  'Confirm each company and role sequence.',
  'Confirm month/year dates and current role status.',
  'Confirm responsibilities and results that should power future assets.',
  'Save once this timeline is trustworthy.',
];
const TOAST_AUTO_DISMISS_MS = 7_000;

function createDraftId(prefix: 'company' | 'role' | 'line'): string {
  return `${prefix}-manual-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRole(): ExperienceTimelineRoleDraft {
  return {
    id: createDraftId('role'),
    title: '',
    startDate: '',
    endDate: '',
    currentRole: false,
    responsibilities: [''],
    results: [''],
  };
}

function hasRoleValidationError(role: ExperienceTimelineRoleDraft): boolean {
  return !role.title.trim() || !role.startDate.trim() || (!role.currentRole && !role.endDate.trim());
}

function hasCompanyValidationError(company: ExperienceTimelineCompanyDraft): boolean {
  return !company.company.trim() || company.roles.length === 0 || company.roles.some(hasRoleValidationError);
}

function normalizeEditableLines(lines: string[]): string[] {
  if (lines.length === 0) return [''];
  return lines;
}

function cloneTimelineCompanies(companies: ExperienceTimelineCompanyDraft[]): ExperienceTimelineCompanyDraft[] {
  return JSON.parse(JSON.stringify(companies)) as ExperienceTimelineCompanyDraft[];
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined'
    && typeof window.localStorage !== 'undefined'
    && typeof window.localStorage.getItem === 'function'
    && typeof window.localStorage.setItem === 'function';
}

function moveIndex<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function IconMoveButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
  upLabel,
  downLabel,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  upLabel: string;
  downLabel: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disableUp}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--color-brand-300)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
        aria-label={upLabel}
      >
        <ArrowUp size={13} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disableDown}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--color-brand-300)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
        aria-label={downLabel}
      >
        <ArrowDown size={13} aria-hidden />
      </button>
    </>
  );
}

function ExpandButton({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--color-brand-300)] hover:text-[var(--text-primary)]"
      aria-label={label}
      aria-expanded={expanded}
    >
      {expanded ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
    </button>
  );
}

function AutoGrowTextarea({
  value,
  placeholder,
  ariaLabel,
  onChange,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.max(node.scrollHeight, 74)}px`;
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={2}
      onChange={(event) => onChange(event.target.value)}
      onInput={resize}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="workspace-input min-h-[74px] resize-none leading-5"
    />
  );
}

export function ProfileExperienceImportStep({
  selectedPath,
  selectedFileName,
  selectedFileMeta,
  extractionStage,
  importError,
  timelineCompanies,
  experienceConfirmed,
  onTimelineChange,
  onConfirmTimeline,
  onBack,
  deletePreferenceStorageKey,
}: ProfileExperienceImportStepProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(() => {
    if (!deletePreferenceStorageKey || !canUseLocalStorage()) return false;
    const raw = window.localStorage.getItem(deletePreferenceStorageKey);
    return raw === 'skip';
  });
  const [pendingDelete, setPendingDelete] = useState<{
    label: string;
    nextCompanies: ExperienceTimelineCompanyDraft[];
    previousCompanies: ExperienceTimelineCompanyDraft[];
  } | null>(null);
  const [deleteDontAskAgain, setDeleteDontAskAgain] = useState(false);
  const [undoDelete, setUndoDelete] = useState<{
    label: string;
    previousCompanies: ExperienceTimelineCompanyDraft[];
  } | null>(null);

  const isResumePath = selectedPath === 'resume';
  const isProcessing = extractionStage === 'extracting_text'
    || extractionStage === 'mapping_timeline'
    || extractionStage === 'assembling_preview';

  const hasValidationErrors = useMemo(() => {
    if (timelineCompanies.length === 0) return true;
    return timelineCompanies.some(hasCompanyValidationError);
  }, [timelineCompanies]);

  useEffect(() => {
    if (!pendingDelete) return undefined;
    const timerId = window.setTimeout(() => {
      setPendingDelete(null);
      setDeleteDontAskAgain(false);
    }, TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timerId);
  }, [pendingDelete]);

  useEffect(() => {
    if (!undoDelete) return undefined;
    const timerId = window.setTimeout(() => {
      setUndoDelete(null);
    }, TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timerId);
  }, [undoDelete]);

  const persistDeletePreference = (skip: boolean) => {
    if (!deletePreferenceStorageKey || !canUseLocalStorage()) return;
    if (skip) {
      window.localStorage.setItem(deletePreferenceStorageKey, 'skip');
      return;
    }
    window.localStorage.removeItem(deletePreferenceStorageKey);
  };

  const applyTimelineChange = (nextCompanies: ExperienceTimelineCompanyDraft[]) => {
    onTimelineChange(nextCompanies.map((company) => {
      const unresolvedPlacement = Boolean(company.unresolvedPlacement) || !company.company.trim();
      const normalizedRoles = company.roles.map((role) => ({
        ...role,
        responsibilities: normalizeEditableLines(role.responsibilities),
        results: normalizeEditableLines(role.results),
      }));
      const normalizedCompany: ExperienceTimelineCompanyDraft = {
        ...company,
        unresolvedPlacement,
        roles: normalizedRoles,
        needsReview: unresolvedPlacement || hasCompanyValidationError({
          ...company,
          roles: normalizedRoles,
          needsReview: company.needsReview,
          unresolvedPlacement,
        }),
      };
      return normalizedCompany;
    }));
  };

  const requestDelete = (label: string, nextCompanies: ExperienceTimelineCompanyDraft[]) => {
    const previousSnapshot = cloneTimelineCompanies(timelineCompanies);
    setUndoDelete(null);

    if (skipDeleteConfirmation) {
      applyTimelineChange(nextCompanies);
      setUndoDelete({ label, previousCompanies: previousSnapshot });
      return;
    }

    setPendingDelete({
      label,
      nextCompanies,
      previousCompanies: previousSnapshot,
    });
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    applyTimelineChange(pendingDelete.nextCompanies);
    setUndoDelete({
      label: pendingDelete.label,
      previousCompanies: pendingDelete.previousCompanies,
    });

    if (deleteDontAskAgain) {
      setSkipDeleteConfirmation(true);
      persistDeletePreference(true);
    }

    setPendingDelete(null);
    setDeleteDontAskAgain(false);
  };

  const cancelPendingDelete = () => {
    setPendingDelete(null);
    setDeleteDontAskAgain(false);
  };

  const toggleCompanyExpanded = (companyId: string) => {
    setExpandedCompanies((previous) => ({
      ...previous,
      [companyId]: !(previous[companyId] ?? true),
    }));
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles((previous) => ({
      ...previous,
      [roleId]: !(previous[roleId] ?? true),
    }));
  };

  const addCompany = () => {
    applyTimelineChange([
      ...timelineCompanies,
      {
        id: createDraftId('company'),
        company: '',
        needsReview: true,
        unresolvedPlacement: true,
        roles: [createEmptyRole()],
      },
    ]);
  };

  const removeCompany = (companyId: string) => {
    requestDelete(
      'Company removed.',
      timelineCompanies.filter((company) => company.id !== companyId),
    );
  };

  const moveCompany = (companyIndex: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? companyIndex - 1 : companyIndex + 1;
    applyTimelineChange(moveIndex(timelineCompanies, companyIndex, nextIndex));
  };

  const addRole = (companyId: string) => {
    applyTimelineChange(
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: [...company.roles, createEmptyRole()],
        };
      }),
    );
  };

  const removeRole = (companyId: string, roleId: string) => {
    requestDelete(
      'Role removed.',
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: company.roles.filter((role) => role.id !== roleId),
        };
      }),
    );
  };

  const moveRole = (companyId: string, roleIndex: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? roleIndex - 1 : roleIndex + 1;
    applyTimelineChange(
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: moveIndex(company.roles, roleIndex, nextIndex),
        };
      }),
    );
  };

  const updateCompany = (companyId: string, value: string) => {
    applyTimelineChange(
      timelineCompanies.map((company) => (company.id === companyId
        ? { ...company, company: value, unresolvedPlacement: !value.trim() }
        : company)),
    );
  };

  const updateRole = (
    companyId: string,
    roleId: string,
    update: Partial<ExperienceTimelineRoleDraft>,
  ) => {
    applyTimelineChange(
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: company.roles.map((role) => (role.id === roleId ? { ...role, ...update } : role)),
        };
      }),
    );
  };

  const addRoleLine = (
    companyId: string,
    roleId: string,
    collection: 'responsibilities' | 'results',
  ) => {
    applyTimelineChange(
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: company.roles.map((role) => {
            if (role.id !== roleId) return role;
            return {
              ...role,
              [collection]: [...role[collection], ''],
            };
          }),
        };
      }),
    );
  };

  const updateRoleLine = (
    companyId: string,
    roleId: string,
    collection: 'responsibilities' | 'results',
    lineIndex: number,
    lineValue: string,
  ) => {
    applyTimelineChange(
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: company.roles.map((role) => {
            if (role.id !== roleId) return role;
            const nextLines = role[collection].map((line, index) => (index === lineIndex ? lineValue : line));
            return {
              ...role,
              [collection]: nextLines,
            };
          }),
        };
      }),
    );
  };

  const removeRoleLine = (
    companyId: string,
    roleId: string,
    collection: 'responsibilities' | 'results',
    lineIndex: number,
  ) => {
    requestDelete(
      collection === 'responsibilities' ? 'Responsibility removed.' : 'Result removed.',
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: company.roles.map((role) => {
            if (role.id !== roleId) return role;
            const nextLines = role[collection].filter((_, index) => index !== lineIndex);
            return {
              ...role,
              [collection]: nextLines.length > 0 ? nextLines : [''],
            };
          }),
        };
      }),
    );
  };

  const moveRoleLine = (
    companyId: string,
    roleId: string,
    collection: 'responsibilities' | 'results',
    lineIndex: number,
    direction: 'up' | 'down',
  ) => {
    const nextIndex = direction === 'up' ? lineIndex - 1 : lineIndex + 1;
    applyTimelineChange(
      timelineCompanies.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          roles: company.roles.map((role) => {
            if (role.id !== roleId) return role;
            return {
              ...role,
              [collection]: moveIndex(role[collection], lineIndex, nextIndex),
            };
          }),
        };
      }),
    );
  };

  const isCompanyExpanded = (companyId: string) => expandedCompanies[companyId] ?? true;
  const isRoleExpanded = (roleId: string) => expandedRoles[roleId] ?? true;

  const focusFirstValidationIssue = () => {
    window.requestAnimationFrame(() => {
      const root = sectionRef.current;
      if (!root) return;
      const firstInvalid = root.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus?.();
        if (typeof firstInvalid.scrollIntoView === 'function') {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      const firstError = root.querySelector<HTMLElement>('[data-validation-error="true"]');
      if (!firstError) return;
      if (typeof firstError.scrollIntoView === 'function') {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  return (
    <section ref={sectionRef} className="workspace-panel p-6 sm:p-7">
      <h1 className="text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)]">Confirm the work history we&apos;ll reuse everywhere</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
        Review this once now so every future resume, cover letter, and outreach asset starts from facts you already approved.
      </p>

      <div className="mt-5 rounded-[18px] border border-white/70 bg-white/74 p-4 shadow-[0_16px_36px_rgba(16,26,21,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">How to confirm this step</p>
        <div className="mt-2 space-y-2.5">
          {CONFIRMATION_CHECKLIST.map((item, index) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-[14px] border border-white/70 bg-white/78 px-4 py-3 shadow-[0_10px_20px_rgba(10,26,20,0.05)]"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-bg)] text-xs font-semibold text-[var(--text-primary)]">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {isResumePath && (
        <div className="mt-5 rounded-[18px] border border-[var(--border-subtle)] bg-white/92 p-4 shadow-[0_18px_30px_rgba(15,24,20,0.09)]">
          <div className="flex min-w-0 items-center gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3.5 py-3">
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2">
              <FileText size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {selectedFileName || 'No resume file attached'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {selectedFileMeta || 'Upload from Start Here to begin extraction.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedPath === 'manual' && (
        <div className="mt-5 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Manual timeline setup</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Add each company, role, month/year range, responsibilities, and results you want approved.
          </p>
        </div>
      )}

      {isProcessing && (
        <p className="mt-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          We are still organizing timeline rows. You can edit now and confirm once dates and role structure are clean.
        </p>
      )}

      {extractionStage === 'error' && (
        <p className="mt-4 rounded-[var(--radius-control)] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
          {importError || 'We could not complete timeline extraction from this file. Use manual editing to continue.'}
        </p>
      )}

      <div className="mt-5 max-h-[62vh] space-y-3 overflow-y-auto overflow-x-visible px-1 pb-4 pr-3">
        {timelineCompanies.map((company, companyIndex) => {
          const expandedCompany = isCompanyExpanded(company.id);
          const unresolvedPlacement = Boolean(company.unresolvedPlacement) || !company.company.trim();

          return (
            <div key={company.id} className="mr-0.5 rounded-[18px] border border-[var(--border-subtle)] bg-white/90 p-3 shadow-[0_14px_28px_rgba(15,25,20,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {unresolvedPlacement ? `Unresolved evidence ${companyIndex + 1}` : `Company ${companyIndex + 1}`}
                  </p>
                  {!unresolvedPlacement && company.company.trim() && (
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{company.company}</p>
                  )}
                  {unresolvedPlacement && (
                    <p className="truncate text-sm font-semibold text-[var(--status-warn-text)]">Unresolved placement</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unresolvedPlacement && (
                    <span className="rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--status-warn-text)]">
                      Needs assignment
                    </span>
                  )}
                  {company.needsReview && (
                    <span className="rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--status-warn-text)]">
                      Needs review
                    </span>
                  )}
                  <IconMoveButtons
                    onMoveUp={() => moveCompany(companyIndex, 'up')}
                    onMoveDown={() => moveCompany(companyIndex, 'down')}
                    disableUp={companyIndex === 0}
                    disableDown={companyIndex === timelineCompanies.length - 1}
                    upLabel={`Move company ${companyIndex + 1} up`}
                    downLabel={`Move company ${companyIndex + 1} down`}
                  />
                  <ExpandButton
                    expanded={expandedCompany}
                    onToggle={() => toggleCompanyExpanded(company.id)}
                    label={expandedCompany ? 'Collapse company' : 'Expand company'}
                  />
                  <button
                    type="button"
                    onClick={() => removeCompany(company.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--status-danger-border)] hover:text-[var(--status-danger-text)]"
                    aria-label="Remove company"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </div>

              {expandedCompany && (
                <>
                  {unresolvedPlacement && (
                    <p className="mt-2 rounded-[12px] border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-3 py-2 text-xs text-[var(--status-warn-text)]">
                      These lines could not be confidently placed under a company. Assign a company to resolve this evidence.
                    </p>
                  )}
                  <label className="mt-2 block text-xs font-medium text-[var(--text-secondary)]">
                    {unresolvedPlacement ? 'Assign company' : 'Company name'}
                    <input
                      type="text"
                      value={company.company}
                      onChange={(event) => updateCompany(company.id, event.target.value)}
                      className={`workspace-input mt-1.5 ${showValidation && !company.company.trim() ? 'workspace-input-danger' : ''}`}
                      placeholder="Acme Corp"
                      aria-invalid={showValidation && !company.company.trim()}
                    />
                  </label>
                  {showValidation && !company.company.trim() && (
                    <p data-validation-error="true" className="mt-1 text-xs text-[var(--status-danger-text)]">Company is required.</p>
                  )}

                  <div className="mt-3 space-y-3">
                    {company.roles.map((role, roleIndex) => {
                      const expandedRole = isRoleExpanded(role.id);
                      return (
                        <div key={role.id} className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Role {roleIndex + 1}</p>
                            <div className="flex items-center gap-2">
                              <IconMoveButtons
                                onMoveUp={() => moveRole(company.id, roleIndex, 'up')}
                                onMoveDown={() => moveRole(company.id, roleIndex, 'down')}
                                disableUp={roleIndex === 0}
                                disableDown={roleIndex === company.roles.length - 1}
                                upLabel={`Move role ${roleIndex + 1} up`}
                                downLabel={`Move role ${roleIndex + 1} down`}
                              />
                              <ExpandButton
                                expanded={expandedRole}
                                onToggle={() => toggleRoleExpanded(role.id)}
                                label={expandedRole ? 'Collapse role' : 'Expand role'}
                              />
                              <button
                                type="button"
                                onClick={() => removeRole(company.id, role.id)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--status-danger-border)] hover:text-[var(--status-danger-text)]"
                                aria-label="Remove role"
                              >
                                <Trash2 size={14} aria-hidden />
                              </button>
                            </div>
                          </div>

                          {expandedRole && (
                            <>
                              <label className="mt-2 block text-xs font-medium text-[var(--text-secondary)]">
                                Role title
                                <input
                                  type="text"
                                  value={role.title}
                                  onChange={(event) => updateRole(company.id, role.id, { title: event.target.value })}
                                  className={`workspace-input mt-1.5 ${showValidation && !role.title.trim() ? 'workspace-input-danger' : ''}`}
                                  placeholder="Marketing Director"
                                  aria-invalid={showValidation && !role.title.trim()}
                                />
                              </label>
                              {showValidation && !role.title.trim() && (
                                <p data-validation-error="true" className="mt-1 text-xs text-[var(--status-danger-text)]">Role title is required.</p>
                              )}

                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                                  Start month
                                  <input
                                    type="month"
                                    value={role.startDate}
                                    onChange={(event) => updateRole(company.id, role.id, { startDate: event.target.value })}
                                    className={`workspace-input mt-1.5 ${showValidation && !role.startDate.trim() ? 'workspace-input-danger' : ''}`}
                                    aria-invalid={showValidation && !role.startDate.trim()}
                                  />
                                </label>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                                  End month
                                  <input
                                    type="month"
                                    value={role.currentRole ? '' : role.endDate}
                                    onChange={(event) => updateRole(company.id, role.id, { endDate: event.target.value })}
                                    className={`workspace-input mt-1.5 ${showValidation && !role.currentRole && !role.endDate.trim() ? 'workspace-input-danger' : ''}`}
                                    disabled={role.currentRole}
                                    aria-invalid={showValidation && !role.currentRole && !role.endDate.trim()}
                                  />
                                </label>
                              </div>
                              {showValidation && !role.startDate.trim() && (
                                <p data-validation-error="true" className="mt-1 text-xs text-[var(--status-danger-text)]">Start month is required.</p>
                              )}
                              {showValidation && !role.currentRole && !role.endDate.trim() && (
                                <p data-validation-error="true" className="mt-1 text-xs text-[var(--status-danger-text)]">End month is required unless current role is checked.</p>
                              )}

                              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                                <input
                                  type="checkbox"
                                  checked={role.currentRole}
                                  onChange={(event) => updateRole(company.id, role.id, {
                                    currentRole: event.target.checked,
                                  })}
                                  className="h-4 w-4 rounded border-[var(--border-subtle)]"
                                />
                                Current role
                              </label>

                              <div className="mt-3 space-y-3">
                                <div className="rounded-[12px] border border-[var(--border-subtle)] bg-white/85 p-2.5">
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Responsibilities</p>
                                  <div className="mt-2 space-y-2">
                                    {role.responsibilities.map((line, lineIndex) => (
                                      <div
                                        key={`${role.id}-resp-${lineIndex}`}
                                        className="rounded-[10px] border border-[var(--border-subtle)] bg-white p-2.5"
                                      >
                                        <AutoGrowTextarea
                                          value={line}
                                          onChange={(nextValue) => updateRoleLine(company.id, role.id, 'responsibilities', lineIndex, nextValue)}
                                          placeholder="Led weekly growth planning with sales and CS"
                                          ariaLabel={`Responsibility ${lineIndex + 1}`}
                                        />
                                        <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                                          <IconMoveButtons
                                            onMoveUp={() => moveRoleLine(company.id, role.id, 'responsibilities', lineIndex, 'up')}
                                            onMoveDown={() => moveRoleLine(company.id, role.id, 'responsibilities', lineIndex, 'down')}
                                            disableUp={lineIndex === 0}
                                            disableDown={lineIndex === role.responsibilities.length - 1}
                                            upLabel="Move responsibility up"
                                            downLabel="Move responsibility down"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeRoleLine(company.id, role.id, 'responsibilities', lineIndex)}
                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--status-danger-border)] hover:text-[var(--status-danger-text)]"
                                            aria-label="Remove responsibility"
                                          >
                                            <Trash2 size={14} aria-hidden />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addRoleLine(company.id, role.id, 'responsibilities')}
                                    className="workspace-btn-secondary mt-2"
                                  >
                                    <Plus size={14} aria-hidden />
                                    Add responsibility
                                  </button>
                                </div>

                                <div className="rounded-[12px] border border-[var(--border-subtle)] bg-white/85 p-2.5">
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Results</p>
                                  <div className="mt-2 space-y-2">
                                    {role.results.map((line, lineIndex) => (
                                      <div
                                        key={`${role.id}-result-${lineIndex}`}
                                        className="rounded-[10px] border border-[var(--border-subtle)] bg-white p-2.5"
                                      >
                                        <AutoGrowTextarea
                                          value={line}
                                          onChange={(nextValue) => updateRoleLine(company.id, role.id, 'results', lineIndex, nextValue)}
                                          placeholder="Increased qualified pipeline by 48%"
                                          ariaLabel={`Result ${lineIndex + 1}`}
                                        />
                                        <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                                          <IconMoveButtons
                                            onMoveUp={() => moveRoleLine(company.id, role.id, 'results', lineIndex, 'up')}
                                            onMoveDown={() => moveRoleLine(company.id, role.id, 'results', lineIndex, 'down')}
                                            disableUp={lineIndex === 0}
                                            disableDown={lineIndex === role.results.length - 1}
                                            upLabel="Move result up"
                                            downLabel="Move result down"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeRoleLine(company.id, role.id, 'results', lineIndex)}
                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--status-danger-border)] hover:text-[var(--status-danger-text)]"
                                            aria-label="Remove result"
                                          >
                                            <Trash2 size={14} aria-hidden />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addRoleLine(company.id, role.id, 'results')}
                                    className="workspace-btn-secondary mt-2"
                                  >
                                    <Plus size={14} aria-hidden />
                                    Add result
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" onClick={() => addRole(company.id)} className="workspace-btn-secondary mt-3">
                    <Plus size={14} aria-hidden />
                    Add role
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {timelineCompanies.length === 0 && (
        <p className="mt-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          No timeline rows yet. Add a company to begin confirmation.
        </p>
      )}

      <button type="button" onClick={addCompany} className="workspace-btn-secondary mt-3">
        <Plus size={14} aria-hidden />
        Add company
      </button>

      {experienceConfirmed && (
        <p className="mt-4 rounded-[var(--radius-control)] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-3 py-2 text-sm font-medium text-[var(--status-success-text)]">
          Timeline confirmed and saved for future assets.
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="workspace-btn-secondary">
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            setShowValidation(true);
            if (hasValidationErrors) {
              setExpandedCompanies(
                Object.fromEntries(timelineCompanies.map((company) => [company.id, true])),
              );
              setExpandedRoles(
                Object.fromEntries(
                  timelineCompanies.flatMap((company) => company.roles.map((role) => [role.id, true])),
                ),
              );
              focusFirstValidationIssue();
              return;
            }
            onConfirmTimeline();
          }}
          className="workspace-btn-primary"
        >
          Confirm timeline
        </button>
      </div>

      {(pendingDelete || undoDelete) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
          <div className="pointer-events-auto w-full max-w-xl space-y-2">
            {pendingDelete && (
              <div
                data-testid="experience-delete-confirmation"
                className="rounded-[14px] border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-3.5 py-3 shadow-[0_18px_30px_rgba(34,27,12,0.2)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--status-warn-text)]">Confirm deletion</p>
                    <p className="mt-1 text-xs text-[var(--status-warn-text)]">
                      This change removes timeline evidence from this step. You can still undo immediately after deleting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={cancelPendingDelete}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--status-warn-border)] bg-white/65 text-[var(--status-warn-text)]"
                    aria-label="Dismiss delete confirmation"
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--status-warn-text)]">
                  <input
                    type="checkbox"
                    checked={deleteDontAskAgain}
                    onChange={(event) => setDeleteDontAskAgain(event.target.checked)}
                    className="h-4 w-4 rounded border-[var(--status-warn-border)]"
                  />
                  Don&apos;t ask again on this device
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={confirmPendingDelete} className="workspace-btn-primary">
                    Delete
                  </button>
                  <button type="button" onClick={cancelPendingDelete} className="workspace-btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {undoDelete && (
              <div
                data-testid="experience-delete-undo"
                className="rounded-[14px] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-3.5 py-2.5 shadow-[0_18px_30px_rgba(12,36,28,0.18)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--status-success-text)]">{undoDelete.label}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        applyTimelineChange(undoDelete.previousCompanies);
                        setUndoDelete(null);
                      }}
                      className="workspace-btn-secondary"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUndoDelete(null)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--status-success-border)] bg-white/70 text-[var(--status-success-text)]"
                      aria-label="Dismiss undo message"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

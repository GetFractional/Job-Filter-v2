import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { ImportDraft, ImportDraftItem, ImportDraftRole, ImportItemStatus } from '../../types';
import {
  addCompany,
  addRole,
  addRoleItem,
  addRoleTag,
  deleteCompany,
  deleteRole,
  deleteRoleItem,
  deleteRoleTag,
  getRoleDestinationOptions,
  moveRoleItem,
  updateCompanyName,
  updateRole,
  updateRoleItem,
  type RoleItemCollection,
} from '../../lib/importDraftMutations';

interface DigitalResumeBuilderProps {
  draft: ImportDraft;
  showAllStatuses: boolean;
  onShowAllStatusesChange: (value: boolean) => void;
  onDraftChange: (next: ImportDraft) => void;
}

interface ItemLocation {
  companyId: string;
  roleId: string;
  collection: RoleItemCollection;
  item: ImportDraftItem;
  roleTitle: string;
  companyName: string;
}

interface PendingDeleteConfirm {
  kind: 'company' | 'role';
  title: string;
  details: string;
  dontAskAgain: boolean;
  onConfirm: () => void;
}

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ItemFilterState {
  showAccepted: boolean;
  query: string;
}

const CONTAINER_DELETE_CONFIRM_KEY = 'jf2-confirm-container-delete-v1';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined'
    && typeof window.localStorage !== 'undefined'
    && typeof window.localStorage.getItem === 'function'
    && typeof window.localStorage.setItem === 'function';
}

function statusBadgeClass(status: ImportItemStatus): string {
  if (status === 'needs_attention') {
    return 'border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] text-[var(--status-warn-text)]';
  }
  if (status === 'accepted') {
    return 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]';
  }
  return 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]';
}

function statusLabel(status: ImportItemStatus): string {
  if (status === 'needs_attention') return 'Needs attention';
  if (status === 'accepted') return 'Accepted';
  return 'Excluded';
}

function shouldShowBadge(status: ImportItemStatus, showAllStatuses: boolean): boolean {
  if (showAllStatuses) return true;
  return status === 'needs_attention';
}

function formatRoleWindow(role: ImportDraftRole): string {
  if (role.startDate && role.endDate) return `${role.startDate} - ${role.endDate}`;
  if (role.startDate) return `${role.startDate} - Present`;
  if (role.endDate) return `Ends ${role.endDate}`;
  return 'No timeframe';
}

function itemKey(companyId: string, roleId: string, collection: RoleItemCollection, itemId: string): string {
  return `${companyId}::${roleId}::${collection}::${itemId}`;
}

function asDestinationValue(companyId: string, roleId: string): string {
  return `${companyId}::${roleId}`;
}

function countRoleItems(role: ImportDraftRole): number {
  return role.highlights.length + role.outcomes.length + role.tools.length + role.skills.length;
}

function matchesItemFilters(item: ImportDraftItem, filters: ItemFilterState): boolean {
  if (!filters.showAccepted && item.status !== 'needs_attention') {
    return false;
  }

  const query = filters.query.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return item.text.toLowerCase().includes(query) || (item.metric ?? '').toLowerCase().includes(query);
}

function textMatchesQuery(value: string | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function itemMatchesQuery(item: ImportDraftItem, query: string): boolean {
  return textMatchesQuery(item.text, query) || textMatchesQuery(item.metric, query);
}

function roleMatchesQuery(companyName: string, role: ImportDraftRole, query: string): { matches: boolean; count: number; containerMatch: boolean } {
  if (!query) {
    return { matches: true, count: 0, containerMatch: false };
  }

  let count = 0;
  let containerMatch = false;

  const checkContainer = [companyName, role.title, role.startDate, role.endDate ?? ''];
  for (const value of checkContainer) {
    if (textMatchesQuery(value, query)) {
      containerMatch = true;
      count += 1;
    }
  }

  for (const item of role.highlights) {
    if (itemMatchesQuery(item, query)) count += 1;
  }
  for (const item of role.outcomes) {
    if (itemMatchesQuery(item, query)) count += 1;
  }
  for (const item of role.tools) {
    if (textMatchesQuery(item.text, query)) count += 1;
  }
  for (const item of role.skills) {
    if (textMatchesQuery(item.text, query)) count += 1;
  }

  return {
    matches: count > 0,
    count,
    containerMatch,
  };
}

function TagEditor({
  label,
  placeholder,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  items: ImportDraftItem[];
  onAdd: (value: string) => void;
  onRemove: (itemId: string) => void;
}) {
  const [draftValue, setDraftValue] = useState('');

  const commit = () => {
    const value = draftValue.trim();
    if (!value) return;
    onAdd(value);
    setDraftValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-2.5 py-2">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[var(--text-primary)]"
            >
              {item.text}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label={`Remove ${label} value ${item.text}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent p-0 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>
    </div>
  );
}

function ItemEditor({
  item,
  roleLabel,
  showAccepted,
  collection,
  moveDestination,
  onMoveDestinationChange,
  destinationOptions,
  selected,
  onSelectedChange,
  focusTarget,
  onTextChange,
  onMetricChange,
  onMove,
  onDelete,
}: {
  item: ImportDraftItem;
  roleLabel: string;
  showAccepted: boolean;
  collection: Extract<RoleItemCollection, 'highlights' | 'outcomes'>;
  moveDestination: string;
  onMoveDestinationChange: (value: string) => void;
  destinationOptions: Array<{ value: string; label: string }>;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  focusTarget?: 'item' | null;
  onTextChange: (value: string) => void;
  onMetricChange?: (value: string) => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-3" data-testid={`item-editor-${item.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <input type="checkbox" checked={selected} onChange={(event) => onSelectedChange(event.target.checked)} />
            Select
          </label>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{collection === 'highlights' ? 'Highlight' : 'Outcome'}</p>
        </div>
        <div className="flex items-center gap-2">
          {shouldShowBadge(item.status, showAccepted) && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(item.status)}`}>
              {statusLabel(item.status)}
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            Delete
          </button>
        </div>
      </div>

      <textarea
        data-item-input-id={item.id}
        value={item.text}
        onChange={(event) => onTextChange(event.target.value)}
        rows={2}
        className={`w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${focusTarget === 'item' ? 'ring-2 ring-[var(--accent-soft)]' : ''}`}
        placeholder={collection === 'highlights' ? 'Describe the work delivered' : 'Describe measurable impact'}
      />

      {collection === 'outcomes' && (
        <input
          type="text"
          value={item.metric ?? ''}
          onChange={(event) => onMetricChange?.(event.target.value)}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          placeholder="Metric (optional), for example 42% or $1.2M"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[var(--text-muted)]">Move from {roleLabel}</span>
        <select
          data-testid={`move-select-${item.id}`}
          value={moveDestination}
          onChange={(event) => onMoveDestinationChange(event.target.value)}
          className="min-w-[220px] rounded-lg border border-[var(--border-subtle)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
        >
          {destinationOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          data-testid={`move-button-${item.id}`}
          type="button"
          onClick={onMove}
          disabled={!moveDestination}
          className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          Move
        </button>
      </div>
    </div>
  );
}

export function DigitalResumeBuilder({ draft, showAllStatuses, onShowAllStatusesChange, onDraftChange }: DigitalResumeBuilderProps) {
  const [unassignedOpen, setUnassignedOpen] = useState(false);
  const [moveDestinations, setMoveDestinations] = useState<Record<string, string>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});
  const [bulkDestination, setBulkDestination] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingDeleteConfirm, setPendingDeleteConfirm] = useState<PendingDeleteConfirm | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ type: 'company' | 'role' | 'item'; id: string } | null>(null);
  const [highlightTarget, setHighlightTarget] = useState<{ type: 'company' | 'role'; id: string } | null>(null);
  const [askBeforeContainerDelete, setAskBeforeContainerDelete] = useState<boolean>(() => {
    if (!canUseLocalStorage()) return true;
    return window.localStorage.getItem(CONTAINER_DELETE_CONFIRM_KEY) !== 'skip';
  });
  const undoTimeoutRef = useRef<number | null>(null);

  const itemFilters = useMemo<ItemFilterState>(() => ({
    showAccepted: showAllStatuses,
    query: filterQuery,
  }), [filterQuery, showAllStatuses]);
  const searchQuery = filterQuery.trim().toLowerCase();
  const searchActive = searchQuery.length > 0;

  useEffect(() => () => {
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!focusTarget) return;
    const selector = focusTarget.type === 'company'
      ? `[data-company-input-id="${focusTarget.id}"]`
      : focusTarget.type === 'role'
        ? `[data-role-input-id="${focusTarget.id}"]`
        : `[data-item-input-id="${focusTarget.id}"]`;

    const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (element) {
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      element.focus();
      if ('select' in element && typeof element.select === 'function') {
        element.select();
      }
    }
    setFocusTarget(null);
  }, [draft, focusTarget]);

  useEffect(() => {
    if (!searchActive) return;
    setUnassignedOpen(true);
  }, [searchActive]);

  const assignedCompanies = useMemo(
    () => draft.companies.filter((company) => company.name.trim().toLowerCase() !== 'unassigned'),
    [draft],
  );
  const unassignedCompanies = useMemo(
    () => draft.companies.filter((company) => company.name.trim().toLowerCase() === 'unassigned'),
    [draft],
  );

  const destinationOptions = useMemo(() => {
    return getRoleDestinationOptions(draft, false).map((option) => ({
      value: asDestinationValue(option.companyId, option.roleId),
      label: option.label,
      companyId: option.companyId,
      roleId: option.roleId,
    }));
  }, [draft]);

  const destinationLookup = useMemo(() => {
    const lookup = new Map<string, { companyId: string; roleId: string }>();
    for (const option of destinationOptions) {
      lookup.set(option.value, { companyId: option.companyId, roleId: option.roleId });
    }
    return lookup;
  }, [destinationOptions]);

  const unassignedItems = useMemo<ItemLocation[]>(() => {
    const items: ItemLocation[] = [];

    for (const company of unassignedCompanies) {
      for (const role of company.roles) {
        for (const item of role.highlights) {
          items.push({ companyId: company.id, roleId: role.id, collection: 'highlights', item, roleTitle: role.title, companyName: company.name });
        }
        for (const item of role.outcomes) {
          items.push({ companyId: company.id, roleId: role.id, collection: 'outcomes', item, roleTitle: role.title, companyName: company.name });
        }
      }
    }

    return items;
  }, [unassignedCompanies]);

  const allItemLocations = useMemo<ItemLocation[]>(() => {
    const items: ItemLocation[] = [];
    for (const company of draft.companies) {
      for (const role of company.roles) {
        for (const item of role.highlights) {
          items.push({
            companyId: company.id,
            roleId: role.id,
            collection: 'highlights',
            item,
            roleTitle: role.title,
            companyName: company.name,
          });
        }
        for (const item of role.outcomes) {
          items.push({
            companyId: company.id,
            roleId: role.id,
            collection: 'outcomes',
            item,
            roleTitle: role.title,
            companyName: company.name,
          });
        }
      }
    }
    return items;
  }, [draft.companies]);

  const selectedItems = useMemo(
    () =>
      allItemLocations.filter((location) =>
        Boolean(selectedItemIds[itemKey(location.companyId, location.roleId, location.collection, location.item.id)]),
      ),
    [allItemLocations, selectedItemIds],
  );

  const selectedItemCount = selectedItems.length;
  const selectedUnassignedCount = useMemo(
    () =>
      unassignedItems.filter((location) =>
        Boolean(selectedItemIds[itemKey(location.companyId, location.roleId, location.collection, location.item.id)]),
      ).length,
    [selectedItemIds, unassignedItems],
  );

  const applyMutation = (mutate: (current: ImportDraft) => ImportDraft) => {
    const next = mutate(draft);
    onDraftChange(next);
  };

  const clearUndoTimer = () => {
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  const showToast = (nextToast: ToastState | null, timeoutMs = 3500) => {
    clearUndoTimer();
    setToast(nextToast);

    if (!nextToast || timeoutMs <= 0) {
      return;
    }

    undoTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      undoTimeoutRef.current = null;
    }, timeoutMs);
  };

  const queueUndoDelete = (previousDraft: ImportDraft, label: string) => {
    showToast({
      message: label,
      actionLabel: 'Undo',
      onAction: () => {
        onDraftChange(previousDraft);
        setSelectedItemIds({});
        showToast({ message: `${label} undone` });
      },
    }, 10000);
  };

  const resolveMoveValue = (key: string, fallback = destinationOptions[0]?.value ?? ''): string => {
    return moveDestinations[key] ?? fallback;
  };

  const searchResultCount = useMemo(() => {
    if (!searchActive) return 0;
    let count = 0;
    for (const company of draft.companies) {
      for (const role of company.roles) {
        count += roleMatchesQuery(company.name, role, searchQuery).count;
      }
    }
    return count;
  }, [draft.companies, searchActive, searchQuery]);

  const renderRoleBlock = (companyId: string, companyName: string, role: ImportDraftRole, unassigned = false) => {
    const roleDestinationLabel = `${companyName} • ${role.title || 'Untitled role'}`;

    const roleOptions = destinationOptions.filter((destination) => {
      if (destination.companyId === companyId && destination.roleId === role.id) {
        return false;
      }
      return true;
    });

    const roleSearchMatch = roleMatchesQuery(companyName, role, searchQuery);
    if (searchActive && !roleSearchMatch.matches) {
      return null;
    }

    const visibleHighlights = role.highlights.filter((item) => {
      if (!matchesItemFilters(item, itemFilters)) return false;
      if (!searchActive) return true;
      return itemMatchesQuery(item, searchQuery) || roleSearchMatch.containerMatch;
    });
    const visibleOutcomes = role.outcomes.filter((item) => {
      if (!matchesItemFilters(item, itemFilters)) return false;
      if (!searchActive) return true;
      return itemMatchesQuery(item, searchQuery) || roleSearchMatch.containerMatch;
    });

    return (
      <div
        key={role.id}
        className={`space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3 ${highlightTarget?.type === 'role' && highlightTarget.id === role.id ? 'ring-2 ring-[var(--accent-soft)]' : ''}`}
      >
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            data-role-input-id={role.id}
            type="text"
            value={role.title}
            onChange={(event) => {
              applyMutation((current) => updateRole(current, { companyId, roleId: role.id }, { title: event.target.value }));
            }}
            placeholder="Role title"
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <input
            type="text"
            value={role.startDate}
            onChange={(event) => {
              applyMutation((current) => updateRole(current, { companyId, roleId: role.id }, { startDate: event.target.value }));
            }}
            placeholder="Start"
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <input
            type="text"
            value={role.endDate ?? ''}
            onChange={(event) => {
              applyMutation((current) => updateRole(current, { companyId, roleId: role.id }, { endDate: event.target.value }));
            }}
            placeholder="End / Present"
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <div className="flex items-center gap-2">
            {shouldShowBadge(role.status, showAllStatuses) && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(role.status)}`}>
                {statusLabel(role.status)}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const execute = () => {
                  applyMutation((current) => deleteRole(current, { companyId, roleId: role.id }));
                  setSelectedItemIds({});
                  showToast({ message: 'Role deleted' });
                };

                if (!askBeforeContainerDelete) {
                  execute();
                  return;
                }

                setPendingDeleteConfirm({
                  kind: 'role',
                  title: 'Delete role?',
                  details: `This removes 1 role and ${countRoleItems(role)} items.`,
                  dontAskAgain: false,
                  onConfirm: execute,
                });
              }}
              className="rounded-md border border-[var(--border-subtle)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-bg)]"
              aria-label={`Delete role ${role.title || 'Untitled role'}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-muted)]">{formatRoleWindow(role)}</p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = addRoleItem(draft, { companyId, roleId: role.id }, 'highlights');
              const nextRole = next.companies.find((company) => company.id === companyId)?.roles.find((entry) => entry.id === role.id);
              const nextItemId = nextRole?.highlights[0]?.id;
              onDraftChange(next);
              if (nextItemId) {
                setFocusTarget({ type: 'item', id: nextItemId });
              }
              showToast({ message: 'Highlight added' });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-bg)]"
          >
            <Plus size={12} /> Add Highlight
          </button>
          <button
            type="button"
            onClick={() => {
              const next = addRoleItem(draft, { companyId, roleId: role.id }, 'outcomes');
              const nextRole = next.companies.find((company) => company.id === companyId)?.roles.find((entry) => entry.id === role.id);
              const nextItemId = nextRole?.outcomes[0]?.id;
              onDraftChange(next);
              if (nextItemId) {
                setFocusTarget({ type: 'item', id: nextItemId });
              }
              showToast({ message: 'Outcome added' });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-bg)]"
          >
            <Plus size={12} /> Add Outcome
          </button>
        </div>

        <div className="space-y-2">
          {visibleHighlights.map((item) => {
            const key = itemKey(companyId, role.id, 'highlights', item.id);
            const fallbackMoveValue = roleOptions[0]?.value ?? '';

            return (
              <ItemEditor
                key={item.id}
                item={item}
                roleLabel={roleDestinationLabel}
                showAccepted={showAllStatuses}
                collection="highlights"
                destinationOptions={roleOptions}
                selected={Boolean(selectedItemIds[key])}
                onSelectedChange={(checked) => setSelectedItemIds((current) => ({ ...current, [key]: checked }))}
                focusTarget={focusTarget?.type === 'item' && focusTarget.id === item.id ? 'item' : null}
                moveDestination={resolveMoveValue(key, fallbackMoveValue)}
                onMoveDestinationChange={(value) => setMoveDestinations((current) => ({ ...current, [key]: value }))}
                onTextChange={(value) => {
                  applyMutation((current) => updateRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'highlights',
                    itemId: item.id,
                  }, { text: value }));
                }}
                onMove={() => {
                  const targetValue = resolveMoveValue(key, fallbackMoveValue);
                  const target = destinationLookup.get(targetValue);
                  if (!target) return;
                  applyMutation((current) => moveRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'highlights',
                    itemId: item.id,
                  }, target));
                }}
                onDelete={() => {
                  const previousDraft = draft;
                  applyMutation((current) => deleteRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'highlights',
                    itemId: item.id,
                  }));
                  setSelectedItemIds((current) => ({ ...current, [key]: false }));
                  queueUndoDelete(previousDraft, 'Highlight deleted');
                }}
              />
            );
          })}

          {visibleOutcomes.map((item) => {
            const key = itemKey(companyId, role.id, 'outcomes', item.id);
            const fallbackMoveValue = roleOptions[0]?.value ?? '';

            return (
              <ItemEditor
                key={item.id}
                item={item}
                roleLabel={roleDestinationLabel}
                showAccepted={showAllStatuses}
                collection="outcomes"
                destinationOptions={roleOptions}
                selected={Boolean(selectedItemIds[key])}
                onSelectedChange={(checked) => setSelectedItemIds((current) => ({ ...current, [key]: checked }))}
                focusTarget={focusTarget?.type === 'item' && focusTarget.id === item.id ? 'item' : null}
                moveDestination={resolveMoveValue(key, fallbackMoveValue)}
                onMoveDestinationChange={(value) => setMoveDestinations((current) => ({ ...current, [key]: value }))}
                onTextChange={(value) => {
                  applyMutation((current) => updateRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'outcomes',
                    itemId: item.id,
                  }, { text: value }));
                }}
                onMetricChange={(value) => {
                  applyMutation((current) => updateRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'outcomes',
                    itemId: item.id,
                  }, { metric: value }));
                }}
                onMove={() => {
                  const targetValue = resolveMoveValue(key, fallbackMoveValue);
                  const target = destinationLookup.get(targetValue);
                  if (!target) return;
                  applyMutation((current) => moveRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'outcomes',
                    itemId: item.id,
                  }, target));
                }}
                onDelete={() => {
                  const previousDraft = draft;
                  applyMutation((current) => deleteRoleItem(current, {
                    companyId,
                    roleId: role.id,
                    collection: 'outcomes',
                    itemId: item.id,
                  }));
                  setSelectedItemIds((current) => ({ ...current, [key]: false }));
                  queueUndoDelete(previousDraft, 'Outcome deleted');
                }}
              />
            );
          })}

          {visibleHighlights.length + visibleOutcomes.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-white px-3 py-2 text-xs text-[var(--text-muted)]">
              {showAllStatuses
                ? 'No highlights or outcomes match this filter.'
                : 'No needs-attention highlights or outcomes in this role. Uncheck “Needs attention only” to review everything.'}
            </p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TagEditor
            label="Tools"
            placeholder="Type a tool and press Enter"
            items={role.tools}
            onAdd={(value) => applyMutation((current) => addRoleTag(current, { companyId, roleId: role.id }, 'tools', value))}
            onRemove={(itemId) => applyMutation((current) => deleteRoleTag(current, {
              companyId,
              roleId: role.id,
              collection: 'tools',
              itemId,
            }))}
          />
          <TagEditor
            label="Skills"
            placeholder="Type a skill and press Enter"
            items={role.skills}
            onAdd={(value) => applyMutation((current) => addRoleTag(current, { companyId, roleId: role.id }, 'skills', value))}
            onRemove={(itemId) => applyMutation((current) => deleteRoleTag(current, {
              companyId,
              roleId: role.id,
              collection: 'skills',
              itemId,
            }))}
          />
        </div>

        {unassigned && (
          <div className="rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-2 text-[11px] text-[var(--status-warn-text)]">
            This role still needs assignment. Use the controls below to move highlights and outcomes into a named company and role.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="digital-resume-builder">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Resume Review</h4>
          <p className="text-xs text-[var(--text-secondary)]">Edit companies, roles, highlights, outcomes, tools, and skills before saving.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = addCompany(draft);
              const nextCompanyId = next.companies[0]?.id;
              onDraftChange(next);
              if (nextCompanyId) {
                setHighlightTarget({ type: 'company', id: nextCompanyId });
                setFocusTarget({ type: 'company', id: nextCompanyId });
                window.setTimeout(() => setHighlightTarget(null), 1200);
              }
              showToast({ message: 'Company added' });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          >
            <Plus size={13} /> Add Company
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3 py-2.5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1 text-[11px] text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={!showAllStatuses}
              onChange={(event) => onShowAllStatusesChange(!event.target.checked)}
            />
            Needs attention only
          </label>
          <input
            type="search"
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder="Search companies, roles, highlights, outcomes, tools, skills"
            className="min-w-[220px] flex-1 rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {searchActive && (
            <span className="text-[11px] text-[var(--text-muted)]">{searchResultCount} results</span>
          )}
          {searchActive && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="rounded-lg border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            >
              Clear
            </button>
          )}
          <select
            value={bulkDestination || destinationOptions[0]?.value || ''}
            onChange={(event) => setBulkDestination(event.target.value)}
            className="min-w-[220px] rounded-lg border border-[var(--border-subtle)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
          >
            {destinationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={selectedItemCount === 0}
            onClick={() => {
              applyMutation((current) => {
                let next = current;
                for (const selected of selectedItems) {
                  next = updateRoleItem(next, {
                    companyId: selected.companyId,
                    roleId: selected.roleId,
                    collection: selected.collection,
                    itemId: selected.item.id,
                  }, { status: 'accepted' });
                }
                return next;
              });
              setSelectedItemIds({});
              showToast({ message: 'Selected items marked accepted' });
            }}
            className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            Mark selected accepted ({selectedItemCount})
          </button>
          <button
            type="button"
            disabled={selectedItemCount === 0 || destinationOptions.length === 0}
            onClick={() => {
              const target = destinationLookup.get(bulkDestination || destinationOptions[0]?.value || '');
              if (!target) return;

              applyMutation((current) => {
                let next = current;
                for (const selected of selectedItems) {
                  next = moveRoleItem(next, {
                    companyId: selected.companyId,
                    roleId: selected.roleId,
                    collection: selected.collection,
                    itemId: selected.item.id,
                  }, target);
                }
                return next;
              });
              setSelectedItemIds({});
              showToast({ message: 'Selected items moved' });
            }}
            className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            Move selected to...
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Import controls are above. Review controls are here, then edit in the list below.
        </p>
      </div>

      {assignedCompanies.length === 0 && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          Add a company to begin organizing your experience.
        </div>
      )}

      <div className="space-y-4">
        {assignedCompanies.map((company) => {
          const visibleRoles = company.roles.filter((role) => {
            if (!searchActive) return true;
            return roleMatchesQuery(company.name, role, searchQuery).matches;
          });

          if (searchActive && visibleRoles.length === 0) {
            return null;
          }

          return (
            <section
              key={company.id}
              className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4 space-y-3 ${highlightTarget?.type === 'company' && highlightTarget.id === company.id ? 'ring-2 ring-[var(--accent-soft)]' : ''}`}
            >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-[240px] flex-1 items-center gap-2">
                <input
                  data-company-input-id={company.id}
                  type="text"
                  value={company.name}
                  onChange={(event) => applyMutation((current) => updateCompanyName(current, company.id, event.target.value))}
                  placeholder="Company name"
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
                {shouldShowBadge(company.status, showAllStatuses) && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(company.status)}`}>
                    {statusLabel(company.status)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = addRole(draft, company.id);
                    const newRoleId = next.companies.find((entry) => entry.id === company.id)?.roles[0]?.id;
                    onDraftChange(next);
                    if (newRoleId) {
                      setHighlightTarget({ type: 'role', id: newRoleId });
                      setFocusTarget({ type: 'role', id: newRoleId });
                      window.setTimeout(() => setHighlightTarget(null), 1200);
                    }
                    showToast({ message: 'Role added' });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  <Plus size={12} /> Add Role
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const execute = () => {
                      applyMutation((current) => deleteCompany(current, company.id));
                      setSelectedItemIds({});
                      showToast({ message: 'Company deleted' });
                    };

                    if (!askBeforeContainerDelete) {
                      execute();
                      return;
                    }

                    const totalRoles = company.roles.length;
                    const totalItems = company.roles.reduce((sum, role) => sum + countRoleItems(role), 0);
                    setPendingDeleteConfirm({
                      kind: 'company',
                      title: 'Delete company?',
                      details: `This removes ${totalRoles} role${totalRoles === 1 ? '' : 's'} and ${totalItems} items.`,
                      dontAskAgain: false,
                      onConfirm: execute,
                    });
                  }}
                  className="rounded-lg border border-[var(--border-subtle)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                  aria-label={`Delete company ${company.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {visibleRoles.map((role) => renderRoleBlock(company.id, company.name, role))}
            </div>
            </section>
          );
        })}
      </div>

      {unassignedCompanies.length > 0 && (
        <section className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)]">
          <button
            type="button"
            onClick={() => setUnassignedOpen((open) => !open)}
            data-testid="unassigned-toggle"
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--status-warn-text)]">Unassigned</p>
              <p className="text-xs text-[var(--status-warn-text)]/85">{unassignedItems.length} highlights or outcomes need assignment</p>
            </div>
            {unassignedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {unassignedOpen && (
            <div className="border-t border-[var(--status-warn-border)] px-4 py-3 space-y-3">
              {destinationOptions.length === 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-[var(--status-warn-border)] bg-white p-3 text-xs text-[var(--status-warn-text)]">
                  <AlertTriangle size={14} className="mt-0.5" />
                  <p>Add at least one named company and role, then assign unassigned highlights and outcomes.</p>
                </div>
              )}

              {destinationOptions.length > 0 && unassignedItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--status-warn-border)] bg-white p-2.5">
                  <select
                    data-testid="assign-selected-destination"
                    value={bulkDestination || destinationOptions[0].value}
                    onChange={(event) => setBulkDestination(event.target.value)}
                    className="min-w-[220px] rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    {destinationOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={selectedUnassignedCount === 0}
                    data-testid="assign-selected-button"
                    onClick={() => {
                      const target = destinationLookup.get(bulkDestination || destinationOptions[0].value);
                      if (!target) return;

                      applyMutation((current) => {
                        let next = current;
                        for (const item of unassignedItems) {
                          const key = itemKey(item.companyId, item.roleId, item.collection, item.item.id);
                          if (!selectedItemIds[key]) continue;
                          next = moveRoleItem(next, {
                            companyId: item.companyId,
                            roleId: item.roleId,
                            collection: item.collection,
                            itemId: item.item.id,
                          }, target);
                        }
                        return next;
                      });

                      setSelectedItemIds({});
                      showToast({ message: 'Selected unassigned items moved' });
                    }}
                    className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                  >
                    Assign selected ({selectedUnassignedCount})
                  </button>
                </div>
              )}

              {unassignedCompanies.map((company) => (
                <div key={company.id} className="space-y-3">
                  {company.roles.map((role) => {
                    const roleSearchMatch = roleMatchesQuery(company.name, role, searchQuery);
                    if (searchActive && !roleSearchMatch.matches) {
                      return null;
                    }

                    const visibleUnassignedItems = [...role.highlights, ...role.outcomes].filter((item) => {
                      if (!matchesItemFilters(item, itemFilters)) return false;
                      if (!searchActive) return true;
                      return itemMatchesQuery(item, searchQuery) || roleSearchMatch.containerMatch;
                    });

                    if (searchActive && visibleUnassignedItems.length === 0 && !roleSearchMatch.containerMatch) {
                      return null;
                    }

                    return (
                      <div key={role.id} className="space-y-2 rounded-lg border border-[var(--status-warn-border)] bg-white p-3">
                      <p className="text-xs font-medium text-[var(--status-warn-text)]">{company.name} • {role.title || 'Unassigned role'} ({formatRoleWindow(role)})</p>

                      {visibleUnassignedItems
                        .map((item) => {
                        const collection: RoleItemCollection = item.type === 'outcome' ? 'outcomes' : 'highlights';
                        const key = itemKey(company.id, role.id, collection, item.id);
                        const optionValue = resolveMoveValue(key, destinationOptions[0]?.value ?? '');

                        return (
                          <div key={item.id} className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedItemIds[key])}
                                  onChange={(event) => setSelectedItemIds((current) => ({
                                    ...current,
                                    [key]: event.target.checked,
                                  }))}
                                />
                                Select
                              </label>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(item.status)}`}>
                                {statusLabel(item.status)}
                              </span>
                            </div>

                            <textarea
                              value={item.text}
                              onChange={(event) => {
                                applyMutation((current) => updateRoleItem(current, {
                                  companyId: company.id,
                                  roleId: role.id,
                                  collection,
                                  itemId: item.id,
                                }, { text: event.target.value }));
                              }}
                              rows={2}
                              className="w-full rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)]"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                data-testid={`assign-select-${item.id}`}
                                value={optionValue}
                                onChange={(event) => setMoveDestinations((current) => ({ ...current, [key]: event.target.value }))}
                                className="min-w-[220px] rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                              >
                                {destinationOptions.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const target = destinationLookup.get(optionValue);
                                  if (!target) return;
                                  applyMutation((current) => moveRoleItem(current, {
                                    companyId: company.id,
                                    roleId: role.id,
                                    collection,
                                    itemId: item.id,
                                  }, target));
                                  setSelectedItemIds((current) => ({ ...current, [key]: false }));
                                  showToast({ message: 'Item assigned' });
                                }}
                              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                              >
                                Assign to...
                              </button>
                            </div>
                          </div>
                        );
                        })}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {pendingDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-white p-4 shadow-lg space-y-3">
            <h5 className="text-sm font-semibold text-[var(--text-primary)]">{pendingDeleteConfirm.title}</h5>
            <p className="text-xs text-[var(--text-secondary)]">{pendingDeleteConfirm.details}</p>
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={pendingDeleteConfirm.dontAskAgain}
                onChange={(event) =>
                  setPendingDeleteConfirm((current) =>
                    current
                      ? {
                          ...current,
                          dontAskAgain: event.target.checked,
                        }
                      : current,
                  )
                }
              />
              Don&apos;t ask again on this device
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteConfirm(null)}
                className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  pendingDeleteConfirm.onConfirm();
                  if (pendingDeleteConfirm.dontAskAgain) {
                    setAskBeforeContainerDelete(false);
                    if (canUseLocalStorage()) {
                      window.localStorage.setItem(CONTAINER_DELETE_CONFIRM_KEY, 'skip');
                    }
                  }
                  setPendingDeleteConfirm(null);
                }}
                className="rounded-lg bg-[var(--status-danger-text)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 shadow-2xl">
          <div className="flex items-center gap-3 text-xs text-neutral-100">
            <span>{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white hover:bg-white/20"
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-neutral-300 hover:text-white"
              aria-label="Dismiss notice"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

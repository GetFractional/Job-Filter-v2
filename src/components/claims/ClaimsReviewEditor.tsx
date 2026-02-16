import { useMemo } from 'react';
import { AlertTriangle, Check, Scissors, GitMerge, X } from 'lucide-react';
import {
  groupClaimReviewItems,
  mergeReviewItems,
  regroupClaimReviewItems,
  splitReviewItem,
  type ClaimReviewItem,
  type ClaimReviewStatus,
} from '../../lib/claimsReview';

interface ClaimsReviewEditorProps {
  items: ClaimReviewItem[];
  onChange: (items: ClaimReviewItem[]) => void;
  onApprove: () => void | Promise<void>;
  onDiscard: () => void;
  approving?: boolean;
  approveLabel?: string;
}

const STATUS_STYLES: Record<ClaimReviewStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
  conflict: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<ClaimReviewStatus, string> = {
  active: 'Active',
  needs_review: 'Needs Review',
  conflict: 'Conflict',
};

function updateItem(
  items: ClaimReviewItem[],
  id: string,
  patch: Partial<ClaimReviewItem>
): ClaimReviewItem[] {
  return regroupClaimReviewItems(
    items.map((item) => (item.id === id ? { ...item, ...patch } : item))
  );
}

export function ClaimsReviewEditor({
  items,
  onChange,
  onApprove,
  onDiscard,
  approving = false,
  approveLabel = 'Approve & Save',
}: ClaimsReviewEditorProps) {
  const groups = useMemo(() => groupClaimReviewItems(items), [items]);
  const selectedCount = useMemo(() => items.filter((item) => item.included).length, [items]);

  const handleSplit = (itemId: string) => {
    const index = items.findIndex((item) => item.id === itemId);
    if (index < 0) return;

    const target = items[index];
    const splitItems = splitReviewItem(target);
    if (splitItems.length <= 1) return;

    const next = [
      ...items.slice(0, index),
      ...splitItems,
      ...items.slice(index + 1),
    ];

    onChange(regroupClaimReviewItems(next));
  };

  const handleMergeWithPrevious = (itemId: string) => {
    const index = items.findIndex((item) => item.id === itemId);
    if (index <= 0) return;

    const previous = items[index - 1];
    const current = items[index];

    const sameGroup =
      previous.company === current.company &&
      previous.role === current.role &&
      previous.startDate === current.startDate &&
      previous.endDate === current.endDate;

    if (!sameGroup) return;

    const merged = mergeReviewItems(previous, current);
    const next = [
      ...items.slice(0, index - 1),
      merged,
      ...items.slice(index + 1),
    ];

    onChange(regroupClaimReviewItems(next));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-h3 text-neutral-900">Review & Commit Claims</h3>
          <p className="text-xs text-neutral-500">
            {selectedCount} of {items.length} claims selected for import.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <AlertTriangle size={12} className="text-amber-600" />
          Conflicts and needs review default to not auto-use.
        </div>
      </div>

      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.key} className="rounded-lg border border-neutral-200 bg-white">
            <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-50">
              <p className="text-xs font-semibold text-neutral-700">{group.company}</p>
              <p className="text-[11px] text-neutral-500">{group.role} • {group.timeframe}</p>
            </div>

            <div className="divide-y divide-neutral-100">
              {group.items.map((item) => {
                const statusStyle = STATUS_STYLES[item.status];
                const statusLabel = STATUS_LABELS[item.status];

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={item.included}
                          onChange={() => onChange(updateItem(items, item.id, { included: !item.included }))}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500/30"
                        />
                        Include
                      </label>

                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusStyle}`}>
                        {statusLabel}
                      </span>

                      <label className="inline-flex items-center gap-2 text-[11px] text-neutral-600 ml-auto">
                        <input
                          type="checkbox"
                          checked={item.autoUse}
                          onChange={() => onChange(updateItem(items, item.id, { autoUse: !item.autoUse }))}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500/30"
                        />
                        Auto-use in assets/scoring
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Company</label>
                        <input
                          value={item.company}
                          onChange={(event) => onChange(updateItem(items, item.id, { company: event.target.value }))}
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Role</label>
                        <input
                          value={item.role}
                          onChange={(event) => onChange(updateItem(items, item.id, { role: event.target.value }))}
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Start Date</label>
                        <input
                          value={item.startDate}
                          onChange={(event) => onChange(updateItem(items, item.id, { startDate: event.target.value }))}
                          placeholder="Jan 2021"
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">End Date</label>
                        <input
                          value={item.endDate}
                          onChange={(event) => onChange(updateItem(items, item.id, { endDate: event.target.value }))}
                          placeholder="Present"
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Raw Snippet</label>
                      <textarea
                        value={item.rawSnippet}
                        onChange={(event) => onChange(updateItem(items, item.id, { rawSnippet: event.target.value }))}
                        rows={2}
                        className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Normalized Claim Text</label>
                      <textarea
                        value={item.claimText}
                        onChange={(event) => onChange(updateItem(items, item.id, { claimText: event.target.value }))}
                        rows={2}
                        className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Metric Value</label>
                        <input
                          value={item.metricValue}
                          onChange={(event) => onChange(updateItem(items, item.id, { metricValue: event.target.value }))}
                          placeholder="40"
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Metric Unit</label>
                        <input
                          value={item.metricUnit}
                          onChange={(event) => onChange(updateItem(items, item.id, { metricUnit: event.target.value }))}
                          placeholder="%"
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Metric Context</label>
                        <input
                          value={item.metricContext}
                          onChange={(event) => onChange(updateItem(items, item.id, { metricContext: event.target.value }))}
                          placeholder="Qualified pipeline"
                          className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSplit(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] border border-neutral-200 rounded-md text-neutral-700 hover:bg-neutral-50"
                      >
                        <Scissors size={12} />
                        Split by semicolon
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMergeWithPrevious(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] border border-neutral-200 rounded-md text-neutral-700 hover:bg-neutral-50"
                      >
                        <GitMerge size={12} />
                        Merge with previous
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDiscard}
          className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 inline-flex items-center justify-center gap-2"
        >
          <X size={14} />
          Discard
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={approving || selectedCount === 0}
          className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {approving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check size={14} />
              {approveLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

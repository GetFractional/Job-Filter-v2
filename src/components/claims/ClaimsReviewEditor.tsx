import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, GitMerge, Scissors, X } from 'lucide-react';
import {
  canMergeWithPrevious,
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
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSplit = (itemId: string) => {
    const index = items.findIndex((item) => item.id === itemId);
    if (index < 0) return;

    const target = items[index];
    const splitResult = splitReviewItem(target);
    if (splitResult.items.length <= 1) {
      setFeedback(splitResult.reason || 'No bullet boundaries found.');
      return;
    }

    const next = [
      ...items.slice(0, index),
      ...splitResult.items,
      ...items.slice(index + 1),
    ];

    onChange(regroupClaimReviewItems(next));
    setFeedback(`Split into ${splitResult.items.length} bullets.`);
  };

  const handleMergeWithPrevious = (itemId: string) => {
    const index = items.findIndex((item) => item.id === itemId);
    if (index <= 0) {
      setFeedback('Nothing above this bullet to merge.');
      return;
    }

    const previous = items[index - 1];
    const current = items[index];
    if (!canMergeWithPrevious(previous, current)) {
      setFeedback('Merge is only available when company, role, and dates match.');
      return;
    }

    const merged = mergeReviewItems(previous, current);
    const next = [
      ...items.slice(0, index - 1),
      merged,
      ...items.slice(index + 1),
    ];

    onChange(regroupClaimReviewItems(next));
    setFeedback('Merged with previous bullet.');
  };

  const actionButtons = (sticky = false) => (
    <div
      className={
        sticky
          ? 'sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-neutral-200 px-3 py-3 -mx-3 sm:-mx-0 sm:px-0 sm:py-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none'
          : ''
      }
    >
      <div className="flex flex-col sm:flex-row gap-2">
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-h3 text-neutral-900">Resume Review</h3>
          <p className="text-xs text-neutral-500">
            {selectedCount} of {items.length} bullets selected for import.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <AlertTriangle size={12} className="text-amber-600" />
          Conflicts and needs review are excluded from auto-use by default.
        </div>
      </div>

      {actionButtons()}

      {feedback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {feedback}
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.key} className="rounded-lg border border-neutral-200 bg-white">
            <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-50">
              <p className="text-sm font-semibold text-neutral-800">{group.company}</p>
              <p className="text-xs text-neutral-600">
                {group.role || 'Role missing'} • {group.timeframe}
              </p>
            </div>

            <div className="divide-y divide-neutral-100">
              {group.items.map((item) => {
                const statusStyle = STATUS_STYLES[item.status];
                const statusLabel = STATUS_LABELS[item.status];
                const itemIndex = items.findIndex((candidate) => candidate.id === item.id);
                const previousItem = itemIndex > 0 ? items[itemIndex - 1] : null;
                const canMerge = previousItem ? canMergeWithPrevious(previousItem, item) : false;
                const mergeHint = canMerge
                  ? 'Merge this bullet with the one above.'
                  : 'Merge works only for adjacent bullets in the same company, role, and dates.';

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 shrink-0">
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
                        Use for matching & writing
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-700 mb-1 block">Resume bullet</label>
                      <textarea
                        value={item.claimText}
                        onChange={(event) => onChange(updateItem(items, item.id, { claimText: event.target.value }))}
                        rows={3}
                        className="w-full px-2.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSplit(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] border border-neutral-200 rounded-md text-neutral-700 hover:bg-neutral-50"
                      >
                        <Scissors size={12} />
                        Split into bullets
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMergeWithPrevious(item.id)}
                        disabled={!canMerge}
                        title={mergeHint}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] border border-neutral-200 rounded-md text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <GitMerge size={12} />
                        Merge with previous
                      </button>
                    </div>
                    {!canMerge && (
                      <p className="text-[11px] text-neutral-500">
                        Merge is available only when the bullet above has the same company, role, and dates.
                      </p>
                    )}

                    <details className="rounded-md border border-neutral-200 bg-neutral-50">
                      <summary className="px-3 py-2 text-xs font-medium text-neutral-700 cursor-pointer inline-flex items-center gap-1.5">
                        <ChevronDown size={12} />
                        Advanced details
                      </summary>
                      <div className="px-3 pb-3 space-y-3">
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
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Start date</label>
                            <input
                              value={item.startDate}
                              onChange={(event) => onChange(updateItem(items, item.id, { startDate: event.target.value }))}
                              placeholder="Jan 2021"
                              className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">End date</label>
                            <input
                              value={item.endDate}
                              onChange={(event) => onChange(updateItem(items, item.id, { endDate: event.target.value }))}
                              placeholder="Present"
                              className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Metric value</label>
                            <input
                              value={item.metricValue}
                              onChange={(event) => onChange(updateItem(items, item.id, { metricValue: event.target.value }))}
                              placeholder="40"
                              className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Metric unit</label>
                            <input
                              value={item.metricUnit}
                              onChange={(event) => onChange(updateItem(items, item.id, { metricUnit: event.target.value }))}
                              placeholder="%"
                              className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Metric context</label>
                            <input
                              value={item.metricContext}
                              onChange={(event) => onChange(updateItem(items, item.id, { metricContext: event.target.value }))}
                              placeholder="Qualified pipeline"
                              className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Tools (comma-separated)</label>
                          <input
                            value={item.tools.join(', ')}
                            onChange={(event) =>
                              onChange(
                                updateItem(items, item.id, {
                                  tools: event.target.value
                                    .split(',')
                                    .map((tool) => tool.trim())
                                    .filter(Boolean),
                                }),
                              )
                            }
                            placeholder="HubSpot, Salesforce, GA4"
                            className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Raw extracted text</label>
                          <textarea
                            value={item.rawSnippet}
                            onChange={(event) => onChange(updateItem(items, item.id, { rawSnippet: event.target.value }))}
                            rows={2}
                            className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {actionButtons(true)}
    </div>
  );
}

import type { Claim } from '../types';
import type { ParsedClaim } from './claimParser';

export type ClaimReviewStatus = 'active' | 'needs_review' | 'conflict';

export interface ClaimReviewItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  timeframe: string;
  rawSnippet: string;
  claimText: string;
  metricValue: string;
  metricUnit: string;
  metricContext: string;
  status: ClaimReviewStatus;
  included: boolean;
  autoUse: boolean;
}

export interface ClaimReviewGroup {
  key: string;
  company: string;
  role: string;
  timeframe: string;
  items: ClaimReviewItem[];
}

const METRIC_RE = /(\$\s*\d[\d,.]*\s*[kKmMbB]?|\d[\d,.]*\s*%|\d[\d,.]*\s*[xX])/;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function makeId(seed: string, index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${seed}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildTimeframe(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return 'Timeframe unknown';
  if (!startDate) return endDate;
  return `${startDate} - ${endDate || 'Present'}`;
}

function parseMetric(claimText: string, fallbackMetric?: string): {
  value: string;
  unit: string;
  context: string;
} {
  const source = fallbackMetric?.trim() || '';
  const sourceMatch = source.match(/^(\$?\s*\d[\d,.]*)(\s*[kKmMbBxX%])?$/);
  if (sourceMatch) {
    return {
      value: sourceMatch[1].replace(/\s+/g, ''),
      unit: (sourceMatch[2] || '').replace(/\s+/g, ''),
      context: normalizeText(claimText.slice(0, 120)),
    };
  }

  const match = claimText.match(METRIC_RE);
  if (!match) {
    return { value: '', unit: '', context: '' };
  }

  const metricToken = match[0].replace(/\s+/g, '');
  const valueMatch = metricToken.match(/^\$?\d[\d,.]*/);
  const unit = metricToken.slice(valueMatch?.[0].length || 0);
  const context = normalizeText(claimText.replace(match[0], '').slice(0, 120));

  return {
    value: valueMatch?.[0] || metricToken,
    unit,
    context,
  };
}

function baseStatus(item: Pick<ClaimReviewItem, 'company' | 'role' | 'claimText'>): ClaimReviewStatus {
  if (!item.company.trim() || !item.role.trim() || !item.claimText.trim()) {
    return 'needs_review';
  }
  return 'active';
}

function applyConflictStatus(items: ClaimReviewItem[]): ClaimReviewItem[] {
  const keyed = new Map<string, { values: Set<string>; indexes: number[] }>();

  items.forEach((item, index) => {
    if (!item.metricValue.trim()) return;

    const key = [
      item.company.toLowerCase().trim(),
      item.role.toLowerCase().trim(),
      item.metricUnit.toLowerCase().trim(),
    ].join('::');

    if (!keyed.has(key)) {
      keyed.set(key, { values: new Set<string>(), indexes: [] });
    }

    const group = keyed.get(key);
    if (!group) return;
    group.values.add(item.metricValue.trim());
    group.indexes.push(index);
  });

  const next = [...items];

  for (const { values, indexes } of keyed.values()) {
    if (values.size <= 1) continue;
    for (const index of indexes) {
      const current = next[index];
      next[index] = {
        ...current,
        status: 'conflict',
        autoUse: current.autoUse && current.status !== 'needs_review' ? false : current.autoUse,
      };
    }
  }

  return next;
}

export function createClaimReviewItems(parsedClaims: ParsedClaim[]): ClaimReviewItem[] {
  const items: ClaimReviewItem[] = [];

  parsedClaims.forEach((claim, claimIndex) => {
    const lines = [
      ...(claim.outcomes.map((o) => ({ text: normalizeText(o.description), metric: o.metric || '' }))),
      ...(claim.responsibilities.map((r) => ({ text: normalizeText(r), metric: '' }))),
    ].filter((line) => line.text.length > 0);

    const timeframe = buildTimeframe(claim.startDate, claim.endDate);

    if (lines.length === 0) {
      const placeholderText = normalizeText(claim.claimText || claim.rawSnippet || '');
      const parsedMetric = parseMetric(placeholderText);
      const initialStatus = baseStatus({ company: claim.company, role: claim.role, claimText: placeholderText });

      items.push({
        id: makeId(claim._key, claimIndex),
        company: claim.company,
        role: claim.role,
        startDate: claim.startDate,
        endDate: claim.endDate,
        timeframe,
        rawSnippet: claim.rawSnippet || placeholderText,
        claimText: placeholderText,
        metricValue: claim.metricValue || parsedMetric.value,
        metricUnit: claim.metricUnit || parsedMetric.unit,
        metricContext: claim.metricContext || parsedMetric.context,
        status: claim.reviewStatus || initialStatus,
        included: claim.included,
        autoUse:
          typeof claim.autoUse === 'boolean'
            ? claim.autoUse
            : (claim.reviewStatus || initialStatus) === 'active',
      });
      return;
    }

    lines.forEach((line, lineIndex) => {
      const parsedMetric = parseMetric(line.text, line.metric);
      const initialStatus = baseStatus({ company: claim.company, role: claim.role, claimText: line.text });

      items.push({
        id: makeId(claim._key, lineIndex),
        company: claim.company,
        role: claim.role,
        startDate: claim.startDate,
        endDate: claim.endDate,
        timeframe,
        rawSnippet: line.text,
        claimText: line.text,
        metricValue: parsedMetric.value,
        metricUnit: parsedMetric.unit,
        metricContext: parsedMetric.context,
        status: initialStatus,
        included: claim.included,
        autoUse: initialStatus === 'active',
      });
    });
  });

  return applyConflictStatus(items).map((item) => ({
    ...item,
    status: baseStatus(item) === 'needs_review' ? 'needs_review' : item.status,
    autoUse: baseStatus(item) === 'needs_review' ? false : item.autoUse,
  }));
}

export function regroupClaimReviewItems(items: ClaimReviewItem[]): ClaimReviewItem[] {
  return applyConflictStatus(
    items.map((item) => {
      const timeframe = buildTimeframe(item.startDate, item.endDate);
      const status = baseStatus(item) === 'needs_review' ? 'needs_review' : item.status;
      return {
        ...item,
        timeframe,
        status,
        autoUse: status === 'needs_review' ? false : item.autoUse,
      };
    })
  );
}

export function groupClaimReviewItems(items: ClaimReviewItem[]): ClaimReviewGroup[] {
  const map = new Map<string, ClaimReviewGroup>();

  items.forEach((item) => {
    const key = [item.company || 'Unknown Company', item.role || 'Unknown Role', item.timeframe].join('::');
    if (!map.has(key)) {
      map.set(key, {
        key,
        company: item.company || 'Unknown Company',
        role: item.role || 'Unknown Role',
        timeframe: item.timeframe,
        items: [],
      });
    }
    map.get(key)?.items.push(item);
  });

  return [...map.values()];
}

export function reviewItemToClaimInput(item: ClaimReviewItem): Partial<Claim> {
  const normalizedClaimText = normalizeText(item.claimText);
  const hasMetric = item.metricValue.trim().length > 0;
  const metricLabel = `${item.metricValue.trim()}${item.metricUnit.trim()}`.trim();

  return {
    company: item.company.trim(),
    role: item.role.trim(),
    startDate: item.startDate.trim(),
    endDate: item.endDate.trim() || undefined,
    claimText: normalizedClaimText,
    rawSnippet: normalizeText(item.rawSnippet),
    reviewStatus: item.status,
    autoUse: item.autoUse,
    metric: {
      value: item.metricValue.trim() || undefined,
      unit: item.metricUnit.trim() || undefined,
      context: item.metricContext.trim() || undefined,
    },
    responsibilities: hasMetric || !normalizedClaimText ? [] : [normalizedClaimText],
    outcomes: hasMetric
      ? [{
          description: normalizedClaimText,
          metric: metricLabel || undefined,
          isNumeric: true,
          verified: false,
        }]
      : [],
    tools: [],
  };
}

export function splitReviewItem(item: ClaimReviewItem): ClaimReviewItem[] {
  const parts = item.claimText
    .split(';')
    .map((part) => normalizeText(part))
    .filter(Boolean);

  if (parts.length <= 1) {
    return [item];
  }

  return parts.map((part, index) => {
    const metric = parseMetric(part);
    return {
      ...item,
      id: makeId(item.id, index),
      claimText: part,
      rawSnippet: part,
      metricValue: metric.value,
      metricUnit: metric.unit,
      metricContext: metric.context,
    };
  });
}

export function mergeReviewItems(primary: ClaimReviewItem, secondary: ClaimReviewItem): ClaimReviewItem {
  const mergedText = normalizeText(`${primary.claimText}; ${secondary.claimText}`);
  const metric = parseMetric(mergedText);

  return {
    ...primary,
    claimText: mergedText,
    rawSnippet: normalizeText(`${primary.rawSnippet}; ${secondary.rawSnippet}`),
    metricValue: primary.metricValue || metric.value,
    metricUnit: primary.metricUnit || metric.unit,
    metricContext: primary.metricContext || secondary.metricContext || metric.context,
    included: primary.included || secondary.included,
    autoUse: primary.autoUse || secondary.autoUse,
  };
}

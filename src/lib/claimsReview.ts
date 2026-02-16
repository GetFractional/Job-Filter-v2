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
  tools: string[];
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

export interface SplitReviewResult {
  items: ClaimReviewItem[];
  reason?: string;
}

const METRIC_RE = /(\$\s*\d[\d,.]*\s*[kKmMbB]?|\d[\d,.]*\s*%|\d[\d,.]*\s*[xX])/;
const BULLET_LINE_RE = /^\s*[\u2022\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\-*]\s+/;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeLines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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

function normalizeToolList(tools: string[]): string[] {
  return [...new Set(tools.map((tool) => tool.trim()).filter(Boolean))];
}

function splitByLineBullets(text: string): string[] {
  const lines = normalizeLines(text).split('\n');
  const segments: string[] = [];
  let current = '';

  const flush = () => {
    const normalized = normalizeText(current);
    if (normalized) segments.push(normalized);
    current = '';
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }

    if (BULLET_LINE_RE.test(line)) {
      flush();
      current = line.replace(BULLET_LINE_RE, '').trim();
      continue;
    }

    current = current ? `${current} ${line}` : line;
  }

  flush();
  return segments;
}

function splitByParagraphs(text: string): string[] {
  return normalizeLines(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(BULLET_LINE_RE, '').trim())
    .filter(Boolean);
}

function splitInlineBullets(text: string): string[] {
  const normalized = normalizeLines(text)
    .replace(/\s+[\u2022\u25E6\u25AA\u25B8\u25BA\u2023\u27A2*]\s+(?=[A-Z0-9])/g, '\n• ')
    .replace(/\s+-\s+(?=[A-Z0-9])/g, '\n- ');

  return splitByLineBullets(normalized);
}

function smartSplit(text: string): string[] {
  const lineSplit = splitByLineBullets(text);
  if (lineSplit.length > 1) return lineSplit;

  const paragraphSplit = splitByParagraphs(text);
  if (paragraphSplit.length > 1) return paragraphSplit;

  const inlineSplit = splitInlineBullets(text);
  if (inlineSplit.length > 1) return inlineSplit;

  const single = normalizeText(text);
  return single ? [single] : [];
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
      next[index] = {
        ...next[index],
        status: 'conflict',
        autoUse: false,
      };
    }
  }

  return next;
}

function claimSourceLines(claim: ParsedClaim): Array<{ text: string; metric?: string }> {
  const outcomeLines = claim.outcomes.map((outcome) => ({
    text: normalizeText(outcome.description),
    metric: outcome.metric || '',
  }));
  const responsibilityLines = claim.responsibilities.map((responsibility) => ({
    text: normalizeText(responsibility),
    metric: '',
  }));

  const merged = [...outcomeLines, ...responsibilityLines].filter((line) => line.text.length > 0);
  if (merged.length > 0) return merged;

  const fallback = normalizeText(claim.claimText || claim.rawSnippet || '');
  if (!fallback) return [];
  return [{ text: fallback, metric: claim.metricValue ? `${claim.metricValue}${claim.metricUnit}` : '' }];
}

export function createClaimReviewItems(parsedClaims: ParsedClaim[]): ClaimReviewItem[] {
  const items: ClaimReviewItem[] = [];

  parsedClaims.forEach((claim, claimIndex) => {
    const timeframe = buildTimeframe(claim.startDate, claim.endDate);
    const tools = normalizeToolList(claim.tools ?? []);
    const sourceLines = claimSourceLines(claim);

    sourceLines.forEach((sourceLine, lineIndex) => {
      const segments = smartSplit(sourceLine.text);
      const lines = segments.length > 0 ? segments : [sourceLine.text];

      lines.forEach((lineText, segmentIndex) => {
        const parsedMetric = parseMetric(lineText, sourceLine.metric);
        const initialStatus = baseStatus({
          company: claim.company,
          role: claim.role,
          claimText: lineText,
        });

        items.push({
          id: makeId(claim._key || `claim-${claimIndex}`, lineIndex * 100 + segmentIndex),
          company: claim.company,
          role: claim.role,
          startDate: claim.startDate,
          endDate: claim.endDate,
          timeframe,
          rawSnippet: lineText,
          claimText: lineText,
          metricValue: parsedMetric.value,
          metricUnit: parsedMetric.unit,
          metricContext: parsedMetric.context,
          tools,
          status: initialStatus,
          included: claim.included,
          autoUse: initialStatus === 'active' && (claim.autoUse ?? true),
        });
      });
    });
  });

  return applyConflictStatus(items).map((item) => {
    const status = baseStatus(item) === 'needs_review' ? 'needs_review' : item.status;
    return {
      ...item,
      status,
      autoUse: status === 'needs_review' ? false : item.autoUse,
      tools: normalizeToolList(item.tools),
    };
  });
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
        tools: normalizeToolList(item.tools),
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
    tools: normalizeToolList(item.tools),
  };
}

export function splitReviewItem(item: ClaimReviewItem): SplitReviewResult {
  const parts = smartSplit(item.claimText);

  if (parts.length <= 1) {
    return {
      items: [item],
      reason: 'No bullet boundaries found. Try adding line breaks before splitting.',
    };
  }

  return {
    items: parts.map((part, index) => {
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
    }),
  };
}

export function canMergeWithPrevious(previous: ClaimReviewItem, current: ClaimReviewItem): boolean {
  return (
    previous.company === current.company &&
    previous.role === current.role &&
    previous.startDate === current.startDate &&
    previous.endDate === current.endDate
  );
}

export function mergeReviewItems(primary: ClaimReviewItem, secondary: ClaimReviewItem): ClaimReviewItem {
  const mergedText = normalizeText(`${primary.claimText}\n${secondary.claimText}`);
  const metric = parseMetric(mergedText);

  return {
    ...primary,
    claimText: mergedText,
    rawSnippet: normalizeText(`${primary.rawSnippet}\n${secondary.rawSnippet}`),
    metricValue: primary.metricValue || metric.value,
    metricUnit: primary.metricUnit || metric.unit,
    metricContext: primary.metricContext || secondary.metricContext || metric.context,
    tools: normalizeToolList([...primary.tools, ...secondary.tools]),
    included: primary.included || secondary.included,
    autoUse: primary.autoUse || secondary.autoUse,
  };
}

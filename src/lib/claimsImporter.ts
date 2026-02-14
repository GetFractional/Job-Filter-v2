import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type {
  Claim,
  ClaimMetric,
  ClaimStatus,
  ClaimVerification,
} from '../types';
import type { ParsedClaim } from './claimParser.ts';
import { parseResumeStructured } from './claimParser.ts';

GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ClaimsImportOptions {
  source?: string;
  importedAt?: string;
  verification?: ClaimVerification;
}

interface ClaimDraft extends Omit<Claim, 'id' | 'createdAt'> {
  draftKey: string;
  claimText: string;
  source: string;
  verification: ClaimVerification;
  status: ClaimStatus;
  metrics: ClaimMetric[];
  conflictKey: string;
  importedAt: string;
}

export interface ClaimsImportResult {
  claims: Omit<Claim, 'id' | 'createdAt'>[];
  inputCount: number;
  dedupedCount: number;
  conflictCount: number;
  needsReviewCount: number;
}

export interface ClaimsHealthSummary {
  total: number;
  active: number;
  conflict: number;
  needsReview: number;
  topPreview: Array<{
    company: string;
    role: string;
    claimText: string;
    status: ClaimStatus;
  }>;
  conflicts: Array<{
    company: string;
    role: string;
    claimText: string;
    conflictKey: string;
  }>;
  lastImportTimestamp: string | null;
  lastImportSource: string | null;
}

const CLAIM_DUPLICATE_SIMILARITY = 0.5;

const METRIC_PATTERNS: Array<{
  regex: RegExp;
  unit: ClaimMetric['unit'];
}> = [
  { regex: /\$([\d,.]+)\s*([kKmMbB])?/g, unit: '$' },
  { regex: /([\d,.]+)\s*%/g, unit: '%' },
  { regex: /([\d,.]+)\s*[xX]/g, unit: 'x' },
  { regex: /\b([\d]{2,})\b/g, unit: 'count' },
];

const METRIC_TYPE_HINTS: Array<{ type: string; keywords: string[] }> = [
  { type: 'revenue', keywords: ['revenue', 'arr', 'mrr', 'bookings', 'pipeline'] },
  { type: 'conversion', keywords: ['conversion', 'cvr', 'signup', 'activation'] },
  { type: 'efficiency', keywords: ['cac', 'cpa', 'cost', 'efficiency'] },
  { type: 'retention', keywords: ['retention', 'churn', 'renewal'] },
  { type: 'growth', keywords: ['growth', 'increase', 'improved', 'scaled', 'boosted'] },
  { type: 'engagement', keywords: ['engagement', 'ctr', 'open rate', 'response rate'] },
];

const ROLE_HINTS = [
  'marketing operations manager',
  'operations manager',
  'growth manager',
  'product manager',
  'account manager',
  'team lead',
  'vice president',
  'vp',
  'chief',
  'head',
  'director',
  'owner',
  'founder',
  'co-founder',
  'manager',
  'lead',
  'consultant',
  'specialist',
  'officer',
  'engineer',
  'architect',
];

const TOOL_KEYWORDS = [
  'HubSpot',
  'Salesforce',
  'Segment',
  'Amplitude',
  'Google Analytics',
  'GA4',
  'Marketo',
  'Braze',
  'Klaviyo',
  'Shopify',
  'Zoho',
  'Workable',
  'n8n',
  'CrewAI',
  'Looker',
  'Tableau',
  'BigQuery',
  'Snowflake',
];

const TEXT_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'over',
  'under',
  'through',
  'across',
  'built',
  'led',
  'managed',
]);

function toNumber(raw: string, suffix?: string): number {
  const normalized = raw.replace(/,/g, '');
  const base = Number.parseFloat(normalized);
  if (!Number.isFinite(base)) return 0;

  if (!suffix) return base;
  const lower = suffix.toLowerCase();
  if (lower === 'k') return base * 1_000;
  if (lower === 'm') return base * 1_000_000;
  if (lower === 'b') return base * 1_000_000_000;
  return base;
}

function inferMetricType(line: string): string {
  const lower = line.toLowerCase();
  for (const { type, keywords } of METRIC_TYPE_HINTS) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return type;
    }
  }
  return 'generic';
}

function extractMetricsFromLine(line: string): ClaimMetric[] {
  const metrics: ClaimMetric[] = [];
  const metricType = inferMetricType(line);

  for (const { regex, unit } of METRIC_PATTERNS) {
    regex.lastIndex = 0;
    let match = regex.exec(line);
    while (match) {
      const value = unit === '$' ? toNumber(match[1], match[2]) : toNumber(match[1]);
      if (value > 0) {
        metrics.push({
          metricType,
          value,
          unit,
          context: line,
          raw: match[0],
        });
      }
      match = regex.exec(line);
    }
  }

  return metrics;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  const tokens = normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !TEXT_STOP_WORDS.has(token));
  return new Set(tokens);
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function claimRichnessScore(claim: ClaimDraft): number {
  return (
    claim.metrics.length * 5 +
    claim.outcomes.length * 2 +
    claim.responsibilities.length +
    claim.tools.length +
    Math.min(claim.claimText.length / 80, 5)
  );
}

function defaultClaimText(parsed: ParsedClaim): string {
  if (parsed.outcomes[0]?.description) return parsed.outcomes[0].description;
  if (parsed.responsibilities[0]) return parsed.responsibilities[0];
  return `${parsed.role} at ${parsed.company}`.trim();
}

function timeframeLabel(startDate?: string, endDate?: string): string {
  return `${startDate || 'unknown'} -> ${endDate || 'present'}`;
}

function stableKey(parsed: ParsedClaim): string {
  return normalizeText([parsed.company, parsed.role, parsed.startDate, parsed.endDate].join('|'));
}

function claimQualityScore(claims: ParsedClaim[]): number {
  return claims.reduce((score, claim) => {
    const hasCompany = claim.company.trim().length > 0;
    const hasReasonableRole = claim.role.trim().length > 0 && claim.role.trim().length <= 120;
    const hasContent = claim.outcomes.length > 0 || claim.responsibilities.length > 0;
    return score + (hasCompany ? 3 : 0) + (hasReasonableRole ? 2 : 0) + (hasContent ? 1 : 0);
  }, 0);
}

function extractExperienceSection(text: string): string {
  const lower = text.toLowerCase();
  const start = lower.indexOf('experience');
  if (start === -1) return text;

  const after = text.slice(start + 'experience'.length);
  const afterLower = after.toLowerCase();
  const end = afterLower.indexOf('education');
  return end === -1 ? after : after.slice(0, end);
}

function splitCompanyAndRole(header: string): { company: string; role: string } {
  const cleaned = normalizeWhitespace(
    header
      .replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, ' ')
      .replace(/\bRole:\b/gi, ' ')
      .replace(/\bAccountabilities?:\b/gi, ' ')
      .replace(/\bAchievements?:\b/gi, ' ')
      .replace(/^[^\w]+/, '')
      .trim(),
  );
  const sentenceTail = cleaned
    .split(/[.!?]/)
    .map((fragment) => normalizeWhitespace(fragment))
    .filter(Boolean)
    .at(-1) || cleaned;

  const lower = sentenceTail.toLowerCase();
  let splitIndex = -1;

  for (const hint of ROLE_HINTS) {
    const hintRegex = new RegExp(`\\b${escapeRegex(hint)}\\b`, 'i');
    const match = hintRegex.exec(lower);
    if (match && (splitIndex === -1 || match.index < splitIndex)) {
      splitIndex = match.index;
    }
  }

  if (splitIndex === -1 && cleaned.includes(' - ')) {
    const [role, company] = sentenceTail.split(' - ', 2);
    return {
      company: refineCompanyName(normalizeWhitespace(company || '')),
      role: normalizeWhitespace(role || ''),
    };
  }

  if (splitIndex === -1) {
    return {
      company: '',
      role: sentenceTail,
    };
  }

  const company = refineCompanyName(normalizeWhitespace(sentenceTail.slice(0, splitIndex)));
  const role = normalizeWhitespace(sentenceTail.slice(splitIndex));
  return { company, role };
}

function refineCompanyName(company: string): string {
  const cleaned = normalizeWhitespace(company);
  if (!cleaned) return '';

  const words = cleaned.split(' ');
  if (words.length <= 5) {
    return cleaned;
  }

  let start = words.length - 1;
  while (start >= 0) {
    const token = words[start];
    if (!/^[A-Z0-9][A-Za-z0-9&'.+-]*$/.test(token)) {
      break;
    }
    start -= 1;
  }

  const trailing = words.slice(start + 1);
  if (trailing.length >= 1 && trailing.length <= 5) {
    return trailing.join(' ');
  }

  return words.slice(-4).join(' ');
}

function hasNumericSignal(text: string): boolean {
  return /(?:\$[\d,.]+(?:[kKmMbB])?|[\d,.]+\s*%|[\d,.]+\s*[xX]|[\d,.]+\+|\b[\d,.]+\s*(?:days|months|years|users|customers|leads|activations)\b)/.test(text);
}

function extractMetricLabel(text: string): string | undefined {
  const match = text.match(/(?:\$[\d,.]+(?:[kKmMbB])?|[\d,.]+\s*%|[\d,.]+\s*[xX]|[\d,.]+\+|\b[\d,.]+\s*(?:days|months|years|users|customers|leads|activations)\b)/);
  return match?.[0];
}

function detectTools(text: string): string[] {
  const lower = text.toLowerCase();
  return TOOL_KEYWORDS.filter((tool) => lower.includes(tool.toLowerCase()));
}

function splitBodyIntoBullets(body: string): string[] {
  const normalized = normalizeWhitespace(body)
    .replace(/\s+[•▪◦●]\s+/g, ' • ')
    .replace(/\bAccountabilities?:\b/gi, ' • ')
    .replace(/\bAchievements?:\b/gi, ' • ')
    .replace(/\bRole:\b/gi, ' • ');

  const chunks = normalized.split('•');
  return chunks
    .map((chunk) => normalizeWhitespace(chunk))
    .filter((chunk) => chunk.length >= 20)
    .slice(0, 20);
}

function parseLinkedInProfileClaims(text: string): ParsedClaim[] {
  const experienceText = normalizeWhitespace(extractExperienceSection(text));
  const monthPattern = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const datePattern = `(${monthPattern}\\s+\\d{4})\\s*-\\s*(Present|${monthPattern}\\s+\\d{4})`;
  const entryRegex = new RegExp(`([A-Z][A-Za-z0-9&'.,/()+\\-\\s]{4,180}?)\\s+${datePattern}\\s*(?:\\([^)]{2,50}\\))?`, 'g');
  const matches = [...experienceText.matchAll(entryRegex)];

  const claims: ParsedClaim[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const headerRaw = normalizeWhitespace(match[1] || '');
    const startDate = normalizeWhitespace(match[2] || '');
    const endDateRaw = normalizeWhitespace(match[3] || '');

    if (!headerRaw || !startDate) {
      continue;
    }

    const sectionStart = (match.index || 0) + match[0].length;
    const sectionEnd = index + 1 < matches.length ? (matches[index + 1].index || experienceText.length) : experienceText.length;
    const body = normalizeWhitespace(experienceText.slice(sectionStart, sectionEnd));
    const { company, role } = splitCompanyAndRole(headerRaw);

    if (!role || role.length > 140) {
      continue;
    }

    const bullets = splitBodyIntoBullets(body);
    const outcomes = bullets
      .filter(hasNumericSignal)
      .slice(0, 5)
      .map((description) => ({
        description,
        metric: extractMetricLabel(description),
        isNumeric: true,
      }));

    const responsibilities = bullets
      .filter((line) => !hasNumericSignal(line))
      .slice(0, 6);

    const fallbackResponsibility = responsibilities.length === 0 && outcomes.length === 0
      ? [normalizeWhitespace(body.split(/[.!?]/)[0] || '').slice(0, 220)].filter(Boolean)
      : [];

    claims.push({
      _key: normalizeText(`${company}|${role}|${startDate}|${endDateRaw}`),
      company,
      role,
      startDate,
      endDate: endDateRaw.toLowerCase() === 'present' ? '' : endDateRaw,
      responsibilities: responsibilities.length > 0 ? responsibilities : fallbackResponsibility,
      tools: detectTools(`${headerRaw} ${body}`),
      outcomes,
      included: true,
    });
  }

  const unique = new Map<string, ParsedClaim>();
  for (const claim of claims) {
    const key = normalizeText(`${claim.company}|${claim.role}|${claim.startDate}|${claim.endDate}`);
    if (!unique.has(key)) {
      unique.set(key, claim);
    }
  }

  return [...unique.values()];
}

export function parseClaimsForImport(text: string): ParsedClaim[] {
  const resumeParsed = parseResumeStructured(text);
  const linkedInParsed = parseLinkedInProfileClaims(text);

  const resumeScore = claimQualityScore(resumeParsed);
  const linkedInScore = claimQualityScore(linkedInParsed);

  if (linkedInScore > resumeScore) {
    return linkedInParsed;
  }

  return resumeParsed;
}

function buildDraftClaim(parsed: ParsedClaim, options: Required<ClaimsImportOptions>): ClaimDraft {
  const lines = [
    ...parsed.outcomes.map((outcome) => outcome.description),
    ...parsed.responsibilities,
  ].filter(Boolean);
  const claimText = defaultClaimText(parsed);
  const metrics = lines.flatMap(extractMetricsFromLine);

  const status: ClaimStatus = parsed.company && parsed.role ? 'active' : 'needs_review';
  const conflictKey = '';

  return {
    draftKey: stableKey(parsed),
    company: parsed.company,
    role: parsed.role,
    startDate: parsed.startDate,
    endDate: parsed.endDate || undefined,
    responsibilities: parsed.responsibilities,
    tools: parsed.tools,
    outcomes: parsed.outcomes.map((outcome) => ({
      description: outcome.description,
      metric: outcome.metric,
      isNumeric: outcome.isNumeric,
      verified: false,
    })),
    claimText,
    source: options.source,
    verification: options.verification,
    status,
    metrics,
    conflictKey,
    importedAt: options.importedAt,
  };
}

function dedupeClaims(claims: ClaimDraft[]): ClaimDraft[] {
  const deduped: ClaimDraft[] = [];

  for (const candidate of claims) {
    const matchIndex = deduped.findIndex((existing) => {
      if (normalizeText(existing.company) !== normalizeText(candidate.company)) return false;
      if (normalizeText(existing.role) !== normalizeText(candidate.role)) return false;
      if (timeframeLabel(existing.startDate, existing.endDate) !== timeframeLabel(candidate.startDate, candidate.endDate)) {
        return false;
      }

      const sameMetricSignature = metricSignature(existing.metrics) === metricSignature(candidate.metrics);
      if (!sameMetricSignature) {
        return false;
      }

      return jaccardSimilarity(existing.claimText, candidate.claimText) >= CLAIM_DUPLICATE_SIMILARITY;
    });

    if (matchIndex === -1) {
      deduped.push(candidate);
      continue;
    }

    const existing = deduped[matchIndex];
    const winner = claimRichnessScore(candidate) > claimRichnessScore(existing) ? candidate : existing;
    deduped[matchIndex] = winner;
  }

  return deduped;
}

function applyConflictLabels(claims: ClaimDraft[]): ClaimDraft[] {
  const claimsByMetricType = new Map<string, ClaimDraft[]>();

  for (const claim of claims) {
    if (!claim.company || claim.status !== 'active') {
      continue;
    }

    for (const metric of claim.metrics) {
      const key = `${normalizeText(claim.company)}|${metric.metricType}`;
      const list = claimsByMetricType.get(key) || [];
      list.push(claim);
      claimsByMetricType.set(key, list);
    }
  }

  const conflictKeysByDraft = new Map<string, string>();

  for (const [key, metricClaims] of claimsByMetricType.entries()) {
    const uniqueDrafts = new Set<string>();
    const perClaimMetricSignatures = new Set<string>();
    const uniqueTimeframes = new Set<string>();

    for (const claim of metricClaims) {
      uniqueDrafts.add(claim.draftKey);
      const claimMetricValues = claim.metrics
        .filter((metric) => `${normalizeText(claim.company)}|${metric.metricType}` === key)
        .map((metric) => `${metric.unit}:${metric.value}`)
        .sort()
        .join(',');

      if (claimMetricValues) {
        perClaimMetricSignatures.add(claimMetricValues);
      }
      uniqueTimeframes.add(timeframeLabel(claim.startDate, claim.endDate));
    }

    const hasConflict =
      uniqueDrafts.size > 1 &&
      (perClaimMetricSignatures.size > 1 || uniqueTimeframes.size > 1);
    if (!hasConflict) continue;

    for (const claim of metricClaims) {
      conflictKeysByDraft.set(claim.draftKey, key);
    }
  }

  return claims.map((claim) => {
    if (claim.status !== 'active') {
      return claim;
    }

    const conflictKey = conflictKeysByDraft.get(claim.draftKey);
    if (!conflictKey) return claim;
    return {
      ...claim,
      status: 'conflict',
      conflictKey,
    };
  });
}

export function prepareClaimsFromParsedClaims(
  parsedClaims: ParsedClaim[],
  options?: ClaimsImportOptions,
): ClaimsImportResult {
  const resolved: Required<ClaimsImportOptions> = {
    source: options?.source || 'Profile.pdf',
    importedAt: options?.importedAt || new Date().toISOString(),
    verification: options?.verification || 'self_reported',
  };

  const drafts = parsedClaims.map((parsed) => buildDraftClaim(parsed, resolved));
  const deduped = dedupeClaims(drafts);
  const withConflicts = applyConflictLabels(deduped);

  const claims = withConflicts.map((claim) => {
    const { draftKey, ...claimWithoutDraftKey } = claim;
    void draftKey;
    return claimWithoutDraftKey;
  });
  const conflictCount = claims.filter((claim) => claim.status === 'conflict').length;
  const needsReviewCount = claims.filter((claim) => claim.status === 'needs_review').length;

  return {
    claims,
    inputCount: parsedClaims.length,
    dedupedCount: claims.length,
    conflictCount,
    needsReviewCount,
  };
}

export function isLikelyDuplicateClaim(candidate: Omit<Claim, 'id' | 'createdAt'>, existing: Claim): boolean {
  if (normalizeText(candidate.company) !== normalizeText(existing.company)) return false;
  if (normalizeText(candidate.role) !== normalizeText(existing.role)) return false;
  if (timeframeLabel(candidate.startDate, candidate.endDate) !== timeframeLabel(existing.startDate, existing.endDate)) {
    return false;
  }

  const existingText = existing.claimText || existing.outcomes[0]?.description || existing.responsibilities[0] || '';
  const candidateText = candidate.claimText || candidate.outcomes[0]?.description || candidate.responsibilities[0] || '';
  const sameMetricSignature = metricSignature(existing.metrics || []) === metricSignature(candidate.metrics || []);
  if (!sameMetricSignature) {
    return false;
  }
  return jaccardSimilarity(existingText, candidateText) >= CLAIM_DUPLICATE_SIMILARITY;
}

function metricSignature(metrics: ClaimMetric[]): string {
  return metrics
    .map((metric) => `${normalizeText(metric.metricType)}:${metric.unit}:${metric.value}`)
    .sort()
    .join('|');
}

export async function extractTextFromPdfBytes(bytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let currentLine = '';

    for (const item of textContent.items) {
      if (!('str' in item)) {
        continue;
      }

      const text = item.str.replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }

      currentLine = currentLine ? `${currentLine} ${text}` : text;

      if ('hasEOL' in item && item.hasEOL) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    const pageText = lines
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();

    if (pageText.length > 0) {
      pages.push(pageText);
    }
  }

  await pdf.destroy();
  return pages.join('\n').trim();
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return extractTextFromPdfBytes(new Uint8Array(buffer));
}

export function summarizeClaimsHealth(claims: Claim[]): ClaimsHealthSummary {
  const total = claims.length;
  const active = claims.filter((claim) => (claim.status || 'active') === 'active').length;
  const conflict = claims.filter((claim) => claim.status === 'conflict').length;
  const needsReview = claims.filter((claim) => claim.status === 'needs_review').length;

  const sortedByImportDate = [...claims].sort((a, b) => {
    const aDate = Date.parse(a.importedAt || a.createdAt);
    const bDate = Date.parse(b.importedAt || b.createdAt);
    return bDate - aDate;
  });

  const lastImportedClaim = sortedByImportDate[0];
  const topPreview = claims
    .filter((claim) => (claim.status || 'active') !== 'conflict')
    .slice(0, 5)
    .map((claim) => ({
      company: claim.company,
      role: claim.role,
      claimText: claim.claimText || claim.outcomes[0]?.description || claim.responsibilities[0] || '',
      status: (claim.status || 'active') as ClaimStatus,
    }));

  const conflicts = claims
    .filter((claim) => claim.status === 'conflict')
    .slice(0, 10)
    .map((claim) => ({
      company: claim.company,
      role: claim.role,
      claimText: claim.claimText || claim.outcomes[0]?.description || claim.responsibilities[0] || '',
      conflictKey: claim.conflictKey || 'conflict',
    }));

  return {
    total,
    active,
    conflict,
    needsReview,
    topPreview,
    conflicts,
    lastImportTimestamp: lastImportedClaim?.importedAt || lastImportedClaim?.createdAt || null,
    lastImportSource: lastImportedClaim?.source || null,
  };
}

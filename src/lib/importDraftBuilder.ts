import { parseResumeStructured, detectTools } from './claimParser';
import type { ParsedClaim } from './claimParser';
import type {
  ImportDraft,
  ImportDraftCompany,
  ImportDraftItem,
  ImportDraftRole,
  ImportItemStatus,
  ParseDiagnostics,
  ParseReasonCode,
  SegmentationMode,
  SourceRef,
} from '../types';

interface BuildImportDraftOptions {
  mode?: SegmentationMode;
  pageCount?: number;
}

export interface ImportDraftParseResult {
  draft: ImportDraft;
  diagnostics: ParseDiagnostics;
  normalizedText: string;
}

const BULLET_CANDIDATE_RE = /^[\s]*[\u2022\u25CF\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\u2219\-*]\s*/;
const SECTION_HEADER_RE = /^(experience|work experience|work history|professional experience|employment|skills|education|summary|profile|projects|certifications)$/i;
const LOCAL_MAX_PREVIEW_LINES = 30;

export function normalizeImportText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replaceAll('\u0000', '')
    .trim();
}

export function applySegmentationMode(text: string, mode: SegmentationMode): string {
  if (mode === 'default') return text;

  if (mode === 'newlines') {
    return text
      .replace(/[\t ]+[\u2022\u25CF\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\u2219\-*]\s+/g, '\n- ')
      .replace(/\n{3,}/g, '\n\n');
  }

  if (mode === 'bullets') {
    return text
      .replace(/[\u2022\u25CF\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\u2219]/g, '\n- ')
      .replace(/\s+[-*]\s+/g, '\n- ')
      .replace(/;\s+(?=[A-Z])/g, '\n- ')
      .replace(/\n{3,}/g, '\n\n');
  }

  return text
    .replace(/\s+(EXPERIENCE|WORK EXPERIENCE|WORK HISTORY|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROFILE)\s+/gi, '\n$1\n')
    .replace(/\n{3,}/g, '\n\n');
}

function mergeColonContinuation(lines: string[]): string[] {
  const merged: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      merged.push(line);
      continue;
    }

    if (trimmed.startsWith(':') && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${trimmed.replace(/^:\s*/, '')}`.trim();
      continue;
    }

    merged.push(line);
  }

  return merged;
}

function mergeBulletContinuation(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i];
    const trimmed = current.trim();
    const next = lines[i + 1]?.trim();

    if (/^[\u2022\u25CF\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\u2219\-*]+$/.test(trimmed) && next) {
      merged.push(`${trimmed} ${next}`);
      i += 1;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function normalizeForParser(text: string, mode: SegmentationMode): string {
  const segmented = applySegmentationMode(text, mode);
  const lines = segmented.split('\n');
  return mergeBulletContinuation(mergeColonContinuation(lines)).join('\n');
}

function normalizeMatchToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2022\u25CF\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\u2219]/g, ' ')
    .replace(/[^a-z0-9$%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSourceRefs(lines: string[], snippets: string[]): SourceRef[] {
  const refs = new Set<number>();
  const normalizedLines = lines.map((line) => normalizeMatchToken(line));

  for (const snippet of snippets) {
    const token = normalizeMatchToken(snippet);
    if (!token) continue;

    for (let i = 0; i < normalizedLines.length; i += 1) {
      if (normalizedLines[i].includes(token) || token.includes(normalizedLines[i])) {
        refs.add(i);
      }
    }
  }

  return [...refs].sort((a, b) => a - b).map((lineIndex) => ({ lineIndex }));
}

function toStatus(confidence: number): ImportItemStatus {
  if (confidence >= 0.75) return 'accepted';
  if (confidence >= 0.4) return 'needs_attention';
  return 'rejected';
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function scoreRoleConfidence(claim: ParsedClaim): number {
  let score = 0;

  if (claim.role) score += 0.32;
  if (claim.company) score += 0.26;
  if (claim.startDate) score += 0.12;
  if (claim.endDate || claim.startDate) score += 0.08;

  const itemCount = claim.responsibilities.length + claim.outcomes.length;
  if (itemCount > 0) score += 0.18;
  if (itemCount >= 3) score += 0.04;

  if (claim.tools.length > 0) score += 0.05;

  return clampConfidence(score);
}

function itemConfidence(base: number, text: string): number {
  const lengthBonus = text.trim().length >= 24 ? 0.08 : 0;
  const metricBonus = /\d/.test(text) ? 0.07 : 0;
  return clampConfidence(base * 0.85 + lengthBonus + metricBonus);
}

function buildDiagnostics(
  lines: string[],
  draft: ImportDraft,
  claims: ParsedClaim[],
  normalizedText: string,
  pageCount?: number,
): ParseDiagnostics {
  const bulletsCount = draft.companies.reduce((sumCompanies, company) => {
    return (
      sumCompanies +
      company.roles.reduce((sumRoles, role) => {
        return sumRoles + role.highlights.length + role.outcomes.length;
      }, 0)
    );
  }, 0);

  const reasonCodes: ParseReasonCode[] = [];

  if (!normalizedText.trim()) {
    reasonCodes.push('TEXT_EMPTY');
  }
  if (bulletsCount === 0) {
    reasonCodes.push('BULLET_DETECT_FAIL');
  }

  const companyCount = draft.companies.length;
  const roleCount = draft.companies.reduce((sum, company) => sum + company.roles.length, 0);

  if (companyCount === 0) {
    reasonCodes.push('COMPANY_DETECT_FAIL');
  }
  if (roleCount === 0) {
    reasonCodes.push('ROLE_DETECT_FAIL');
  }
  if (claims.length > 0 && companyCount === 0 && roleCount === 0) {
    reasonCodes.push('FILTERED_ALL');
  }
  if (lines.length > 0 && claims.length === 0) {
    reasonCodes.push('LAYOUT_COLLAPSE');
  }

  return {
    extractedTextLength: normalizedText.length,
    pageCount,
    detectedLinesCount: lines.length,
    bulletCandidatesCount: lines.filter((line) => BULLET_CANDIDATE_RE.test(line)).length,
    sectionHeadersDetected: lines.filter((line) => SECTION_HEADER_RE.test(line.trim())).length,
    companyCandidatesDetected: new Set(claims.map((claim) => claim.company).filter(Boolean)).size,
    roleCandidatesDetected: new Set(claims.map((claim) => claim.role).filter(Boolean)).size,
    finalCompaniesCount: companyCount,
    rolesCount: roleCount,
    bulletsCount,
    reasonCodes,
    previewLines: lines.map((line) => line.trim()).filter(Boolean).slice(0, LOCAL_MAX_PREVIEW_LINES),
  };
}

function buildRole(
  claim: ParsedClaim,
  lines: string[],
  roleIndex: number,
): ImportDraftRole {
  const confidence = scoreRoleConfidence(claim);
  const roleSourceSnippets = [claim.role, claim.company, claim.startDate, claim.endDate].filter(Boolean);

  const highlights: ImportDraftItem[] = claim.responsibilities.map((text, index) => {
    const itemScore = itemConfidence(confidence, text);
    return {
      id: `highlight-${roleIndex}-${index}`,
      type: 'highlight',
      text,
      confidence: itemScore,
      status: toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [text]),
    };
  });

  const outcomes: ImportDraftItem[] = claim.outcomes.map((outcome, index) => {
    const itemScore = itemConfidence(confidence + 0.05, outcome.description);
    return {
      id: `outcome-${roleIndex}-${index}`,
      type: 'outcome',
      text: outcome.description,
      metric: outcome.metric,
      confidence: itemScore,
      status: toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [outcome.description]),
    };
  });

  const toolsFromText = detectTools(`${claim.responsibilities.join(' ')} ${claim.outcomes.map((o) => o.description).join(' ')}`);
  const mergedTools = [...new Set([...claim.tools, ...toolsFromText])];

  const tools: ImportDraftItem[] = mergedTools.map((tool, index) => {
    const itemScore = clampConfidence(Math.max(confidence, 0.78));
    return {
      id: `tool-${roleIndex}-${index}`,
      type: 'tool',
      text: tool,
      confidence: itemScore,
      status: toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [tool]),
    };
  });

  return {
    id: `role-${roleIndex}`,
    title: claim.role || 'Unspecified Role',
    startDate: claim.startDate,
    endDate: claim.endDate || undefined,
    confidence,
    status: toStatus(confidence),
    sourceRefs: findSourceRefs(lines, roleSourceSnippets),
    highlights,
    outcomes,
    tools,
    skills: [],
  };
}

export function buildImportDraftFromText(
  rawText: string,
  options: BuildImportDraftOptions = {},
): ImportDraftParseResult {
  const mode = options.mode ?? 'default';
  const normalizedInput = normalizeImportText(rawText);
  const normalizedText = normalizeForParser(normalizedInput, mode);

  if (!normalizedText.trim()) {
    const emptyDraft: ImportDraft = { companies: [] };
    return {
      draft: emptyDraft,
      diagnostics: buildDiagnostics([], emptyDraft, [], normalizedText, options.pageCount),
      normalizedText,
    };
  }

  const lines = normalizedText.split('\n');
  const claims = parseResumeStructured(normalizedText);

  const grouped = new Map<string, ImportDraftCompany>();
  let roleCounter = 0;

  for (const claim of claims) {
    const companyName = claim.company.trim() || 'Unspecified Company';
    if (!grouped.has(companyName)) {
      const companyConfidence = clampConfidence(claim.company ? 0.85 : 0.55);
      grouped.set(companyName, {
        id: `company-${grouped.size}`,
        name: companyName,
        confidence: companyConfidence,
        status: toStatus(companyConfidence),
        sourceRefs: findSourceRefs(lines, [companyName]),
        roles: [],
      });
    }

    grouped.get(companyName)?.roles.push(buildRole(claim, lines, roleCounter));
    roleCounter += 1;
  }

  const draft: ImportDraft = {
    companies: [...grouped.values()],
  };

  return {
    draft,
    diagnostics: buildDiagnostics(lines, draft, claims, normalizedText, options.pageCount),
    normalizedText,
  };
}

export function hasUsableImportDraft(draft: ImportDraft): boolean {
  return draft.companies.some((company) =>
    company.roles.some(
      (role) => role.highlights.length + role.outcomes.length + role.tools.length + role.skills.length > 0,
    ),
  );
}

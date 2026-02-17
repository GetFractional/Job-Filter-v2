import { detectTools, parseResumeStructured } from './claimParser';
import type { ParsedClaim } from './claimParser';
import { summarizeTextStage, toNumberedPreview } from './importDiagnostics';
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
import type { ClaimsImportExtractionDiagnostics } from './claimsImportPipeline';

interface BuildImportDraftOptions {
  mode?: SegmentationMode;
  extractionDiagnostics?: ClaimsImportExtractionDiagnostics;
}

export interface ImportDraftParseResult {
  draft: ImportDraft;
  diagnostics: ParseDiagnostics;
  normalizedText: string;
}

const SECTION_HEADER_RE = /^(experience|work experience|work history|professional experience|employment|skills|education|summary|profile|projects|certifications|about|contact)$/i;
const DATE_RANGE_RE = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+\d{4}\b|\b\d{4}\b)\s*[-–—]\s*(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+\d{4}\b|\b\d{4}\b|present|current|now)/i;
const BULLET_ONLY_RE = /^[\s]*[•●◦▪▫‣⁃\-–—*✅✔➤➔]+[\s]*$/u;
const BULLET_LINE_RE = /^[\s]*[•●◦▪▫‣⁃\-–—*✅✔➤➔][\s\t]+/u;
const CONTINUATION_PREFIX_RE = /^[\s]*([+%(|[a-z])/;
const LOCAL_MAX_PREVIEW_LINES = 40;

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
      .replace(/[\t ]+[•●◦▪▫‣⁃\-–—*✅✔➤➔]\s+/gu, '\n- ')
      .replace(/\n{3,}/g, '\n\n');
  }

  if (mode === 'bullets') {
    return text
      .replace(/[•●◦▪▫‣⁃✅✔➤➔]/gu, '\n- ')
      .replace(/\s+[-–—*]\s+/g, '\n- ')
      .replace(/;\s+(?=[A-Z])/g, '\n- ')
      .replace(/\n{3,}/g, '\n\n');
  }

  return text
    .replace(/\s+(EXPERIENCE|WORK EXPERIENCE|WORK HISTORY|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROFILE|PROJECTS)\s+/gi, '\n$1\n')
    .replace(/\n{3,}/g, '\n\n');
}

function normalizeMatchToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[•●◦▪▫‣⁃✅✔➤➔]/gu, ' ')
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
      if (!normalizedLines[i]) continue;
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

  if (claim.role) score += 0.3;
  if (claim.company) score += 0.24;
  if (claim.startDate) score += 0.14;
  if (claim.endDate || claim.startDate) score += 0.07;

  const itemCount = claim.responsibilities.length + claim.outcomes.length;
  if (itemCount > 0) score += 0.18;
  if (itemCount >= 3) score += 0.05;

  if (claim.tools.length > 0) score += 0.04;

  return clampConfidence(score);
}

function itemConfidence(base: number, text: string): number {
  const lengthBonus = text.trim().length >= 24 ? 0.08 : 0;
  const metricBonus = /\d/.test(text) ? 0.07 : 0;
  return clampConfidence(base * 0.84 + lengthBonus + metricBonus);
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

function looksLikeBoundary(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (SECTION_HEADER_RE.test(trimmed)) return true;
  if (DATE_RANGE_RE.test(trimmed)) return true;
  if (/^[A-Z][A-Z\s]{4,}$/.test(trimmed)) return true;
  return false;
}

function mergeBulletContinuation(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i];
    const trimmed = current.trim();
    const next = lines[i + 1]?.trim() || '';

    if (BULLET_ONLY_RE.test(trimmed) && next && !looksLikeBoundary(next)) {
      merged.push(`${trimmed} ${next}`);
      i += 1;
      continue;
    }

    if (
      merged.length > 0 &&
      BULLET_LINE_RE.test(merged[merged.length - 1]) &&
      CONTINUATION_PREFIX_RE.test(trimmed) &&
      !looksLikeBoundary(trimmed)
    ) {
      const nextLine = lines[i + 1]?.trim() || '';
      if (!looksLikeBoundary(nextLine) || nextLine === '') {
        merged[merged.length - 1] = `${merged[merged.length - 1]} ${trimmed}`.replace(/\s+/g, ' ').trim();
        continue;
      }
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

function buildRole(
  claim: ParsedClaim,
  lines: string[],
  roleIndex: number,
  forceNeedsAttention = false,
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
      status: forceNeedsAttention ? 'needs_attention' : toStatus(itemScore),
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
      status: forceNeedsAttention ? 'needs_attention' : toStatus(itemScore),
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
      status: forceNeedsAttention ? 'needs_attention' : toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [tool]),
    };
  });

  return {
    id: `role-${roleIndex}`,
    title: claim.role.trim() || 'Unassigned',
    startDate: claim.startDate,
    endDate: claim.endDate || undefined,
    confidence,
    status: forceNeedsAttention ? 'needs_attention' : toStatus(confidence),
    sourceRefs: findSourceRefs(lines, roleSourceSnippets),
    highlights,
    outcomes,
    tools,
    skills: [],
  };
}

function buildDiagnostics(
  extractionDiagnostics: ClaimsImportExtractionDiagnostics | null,
  segmentedLines: string[],
  draft: ImportDraft,
  claims: ParsedClaim[],
  mode: SegmentationMode,
): ParseDiagnostics {
  const segmentationSummary = summarizeTextStage(segmentedLines);
  const finalItemsCount = draft.companies.reduce((sumCompanies, company) => {
    return (
      sumCompanies +
      company.roles.reduce((sumRoles, role) => {
        return sumRoles + role.highlights.length + role.outcomes.length + role.tools.length + role.skills.length;
      }, 0)
    );
  }, 0);

  const bulletsCount = draft.companies.reduce((sumCompanies, company) => {
    return (
      sumCompanies +
      company.roles.reduce((sumRoles, role) => {
        return sumRoles + role.highlights.length + role.outcomes.length;
      }, 0)
    );
  }, 0);

  const companyCandidatesCount = new Set(claims.map((claim) => claim.company.trim()).filter(Boolean)).size;
  const roleCandidatesCount = new Set(claims.map((claim) => claim.role.trim()).filter(Boolean)).size;
  const timeframeCandidatesCount = claims.filter((claim) => claim.startDate || claim.endDate).length;
  const finalCompaniesCount = draft.companies.length;
  const finalRolesCount = draft.companies.reduce((sum, company) => sum + company.roles.length, 0);

  const reasonCodes: ParseReasonCode[] = [];

  if (segmentedLines.length === 0) {
    reasonCodes.push('TEXT_EMPTY');
  }
  if (segmentationSummary.bulletCandidatesCount === 0) {
    reasonCodes.push('BULLET_DETECT_FAIL');
  }
  if (companyCandidatesCount > 0 && finalCompaniesCount === 0) {
    reasonCodes.push('FILTERED_ALL');
  }
  if (segmentedLines.length > 0 && claims.length === 0) {
    reasonCodes.push('LAYOUT_COLLAPSE');
  }
  if (finalCompaniesCount === 0) {
    reasonCodes.push('COMPANY_DETECT_FAIL');
  }
  if (finalRolesCount === 0) {
    reasonCodes.push('ROLE_DETECT_FAIL');
  }

  const extractionStage = extractionDiagnostics ?? {
    ...summarizeTextStage(segmentedLines),
    pageCount: undefined,
    previewLines: segmentedLines.slice(0, LOCAL_MAX_PREVIEW_LINES),
    previewLinesWithNumbers: toNumberedPreview(segmentedLines, LOCAL_MAX_PREVIEW_LINES),
  };

  const previewLinesWithNumbers = toNumberedPreview(segmentedLines, LOCAL_MAX_PREVIEW_LINES);

  return {
    mode,
    extractedTextLength: extractionStage.extractedChars,
    pageCount: extractionStage.pageCount,
    detectedLinesCount: segmentationSummary.detectedLinesCount,
    bulletCandidatesCount: segmentationSummary.bulletCandidatesCount,
    topBulletGlyphs: segmentationSummary.topBulletGlyphs,
    sectionHeadersDetected: segmentedLines.filter((line) => SECTION_HEADER_RE.test(line.trim())).length,
    companyCandidatesDetected: companyCandidatesCount,
    roleCandidatesDetected: roleCandidatesCount,
    timeframeCandidatesCount,
    finalCompaniesCount,
    rolesCount: finalRolesCount,
    bulletsCount,
    reasonCodes,
    previewLines: previewLinesWithNumbers.map((line) => `${line.line}: ${line.text}`),
    previewLinesWithNumbers,
    extractionStage: {
      pageCount: extractionStage.pageCount,
      extractedChars: extractionStage.extractedChars,
      detectedLinesCount: extractionStage.detectedLinesCount,
      bulletCandidatesCount: extractionStage.bulletCandidatesCount,
      topBulletGlyphs: extractionStage.topBulletGlyphs,
    },
    segmentationStage: {
      detectedLinesCount: segmentationSummary.detectedLinesCount,
      bulletCandidatesCount: segmentationSummary.bulletCandidatesCount,
      topBulletGlyphs: segmentationSummary.topBulletGlyphs,
      sectionHeadersDetected: segmentedLines.filter((line) => SECTION_HEADER_RE.test(line.trim())).length,
    },
    mappingStage: {
      companyCandidatesCount,
      roleCandidatesCount,
      timeframeCandidatesCount,
      finalCompaniesCount,
      finalRolesCount,
      finalItemsCount,
    },
  };
}

export function buildImportDraftFromText(rawText: string, options: BuildImportDraftOptions = {}): ImportDraftParseResult {
  const mode = options.mode ?? 'default';
  const normalizedInput = normalizeImportText(rawText);
  const normalizedText = normalizeForParser(normalizedInput, mode);

  if (!normalizedText.trim()) {
    const emptyDraft: ImportDraft = { companies: [] };
    return {
      draft: emptyDraft,
      diagnostics: buildDiagnostics(options.extractionDiagnostics || null, [], emptyDraft, [], mode),
      normalizedText,
    };
  }

  const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean);
  const claims = parseResumeStructured(normalizedText);

  const grouped = new Map<string, ImportDraftCompany>();
  let roleCounter = 0;

  for (const claim of claims) {
    const hasItems = claim.responsibilities.length + claim.outcomes.length + claim.tools.length > 0;
    if (!hasItems && !claim.role.trim() && !claim.company.trim()) {
      continue;
    }

    const unresolvedIdentity = !claim.role.trim() || !claim.company.trim();
    const companyName = claim.company.trim() || 'Unassigned';
    const groupKey = companyName.toLowerCase();

    if (!grouped.has(groupKey)) {
      const companyConfidence = unresolvedIdentity ? 0.5 : 0.85;
      grouped.set(groupKey, {
        id: `company-${grouped.size}`,
        name: companyName,
        confidence: companyConfidence,
        status: unresolvedIdentity ? 'needs_attention' : toStatus(companyConfidence),
        sourceRefs: findSourceRefs(lines, [companyName]),
        roles: [],
      });
    }

    const role = buildRole(claim, lines, roleCounter, unresolvedIdentity);
    grouped.get(groupKey)?.roles.push(role);
    roleCounter += 1;
  }

  const draft: ImportDraft = {
    companies: [...grouped.values()],
  };

  return {
    draft,
    diagnostics: buildDiagnostics(options.extractionDiagnostics || null, lines, draft, claims, mode),
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

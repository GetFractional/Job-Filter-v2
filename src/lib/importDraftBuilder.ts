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
const BULLET_ONLY_RE = /^[\s]*[•●◦▪▫‣⁃\-–—*\uF0B7\uF0A7\uF0FC✅✔➤➔]+[\s]*$/u;
const BULLET_LINE_RE = /^[\s]*[•●◦▪▫‣⁃\-–—*\uF0B7\uF0A7\uF0FC✅✔➤➔][\s\t]+/u;
const MONTH_YEAR_RE = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\b/i;
const DATE_ONLY_RE = /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})(?:\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{4}|present|current|now))?$/i;
const DATE_LOCATION_COMPOSITE_RE = /^[A-Z]{2}\s*[|/,]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}$/i;
const LOCATION_STYLE_RE = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3},\s*[A-Z]{2}$/;
const LOCATION_STATUS_RE = /^(remote|hybrid|onsite|on-site|in office)$/i;
const ROLE_KEYWORD_RE = /\b(director|manager|lead|head|vp|vice president|president|engineer|analyst|specialist|coordinator|officer|chief|consultant|marketing|growth|sales|operations|product)\b/i;
const METRIC_FRAGMENT_RE = /(?:[$€£]\s?\d|\b\d+(?:[.,]\d+)?%|\b\d+[kKmMbB]\b)/;
const NARRATIVE_VERB_RE = /\b(led|built|launched|improved|increased|reduced|managed|scaled|drove|created|implemented|delivered|grew|generated|owned|optimized|negotiated|partnered)\b/i;
const COMPANY_ENTITY_RE = /\b(inc|corp|llc|ltd|group|company|co\.|media|software|labs|systems|agency|partners)\b/i;
const SUMMARY_BOUNDARY_LINE_RE = /^[A-Z][A-Za-z0-9&.'’/()\- ]{1,90}\s*(?:\||at|@|[-–—]|→|->)\s*[A-Z][A-Za-z0-9&.'’/()\- ]{1,90}/i;
const EXPERIENCE_SECTION_RE = /^(experience|work experience|work history|professional experience|employment|employment history)$/i;
const FEATURED_ACHIEVEMENTS_SECTION_RE = /^(featured|selected)\s+(achievements|highlights|results)$/i;
const SKILLS_SECTION_RE = /^(skills|skills & tools|tools|technical skills|core skills|competencies|core competencies)$/i;
const EDUCATION_SECTION_RE = /^(education|certifications|licenses|references|awards|publications|volunteer|volunteer experience)$/i;
const COMPANY_WEB_BRAND_RE = /\b[a-z0-9][a-z0-9.'’&-]*\.(?:com|io|ai|co|net|org)\b/i;
const FEATURED_COMPANY_ANCHOR_RE = /^([A-Z][A-Za-z0-9&.'’-]*(?:\s+[A-Z][A-Za-z0-9&.'’-]*){0,5})(?:\s*\([^)]{2,30}\))?\s*[:|]/;
const CONTINUATION_TRAILING_RE = /([,(/:+&-]|\b(and|or|to|for|with|across|including|through|via|while|plus|of|in|on|by|into|over|under|between|generated|resulting))$/i;
const CONTINUATION_LEADING_RE = /^([+%(]|[$€£]?\d|and\b|or\b|to\b|for\b|with\b|via\b|while\b|including\b|across\b|resulting\b)/i;
const INCOMPLETE_VERB_TRAILING_RE = /\b(generated|resulting|including|supporting|driving|building|leading|managing|delivering|improving)$/i;
const FRAGMENT_VERB_LEADING_RE = /^(retained|supported|supporting)\b/i;
const OUTCOME_CHANGE_VERB_RE = /\b(increased|reduced|improved|grew|generated|delivered|launched|achieved|saved|boosted|scaled|drove|lifted|cut)\b/i;
const OUTCOME_IMPACT_TERM_RE = /\b(revenue|pipeline|conversion|margin|retention|cost|roi|arr|mrr|orders|aov|sessions|leads|activations|customers|cycle time|time-to-fill)\b/i;
const OUTCOME_SCALE_TERM_RE = /\b(\d+(?:[.,]\d+)?%|\d+[kKmMbB]\+?|[$€£]\s?\d)\b/;
const LOCAL_MAX_PREVIEW_LINES = 40;
const AUTO_SEGMENTATION_MODES: SegmentationMode[] = ['default', 'newlines', 'bullets', 'headings'];
const QUALITY_PENALTY_CODES = new Set<ParseReasonCode>([
  'FILTERED_ALL',
  'LAYOUT_COLLAPSE',
  'ROLE_DETECT_FAIL',
  'COMPANY_DETECT_FAIL',
]);
const STATE_OR_PROVINCE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'BC', 'AB', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON',
  'PE', 'QC', 'SK', 'YT',
]);

type ResumeZone =
  | 'identity_contact'
  | 'featured_title'
  | 'featured_achievements'
  | 'experience_timeline'
  | 'skills_tools'
  | 'education_references';

function normalizeIdentityToken(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isDateLikeIdentity(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return false;
  if (DATE_ONLY_RE.test(normalized)) return true;
  if (DATE_LOCATION_COMPOSITE_RE.test(normalized)) return true;
  if (MONTH_YEAR_RE.test(normalized) && !/[A-Za-z]{3,}[^0-9]*(?:inc|corp|llc|ltd|group|labs|technologies|systems|co)\b/i.test(normalized)) {
    const nonDateWordCount = normalized
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .filter((token) => !STATE_OR_PROVINCE_CODES.has(token.toUpperCase()))
      .filter((token) => !/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|present|current|now)$/i.test(token))
      .filter((token) => !/^\d{4}$/.test(token))
      .length;
    return nonDateWordCount <= 1;
  }
  return false;
}

function isLocationLikeIdentity(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return false;
  if (LOCATION_STYLE_RE.test(normalized)) return true;
  if (LOCATION_STATUS_RE.test(normalized)) return true;
  if (STATE_OR_PROVINCE_CODES.has(normalized.toUpperCase())) return true;
  return false;
}

function isSuspiciousIdentity(value: string): boolean {
  return isDateLikeIdentity(value) || isLocationLikeIdentity(value);
}

function isLikelyMetricNarrative(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return false;
  if (!METRIC_FRAGMENT_RE.test(normalized)) return false;
  if (COMPANY_ENTITY_RE.test(normalized)) return false;
  if (normalized.includes(';')) return true;
  if (NARRATIVE_VERB_RE.test(normalized)) return true;
  return normalized.split(/\s+/).length >= 6;
}

function isLikelyNoisyRoleIdentity(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return true;
  if (isSuspiciousIdentity(normalized)) return true;
  if (/^(unassigned|unspecified role|n\/a|na)$/i.test(normalized)) return true;
  if (!ROLE_KEYWORD_RE.test(normalized) && LOCATION_STYLE_RE.test(normalized)) return true;
  if (!ROLE_KEYWORD_RE.test(normalized) && METRIC_FRAGMENT_RE.test(normalized)) return true;
  if (!ROLE_KEYWORD_RE.test(normalized) && NARRATIVE_VERB_RE.test(normalized)) return true;
  return false;
}

function hasAmbiguousOlderRoleBoundary(claim: ParsedClaim): boolean {
  if (claim.startDate || claim.endDate) return true;

  const evidenceLines = [...claim.responsibilities, ...claim.outcomes.map((outcome) => outcome.description)];
  return evidenceLines.some((line) => {
    const normalized = normalizeIdentityToken(line);
    if (!normalized) return false;
    if (DATE_RANGE_RE.test(normalized) && SUMMARY_BOUNDARY_LINE_RE.test(normalized)) return true;
    if (/\b(?:19|20)\d{2}\b/.test(normalized) && /\|/.test(normalized)) return true;
    return false;
  });
}

export function isLikelySuspiciousCompanyName(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return true;
  if (isSuspiciousIdentity(normalized)) return true;
  if (isLikelyMetricNarrative(normalized)) return true;
  if (!COMPANY_ENTITY_RE.test(normalized) && NARRATIVE_VERB_RE.test(normalized)) return true;
  if (normalized.split(/\s+/).length > 9) return true;
  return false;
}

function looksLikeFeaturedAchievementLine(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return false;
  if (FEATURED_ACHIEVEMENTS_SECTION_RE.test(normalized)) return true;
  if (METRIC_FRAGMENT_RE.test(normalized)) return true;
  if (NARRATIVE_VERB_RE.test(normalized) && normalized.split(/\s+/).length <= 20) return true;
  return false;
}

function looksLikeFeaturedTitleLine(value: string): boolean {
  const normalized = normalizeIdentityToken(value);
  if (!normalized) return false;
  if (isSuspiciousIdentity(normalized)) return false;
  if (DATE_RANGE_RE.test(normalized)) return false;
  if (METRIC_FRAGMENT_RE.test(normalized)) return false;
  if (!ROLE_KEYWORD_RE.test(normalized)) return false;
  if (normalized.split(/\s+/).length > 8) return false;
  return true;
}

function classifyLineZones(lines: string[]): ResumeZone[] {
  let zone: ResumeZone = 'identity_contact';
  let foundExperience = false;

  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return zone;

    if (EXPERIENCE_SECTION_RE.test(trimmed)) {
      zone = 'experience_timeline';
      foundExperience = true;
      return zone;
    }
    if (FEATURED_ACHIEVEMENTS_SECTION_RE.test(trimmed) && !foundExperience) {
      zone = 'featured_achievements';
      return zone;
    }
    if (SKILLS_SECTION_RE.test(trimmed)) {
      zone = 'skills_tools';
      return zone;
    }
    if (EDUCATION_SECTION_RE.test(trimmed)) {
      zone = 'education_references';
      return zone;
    }

    if (!foundExperience && DATE_RANGE_RE.test(trimmed)) {
      zone = 'experience_timeline';
      foundExperience = true;
      return zone;
    }

    if (!foundExperience && zone !== 'featured_achievements' && looksLikeFeaturedTitleLine(trimmed)) {
      zone = 'featured_title';
      return zone;
    }

    if (!foundExperience && looksLikeFeaturedAchievementLine(trimmed)) {
      zone = 'featured_achievements';
      return zone;
    }

    if (!foundExperience && zone !== 'featured_title' && zone !== 'featured_achievements') {
      zone = 'identity_contact';
    }

    return zone;
  });
}

function inferClaimZone(claim: ParsedClaim, lines: string[], lineZones: ResumeZone[]): ResumeZone {
  const snippets = [
    claim.role,
    claim.company,
    claim.startDate,
    claim.endDate,
    ...claim.responsibilities,
    ...claim.outcomes.map((outcome) => outcome.description),
  ].filter(Boolean);

  const refs = findSourceRefs(lines, snippets);
  if (refs.length > 0) {
    const counts = new Map<ResumeZone, number>();
    for (const ref of refs) {
      const zone = lineZones[ref.lineIndex] ?? 'experience_timeline';
      counts.set(zone, (counts.get(zone) ?? 0) + 1);
    }
    let winner: ResumeZone = 'experience_timeline';
    let winnerCount = -1;
    for (const [zone, count] of counts.entries()) {
      if (count > winnerCount) {
        winner = zone;
        winnerCount = count;
      }
    }
    return winner;
  }

  if (claim.startDate || claim.endDate || claim.company || claim.role) {
    return 'experience_timeline';
  }
  if (
    claim.responsibilities.some((line) => looksLikeFeaturedAchievementLine(line))
    || claim.outcomes.some((outcome) => looksLikeFeaturedAchievementLine(outcome.description))
  ) {
    return 'featured_achievements';
  }
  return 'experience_timeline';
}

function hasHighConfidenceCompanyAnchor(
  claim: ParsedClaim,
  roleValue: string,
  companyValue: string,
  zone: ResumeZone,
): boolean {
  const normalizedCompany = normalizeIdentityToken(companyValue);
  if (!normalizedCompany) return false;
  if (isDateLikeIdentity(normalizedCompany) || isLocationLikeIdentity(normalizedCompany)) return false;
  if (isLikelyMetricNarrative(normalizedCompany)) return false;

  const hasRoleSignal = roleValue.length > 0 && !isLikelyNoisyRoleIdentity(roleValue);
  const hasDateSignal = Boolean(claim.startDate || claim.endDate);
  const hasEvidenceSignal = claim.responsibilities.length + claim.outcomes.length > 0;
  const evidenceLines = [...claim.responsibilities, ...claim.outcomes.map((outcome) => outcome.description)];
  const looksLikeCompany = COMPANY_ENTITY_RE.test(normalizedCompany)
    || COMPANY_WEB_BRAND_RE.test(normalizedCompany)
    || (normalizedCompany.split(/\s+/).length <= 6 && normalizedCompany.length <= 70);

  if (zone === 'featured_achievements' && looksLikeCompany && hasEvidenceSignal) {
    const normalizedEvidence = evidenceLines.map((line) => normalizeIdentityToken(line).toLowerCase()).join(' ');
    const companyTokens = normalizedCompany.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
    const mentionsCompany = companyTokens.some((token) => normalizedEvidence.includes(token));
    const hasOutcomeSignal = evidenceLines.some((line) =>
      METRIC_FRAGMENT_RE.test(line) || OUTCOME_CHANGE_VERB_RE.test(line) || OUTCOME_IMPACT_TERM_RE.test(line));
    if (mentionsCompany && hasOutcomeSignal) {
      return true;
    }
  }

  if (zone !== 'experience_timeline' && !hasDateSignal) return false;
  if (!looksLikeCompany) return false;
  return hasDateSignal || (hasRoleSignal && hasEvidenceSignal);
}

function extractCompanyAnchorFromEvidence(claim: ParsedClaim): string {
  const evidenceLines = [...claim.responsibilities, ...claim.outcomes.map((outcome) => outcome.description)];
  for (const line of evidenceLines) {
    const normalized = normalizeIdentityToken(line);
    if (!normalized) continue;
    const match = normalized.match(FEATURED_COMPANY_ANCHOR_RE);
    if (!match) continue;
    const candidate = normalizeIdentityToken(match[1]);
    if (!candidate) continue;
    if (isLikelySuspiciousCompanyName(candidate)) continue;
    return candidate;
  }
  return '';
}

function shouldMergeContinuationSegment(previousLine: string, candidate: string, nextLine: string): boolean {
  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) return false;
  if (looksLikeBoundary(trimmedCandidate)) return false;
  if (BULLET_LINE_RE.test(trimmedCandidate)) return false;

  const startsLikeContinuation = CONTINUATION_LEADING_RE.test(trimmedCandidate) || /^[a-z]/.test(trimmedCandidate);
  const previousSignalsContinuation = CONTINUATION_TRAILING_RE.test(previousLine.trim());
  const previousIncompleteVerb = INCOMPLETE_VERB_TRAILING_RE.test(previousLine.trim());
  const shortTail = trimmedCandidate.split(/\s+/).length <= 5 && !/[.!?]$/.test(trimmedCandidate);
  if (!(startsLikeContinuation || previousSignalsContinuation || previousIncompleteVerb || shortTail)) return false;

  if (nextLine && looksLikeBoundary(nextLine) && !startsLikeContinuation && !previousSignalsContinuation && !previousIncompleteVerb) {
    return false;
  }
  return true;
}

function shouldMergeBulletLineContinuation(previousLine: string, candidate: string): boolean {
  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) return false;

  const startsLikeContinuation = CONTINUATION_LEADING_RE.test(trimmedCandidate) || /^[a-z]/.test(trimmedCandidate) || /^[$€£]?\d/.test(trimmedCandidate);
  const previousSignalsContinuation = CONTINUATION_TRAILING_RE.test(previousLine.trim()) || INCOMPLETE_VERB_TRAILING_RE.test(previousLine.trim());
  if (startsLikeContinuation || previousSignalsContinuation) {
    return true;
  }

  const candidateWords = trimmedCandidate.split(/\s+/).length;
  const looksLikeVerbFragment = FRAGMENT_VERB_LEADING_RE.test(trimmedCandidate);
  return looksLikeVerbFragment && candidateWords <= 10;
}

export function normalizeImportText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
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
  if (confidence >= 0.75) return 'active';
  if (confidence >= 0.4) return 'needs_review';
  return 'needs_review';
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

    if (BULLET_ONLY_RE.test(trimmed)) {
      const continuation: string[] = [];
      let j = i + 1;

      while (j < lines.length) {
        const next = lines[j].trim();
        if (!next || looksLikeBoundary(next) || BULLET_ONLY_RE.test(next) || BULLET_LINE_RE.test(next)) {
          break;
        }
        continuation.push(next);
        j += 1;
      }

      if (continuation.length > 0) {
        merged.push(`${trimmed} ${continuation.join(' ')}`.replace(/\s+/g, ' ').trim());
        i = j - 1;
      } else {
        merged.push(current);
      }
      continue;
    }

    if (
      merged.length > 0 &&
      BULLET_LINE_RE.test(merged[merged.length - 1]) &&
      shouldMergeContinuationSegment(
        merged[merged.length - 1],
        BULLET_LINE_RE.test(trimmed) ? trimmed.replace(BULLET_LINE_RE, '').trim() : trimmed,
        lines[i + 1]?.trim() || '',
      )
    ) {
      const candidateText = BULLET_LINE_RE.test(trimmed) ? trimmed.replace(BULLET_LINE_RE, '').trim() : trimmed;
      if (!candidateText) {
        continue;
      }
      if (BULLET_LINE_RE.test(trimmed) && !shouldMergeBulletLineContinuation(merged[merged.length - 1], candidateText)) {
        merged.push(current);
        continue;
      }
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${candidateText}`.replace(/\s+/g, ' ').trim();
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

function splitEvidenceClauses(value: string): string[] {
  const trimmed = normalizeIdentityToken(value);
  if (!trimmed) return [];
  if (!trimmed.includes(';')) return [trimmed];
  return trimmed
    .split(/\s*;\s+/)
    .map((clause) => normalizeIdentityToken(clause))
    .filter(Boolean);
}

function shouldClassifyAsOutcome(value: string, claimZone: ResumeZone, source: 'responsibility' | 'outcome'): boolean {
  if (claimZone === 'featured_achievements') return true;
  if (source === 'outcome') return true;

  const normalized = normalizeIdentityToken(value);
  if (!normalized) return false;
  const hasScale = OUTCOME_SCALE_TERM_RE.test(normalized) || METRIC_FRAGMENT_RE.test(normalized);
  const hasChangeVerb = OUTCOME_CHANGE_VERB_RE.test(normalized);
  const hasImpactTerm = OUTCOME_IMPACT_TERM_RE.test(normalized);

  if (hasScale && (hasChangeVerb || hasImpactTerm)) return true;
  if (hasChangeVerb && hasImpactTerm) return true;
  return false;
}

function shouldMergeResponsibilityFragment(previous: string | undefined, candidate: string): boolean {
  if (!previous) return false;
  const normalizedCandidate = normalizeIdentityToken(candidate);
  if (!normalizedCandidate) return false;
  if (looksLikeBoundary(normalizedCandidate) || DATE_RANGE_RE.test(normalizedCandidate)) return false;

  const startsLikeContinuation = /^[a-z]/.test(normalizedCandidate) || FRAGMENT_VERB_LEADING_RE.test(normalizedCandidate);
  if (!startsLikeContinuation) return false;

  const candidateWords = normalizedCandidate.split(/\s+/).length;
  if (candidateWords > 10) return false;

  const previousMissingTerminalPunctuation = !/[.!?]$/.test(previous.trim());
  return previousMissingTerminalPunctuation || /^[a-z]/.test(normalizedCandidate);
}

function mergeResponsibilityFragments(lines: string[]): string[] {
  const merged: string[] = [];

  for (const line of lines) {
    const normalized = normalizeIdentityToken(line);
    if (!normalized) continue;
    const previous = merged[merged.length - 1];
    if (shouldMergeResponsibilityFragment(previous, normalized)) {
      merged[merged.length - 1] = `${previous} ${normalized}`.replace(/\s+/g, ' ').trim();
      continue;
    }
    merged.push(normalized);
  }

  return merged;
}

function normalizeClaimEvidence(claim: ParsedClaim, claimZone: ResumeZone): {
  responsibilities: string[];
  outcomes: Array<{ description: string; metric?: string; isNumeric: boolean }>;
} {
  const responsibilities: string[] = [];
  const outcomes: Array<{ description: string; metric?: string; isNumeric: boolean }> = [];
  const seenResponsibilities = new Set<string>();
  const seenOutcomes = new Set<string>();

  const pushResponsibility = (value: string) => {
    const normalized = normalizeIdentityToken(value);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seenResponsibilities.has(key)) return;
    seenResponsibilities.add(key);
    responsibilities.push(normalized);
  };

  const pushOutcome = (value: string) => {
    const normalized = normalizeIdentityToken(value);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seenOutcomes.has(key)) return;
    seenOutcomes.add(key);
    outcomes.push({
      description: normalized,
      metric: toOutcomeMetric(normalized),
      isNumeric: /\d/.test(normalized),
    });
  };

  const evidence = [
    ...claim.responsibilities.map((text) => ({ text, source: 'responsibility' as const })),
    ...claim.outcomes.map((outcome) => ({ text: outcome.description, source: 'outcome' as const })),
  ];

  for (const entry of evidence) {
    const clauses = splitEvidenceClauses(entry.text);
    for (const clause of clauses) {
      if (shouldClassifyAsOutcome(clause, claimZone, entry.source)) {
        pushOutcome(clause);
      } else {
        pushResponsibility(clause);
      }
    }
  }

  return { responsibilities: mergeResponsibilityFragments(responsibilities), outcomes };
}

function buildRole(
  claim: ParsedClaim,
  lines: string[],
  roleIndex: number,
  claimZone: ResumeZone,
  forceNeedsAttention = false,
): ImportDraftRole {
  const normalizedEvidence = normalizeClaimEvidence(claim, claimZone);
  const normalizedResponsibilities = [...normalizedEvidence.responsibilities];
  const normalizedOutcomes = normalizedEvidence.outcomes.map((outcome) => ({ ...outcome }));
  const trailingResponsibility = normalizedResponsibilities[normalizedResponsibilities.length - 1]?.trim();
  const leadingOutcome = normalizedOutcomes[0]?.description.trim();
  if (
    trailingResponsibility
    && leadingOutcome
    && CONTINUATION_TRAILING_RE.test(trailingResponsibility)
    && /^[$€£]?\d/.test(leadingOutcome)
  ) {
    const mergedDescription = `${trailingResponsibility} ${leadingOutcome}`.replace(/\s+/g, ' ').trim();
    normalizedResponsibilities.pop();
    normalizedOutcomes[0] = {
      ...normalizedOutcomes[0],
      description: mergedDescription,
      metric: toOutcomeMetric(mergedDescription),
      isNumeric: /\d/.test(mergedDescription),
    };
  }

  const confidence = scoreRoleConfidence(claim);
  const roleSourceSnippets = [claim.role, claim.company, claim.startDate, claim.endDate].filter(Boolean);

  const highlights: ImportDraftItem[] = normalizedResponsibilities.map((text, index) => {
    const itemScore = itemConfidence(confidence, text);
    return {
      id: `highlight-${roleIndex}-${index}`,
      type: 'highlight',
      text,
      confidence: itemScore,
      status: forceNeedsAttention ? 'needs_review' : toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [text]),
    };
  });

  const outcomes: ImportDraftItem[] = normalizedOutcomes.map((outcome, index) => {
    const itemScore = itemConfidence(confidence + 0.05, outcome.description);
    return {
      id: `outcome-${roleIndex}-${index}`,
      type: 'outcome',
      text: outcome.description,
      metric: outcome.metric,
      confidence: itemScore,
      status: forceNeedsAttention ? 'needs_review' : toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [outcome.description]),
    };
  });

  const toolsFromText = detectTools(`${normalizedResponsibilities.join(' ')} ${normalizedOutcomes.map((o) => o.description).join(' ')}`);
  const mergedTools = [...new Set([...claim.tools, ...toolsFromText])];

  const tools: ImportDraftItem[] = mergedTools.map((tool, index) => {
    const itemScore = clampConfidence(Math.max(confidence, 0.78));
    return {
      id: `tool-${roleIndex}-${index}`,
      type: 'tool',
      text: tool,
      confidence: itemScore,
      status: forceNeedsAttention ? 'needs_review' : toStatus(itemScore),
      sourceRefs: findSourceRefs(lines, [tool]),
    };
  });

  return {
    id: `role-${roleIndex}`,
    title: claim.role.trim() || 'Unassigned',
    startDate: claim.startDate,
    endDate: claim.endDate || undefined,
    currentRole: Boolean(claim.startDate && !claim.endDate),
    confidence,
    status: forceNeedsAttention ? 'needs_review' : toStatus(confidence),
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
  inputLines: string[],
  draft: ImportDraft,
  claims: ParsedClaim[],
  mode: SegmentationMode,
  selectedMode: SegmentationMode = mode,
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
    ...summarizeTextStage(inputLines),
    pageCount: undefined,
    previewLines: inputLines.slice(0, LOCAL_MAX_PREVIEW_LINES),
    previewLinesWithNumbers: toNumberedPreview(inputLines, LOCAL_MAX_PREVIEW_LINES),
  };

  const previewLinesWithNumbers = toNumberedPreview(segmentedLines, LOCAL_MAX_PREVIEW_LINES);

  return {
    mode,
    selectedMode,
    extractedTextLength: extractionStage.extractedChars,
    pageCount: extractionStage.pageCount,
    detectedLinesCount: segmentationSummary.detectedLinesCount,
    bulletCandidatesCount: segmentationSummary.bulletCandidatesCount,
    bulletOnlyLineCount: extractionStage.bulletOnlyLineCount,
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
    rawPreviewLinesWithNumbers: extractionDiagnostics?.previewLinesWithNumbers ?? extractionStage.previewLinesWithNumbers,
    extractionStage: {
      pageCount: extractionStage.pageCount,
      extractedChars: extractionStage.extractedChars,
      detectedLinesCount: extractionStage.detectedLinesCount,
      bulletCandidatesCount: extractionStage.bulletCandidatesCount,
      bulletOnlyLineCount: extractionStage.bulletOnlyLineCount,
      topBulletGlyphs: extractionStage.topBulletGlyphs,
    },
    segmentationStage: {
      detectedLinesCount: segmentationSummary.detectedLinesCount,
      bulletCandidatesCount: segmentationSummary.bulletCandidatesCount,
      bulletOnlyLineCount: segmentationSummary.bulletOnlyLineCount,
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

function toOutcomeMetric(text: string): string | undefined {
  const match = text.match(/([$€£]?\d[\d,.]*(?:\.\d+)?(?:[%xXkKmMbB])?)/);
  return match?.[1];
}

function isFeaturedAchievementRole(role: ImportDraftRole): boolean {
  const normalizedTitle = normalizeIdentityToken(role.title).toLowerCase();
  if (normalizedTitle !== 'featured achievements' && normalizedTitle !== 'featured proof') return false;
  const hasDate = Boolean(role.startDate.trim() || (role.endDate ?? '').trim() || role.currentRole);
  return !hasDate;
}

function mergeAnchoredFeaturedAchievementRoles(companies: ImportDraftCompany[]): ImportDraftCompany[] {
  return companies.map((company) => {
    const featuredRoles = company.roles.filter(isFeaturedAchievementRole);
    if (featuredRoles.length === 0) return company;

    const targetRoleIndex = company.roles.findIndex((role) =>
      !isFeaturedAchievementRole(role)
      && Boolean(role.title.trim() || role.startDate.trim() || (role.endDate ?? '').trim() || role.currentRole));
    if (targetRoleIndex < 0) return company;

    const nextRoles = company.roles.map((role) => ({
      ...role,
      highlights: [...role.highlights],
      outcomes: [...role.outcomes],
      tools: [...role.tools],
      skills: [...role.skills],
      sourceRefs: [...role.sourceRefs],
    }));
    const targetRole = nextRoles[targetRoleIndex];
    const seenOutcomeLines = new Set(targetRole.outcomes.map((item) => normalizeIdentityToken(item.text).toLowerCase()));
    let promotedCount = 0;

    for (const featuredRole of featuredRoles) {
      const featuredItems = [...featuredRole.highlights, ...featuredRole.outcomes];
      for (const item of featuredItems) {
        const normalizedText = normalizeIdentityToken(item.text);
        if (!normalizedText) continue;
        const normalizedKey = normalizedText.toLowerCase();
        if (seenOutcomeLines.has(normalizedKey)) continue;
        seenOutcomeLines.add(normalizedKey);
        targetRole.outcomes.push({
          ...item,
          id: `${targetRole.id}-featured-${promotedCount}`,
          type: 'outcome',
          text: normalizedText,
          metric: item.metric ?? toOutcomeMetric(normalizedText),
          confidence: clampConfidence(Math.max(item.confidence, targetRole.confidence * 0.82)),
          status: item.status === 'rejected' ? 'needs_review' : item.status,
        });
        promotedCount += 1;
      }
    }

    if (promotedCount === 0) return company;
    targetRole.status = targetRole.status === 'active' ? 'active' : 'needs_review';

    return {
      ...company,
      roles: nextRoles.filter((role) => !isFeaturedAchievementRole(role)),
    };
  });
}

function buildFallbackClaimsFromLines(lines: string[]): ParsedClaim[] {
  const items: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (BULLET_LINE_RE.test(trimmed)) {
      const value = trimmed.replace(BULLET_LINE_RE, '').trim();
      if (value) items.push(value);
      continue;
    }

    if (!BULLET_ONLY_RE.test(trimmed)) continue;

    const continuation: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].trim();
      if (!next || looksLikeBoundary(next) || BULLET_ONLY_RE.test(next) || BULLET_LINE_RE.test(next)) {
        break;
      }
      continuation.push(next);
      j += 1;
    }

    if (continuation.length > 0) {
      items.push(continuation.join(' ').replace(/\s+/g, ' ').trim());
      i = j - 1;
    }
  }

  if (items.length === 0) return [];

  const responsibilities = items.filter((item) => !shouldClassifyAsOutcome(item, 'experience_timeline', 'responsibility'));
  const outcomes = items
    .filter((item) => shouldClassifyAsOutcome(item, 'experience_timeline', 'responsibility'))
    .map((description) => ({
      description,
      metric: toOutcomeMetric(description),
      isNumeric: /\d/.test(description),
    }));
  const tools = detectTools(items.join(' '));

  return [
    {
      _key: 'fallback-unassigned',
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      responsibilities,
      outcomes,
      tools,
      included: true,
    },
  ];
}

function buildImportDraftForMode(
  rawText: string,
  mode: SegmentationMode,
  extractionDiagnostics?: ClaimsImportExtractionDiagnostics,
): ImportDraftParseResult {
  const normalizedInput = normalizeImportText(rawText);
  const inputLines = normalizedInput.split('\n');
  const normalizedText = normalizeForParser(normalizedInput, mode);

  if (!normalizedText.trim()) {
    const emptyDraft: ImportDraft = { companies: [] };
    return {
      draft: emptyDraft,
      diagnostics: buildDiagnostics(extractionDiagnostics || null, [], inputLines, emptyDraft, [], mode),
      normalizedText,
    };
  }

  const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean);
  const lineZones = classifyLineZones(lines);
  let claims = parseResumeStructured(normalizedText);
  if (claims.length === 0) {
    claims = buildFallbackClaimsFromLines(lines);
  }

  const grouped = new Map<string, ImportDraftCompany>();
  let roleCounter = 0;
  const hasStructuredExperienceClaims = claims.some((candidate) =>
    hasHighConfidenceCompanyAnchor(
      candidate,
      candidate.role.trim(),
      candidate.company.trim(),
      inferClaimZone(candidate, lines, lineZones),
    ));

  for (const claim of claims) {
    const claimZone = inferClaimZone(claim, lines, lineZones);
    if (claimZone === 'identity_contact' || claimZone === 'skills_tools' || claimZone === 'education_references') {
      continue;
    }

    const hasItems = claim.responsibilities.length + claim.outcomes.length + claim.tools.length > 0;
    if (!hasItems && !claim.role.trim() && !claim.company.trim()) {
      continue;
    }

    const roleValue = claim.role.trim();
    const parsedCompanyValue = claim.company.trim();
    const inferredFeaturedCompany = claimZone === 'featured_achievements' && !parsedCompanyValue
      ? extractCompanyAnchorFromEvidence(claim)
      : '';
    const companyValue = parsedCompanyValue || inferredFeaturedCompany;
    if (claimZone === 'featured_title' && !companyValue && !claim.startDate && !claim.endDate) {
      continue;
    }
    if (claimZone === 'featured_achievements' && !hasStructuredExperienceClaims && !companyValue) {
      continue;
    }
    const suspiciousRole = isLikelyNoisyRoleIdentity(roleValue);
    const suspiciousCompany = isLikelySuspiciousCompanyName(companyValue);
    const anchoredCompany = hasHighConfidenceCompanyAnchor(claim, roleValue, companyValue, claimZone);
    const featuredEvidenceBucket = claimZone === 'featured_achievements' && !anchoredCompany;
    const unresolvedBucket = !anchoredCompany;
    const unresolvedIdentity = unresolvedBucket
      || (claimZone !== 'featured_achievements' && (!roleValue || suspiciousRole));
    const companyName = unresolvedBucket ? 'Unassigned' : companyValue;
    const groupKey = unresolvedBucket
      ? (featuredEvidenceBucket ? 'featured-proof' : `unassigned-${roleCounter}`)
      : companyName.toLowerCase();

    if (
      suspiciousRole
      && suspiciousCompany
      && !hasAmbiguousOlderRoleBoundary(claim)
      && claimZone !== 'featured_achievements'
    ) {
      continue;
    }

    if (!grouped.has(groupKey)) {
      const companyConfidence = unresolvedIdentity ? 0.45 : 0.85;
      const companySourceSnippets = unresolvedBucket
        ? [...claim.responsibilities, ...claim.outcomes.map((outcome) => outcome.description)]
        : [companyName];
      grouped.set(groupKey, {
        id: `company-${grouped.size}`,
        name: companyName,
        confidence: companyConfidence,
        status: unresolvedIdentity ? 'needs_review' : toStatus(companyConfidence),
        sourceRefs: findSourceRefs(lines, companySourceSnippets),
        roles: [],
      });
    }

    const role = buildRole(
      {
        ...claim,
        role: claimZone === 'featured_achievements' && (!roleValue || suspiciousRole)
          ? 'Featured achievements'
          : (suspiciousRole ? '' : roleValue),
        company: companyValue,
      },
      lines,
      roleCounter,
      claimZone,
      unresolvedIdentity,
    );
    grouped.get(groupKey)?.roles.push(role);
    roleCounter += 1;
  }

  const draft: ImportDraft = {
    companies: mergeAnchoredFeaturedAchievementRoles([...grouped.values()]),
  };

  return {
    draft,
    diagnostics: buildDiagnostics(extractionDiagnostics || null, lines, inputLines, draft, claims, mode),
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

function scoreCandidate(result: ImportDraftParseResult): number {
  const companies = result.diagnostics.finalCompaniesCount;
  const roles = result.diagnostics.rolesCount;
  const items = result.diagnostics.mappingStage?.finalItemsCount ?? result.diagnostics.bulletsCount;
  const bulletCandidates = result.diagnostics.bulletCandidatesCount;
  const hasUsableDraft = hasUsableImportDraft(result.draft);
  const unresolvedCompanyCount = result.draft.companies.filter((company) => company.name === 'Unassigned').length;
  const namedCompanyCount = Math.max(0, companies - unresolvedCompanyCount);
  const unresolvedCompanyRatio = companies > 0 ? unresolvedCompanyCount / companies : 1;
  const noisyRoleCount = result.draft.companies
    .flatMap((company) => company.roles)
    .filter((role) => isLikelyNoisyRoleIdentity(role.title))
    .length;

  let score = items * 1 + roles * 4 + companies * 3 + bulletCandidates * 0.2;
  if (!hasUsableDraft) score -= 6;
  score -= result.diagnostics.reasonCodes.filter((code) => QUALITY_PENALTY_CODES.has(code)).length * 2;
  score += namedCompanyCount * 2;
  score -= unresolvedCompanyCount * 6;
  score -= unresolvedCompanyRatio * 12;
  score -= noisyRoleCount * 2;

  return score;
}

export function buildBestImportDraftFromText(
  rawText: string,
  options: Omit<BuildImportDraftOptions, 'mode'> = {},
): ImportDraftParseResult {
  const candidates = AUTO_SEGMENTATION_MODES.map((mode) => ({
    mode,
    result: buildImportDraftForMode(rawText, mode, options.extractionDiagnostics),
  }));

  const scored = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate.result),
      counts: {
        companies: candidate.result.diagnostics.finalCompaniesCount,
        roles: candidate.result.diagnostics.rolesCount,
        items: candidate.result.diagnostics.mappingStage?.finalItemsCount ?? candidate.result.diagnostics.bulletsCount,
        bulletCandidates: candidate.result.diagnostics.bulletCandidatesCount,
      },
    }))
    .sort((a, b) => b.score - a.score);

  const winner = scored[0] ?? {
    mode: 'default' as SegmentationMode,
    result: buildImportDraftForMode(rawText, 'default', options.extractionDiagnostics),
    score: 0,
    counts: { companies: 0, roles: 0, items: 0, bulletCandidates: 0 },
  };

  return {
    ...winner.result,
    diagnostics: {
      ...winner.result.diagnostics,
      mode: winner.mode,
      selectedMode: winner.mode,
      candidateModes: scored.map((candidate) => ({
        mode: candidate.mode,
        score: candidate.score,
        reasonCodes: candidate.result.diagnostics.reasonCodes,
        counts: candidate.counts,
      })),
    },
  };
}

export function buildImportDraftFromText(rawText: string, options: BuildImportDraftOptions = {}): ImportDraftParseResult {
  if (options.mode) {
    return buildImportDraftForMode(rawText, options.mode, options.extractionDiagnostics);
  }

  return buildBestImportDraftFromText(rawText, options);
}

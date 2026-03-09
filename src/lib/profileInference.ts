import type { ImportDraft, ParseDiagnostics, ProfilePrefillSuggestion } from '../types';

const NAME_LINE_TITLE_CASE_RE = /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/;
const NAME_LINE_ALL_CAPS_RE = /^[A-Z][A-Z.'-]+(?:\s+[A-Z][A-Z.'-]+){1,3}$/;
const CITY_STATE_RE = /\b([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){0,3}),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/;
const SALARY_RE = /\$\s?(\d[\d,]{4,})/g;
const ROLE_KEYWORD_RE = /\b(director|manager|lead|head|vp|vice president|engineer|analyst|specialist|coordinator|officer|chief|consultant)\b/i;
const CONTACT_RE = /(@|https?:\/\/|www\.|linkedin\.com|github\.com)/i;
const DATE_LINE_RE = /^(?:\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4})(?:\s*[-–—]\s*(?:\d{4}|present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}))?$/i;
const DISALLOWED_ROLE_RE = /^(unassigned|unspecified role|role title needs review|n\/a|na)$/i;
const PREVIEW_LINE_PREFIX_RE = /^\s*\d+\s*[:.)-]\s*/;

function normalizePreviewLine(value: string): string {
  return value.replace(PREVIEW_LINE_PREFIX_RE, '').trim();
}

function toNameCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+)/)
    .map((token) => {
      if (!/[a-z]/.test(token)) return token;
      return token[0].toUpperCase() + token.slice(1);
    })
    .join('');
}

function toTargetRoleCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const hadLowercase = /[a-z]/.test(trimmed);
  if (hadLowercase) return trimmed;

  return trimmed
    .toLowerCase()
    .split(/(\s+)/)
    .map((token) => {
      if (!/[a-z]/.test(token)) return token;
      return token[0].toUpperCase() + token.slice(1);
    })
    .join('');
}

function inferName(previewLines: string[]): { firstName?: string; lastName?: string } {
  for (const line of previewLines.slice(0, 10)) {
    const trimmed = normalizePreviewLine(line);
    if (!trimmed || CONTACT_RE.test(trimmed)) continue;
    if (ROLE_KEYWORD_RE.test(trimmed)) continue;

    const isTitleCase = NAME_LINE_TITLE_CASE_RE.test(trimmed);
    const isAllCaps = NAME_LINE_ALL_CAPS_RE.test(trimmed);
    if (!isTitleCase && !isAllCaps) continue;

    const normalized = isAllCaps ? toNameCase(trimmed) : trimmed;
    const parts = normalized.split(/\s+/);
    if (parts.length < 2) continue;

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  return {};
}

function isUsableRole(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (DISALLOWED_ROLE_RE.test(trimmed)) return false;
  if (!ROLE_KEYWORD_RE.test(trimmed)) return false;
  if (CONTACT_RE.test(trimmed)) return false;
  if (DATE_LINE_RE.test(trimmed)) return false;
  return true;
}

function inferRoleFromPreviewLines(previewLines: string[]): string | null {
  for (const line of previewLines.slice(0, 24)) {
    const trimmed = normalizePreviewLine(line);
    if (!isUsableRole(trimmed)) continue;
    if (trimmed.length > 72) continue;
    return toTargetRoleCase(trimmed);
  }
  return null;
}

function inferTargetRoles(draft: ImportDraft, previewLines: string[]): string[] {
  const roles = new Set<string>();

  for (const company of draft.companies) {
    for (const role of company.roles) {
      const title = role.title.trim();
      if (!isUsableRole(title)) continue;
      roles.add(toTargetRoleCase(title));
      if (roles.size >= 6) return [...roles];
    }
  }

  if (roles.size === 0) {
    const fallbackRole = inferRoleFromPreviewLines(previewLines);
    if (fallbackRole) roles.add(fallbackRole);
  }

  return [...roles];
}

function inferToolAndSkillHints(draft: ImportDraft): { toolHints: string[]; skillHints: string[] } {
  const tools = new Set<string>();
  const skills = new Set<string>();

  for (const company of draft.companies) {
    for (const role of company.roles) {
      for (const tool of role.tools) {
        const value = tool.text.trim();
        if (value) tools.add(value);
        if (tools.size >= 10) break;
      }
      for (const skill of role.skills) {
        const value = skill.text.trim();
        if (value) skills.add(value);
        if (skills.size >= 10) break;
      }
    }
  }

  return {
    toolHints: [...tools].slice(0, 8),
    skillHints: [...skills].slice(0, 8),
  };
}

function inferLocationHints(previewLines: string[]): string[] {
  const hints = new Set<string>();

  for (const line of previewLines) {
    const normalized = normalizePreviewLine(line);
    if (/\bremote\b/i.test(normalized)) hints.add('Remote');
    if (/\bhybrid\b/i.test(normalized)) hints.add('Hybrid');
    if (/\bonsite\b|on-site|in office/i.test(normalized)) hints.add('Onsite');

    const cityMatch = normalized.match(CITY_STATE_RE);
    if (cityMatch) {
      hints.add(`${cityMatch[1].trim()}, ${cityMatch[2].trim()}`);
    }

    if (hints.size >= 4) break;
  }

  return [...hints];
}

function inferCompensation(previewLines: string[]): ProfilePrefillSuggestion['compensation'] {
  const salaries: number[] = [];

  for (const line of previewLines) {
    SALARY_RE.lastIndex = 0;
    let match = SALARY_RE.exec(line);
    while (match) {
      const value = Number.parseInt(match[1].replaceAll(',', ''), 10);
      if (!Number.isNaN(value)) salaries.push(value);
      match = SALARY_RE.exec(line);
    }
  }

  if (salaries.length === 0) return undefined;

  const floor = Math.min(...salaries);
  const target = Math.max(...salaries);
  return { floor, target };
}

function toPrefillPreviewLines(diagnostics: ParseDiagnostics): string[] {
  if (diagnostics.rawPreviewLinesWithNumbers?.length) {
    return diagnostics.rawPreviewLinesWithNumbers.map((line) => line.text);
  }
  return diagnostics.previewLines.map((line) => normalizePreviewLine(line));
}

export function inferProfilePrefillSuggestion(
  diagnostics: ParseDiagnostics,
  draft: ImportDraft,
): ProfilePrefillSuggestion {
  const previewLines = toPrefillPreviewLines(diagnostics);
  const name = inferName(previewLines);
  const { toolHints, skillHints } = inferToolAndSkillHints(draft);

  const suggestion: ProfilePrefillSuggestion = {
    firstName: name.firstName,
    lastName: name.lastName,
    targetRoles: inferTargetRoles(draft, previewLines),
    skillHints,
    toolHints,
    locationHints: inferLocationHints(previewLines),
    compensation: inferCompensation(previewLines),
    hardFilterHints: undefined,
  };

  return suggestion;
}

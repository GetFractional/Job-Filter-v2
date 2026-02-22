import type { ImportDraft, ParseDiagnostics, ProfilePrefillSuggestion } from '../types';

const NAME_LINE_RE = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/;
const CITY_STATE_RE = /\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/;
const SALARY_RE = /\$\s?(\d[\d,]{4,})/g;

function inferName(previewLines: string[]): { firstName?: string; lastName?: string } {
  for (const line of previewLines.slice(0, 8)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes('@') || trimmed.includes('http')) continue;
    if (!NAME_LINE_RE.test(trimmed)) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  return {};
}

function inferTargetRoles(draft: ImportDraft): string[] {
  const roles = new Set<string>();
  for (const company of draft.companies) {
    for (const role of company.roles) {
      const title = role.title.trim();
      if (!title || title.toLowerCase() === 'unspecified role') continue;
      roles.add(title);
      if (roles.size >= 6) return [...roles];
    }
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
    if (/\bremote\b/i.test(line)) hints.add('Remote');
    if (/\bhybrid\b/i.test(line)) hints.add('Hybrid');
    if (/\bonsite\b|on-site|in office/i.test(line)) hints.add('Onsite');

    const cityMatch = line.match(CITY_STATE_RE);
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

export function inferProfilePrefillSuggestion(
  diagnostics: ParseDiagnostics,
  draft: ImportDraft,
): ProfilePrefillSuggestion {
  const previewLines = diagnostics.previewLines;
  const name = inferName(previewLines);
  const { toolHints, skillHints } = inferToolAndSkillHints(draft);

  const suggestion: ProfilePrefillSuggestion = {
    firstName: name.firstName,
    lastName: name.lastName,
    targetRoles: inferTargetRoles(draft),
    skillHints,
    toolHints,
    locationHints: inferLocationHints(previewLines),
    compensation: inferCompensation(previewLines),
    hardFilterHints: undefined,
  };

  return suggestion;
}

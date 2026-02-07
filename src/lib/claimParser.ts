// Job Filter v2 — Structured Resume/LinkedIn Claim Parser
// Extracts role entries from pasted resume text with tool detection.
// Returns ParsedClaim[] for user review before import.
//
// Two-pass architecture:
//   Pass 1 — Identify claim boundaries by scanning for header lines and dates.
//   Pass 2 — Extract role, company, dates, bullets, tools from each block.
// Followed by a merge step to combine orphan fragments.

import type { ClaimOutcome } from '../types';

// ============================================================
// Types
// ============================================================

export interface ParsedClaim {
  /** Temporary key for React list rendering */
  _key: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string; // empty string = Present
  responsibilities: string[];
  tools: string[];
  outcomes: ParsedOutcome[];
  /** User can mark individual claims to skip */
  included: boolean;
}

export interface ParsedOutcome {
  description: string;
  metric?: string;
  isNumeric: boolean;
}

// ============================================================
// Section headers that should be SKIPPED entirely
// ============================================================

const SECTION_HEADERS = new Set([
  'experience',
  'work experience',
  'work history',
  'professional experience',
  'employment history',
  'employment',
  'education',
  'skills',
  'technical skills',
  'core competencies',
  'competencies',
  'summary',
  'professional summary',
  'executive summary',
  'objective',
  'career objective',
  'certifications',
  'licenses',
  'honors',
  'awards',
  'publications',
  'volunteer',
  'volunteer experience',
  'interests',
  'references',
  'projects',
  'personal projects',
  'languages',
  'affiliations',
  'professional affiliations',
  'additional information',
  'about',
  'about me',
  'profile',
]);

/**
 * Returns true when a line (lowercased, trimmed) looks like a resume section
 * heading that should be ignored rather than treated as a role or company.
 */
function isSectionHeader(line: string): boolean {
  // Strip leading numbering / decoration (e.g., "1. Experience" or "--- SKILLS ---")
  const cleaned = line
    .replace(/^[\d.)\-–—*#|:]+\s*/, '')
    .replace(/[\-–—*#|:]+\s*$/, '')
    .trim()
    .toLowerCase();
  return SECTION_HEADERS.has(cleaned);
}

// ============================================================
// Known Tools (for auto-detection in bullet text)
// ============================================================

const KNOWN_TOOLS: string[] = [
  'Salesforce', 'HubSpot', 'Marketo', 'Pardot', 'Segment', 'Amplitude',
  'Mixpanel', 'Google Analytics', 'GA4', 'Tableau', 'Looker', 'dbt',
  'Snowflake', 'BigQuery', 'Braze', 'Iterable', 'Klaviyo', 'Mailchimp',
  'Meta Ads', 'Google Ads', 'LinkedIn Ads', 'TikTok Ads',
  'Figma', 'Notion', 'Jira', 'Asana', 'Trello', 'Slack',
  'AWS', 'GCP', 'Azure', 'Stripe', 'Shopify', 'Magento',
  'Webflow', 'WordPress', 'Contentful', 'Sanity',
  'React', 'Next.js', 'Node.js', 'Python', 'SQL', 'PostgreSQL', 'MongoDB',
  'Airtable', 'Zapier', 'Make', 'Power BI', 'Excel',
  'Intercom', 'Zendesk', 'Drift', 'Gong', 'Outreach', 'Salesloft',
  'Clearbit', 'ZoomInfo', '6sense', 'Demandbase',
  'Optimizely', 'LaunchDarkly', 'VWO', 'Hotjar', 'FullStory',
  'Attentive', 'Postscript', 'Yotpo', 'Privy',
  'Adobe Analytics', 'Adobe Experience Manager', 'Adobe Campaign',
  'Sprout Social', 'Hootsuite', 'Buffer',
  'SEMrush', 'Ahrefs', 'Moz',
];

// Alias map: common variations -> canonical name
const TOOL_ALIASES: Record<string, string> = {
  'google analytics 4': 'GA4',
  'ga 4': 'GA4',
  'hubspot crm': 'HubSpot',
  'salesforce crm': 'Salesforce',
  'amazon web services': 'AWS',
  'google cloud platform': 'GCP',
  'google cloud': 'GCP',
  'microsoft azure': 'Azure',
  'next js': 'Next.js',
  'nextjs': 'Next.js',
  'node js': 'Node.js',
  'nodejs': 'Node.js',
  'postgres': 'PostgreSQL',
  'mongo': 'MongoDB',
  'power bi': 'Power BI',
  'powerbi': 'Power BI',
  'semrush': 'SEMrush',
  'launch darkly': 'LaunchDarkly',
  'full story': 'FullStory',
  'sprout social': 'Sprout Social',
  'zoom info': 'ZoomInfo',
  'demand base': 'Demandbase',
  'linked in ads': 'LinkedIn Ads',
  'tik tok ads': 'TikTok Ads',
  'facebook ads': 'Meta Ads',
  'fb ads': 'Meta Ads',
  'meta ads manager': 'Meta Ads',
  'wordpress.com': 'WordPress',
  'wordpress.org': 'WordPress',
  'aem': 'Adobe Experience Manager',
};

// Build lookup structures once at module load
interface ToolEntry {
  canonical: string;
  lower: string;
}

const TOOLS_LOWER: ToolEntry[] = KNOWN_TOOLS.map((t) => ({
  canonical: t,
  lower: t.toLowerCase(),
}));

const ALIAS_ENTRIES: { canonical: string; lower: string }[] = Object.entries(
  TOOL_ALIASES,
).map(([alias, canonical]) => ({ canonical, lower: alias.toLowerCase() }));

// ============================================================
// Patterns
// ============================================================

// Date range patterns (evaluated in order; first match wins)
const DATE_PATTERNS: RegExp[] = [
  // "Jan 2020 - Present", "January 2020 - Dec 2023"
  /(\w{3,9}\s+\d{4})\s*[-–—]\s*(\w{3,9}\s+\d{4}|Present|Current|Now)/i,
  // "01/2020 - 12/2023", "1/2020 - Present"
  /(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|Present|Current|Now)/i,
  // "2020 - 2023", "2020 - Present"
  /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current|Now)/i,
  // "(Jan 2020 - Present)" or "(2020 - 2023)"
  /\((\w{3,9}?\s*\d{4})\s*[-–—]\s*(\w{3,9}?\s*\d{4}|Present|Current|Now)\)/i,
];

// Bullet point prefixes
const BULLET_RE = /^[-*\u2022\u25E6\u25AA\u25B8\u25BA\u2023\u27A2\u2219]\s*/;

// Metric indicators for outcome classification
const METRIC_RE =
  /\d+[%xX$]|\$[\d,]+|increased|grew|reduced|improved|generated|drove|boosted|scaled|launched|saved|achieved|delivered|exceeded|surpassed|doubled|tripled/i;

// Numeric metric extraction (e.g., "150%", "$2.5M", "3x")
const METRIC_VALUE_RE = /(\d[\d,.]*[%xXkKmMbB]?\+?|\$[\d,.]+[kKmMbB]?)/;

// Role/Company header patterns — ordered by specificity (most specific first).
// Each entry returns [role, company]. A null capture means "unknown".
const HEADER_PATTERNS: {
  re: RegExp;
  /** Map match groups to role/company. Return null to skip. */
  extract: (m: RegExpMatchArray) => { role: string; company: string } | null;
}[] = [
  // 1. "Role at Company" or "Role @ Company"
  {
    re: /^(.+?)\s+(?:at|@)\s+(.+?)$/i,
    extract: (m) => ({ role: m[1].trim(), company: m[2].trim() }),
  },
  // 2. "Role — Company" or "Role - Company" or "Role | Company"
  //    Requires the left side to start with a capital letter and be a
  //    reasonable role length. This avoids matching random dash-separated text.
  {
    re: /^([A-Z][^|–—\-\n]{2,55})\s+[|–—-]\s+([A-Z][^|–—\-\n]{2,55})$/,
    extract: (m) => {
      const left = m[1].trim();
      const right = m[2].trim();
      // Heuristic: if the right side looks more like a role title (contains
      // words like Director, Manager, Engineer, etc.), it is the "Company — Role"
      // LinkedIn-style reversed format.
      if (looksLikeRoleTitle(right) && !looksLikeRoleTitle(left)) {
        return { role: right, company: left };
      }
      return { role: left, company: right };
    },
  },
  // 3. "Role, Company" — only when both sides are capitalized and reasonable.
  //    Must NOT look like "City, State" or "Lastname, Firstname".
  {
    re: /^([A-Z][^,\n]{3,50}),\s+([A-Z][^,\n]{2,50})$/,
    extract: (m) => {
      const left = m[1].trim();
      const right = m[2].trim();
      // Reject if either side is just 1-2 words of all-caps short text
      // (likely "City, ST" or "LASTNAME, FIRST")
      if (/^[A-Z]{2}$/.test(right)) return null; // state abbreviation
      return { role: left, company: right };
    },
  },
];

/** Common role-title keywords used to disambiguate "Company — Role" vs "Role — Company". */
const ROLE_KEYWORDS_RE =
  /\b(director|manager|engineer|developer|lead|head|chief|vp|vice president|analyst|coordinator|specialist|consultant|architect|designer|scientist|officer|associate|senior|junior|principal|staff|intern)\b/i;

function looksLikeRoleTitle(text: string): boolean {
  return ROLE_KEYWORDS_RE.test(text);
}

// ============================================================
// Internal: line classification for Pass 1
// ============================================================

type LineKind =
  | 'section_header'
  | 'role_header'
  | 'date_line'
  | 'bullet'
  | 'blank'
  | 'text';

interface ClassifiedLine {
  index: number;
  raw: string;
  trimmed: string;
  kind: LineKind;
  headerMatch?: { role: string; company: string };
  dateMatch?: { start: string; end: string };
}

/**
 * Attempt to extract a date range from a line. Returns null on failure.
 */
function extractDateRange(
  text: string,
): { start: string; end: string; matched: string } | null {
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const endRaw = m[2];
      const endNorm =
        /^(present|current|now)$/i.test(endRaw) ? '' : endRaw;
      return { start: m[1], end: endNorm, matched: m[0] };
    }
  }
  return null;
}

/**
 * Attempt to match a role/company header. Returns null on failure.
 * Strips date ranges from the line first so they don't pollute matching.
 */
function matchRoleHeader(
  trimmed: string,
  dateStr?: string,
): { role: string; company: string } | null {
  let headerLine = trimmed;
  if (dateStr) {
    headerLine = headerLine.replace(dateStr, '').trim();
    // Clean trailing/leading separators left over after removing the date
    headerLine = headerLine.replace(/^[,|–—\-]\s*|\s*[,|–—\-]$/g, '').trim();
  }

  if (headerLine.length < 3 || headerLine.length > 120) return null;

  for (const { re, extract } of HEADER_PATTERNS) {
    const m = headerLine.match(re);
    if (m) {
      const result = extract(m);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Classify every line in the input. This is Pass 1.
 */
function classifyLines(lines: string[]): ClassifiedLine[] {
  return lines.map((raw, index) => {
    const trimmed = raw.trim();

    // Blank
    if (!trimmed) {
      return { index, raw, trimmed, kind: 'blank' as const };
    }

    // Section header (e.g., "EXPERIENCE", "Education")
    if (isSectionHeader(trimmed)) {
      return { index, raw, trimmed, kind: 'section_header' as const };
    }

    // Bullet
    if (BULLET_RE.test(trimmed)) {
      return { index, raw, trimmed, kind: 'bullet' as const };
    }

    // Date range
    const dateInfo = extractDateRange(trimmed);

    // Role/company header (test non-bullet, non-section lines)
    const headerMatch = matchRoleHeader(trimmed, dateInfo?.matched);

    if (headerMatch) {
      return {
        index,
        raw,
        trimmed,
        kind: 'role_header' as const,
        headerMatch,
        dateMatch: dateInfo
          ? { start: dateInfo.start, end: dateInfo.end }
          : undefined,
      };
    }

    // Standalone date line (no header detected, but has a date)
    if (dateInfo) {
      // Check whether the non-date portion looks like a role name
      const residual = trimmed.replace(dateInfo.matched, '').trim()
        .replace(/^[,|–—\-]\s*|\s*[,|–—\-]$/g, '').trim();
      if (residual.length >= 3 && /^[A-Z]/.test(residual)) {
        // Treat as a role header with unknown company
        return {
          index,
          raw,
          trimmed,
          kind: 'role_header' as const,
          headerMatch: { role: residual, company: '' },
          dateMatch: { start: dateInfo.start, end: dateInfo.end },
        };
      }
      return {
        index,
        raw,
        trimmed,
        kind: 'date_line' as const,
        dateMatch: { start: dateInfo.start, end: dateInfo.end },
      };
    }

    return { index, raw, trimmed, kind: 'text' as const };
  });
}

// ============================================================
// Pass 2: Build raw claim blocks from classified lines
// ============================================================

interface RawClaimBlock {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  textLines: string[];
}

/**
 * Try to detect the LinkedIn-style multi-line header format:
 *   Line N:   Company name (text)
 *   Line N+1: Role title (text)
 *   Line N+2: Date range (date_line)
 *
 * Also handles the inverse (Role / Company / Date).
 *
 * Returns the number of lines consumed (0 if no match).
 */
function tryLinkedInBlock(
  classified: ClassifiedLine[],
  startIdx: number,
): { consumed: number; role: string; company: string; start: string; end: string } | null {
  // Need at least 2 lines (text + date) or 3 lines (text + text + date)
  const remaining = classified.length - startIdx;
  if (remaining < 2) return null;

  const line0 = classified[startIdx];
  const line1 = classified[startIdx + 1];
  const line2 = remaining >= 3 ? classified[startIdx + 2] : null;

  // Pattern A: text, text, date_line
  if (
    line0.kind === 'text' &&
    line1.kind === 'text' &&
    line2?.kind === 'date_line' &&
    line2.dateMatch
  ) {
    const a = line0.trimmed;
    const b = line1.trimmed;
    // If b looks like a role title, a is the company
    if (looksLikeRoleTitle(b) && !looksLikeRoleTitle(a)) {
      return {
        consumed: 3,
        company: a,
        role: b,
        start: line2.dateMatch.start,
        end: line2.dateMatch.end,
      };
    }
    // If a looks like a role title, b is the company
    if (looksLikeRoleTitle(a)) {
      return {
        consumed: 3,
        role: a,
        company: b,
        start: line2.dateMatch.start,
        end: line2.dateMatch.end,
      };
    }
    // Default: treat first as role, second as company (standard resume order)
    return {
      consumed: 3,
      role: a,
      company: b,
      start: line2.dateMatch.start,
      end: line2.dateMatch.end,
    };
  }

  // Pattern B: text, date_line (role or company + date, no second text line)
  if (
    line0.kind === 'text' &&
    line1.kind === 'date_line' &&
    line1.dateMatch
  ) {
    const text = line0.trimmed;
    // Only match if the text is short enough to be a header (not a paragraph)
    if (text.length <= 80 && /^[A-Z]/.test(text)) {
      const isRole = looksLikeRoleTitle(text);
      return {
        consumed: 2,
        role: isRole ? text : '',
        company: isRole ? '' : text,
        start: line1.dateMatch.start,
        end: line1.dateMatch.end,
      };
    }
  }

  return null;
}

function buildRawBlocks(classified: ClassifiedLine[]): RawClaimBlock[] {
  const blocks: RawClaimBlock[] = [];
  let current: RawClaimBlock | null = null;

  const pushCurrent = () => {
    if (current) {
      blocks.push(current);
      current = null;
    }
  };

  let i = 0;
  while (i < classified.length) {
    const cl = classified[i];

    // Skip blanks and section headers
    if (cl.kind === 'blank' || cl.kind === 'section_header') {
      i++;
      continue;
    }

    // Explicit role_header — always starts a new block
    if (cl.kind === 'role_header' && cl.headerMatch) {
      pushCurrent();
      current = {
        role: cl.headerMatch.role,
        company: cl.headerMatch.company,
        startDate: cl.dateMatch?.start ?? '',
        endDate: cl.dateMatch?.end ?? '',
        bullets: [],
        textLines: [],
      };
      i++;
      continue;
    }

    // Try LinkedIn multi-line block detection on text/date sequences
    if (cl.kind === 'text' || cl.kind === 'date_line') {
      const linked = tryLinkedInBlock(classified, i);
      if (linked) {
        pushCurrent();
        current = {
          role: linked.role,
          company: linked.company,
          startDate: linked.start,
          endDate: linked.end,
          bullets: [],
          textLines: [],
        };
        i += linked.consumed;
        continue;
      }
    }

    // Date line that attaches to the current block
    if (cl.kind === 'date_line' && cl.dateMatch && current && !current.startDate) {
      current.startDate = cl.dateMatch.start;
      current.endDate = cl.dateMatch.end;
      i++;
      continue;
    }

    // Bullet — attach to current block
    if (cl.kind === 'bullet') {
      if (!current) {
        // Orphan bullet before any header — create a holder block
        current = {
          role: '',
          company: '',
          startDate: '',
          endDate: '',
          bullets: [],
          textLines: [],
        };
      }
      const bulletText = cl.trimmed.replace(BULLET_RE, '').trim();
      if (bulletText) {
        current.bullets.push(bulletText);
      }
      i++;
      continue;
    }

    // Plain text line — attach to current block as context
    if (cl.kind === 'text') {
      if (current) {
        current.textLines.push(cl.trimmed);
      }
      // If there's no current block, we discard stray text (not enough info
      // to start a claim).
      i++;
      continue;
    }

    // Fallback: skip anything else
    i++;
  }

  pushCurrent();
  return blocks;
}

// ============================================================
// Pass 3: Convert raw blocks to ParsedClaim[], merge, deduplicate
// ============================================================

let _keyCounter = 0;

function makeClaim(): ParsedClaim {
  return {
    _key: `claim-${_keyCounter++}`,
    role: '',
    company: '',
    startDate: '',
    endDate: '',
    responsibilities: [],
    tools: [],
    outcomes: [],
    included: true,
  };
}

function blockToClaim(block: RawClaimBlock): ParsedClaim {
  const claim = makeClaim();
  claim.role = block.role;
  claim.company = block.company;
  claim.startDate = block.startDate;
  claim.endDate = block.endDate;

  // Collect tools from all text
  const allToolsSet = new Set<string>();

  for (const bullet of block.bullets) {
    // Detect tools
    for (const t of detectTools(bullet)) {
      allToolsSet.add(t);
    }

    // Classify as outcome or responsibility
    if (METRIC_RE.test(bullet)) {
      const metricMatch = bullet.match(METRIC_VALUE_RE);
      claim.outcomes.push({
        description: bullet,
        metric: metricMatch?.[1],
        isNumeric: !!metricMatch,
      });
    } else {
      claim.responsibilities.push(bullet);
    }
  }

  // Also scan non-bullet text lines for tools
  for (const line of block.textLines) {
    for (const t of detectTools(line)) {
      allToolsSet.add(t);
    }
  }

  claim.tools = [...allToolsSet];
  return claim;
}

/**
 * Merge adjacent claims where the second claim has no role AND no company.
 * These are orphan bullet groups that belong to the preceding role.
 */
function mergeAdjacentRolelessClaims(claims: ParsedClaim[]): ParsedClaim[] {
  if (claims.length <= 1) return claims;

  const merged: ParsedClaim[] = [claims[0]];

  for (let i = 1; i < claims.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = claims[i];

    // If current has neither role nor company, merge into previous
    if (!curr.role && !curr.company) {
      prev.responsibilities.push(...curr.responsibilities);
      prev.outcomes.push(...curr.outcomes);
      // Merge tools (dedup handled later)
      const toolSet = new Set([...prev.tools, ...curr.tools]);
      prev.tools = [...toolSet];
      // Adopt dates if previous had none
      if (!prev.startDate && curr.startDate) {
        prev.startDate = curr.startDate;
        prev.endDate = curr.endDate;
      }
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

/**
 * Deduplicate responsibilities within each claim (case-insensitive).
 */
function deduplicateResponsibilities(claims: ParsedClaim[]): void {
  for (const claim of claims) {
    const seen = new Set<string>();
    claim.responsibilities = claim.responsibilities.filter((r) => {
      const key = r.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Also deduplicate outcomes by description
    const seenOutcomes = new Set<string>();
    claim.outcomes = claim.outcomes.filter((o) => {
      const key = o.description.toLowerCase().trim();
      if (seenOutcomes.has(key)) return false;
      seenOutcomes.add(key);
      return true;
    });
  }
}

// ============================================================
// Main entry point
// ============================================================

export function parseResumeStructured(text: string): ParsedClaim[] {
  // Reset key counter each invocation for deterministic keys
  _keyCounter = 0;

  const lines = text.split('\n');

  // Pass 1: Classify every line
  const classified = classifyLines(lines);

  // Pass 2: Build raw claim blocks
  const rawBlocks = buildRawBlocks(classified);

  // Convert blocks to claims
  let claims = rawBlocks.map(blockToClaim);

  // Merge orphan fragments
  claims = mergeAdjacentRolelessClaims(claims);

  // Drop claims that have neither role nor company (even after merging)
  claims = claims.filter((c) => c.role || c.company);

  // Deduplicate responsibilities and outcomes
  deduplicateResponsibilities(claims);

  return claims;
}

// ============================================================
// Tool Detection (exported)
// ============================================================

export function detectTools(text: string): string[] {
  const lower = text.toLowerCase();
  const foundSet = new Set<string>();

  // Check canonical tool names
  for (const { canonical, lower: toolLower } of TOOLS_LOWER) {
    if (!lower.includes(toolLower)) continue;

    // Verify word boundary (not part of a larger word)
    const idx = lower.indexOf(toolLower);
    if (isWordBoundaryMatch(lower, idx, toolLower.length)) {
      foundSet.add(canonical);
    }
  }

  // Check aliases and normalize to canonical
  for (const { canonical, lower: aliasLower } of ALIAS_ENTRIES) {
    if (!lower.includes(aliasLower)) continue;

    const idx = lower.indexOf(aliasLower);
    if (isWordBoundaryMatch(lower, idx, aliasLower.length)) {
      foundSet.add(canonical); // always store the canonical name
    }
  }

  return [...foundSet];
}

/**
 * Check whether a substring match at `idx` with length `len` in `text`
 * sits on word boundaries (not embedded inside a larger word).
 */
function isWordBoundaryMatch(text: string, idx: number, len: number): boolean {
  const BOUNDARY = /[\s,;()/\-.:|'"!?\[\]{}]/;
  const before = idx > 0 ? text[idx - 1] : ' ';
  const after = idx + len < text.length ? text[idx + len] : ' ';
  return (BOUNDARY.test(before) || idx === 0) &&
    (BOUNDARY.test(after) || idx + len === text.length);
}

// ============================================================
// Convert ParsedClaim -> Partial<Claim> for import
// ============================================================

export function parsedClaimToImport(parsed: ParsedClaim): {
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  responsibilities: string[];
  tools: string[];
  outcomes: ClaimOutcome[];
} {
  return {
    role: parsed.role,
    company: parsed.company,
    startDate: parsed.startDate,
    endDate: parsed.endDate || undefined,
    responsibilities: parsed.responsibilities,
    tools: parsed.tools,
    outcomes: parsed.outcomes.map((o) => ({
      description: o.description,
      metric: o.metric,
      isNumeric: o.isNumeric,
      verified: false,
    })),
  };
}

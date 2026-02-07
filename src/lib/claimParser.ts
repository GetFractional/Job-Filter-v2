// Job Filter v2 — Structured Resume/LinkedIn Claim Parser
// Extracts role entries from pasted resume text with tool detection.
// Returns ParsedClaim[] for user review before import.

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

// Build a case-insensitive lookup map
const TOOLS_LOWER = KNOWN_TOOLS.map((t) => ({ canonical: t, lower: t.toLowerCase() }));

// ============================================================
// Patterns
// ============================================================

// Role/Company header patterns (multiple common formats)
const HEADER_PATTERNS = [
  // "Role at Company" or "Role @ Company"
  /^(.+?)\s+(?:at|@)\s+(.+?)$/i,
  // "Role, Company" (when line doesn't look like a bullet)
  /^([A-Z][^,\n]{3,40}),\s+([A-Z][^,\n]{2,40})$/,
  // "Role - Company" or "Role — Company" or "Role | Company"
  /^(.+?)\s+[-–—|]\s+(.+?)$/i,
  // "Company — Role" (LinkedIn format, reversed)
  /^([A-Z][^\n]{2,40})\s+[-–—]\s+([A-Z][^\n]{2,40})$/,
];

// Date range patterns
const DATE_PATTERNS = [
  // "Jan 2020 - Present", "January 2020 – Dec 2023"
  /(\w{3,9}\s+\d{4})\s*[-–—]\s*(\w{3,9}\s+\d{4}|Present|Current|Now)/i,
  // "2020 - 2023", "2020 - Present"
  /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current|Now)/i,
  // "(2020 - 2023)" or "(Jan 2020 - Present)"
  /\((\w{3,9}?\s*\d{4})\s*[-–—]\s*(\w{3,9}?\s*\d{4}|Present|Current|Now)\)/i,
];

// Bullet point prefixes
const BULLET_RE = /^[-*•◦▪▸►]\s*/;

// Metric indicators for outcome classification
const METRIC_RE = /\d+[%xX$]|\$[\d,]+|increased|grew|reduced|improved|generated|drove|boosted|scaled|launched|saved|achieved|delivered|exceeded|surpassed|doubled|tripled/i;

// Numeric metric extraction (e.g., "150%", "$2.5M", "3x")
const METRIC_VALUE_RE = /(\d[\d,.]*[%xXkKmMbB]?\+?|\$[\d,.]+[kKmMbB]?)/;

// ============================================================
// Parser
// ============================================================

export function parseResumeStructured(text: string): ParsedClaim[] {
  const claims: ParsedClaim[] = [];
  const lines = text.split('\n');

  let current: ParsedClaim | null = null;
  let keyCounter = 0;

  const makeClaim = (): ParsedClaim => ({
    _key: `claim-${keyCounter++}`,
    role: '',
    company: '',
    startDate: '',
    endDate: '',
    responsibilities: [],
    tools: [],
    outcomes: [],
    included: true,
  });

  const finalizeCurrent = () => {
    if (current && (current.role || current.company)) {
      // Deduplicate tools
      current.tools = [...new Set(current.tools)];
      claims.push(current);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) continue;

    // Check if this line contains a date range
    let dateMatch: RegExpMatchArray | null = null;
    for (const pattern of DATE_PATTERNS) {
      dateMatch = trimmed.match(pattern);
      if (dateMatch) break;
    }

    // Check if this line matches a role/company header
    const isBullet = BULLET_RE.test(trimmed);
    let headerMatch: { role: string; company: string } | null = null;

    if (!isBullet) {
      // Strip dates from line before header matching
      let headerLine = trimmed;
      if (dateMatch) {
        headerLine = headerLine.replace(dateMatch[0], '').trim();
        // Clean up trailing/leading separators
        headerLine = headerLine.replace(/^[,|–—-]\s*|\s*[,|–—-]$/g, '').trim();
      }

      if (headerLine.length >= 3 && headerLine.length <= 120) {
        for (const pattern of HEADER_PATTERNS) {
          const match = headerLine.match(pattern);
          if (match) {
            headerMatch = { role: match[1].trim(), company: match[2].trim() };
            break;
          }
        }

        // Fallback: if we have a date but no header pattern matched,
        // and the remaining text looks like a title (capitalized, short),
        // treat the whole line as a role (company unknown).
        if (!headerMatch && dateMatch && headerLine.length >= 3 && /^[A-Z]/.test(headerLine)) {
          headerMatch = { role: headerLine, company: '' };
        }
      }
    }

    // Start a new claim if we found a header
    if (headerMatch) {
      finalizeCurrent();
      current = makeClaim();
      current.role = headerMatch.role;
      current.company = headerMatch.company;

      if (dateMatch) {
        current.startDate = dateMatch[1];
        const end = dateMatch[2];
        current.endDate =
          end.toLowerCase() === 'present' || end.toLowerCase() === 'current' || end.toLowerCase() === 'now'
            ? ''
            : end;
      }
      continue;
    }

    // If we matched a date on a standalone line and have a current claim without dates
    if (dateMatch && current && !current.startDate) {
      current.startDate = dateMatch[1];
      const end = dateMatch[2];
      current.endDate =
        end.toLowerCase() === 'present' || end.toLowerCase() === 'current' || end.toLowerCase() === 'now'
          ? ''
          : end;
      continue;
    }

    // Process bullet points
    if (isBullet && current) {
      const bulletText = trimmed.replace(BULLET_RE, '').trim();
      if (!bulletText) continue;

      // Detect tools in this bullet
      const detectedTools = detectTools(bulletText);
      current.tools.push(...detectedTools);

      // Classify as outcome (has metric) or responsibility
      if (METRIC_RE.test(bulletText)) {
        const metricMatch = bulletText.match(METRIC_VALUE_RE);
        current.outcomes.push({
          description: bulletText,
          metric: metricMatch?.[1],
          isNumeric: !!metricMatch,
        });
      } else {
        current.responsibilities.push(bulletText);
      }
      continue;
    }

    // Non-bullet, non-header line with an active claim — could be a continuation
    // or a sub-header (like a date-only line or team context line).
    // Skip lines that are too short or look like section headers.
    if (current && !isBullet && trimmed.length > 10) {
      // Check if it contains tools
      const detectedTools = detectTools(trimmed);
      if (detectedTools.length > 0) {
        current.tools.push(...detectedTools);
      }
    }
  }

  finalizeCurrent();

  return claims;
}

// ============================================================
// Tool Detection
// ============================================================

function detectTools(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const { canonical, lower: toolLower } of TOOLS_LOWER) {
    if (lower.includes(toolLower)) {
      // Verify word boundary (not part of a larger word)
      const idx = lower.indexOf(toolLower);
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + toolLower.length < lower.length ? lower[idx + toolLower.length] : ' ';
      const isBoundary = /[\s,;()/\-.]/.test(before) || idx === 0;
      const isEndBoundary = /[\s,;()/\-.]/.test(after) || idx + toolLower.length === lower.length;

      if (isBoundary && isEndBoundary) {
        found.push(canonical);
      }
    }
  }

  return found;
}

// ============================================================
// Convert ParsedClaim → Partial<Claim> for import
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

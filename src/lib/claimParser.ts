// Job Filter v2 — Structured Resume/LinkedIn Claim Parser
// Extracts role entries from pasted resume text with tool detection.
// Returns ParsedClaim[] for user review before import.

import type { Claim, ClaimSource, ClaimVerificationStatus } from '../types';

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
  skills: string[];
  tools: string[];
  outcomes: ParsedOutcome[];
  source: ClaimSource;
  evidenceSnippet?: string;
  confidence: number;
  verificationStatus: ClaimVerificationStatus;
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

const KNOWN_SKILLS: Array<{ canonical: string; patterns: RegExp[] }> = [
  { canonical: 'Lifecycle Marketing', patterns: [/\blifecycle\b/i, /\bretention\b/i, /\bcrm\b/i] },
  { canonical: 'Demand Generation', patterns: [/\bdemand gen\b/i, /\bpipeline generation\b/i, /\blead generation\b/i] },
  { canonical: 'Growth Strategy', patterns: [/\bgrowth strategy\b/i, /\bgrowth planning\b/i] },
  { canonical: 'Product Marketing', patterns: [/\bproduct marketing\b/i, /\bpositioning\b/i, /\bmessaging\b/i] },
  { canonical: 'GTM Strategy', patterns: [/\bgo-to-market\b/i, /\bgtm\b/i, /\blaunch strategy\b/i] },
  { canonical: 'Conversion Optimization', patterns: [/\bcro\b/i, /\bconversion\b/i, /\bfunnel optimization\b/i] },
  { canonical: 'A/B Testing', patterns: [/\ba\/b test/i, /\bexperiment/i, /\bsplit test/i] },
  { canonical: 'Paid Acquisition', patterns: [/\bpaid\b/i, /\bperformance marketing\b/i, /\bmedia buying\b/i] },
  { canonical: 'SEO', patterns: [/\bseo\b/i, /\bsearch engine optimization\b/i] },
  { canonical: 'Content Strategy', patterns: [/\bcontent strategy\b/i, /\beditorial\b/i] },
  { canonical: 'Marketing Analytics', patterns: [/\banalytics\b/i, /\breporting\b/i, /\bdashboard\b/i] },
  { canonical: 'Revenue Operations', patterns: [/\brevops\b/i, /\brevenue operations\b/i, /\bsales ops\b/i] },
];

// ============================================================
// Patterns
// ============================================================

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
const OUTCOME_ACTION_RE = /\b(increased|grew|reduced|improved|generated|drove|boosted|scaled|saved|achieved|delivered|exceeded|surpassed|doubled|tripled|cut|lifted)\b/i;
const NUMERIC_SIGNAL_RE = /(\d[\d,.]*\s*%|\$[\d,.]+[kKmMbB]?|\b\d+(\.\d+)?x\b|\b\d+\s*[kKmMbB]\b)/i;

// Numeric metric extraction (e.g., "150%", "$2.5M", "3x")
const METRIC_VALUE_RE = /(\d[\d,.]*[%xXkKmMbB]?\+?|\$[\d,.]+[kKmMbB]?)/;

const SECTION_HEADERS = new Set([
  'experience',
  'work experience',
  'professional experience',
  'employment history',
  'employment',
  'summary',
  'skills',
  'education',
]);

const NON_EXPERIENCE_SECTION_HEADERS = new Set([
  'summary',
  'professional summary',
  'core competencies',
  'skills',
  'technical skills',
  'education',
  'certifications',
  'projects',
  'awards',
  'volunteer',
  'interests',
  'publications',
]);

const ROLE_KEYWORDS = [
  'director',
  'head',
  'vp',
  'vice president',
  'manager',
  'lead',
  'specialist',
  'coordinator',
  'chief',
  'officer',
  'analyst',
  'consultant',
  'engineer',
  'marketing',
  'growth',
  'revenue',
  'operations',
  'product',
];

const COMPANY_SUFFIX_RE = /\b(inc|llc|co|corp|corporation|ltd|plc|group|labs|systems|software|technologies|company)\b\.?/i;

// ============================================================
// Parser
// ============================================================

export function parseResumeStructured(text: string): ParsedClaim[] {
  const claims: ParsedClaim[] = [];
  const blocks = splitIntoExperienceBlocks(text);

  let keyCounter = 0;

  const makeClaim = (): ParsedClaim => ({
    _key: `claim-${keyCounter++}`,
    role: '',
    company: '',
    startDate: '',
    endDate: '',
    responsibilities: [],
    skills: [],
    tools: [],
    outcomes: [],
    source: 'Resume',
    confidence: 0.4,
    verificationStatus: 'Review Needed',
    included: true,
  });

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const claim = makeClaim();
    const bulletLines: string[] = [];
    const extraNarrative: string[] = [];
    const headerLines: string[] = [];

    for (const line of lines) {
      const withoutBullet = line.replace(BULLET_RE, '').trim();
      const isBullet = BULLET_RE.test(line);

      const dateMatch = extractDateMatch(line);
      if (dateMatch && !claim.startDate) {
        claim.startDate = dateMatch[1];
        const end = dateMatch[2];
        claim.endDate =
          end.toLowerCase() === 'present' || end.toLowerCase() === 'current' || end.toLowerCase() === 'now'
            ? ''
            : end;
      }

      const cleaned = removeDateRange(withoutBullet).trim();
      if (!cleaned) continue;
      if (SECTION_HEADERS.has(cleaned.toLowerCase())) continue;

      const labeledHeader = parseLabeledHeaderLine(cleaned);
      if (labeledHeader.role && !claim.role) {
        claim.role = labeledHeader.role;
      }
      if (labeledHeader.company && !claim.company) {
        claim.company = sanitizeCompanyName(labeledHeader.company);
      }
      if (labeledHeader.consumed) {
        continue;
      }

      if (isBullet) {
        bulletLines.push(cleaned);
      } else if (headerLines.length < 3 && !looksLikeNarrativeSentence(cleaned)) {
        headerLines.push(cleaned);
      } else {
        extraNarrative.push(cleaned);
      }
    }

    const inferredHeader = inferRoleAndCompany(headerLines);
    claim.role = claim.role || inferredHeader.role;
    claim.company = claim.company || inferredHeader.company;

    const evidenceLines = bulletLines.length > 0 ? bulletLines : extraNarrative;
    for (const line of evidenceLines) {
      claim.tools.push(...detectTools(line));
      claim.skills.push(...detectSkills(line));
      if (isOutcomeLine(line)) {
        const metricMatch = line.match(METRIC_VALUE_RE);
        claim.outcomes.push({
          description: line,
          metric: metricMatch?.[1],
          isNumeric: !!metricMatch,
        });
      } else {
        claim.responsibilities.push(line);
      }
    }

    if (!isLikelyExperienceClaim(claim, lines, headerLines)) continue;

    claim.responsibilities = [...new Set(claim.responsibilities.map((s) => s.trim()).filter(Boolean))];
    claim.tools = [...new Set(claim.tools)];
    claim.skills = [...new Set(claim.skills)].slice(0, 8);
    claim.outcomes = claim.outcomes.reduce<ParsedOutcome[]>((acc, outcome) => {
      const normalizedOutcome = normalizeLine(outcome.description);
      if (!normalizedOutcome) return acc;
      if (acc.some((item) => normalizeLine(item.description) === normalizedOutcome)) return acc;
      acc.push(outcome);
      return acc;
    }, []);
    claim.confidence = scoreParsedClaimConfidence(claim);
    claim.verificationStatus = determineVerificationStatus(claim);
    claim.included = shouldIncludeParsedClaim(claim);
    claim.evidenceSnippet =
      claim.outcomes[0]?.description ||
      claim.responsibilities[0] ||
      claim.tools[0] ||
      claim.skills[0] ||
      `${claim.role} at ${claim.company}`;

    claims.push(claim);
  }

  return mergeFragmentedClaims(claims);
}

function splitIntoExperienceBlocks(text: string): string[] {
  const normalized = text.replace(/\r/g, '');
  const coarseBlocks = normalized
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const refinedBlocks: string[] = [];

  for (const block of coarseBlocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    let segment: string[] = [];

    for (const line of lines) {
      const shouldSplit = segment.length > 0 && shouldStartNewExperienceSegment(segment, line);
      if (shouldSplit) {
        refinedBlocks.push(segment.join('\n'));
        segment = [];
      }
      segment.push(line);
    }

    if (segment.length > 0) {
      refinedBlocks.push(segment.join('\n'));
    }
  }

  return refinedBlocks;
}

function shouldStartNewExperienceSegment(currentLines: string[], nextLine: string): boolean {
  if (BULLET_RE.test(nextLine)) return false;

  const currentLastLine = currentLines[currentLines.length - 1] || '';
  const currentLabel = parseLabeledHeaderLine(removeDateRange(currentLastLine));
  const nextLabel = parseLabeledHeaderLine(removeDateRange(nextLine));
  if (currentLabel.consumed && nextLabel.consumed) {
    // Keep labeled role/company pairs in the same segment.
    return false;
  }

  const cleaned = removeDateRange(nextLine);
  const normalizedCleaned = normalizeLine(cleaned);
  if (!cleaned || SECTION_HEADERS.has(normalizedCleaned) || NON_EXPERIENCE_SECTION_HEADERS.has(normalizedCleaned)) {
    return false;
  }

  const hasCurrentEvidence = currentLines.some((line) => BULLET_RE.test(line) || isOutcomeLine(line));
  const hasCurrentHeaderSignal = currentLines.some((line) => isPotentialHeaderLine(line));
  if (!hasCurrentEvidence && !hasCurrentHeaderSignal) return false;

  return isPotentialHeaderLine(nextLine);
}

function isPotentialHeaderLine(line: string): boolean {
  if (BULLET_RE.test(line)) return false;

  const cleaned = removeDateRange(line);
  const normalizedCleaned = normalizeLine(cleaned);
  if (!cleaned || SECTION_HEADERS.has(normalizedCleaned) || NON_EXPERIENCE_SECTION_HEADERS.has(normalizedCleaned)) {
    return false;
  }

  const labeledHeader = parseLabeledHeaderLine(cleaned);
  if (labeledHeader.consumed) return true;

  const parsedDelimited = parseDelimitedHeader(line);
  if (parsedDelimited && (parsedDelimited.role || parsedDelimited.company)) return true;

  const hasDate = Boolean(extractDateMatch(line));
  if (!hasDate) return false;

  return looksLikeRole(cleaned) || looksLikeCompany(cleaned);
}

function parseLabeledHeaderLine(line: string): { role?: string; company?: string; consumed: boolean } {
  const cleaned = line.trim();
  if (!cleaned) return { consumed: false };

  const roleMatch = cleaned.match(/^(role|title|position)\s*:\s*(.+)$/i);
  if (roleMatch) {
    return {
      role: roleMatch[2].trim(),
      consumed: true,
    };
  }

  const companyMatch = cleaned.match(/^(company|employer|organization)\s*:\s*(.+)$/i);
  if (companyMatch) {
    return {
      company: companyMatch[2].trim(),
      consumed: true,
    };
  }

  return { consumed: false };
}

function extractDateMatch(line: string): RegExpMatchArray | null {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return match;
  }
  return null;
}

function removeDateRange(line: string): string {
  let output = line;
  for (const pattern of DATE_PATTERNS) {
    output = output.replace(pattern, ' ');
  }
  return output
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s*[-–—|,]\s*$/g, ' ')
    .replace(/^[-–—|,]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeNarrativeSentence(line: string): boolean {
  if (line.length > 80) return true;
  if (/\b(responsible for|managed|led|built|launched|improved|increased|reduced)\b/i.test(line)) return true;
  if (line.split(/\s+/).length > 10) return true;
  return false;
}

function looksLikeRole(line: string): boolean {
  const lower = line.toLowerCase();
  if (ROLE_KEYWORDS.some((keyword) => lower.includes(keyword))) return true;
  if (/,/.test(line) && /\b(marketing|growth|operations|revenue|product|engineering)\b/i.test(line)) return true;
  return false;
}

function looksLikeCompany(line: string): boolean {
  if (COMPANY_SUFFIX_RE.test(line)) return true;
  if (looksLikeRole(line)) return false;
  const wordCount = line.split(/\s+/).length;
  if (wordCount <= 5 && /^[A-Z0-9]/.test(line)) return true;
  return false;
}

function inferDelimitedPair(leftRaw: string, rightRaw: string): { role: string; company: string } | null {
  const left = leftRaw.trim();
  const right = rightRaw.trim();
  if (!left || !right) return null;

  const leftRole = looksLikeRole(left);
  const rightRole = looksLikeRole(right);
  const leftCompany = looksLikeCompany(left);
  const rightCompany = looksLikeCompany(right);

  if (leftRole && !rightRole) return { role: left, company: sanitizeCompanyName(right) };
  if (rightRole && !leftRole) return { role: right, company: sanitizeCompanyName(left) };
  if (leftCompany && !rightCompany) return { role: right, company: sanitizeCompanyName(left) };
  if (rightCompany && !leftCompany) return { role: left, company: sanitizeCompanyName(right) };

  // Explicitly avoid forcing ambiguous role-role/company-company pairs.
  return null;
}

function parseDelimitedParts(parts: string[]): { role: string; company: string } | null {
  if (parts.length < 2) return null;
  for (let index = 0; index < parts.length - 1; index++) {
    const parsed = inferDelimitedPair(parts[index], parts[index + 1]);
    if (parsed) return parsed;
  }
  return null;
}

function parseDelimitedHeader(line: string): { role: string; company: string } | null {
  const cleanedLine = removeDateRange(line).trim();
  if (!cleanedLine) return null;

  if (/\sat\s/i.test(cleanedLine) || /\s@\s/i.test(cleanedLine)) {
    const match = cleanedLine.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (match) {
      return { role: match[1].trim(), company: sanitizeCompanyName(match[2]) };
    }
  }

  const pipeParts = cleanedLine.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
  const pipeParsed = parseDelimitedParts(pipeParts);
  if (pipeParsed) return pipeParsed;

  const dashParts = cleanedLine.split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  const dashParsed = parseDelimitedParts(dashParts);
  if (dashParsed) return dashParsed;

  const commaParts = cleanedLine.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
  const commaParsed = parseDelimitedParts(commaParts);
  if (commaParsed) return commaParsed;

  return null;
}

function inferRoleAndCompany(headerLines: string[]): { role: string; company: string } {
  if (headerLines.length === 0) return { role: '', company: '' };

  for (const line of headerLines) {
    const parsed = parseDelimitedHeader(line);
    if (parsed) return parsed;
  }

  if (headerLines.length >= 2) {
    const first = headerLines[0];
    const second = headerLines[1];

    if (looksLikeRole(first) && !looksLikeRole(second)) {
      return { role: first, company: sanitizeCompanyName(second) };
    }
    if (looksLikeRole(second) && !looksLikeRole(first)) {
      return { role: second, company: sanitizeCompanyName(first) };
    }
    if (looksLikeCompany(first) && !looksLikeCompany(second)) {
      return { role: second, company: sanitizeCompanyName(first) };
    }
    return { role: first, company: sanitizeCompanyName(second) };
  }

  const only = headerLines[0];
  if (looksLikeRole(only)) return { role: only, company: '' };
  if (looksLikeCompany(only)) return { role: '', company: sanitizeCompanyName(only) };
  return { role: only, company: '' };
}

function sanitizeCompanyName(rawCompany: string): string {
  const company = rawCompany.trim();
  if (!company) return company;

  // Remove explicit remote markers often attached to company lines.
  let cleaned = company.replace(/\s*\((remote|hybrid|onsite|on-site)\)\s*$/i, '').trim();

  // Common "Company, City, ST" formatting in resumes.
  cleaned = cleaned.replace(/,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\b\s*$/g, '').trim();

  // Common country suffixes added after city.
  cleaned = cleaned.replace(/,\s*(united states|usa|us|canada|uk|united kingdom)\s*$/i, '').trim();

  return cleaned;
}

function looksLikeSkillList(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (looksLikeRole(text)) return false;
  const tokens = lower.split(/[,\u2022|/]/).map((token) => token.trim()).filter(Boolean);
  if (tokens.length < 3) return false;
  return tokens.every((token) => token.length <= 30 && token.split(/\s+/).length <= 4);
}

function isLikelyExperienceClaim(
  claim: ParsedClaim,
  lines: string[],
  headerLines: string[]
): boolean {
  if (!claim.role && !claim.company) return false;

  const normalizedHeaderCandidates = [...lines.slice(0, 2), ...headerLines]
    .map((line) => normalizeLine(removeDateRange(line)))
    .filter(Boolean);
  if (normalizedHeaderCandidates.some((line) => NON_EXPERIENCE_SECTION_HEADERS.has(line))) {
    return false;
  }

  const hasDate = Boolean(claim.startDate);
  const hasRole = Boolean(claim.role);
  const hasCompany = Boolean(claim.company);
  const hasEvidence =
    claim.responsibilities.length > 0 ||
    claim.tools.length > 0 ||
    claim.skills.length > 0 ||
    claim.outcomes.length > 0;

  if (!hasRole || !hasCompany) return false;
  if (!hasDate && !hasEvidence) return false;
  if (!looksLikeRole(claim.role)) return false;
  if (looksLikeSkillList(claim.role) || looksLikeSkillList(claim.company)) return false;
  if (hasRole && hasCompany && normalizeLine(claim.role) === normalizeLine(claim.company)) return false;

  return true;
}

function mergeUniqueStrings(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function mergeOutcomes(outcomes: ParsedOutcome[]): ParsedOutcome[] {
  return outcomes.reduce<ParsedOutcome[]>((acc, outcome) => {
    const normalizedOutcome = normalizeLine(outcome.description);
    if (!normalizedOutcome) return acc;
    if (acc.some((item) => normalizeLine(item.description) === normalizedOutcome)) return acc;
    acc.push(outcome);
    return acc;
  }, []);
}

function shouldMergeClaims(existing: ParsedClaim, incoming: ParsedClaim): boolean {
  if (normalizeLine(sanitizeCompanyName(existing.company)) !== normalizeLine(sanitizeCompanyName(incoming.company))) {
    return false;
  }

  const normalizedExistingRole = normalizeLine(existing.role);
  const normalizedIncomingRole = normalizeLine(incoming.role);
  const rolesCompatible =
    !normalizedExistingRole ||
    !normalizedIncomingRole ||
    normalizedExistingRole === normalizedIncomingRole ||
    rolesAreNearDuplicates(normalizedExistingRole, normalizedIncomingRole);
  if (!rolesCompatible) return false;

  const startCompatible =
    !existing.startDate ||
    !incoming.startDate ||
    normalizeLine(existing.startDate) === normalizeLine(incoming.startDate);
  const endCompatible =
    !existing.endDate ||
    !incoming.endDate ||
    normalizeLine(existing.endDate) === normalizeLine(incoming.endDate);

  return startCompatible && endCompatible;
}

function rolesAreNearDuplicates(a: string, b: string): boolean {
  if (!a || !b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const aTokens = new Set(a.split(/\s+/).filter((token) => token.length > 2));
  const bTokens = new Set(b.split(/\s+/).filter((token) => token.length > 2));
  if (aTokens.size === 0 || bTokens.size === 0) return false;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  const score = overlap / Math.max(aTokens.size, bTokens.size);
  return score >= 0.6;
}

function mergeFragmentedClaims(claims: ParsedClaim[]): ParsedClaim[] {
  const merged: ParsedClaim[] = [];

  for (const claim of claims) {
    const existing = merged.find((candidate) => shouldMergeClaims(candidate, claim));
    if (!existing) {
      merged.push({ ...claim });
      continue;
    }

    existing.startDate = existing.startDate || claim.startDate;
    existing.endDate = existing.endDate || claim.endDate;
    existing.responsibilities = mergeUniqueStrings([...existing.responsibilities, ...claim.responsibilities]);
    existing.skills = mergeUniqueStrings([...existing.skills, ...claim.skills]).slice(0, 8);
    existing.tools = mergeUniqueStrings([...existing.tools, ...claim.tools]);
    existing.outcomes = mergeOutcomes([...existing.outcomes, ...claim.outcomes]);
    existing.evidenceSnippet =
      existing.evidenceSnippet ||
      claim.evidenceSnippet ||
      existing.outcomes[0]?.description ||
      existing.responsibilities[0];
    existing.confidence = scoreParsedClaimConfidence(existing);
    existing.verificationStatus = determineVerificationStatus(existing);
    existing.included = shouldIncludeParsedClaim(existing);
  }

  return merged;
}

function scoreParsedClaimConfidence(claim: ParsedClaim): number {
  let score = 0.15;
  const hasRole = Boolean(claim.role && looksLikeRole(claim.role));
  const hasCompany = Boolean(claim.company && !looksLikeSkillList(claim.company));
  const hasEvidence =
    claim.responsibilities.length > 0 ||
    claim.tools.length > 0 ||
    claim.skills.length > 0 ||
    claim.outcomes.length > 0;

  if (hasRole) score += 0.24;
  if (hasCompany) score += 0.18;
  if (claim.startDate) score += 0.1;
  if (claim.endDate) score += 0.03;
  if (claim.responsibilities.length > 0) score += 0.12;
  if (claim.tools.length > 0) score += 0.07;
  if (claim.skills.length > 0) score += 0.06;
  if (claim.outcomes.length > 0) score += 0.08;
  if (claim.outcomes.some((outcome) => !!outcome.metric)) score += 0.1;

  if (!hasRole || !hasCompany) score -= 0.08;
  if (!hasEvidence) score -= 0.06;

  return Math.min(0.99, Math.max(0.05, score));
}

function determineVerificationStatus(claim: ParsedClaim): ClaimVerificationStatus {
  const evidenceCount =
    claim.responsibilities.length > 0 ||
    claim.tools.length > 0 ||
    claim.skills.length > 0 ||
    claim.outcomes.length > 0
      ? claim.responsibilities.length + claim.tools.length + claim.skills.length + claim.outcomes.length
      : 0;
  const hasStrongIdentity = Boolean(claim.role && claim.company);

  return claim.confidence >= 0.9 && hasStrongIdentity && evidenceCount >= 2 ? 'Approved' : 'Review Needed';
}

function shouldIncludeParsedClaim(claim: ParsedClaim): boolean {
  const hasIdentity = Boolean(claim.role && claim.company);
  if (!hasIdentity) return false;
  if (claim.verificationStatus === 'Approved') return true;
  return claim.confidence >= 0.55;
}

function isOutcomeLine(line: string): boolean {
  const normalized = line.trim();
  if (!normalized) return false;
  const hasNumericSignal = NUMERIC_SIGNAL_RE.test(normalized);
  const hasOutcomeAction = OUTCOME_ACTION_RE.test(normalized);
  if (hasOutcomeAction && hasNumericSignal) return true;
  if (/\$\d/.test(normalized) && hasOutcomeAction) return true;
  if (/\b(from|to)\b.+\d/i.test(normalized) && hasOutcomeAction) return true;
  return false;
}

// ============================================================
// Tool Detection
// ============================================================

function detectTools(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  const isLikelySqlToolMention = (idx: number): boolean => {
    const context = lower.slice(Math.max(0, idx - 26), Math.min(lower.length, idx + 30));
    if (/\bsqls\b/i.test(context)) return false;

    const salesFunnelSignals = /\b(conversion|lead|leads|pipeline|mql|funnel|qualified|opportunity)\b/i;
    const analyticsSignals = /\b(query|queries|database|databases|warehouse|etl|analytics|reporting|snowflake|bigquery|tableau|looker)\b/i;
    if (salesFunnelSignals.test(context) && !analyticsSignals.test(context)) {
      return false;
    }

    return true;
  };

  for (const { canonical, lower: toolLower } of TOOLS_LOWER) {
    let cursor = 0;
    while (cursor < lower.length) {
      const idx = lower.indexOf(toolLower, cursor);
      if (idx === -1) break;
      cursor = idx + toolLower.length;

      // Verify word boundary (not part of a larger word)
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + toolLower.length < lower.length ? lower[idx + toolLower.length] : ' ';
      const isBoundary = /[\s,;()/\-.]/.test(before) || idx === 0;
      const isEndBoundary = /[\s,;()/\-.]/.test(after) || idx + toolLower.length === lower.length;
      if (!isBoundary || !isEndBoundary) continue;

      if (toolLower === 'sql' && !isLikelySqlToolMention(idx)) continue;

      found.push(canonical);
      break;
    }
  }

  return [...new Set(found)];
}

function detectSkills(text: string): string[] {
  const found: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    if (skill.patterns.some((pattern) => pattern.test(text))) {
      found.push(skill.canonical);
    }
  }

  return found.slice(0, 3);
}

function normalizeLine(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ============================================================
// Convert ParsedClaim → Partial<Claim> for import
// ============================================================

export function parsedClaimToImport(parsed: ParsedClaim): {
  experience: Partial<Claim>;
  skillClaims: Partial<Claim>[];
  toolClaims: Partial<Claim>[];
  outcomeClaims: Partial<Claim>[];
} {
  const experienceText = [parsed.role, parsed.company].filter(Boolean).join(' at ').trim();
  const baseMeta = {
    source: parsed.source,
    confidence: parsed.confidence,
    // Imported parser output should always be human-reviewed before approval.
    verificationStatus: 'Review Needed' as const,
    evidenceSnippet: parsed.evidenceSnippet,
  } satisfies Partial<Claim>;

  return {
    experience: {
      type: 'Experience',
      text: experienceText || parsed.evidenceSnippet || 'Experience entry',
      role: parsed.role,
      company: parsed.company,
      startDate: parsed.startDate,
      endDate: parsed.endDate || undefined,
      responsibilities: parsed.responsibilities,
      ...baseMeta,
    },
    skillClaims: parsed.skills.map((skill) => ({
      type: 'Skill',
      text: skill,
      ...baseMeta,
    })),
    toolClaims: parsed.tools.map((tool) => ({
      type: 'Tool',
      text: tool,
      ...baseMeta,
    })),
    outcomeClaims: parsed.outcomes.map((outcome) => ({
      type: 'Outcome',
      text: outcome.description,
      metric: outcome.metric,
      isNumeric: outcome.isNumeric,
      ...baseMeta,
    })),
  };
}

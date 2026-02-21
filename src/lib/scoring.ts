// Job Filter v2 — Deterministic Fit Scoring Engine
// Client-side, no AI cost. Calibratable via weight adjustments.
// See docs/MASTER_PLAN.md section 9 for spec.

import type { Job, FitLabel, Profile, Requirement, Claim, RequirementPriority, RequirementMatch } from '../types';
import { sanitizeHardFilters } from './profilePreferences';

// ============================================================
// Scoring Weights (calibratable)
// ============================================================

export interface ScoringWeights {
  roleScopeAuthority: number; // max 30
  compensationBenefits: number; // max 25
  companyStageAbility: number; // max 20
  domainFit: number; // max 15
  riskPenaltyMax: number; // max -10
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  roleScopeAuthority: 30,
  compensationBenefits: 25,
  companyStageAbility: 20,
  domainFit: 15,
  riskPenaltyMax: 10,
};

// ============================================================
// Hard Disqualifiers
// ============================================================

const PAID_MEDIA_KEYWORDS = [
  'paid media manager',
  'paid social manager',
  'ppc manager',
  'performance marketing manager',
  'paid acquisition manager',
  'sem manager',
  'paid search manager',
  'media buyer',
];

const SEED_STAGE_KEYWORDS = [
  'seed stage',
  'pre-seed',
  'seed funded',
  'seed round',
  'angel funded',
  'bootstrapped startup',
];

const VISA_SPONSORSHIP_RESTRICTION_PATTERNS = [
  'no visa sponsorship',
  'unable to sponsor',
  'cannot sponsor',
  'without sponsorship',
  'must be authorized to work',
  'no sponsorship available',
];

export interface ScoringResult {
  fitScore: number;
  fitLabel: FitLabel;
  disqualifiers: string[];
  reasonsToPursue: string[];
  reasonsToPass: string[];
  redFlags: string[];
  requirementsExtracted: Requirement[];
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  roleScopeAuthority: number;
  compensationBenefits: number;
  companyStageAbility: number;
  domainFit: number;
  riskPenalty: number;
}

function parseTravelPercent(text: string): number | null {
  const match = text.match(/(\d{1,3})\s*%[^.\\n]*(travel|onsite|on-site)/i)
    || text.match(/(travel|onsite|on-site)[^.\\n]*(\d{1,3})\s*%/i);

  if (!match) return null;
  const value = Number(match[1] || match[2]);
  if (Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, value));
}

function estimateOnsiteDaysPerWeek(job: Partial<Job>, jd: string): number | null {
  if (job.locationType === 'Remote') return 0;
  if (job.locationType === 'In-person') return 5;

  if (job.locationType === 'Hybrid') {
    const dayMatch = jd.match(/(\d)\s*(day|days)\s*(per week|\/week|a week)/i);
    if (dayMatch) return Number(dayMatch[1]);
    return 3;
  }

  return null;
}

function matchesLocationPreferences(job: Partial<Job>, profile: Profile): boolean | null {
  if (!profile.locationPreferences || profile.locationPreferences.length === 0) return null;
  if (!job.locationType || job.locationType === 'Unknown') return null;

  const jobType = job.locationType === 'In-person' ? 'Onsite' : job.locationType;
  const location = (job.location || '').toLowerCase();

  for (const preference of profile.locationPreferences) {
    if (preference.type !== jobType) continue;
    if (preference.type === 'Remote') return true;

    if (!preference.city?.trim()) return true;
    if (location.includes(preference.city.trim().toLowerCase())) return true;
    if (preference.willingToRelocate) return true;
  }

  return false;
}

export function scoreJob(job: Partial<Job>, profile: Profile, claims?: Claim[]): ScoringResult {
  const jd = (job.jobDescription || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const hardFilters = sanitizeHardFilters({
    ...(profile.hardFilters ?? {}),
    minBaseSalary: profile.hardFilters?.minBaseSalary ?? profile.compFloor,
  });

  const disqualifiers: string[] = [];
  const reasonsToPursue: string[] = [];
  const reasonsToPass: string[] = [];
  const redFlags: string[] = [];

  // ----------------------------------------------------------
  // Hard Disqualifiers
  // ----------------------------------------------------------

  // 1. Paid account management as core expectation
  const isPaidMediaOperator = PAID_MEDIA_KEYWORDS.some(
    (kw) => title.includes(kw) || jd.includes(kw + ' role') || jd.includes('hands-on ' + kw)
  );
  const hasPaidMediaHeavy =
    (jd.includes('manage paid') || jd.includes('run paid') || jd.includes('execute paid')) &&
    (jd.includes('day-to-day') || jd.includes('hands-on') || jd.includes('in-platform'));

  if (isPaidMediaOperator || hasPaidMediaHeavy) {
    disqualifiers.push('Role appears to require hands-on paid media account management as core function');
  }

  // 2. Seed-stage
  const isSeedStage =
    SEED_STAGE_KEYWORDS.some((kw) => jd.includes(kw)) ||
    job.compRange?.toLowerCase().includes('seed');

  if (isSeedStage) {
    disqualifiers.push('Company appears to be seed-stage');
  }

  // 3. Compensation below floor
  const effectiveCompFloor = Math.max(profile.compFloor || 0, hardFilters.minBaseSalary || 0);
  if (job.compMax && job.compMax < effectiveCompFloor) {
    disqualifiers.push(`Max compensation ($${job.compMax.toLocaleString()}) is below floor ($${effectiveCompFloor.toLocaleString()})`);
  }

  // 4. Employment type filter
  if (hardFilters.employmentType === 'ft_only' && job.employmentType && job.employmentType !== 'Full-time') {
    disqualifiers.push('Role is not full-time, which is outside your hard filters');
  }
  if (hardFilters.employmentType === 'exclude_contract' && job.employmentType === 'Contract') {
    disqualifiers.push('Contract role is excluded by your hard filters');
  }

  // 5. Sponsorship filter
  if (hardFilters.requiresVisaSponsorship) {
    const hasRestriction = VISA_SPONSORSHIP_RESTRICTION_PATTERNS.some((pattern) => jd.includes(pattern));
    if (hasRestriction) {
      disqualifiers.push('Job indicates visa sponsorship is unavailable');
    }
  }

  // 6. Travel and onsite constraints
  const travelPercent = parseTravelPercent(jd);
  if (travelPercent !== null && travelPercent > hardFilters.maxTravelPercent) {
    disqualifiers.push(`Travel requirement (${travelPercent}%) exceeds your max (${hardFilters.maxTravelPercent}%)`);
  }

  const onsiteDays = estimateOnsiteDaysPerWeek(job, jd);
  if (onsiteDays !== null && onsiteDays > hardFilters.maxOnsiteDaysPerWeek) {
    disqualifiers.push(`Onsite requirement (${onsiteDays} days/week) exceeds your max (${hardFilters.maxOnsiteDaysPerWeek})`);
  }

  // 7. Location preference fit
  const locationMatch = matchesLocationPreferences(job, profile);
  if (locationMatch === false) {
    disqualifiers.push('Job location does not match your location preferences');
  }

  // If hard disqualified, return early with score 0
  if (disqualifiers.length > 0) {
    return {
      fitScore: 0,
      fitLabel: 'Pass',
      disqualifiers,
      reasonsToPursue,
      reasonsToPass: [...disqualifiers],
      redFlags,
      requirementsExtracted: [],
      breakdown: {
        roleScopeAuthority: 0,
        compensationBenefits: 0,
        companyStageAbility: 0,
        domainFit: 0,
        riskPenalty: 0,
      },
    };
  }

  // ----------------------------------------------------------
  // A) Role Scope & Authority (0-30)
  // ----------------------------------------------------------

  let roleScore = 0;

  // Title-level signals
  const seniorTitles = ['vp', 'vice president', 'head of', 'director', 'chief', 'svp', 'senior vice president'];
  const hasSeniorTitle = seniorTitles.some((t) => title.includes(t));
  if (hasSeniorTitle) {
    roleScore += 12;
    reasonsToPursue.push('Senior leadership title');
  } else {
    roleScore += 4;
    reasonsToPass.push('Title may not indicate senior leadership');
  }

  // Strategy signals
  const strategySignals = ['strategy', 'strategic', 'roadmap', 'vision', 'build the team', 'lead the team', 'cross-functional', 'p&l', 'budget ownership'];
  const strategyCount = strategySignals.filter((s) => jd.includes(s)).length;
  if (strategyCount >= 3) {
    roleScore += 12;
    reasonsToPursue.push('Strong strategic ownership signals');
  } else if (strategyCount >= 1) {
    roleScore += 7;
    reasonsToPursue.push('Some strategic scope indicated');
  } else {
    roleScore += 2;
    reasonsToPass.push('Limited strategic scope signals in JD');
  }

  // Team management
  if (jd.includes('manage a team') || jd.includes('direct reports') || jd.includes('build a team') || jd.includes('lead a team')) {
    roleScore += 6;
    reasonsToPursue.push('People management / team leadership');
  } else {
    roleScore += 2;
  }

  roleScore = Math.min(roleScore, 30);

  // ----------------------------------------------------------
  // B) Compensation & Benefits (0-25)
  // ----------------------------------------------------------

  let compScore = 0;

  if (job.compMin && job.compMin >= profile.compTarget) {
    compScore += 15;
    reasonsToPursue.push(`Comp min ($${job.compMin.toLocaleString()}) meets or exceeds target`);
  } else if (job.compMin && job.compMin >= profile.compFloor) {
    compScore += 10;
    reasonsToPursue.push(`Comp min ($${job.compMin.toLocaleString()}) meets floor`);
  } else if (!job.compMin && !job.compMax) {
    compScore += 7; // Unknown = neutral
  } else {
    compScore += 3;
    reasonsToPass.push('Compensation may be below target');
  }

  // Benefits signals
  const benefitSignals = ['medical', 'dental', '401k', '401(k)', 'equity', 'stock', 'bonus', 'rsu', 'shares'];
  const benefitCount = benefitSignals.filter((b) => jd.includes(b)).length;
  compScore += Math.min(benefitCount * 2, 10);
  if (benefitCount >= 3) {
    reasonsToPursue.push('Strong benefits package indicated');
  }

  compScore = Math.min(compScore, 25);

  // ----------------------------------------------------------
  // C) Company Stage / Ability to Pay (0-20)
  // ----------------------------------------------------------

  let companyScore = 0;

  const stageSignals: Record<string, number> = {
    'series c': 18,
    'series d': 19,
    'series b': 15,
    'series a': 10,
    'public': 18,
    'ipo': 18,
    'profitable': 17,
    'fortune 500': 20,
    'enterprise': 14,
  };

  let bestStageScore = 8; // default for unknown
  for (const [signal, score] of Object.entries(stageSignals)) {
    if (jd.includes(signal)) {
      bestStageScore = Math.max(bestStageScore, score);
    }
  }
  companyScore = Math.min(bestStageScore, 20);

  if (companyScore >= 15) {
    reasonsToPursue.push('Company stage suggests ability to pay');
  }

  // ----------------------------------------------------------
  // D) Domain Fit (0-15)
  // ----------------------------------------------------------

  let domainScore = 0;

  const domainSignals = [
    'growth', 'lifecycle', 'gtm', 'go-to-market', 'revenue', 'demand gen',
    'acquisition', 'retention', 'conversion', 'funnel', 'marketing ops',
    'ecommerce', 'e-commerce', 'b2c', 'dtc', 'direct-to-consumer',
    'martech', 'analytics', 'attribution', 'experimentation',
  ];

  const domainCount = domainSignals.filter((d) => jd.includes(d)).length;
  domainScore = Math.min(Math.round(domainCount * 2.5), 15);

  if (domainCount >= 4) {
    reasonsToPursue.push('Strong domain alignment (growth/lifecycle/GTM)');
  } else if (domainCount >= 2) {
    reasonsToPursue.push('Moderate domain alignment');
  }

  // ----------------------------------------------------------
  // E) Risk Flags (-0 to -10)
  // ----------------------------------------------------------

  let riskPenalty = 0;

  const riskSignals = [
    { pattern: 'miracle', penalty: 3, flag: 'JD implies "miracle needed" expectations' },
    { pattern: 'wear many hats', penalty: 2, flag: 'Wear-many-hats language (resource constrained)' },
    { pattern: 'startup mentality', penalty: 1, flag: 'Startup mentality language' },
    { pattern: 'fast-paced', penalty: 0, flag: '' }, // common, not really a risk
    { pattern: 'unicorn', penalty: 2, flag: 'Looking for a "unicorn" (unrealistic expectations)' },
    { pattern: 'do it all', penalty: 3, flag: 'Expects one person to "do it all"' },
  ];

  for (const { pattern, penalty, flag } of riskSignals) {
    if (jd.includes(pattern) && penalty > 0) {
      riskPenalty += penalty;
      if (flag) redFlags.push(flag);
    }
  }

  riskPenalty = Math.min(riskPenalty, DEFAULT_WEIGHTS.riskPenaltyMax);

  // ----------------------------------------------------------
  // Extract requirements (with claim matching)
  // ----------------------------------------------------------

  const requirements = extractRequirements(jd, claims);

  // ----------------------------------------------------------
  // Final Score
  // ----------------------------------------------------------

  const rawScore = roleScore + compScore + companyScore + domainScore - riskPenalty;
  const fitScore = Math.max(0, Math.min(100, rawScore));

  let fitLabel: FitLabel;
  if (fitScore >= 65) {
    fitLabel = 'Pursue';
  } else if (fitScore >= 40) {
    fitLabel = 'Maybe';
  } else {
    fitLabel = 'Pass';
  }

  return {
    fitScore,
    fitLabel,
    disqualifiers,
    reasonsToPursue,
    reasonsToPass,
    redFlags,
    requirementsExtracted: requirements,
    breakdown: {
      roleScopeAuthority: roleScore,
      compensationBenefits: compScore,
      companyStageAbility: companyScore,
      domainFit: domainScore,
      riskPenalty,
    },
  };
}

// ============================================================
// Requirement Extraction (structured, with claim matching)
// ============================================================

// Section headers that signal "must have" vs "nice to have"
const MUST_PATTERNS = [
  /\brequired\b/i,
  /\bmust have\b/i,
  /\bmust-have\b/i,
  /\bminimum qualifications\b/i,
  /\brequirements\b/i,
  /\bwhat you('ll)? need\b/i,
  /\bwhat we('re)? looking for\b/i,
  /\bessential\b/i,
];

const PREFERRED_PATTERNS = [
  /\bpreferred\b/i,
  /\bnice to have\b/i,
  /\bnice-to-have\b/i,
  /\bbonus\b/i,
  /\bdesirable\b/i,
  /\bplus\b/i,
  /\bpreferred qualifications\b/i,
  /\badditional qualifications\b/i,
  /\bwhat sets you apart\b/i,
];

const TOOL_PATTERNS = [
  'salesforce', 'hubspot', 'marketo', 'pardot', 'segment', 'amplitude',
  'mixpanel', 'google analytics', 'ga4', 'tableau', 'looker', 'dbt',
  'snowflake', 'bigquery', 'braze', 'iterable', 'klaviyo', 'mailchimp',
  'meta ads', 'google ads', 'linkedin ads', 'tiktok ads',
  'figma', 'notion', 'jira', 'asana',
  'optimizely', 'launchdarkly', 'vwo', 'hotjar', 'fullstory',
  'semrush', 'ahrefs', 'moz',
  'adobe analytics', 'adobe experience manager',
  'intercom', 'zendesk', 'drift', 'gong', 'outreach', 'salesloft',
  'clearbit', 'zoominfo', '6sense', 'demandbase',
  'attentive', 'postscript', 'yotpo',
  'power bi', 'excel', 'sql',
  'shopify', 'magento', 'stripe',
];

const SKILL_PATTERNS = [
  'analytical',
  'communication',
  'leadership',
  'project management',
  'team management',
  'strategic thinking',
  'data-driven',
  'cross-functional',
  'stakeholder management',
  'budget management',
  'p&l',
  'vendor management',
  'agency management',
];

// ============================================================
// Years-of-experience patterns
// ============================================================

// Matches: "5+ years", "5-7 years", "minimum 5 years", "at least 5 years"
// Uses word boundary to avoid matching "10+" inside unrelated text.
// Only matches when preceded by a bullet, line start, or common preamble.
const YEARS_PATTERNS: RegExp[] = [
  // "5+ years of experience in marketing" / "5+ yrs experience with analytics"
  /(?:^|[-*•◦▪]\s*).*?\b(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?(.+)/i,
  // "minimum 5 years" / "at least 5 years of experience in ..."
  /(?:^|[-*•◦▪]\s*).*?(?:minimum|at\s+least)\s+(\d{1,2})\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?(.+)/i,
  // "5-7 years of experience in ..."
  /(?:^|[-*•◦▪]\s*).*?\b(\d{1,2})\s*[-–]\s*\d{1,2}\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?(.+)/i,
];

// ============================================================
// Description cleaning
// ============================================================

const BULLET_PREFIX_RE = /^[-*•◦▪]+\s*/;
const TRAILING_PUNCT_RE = /[,;.]+$/;

/**
 * Clean a requirement description string:
 * - Strip bullet prefixes
 * - Capitalize first letter
 * - Remove trailing punctuation
 * - Limit to 120 chars (truncate with ellipsis)
 */
function cleanDescription(raw: string): string {
  let desc = raw.replace(BULLET_PREFIX_RE, '').trim();
  desc = desc.replace(TRAILING_PUNCT_RE, '').trim();
  if (desc.length === 0) return desc;
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  if (desc.length > 120) {
    desc = desc.slice(0, 117) + '...';
  }
  return desc;
}

// ============================================================
// Similarity / deduplication helpers
// ============================================================

/**
 * Normalize a tool name for deduplication.
 * Lowercase, collapse whitespace, strip trailing "s" for plurals.
 */
function normalizeToolName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Normalize an experience description for similarity comparison.
 * Lowercase, remove filler words, collapse whitespace.
 */
function normalizeExpDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\b(of|in|with|and|the|a|an|or|for)\b/g, '')
    .replace(/experience/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple word-overlap similarity between two strings (Jaccard-like).
 * Returns a value between 0 and 1.
 */
function descriptionSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeExpDescription(a).split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(normalizeExpDescription(b).split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check whether a new experience requirement is a near-duplicate of an
 * existing one. Two experience requirements are considered duplicates if
 * their normalized descriptions have >= 0.6 Jaccard similarity.
 */
function isDuplicateExperience(existing: Requirement[], desc: string, years?: number): boolean {
  for (const req of existing) {
    if (req.type !== 'experience') continue;
    // If years are the same (or very close) and descriptions are similar, it's a dup
    const yearsSimilar = req.yearsNeeded === undefined || years === undefined ||
      Math.abs(req.yearsNeeded - years) <= 1;
    if (yearsSimilar && descriptionSimilarity(req.description, desc) >= 0.6) {
      return true;
    }
  }
  return false;
}

/**
 * Check whether a skill description is a near-duplicate of an existing
 * skill requirement (similarity >= 0.7).
 */
function isDuplicateSkill(existing: Requirement[], desc: string): boolean {
  for (const req of existing) {
    if (req.type !== 'skill') continue;
    if (descriptionSimilarity(req.description, desc) >= 0.7) {
      return true;
    }
    // Also check exact normalized match
    if (normalizeExpDescription(req.description) === normalizeExpDescription(desc)) {
      return true;
    }
  }
  return false;
}

// ============================================================
// Main extraction
// ============================================================

function extractRequirements(jd: string, claims?: Claim[]): Requirement[] {
  const reqs: Requirement[] = [];
  const lines = jd.split('\n');

  // Track current section priority
  let currentPriority: RequirementPriority = 'Must';

  // Normalized set of tool names already added (case-insensitive dedup)
  const addedTools = new Set<string>();

  // Track education and certification to avoid duplicates (allow multiple
  // distinct entries unlike the old code which capped at 1)
  const addedEducationNorm = new Set<string>();
  const addedCertNorm = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const lineLower = line.toLowerCase();

    // Check if this line is a section header that changes priority
    if (PREFERRED_PATTERNS.some((p) => p.test(line))) {
      currentPriority = 'Preferred';
      continue;
    }
    if (MUST_PATTERNS.some((p) => p.test(line))) {
      currentPriority = 'Must';
      continue;
    }

    // Inline priority detection (for single-line items)
    let linePriority = currentPriority;
    if (/\bpreferred\b|\bnice to have\b|\bbonus\b|\bplus\b|\bdesirable\b/i.test(lineLower)) {
      linePriority = 'Preferred';
    }
    if (/\brequired\b|\bmust have\b|\bessential\b/i.test(lineLower)) {
      linePriority = 'Must';
    }

    // ---- Years of experience ----
    for (const pattern of YEARS_PATTERNS) {
      const yearsMatch = lineLower.match(pattern);
      if (yearsMatch) {
        const years = parseInt(yearsMatch[1]);
        // Sanity: skip if years > 30 (likely a misparse)
        if (years > 30) continue;

        const rawDesc = yearsMatch[2].trim();
        const desc = cleanDescription(rawDesc);
        if (!desc) continue;

        // Dedup: skip if we already have a similar experience requirement
        if (isDuplicateExperience(reqs, desc, years)) {
          break;
        }

        const match = matchExperienceClaim(years, desc, claims);

        reqs.push({
          type: 'experience',
          description: desc,
          yearsNeeded: years,
          priority: linePriority,
          match: match.status,
          evidence: match.evidence,
        });
        break; // only take first matching pattern per line
      }
    }

    // ---- Tools ----
    for (const tool of TOOL_PATTERNS) {
      const normalized = normalizeToolName(tool);
      if (lineLower.includes(normalized) && !addedTools.has(normalized)) {
        addedTools.add(normalized);
        const match = matchToolClaim(tool, claims);
        reqs.push({
          type: 'tool',
          description: capitalizeFirst(tool),
          priority: linePriority,
          match: match.status,
          evidence: match.evidence,
        });
      }
    }

    // ---- Skills (new) ----
    // Detect lines that mention soft/hard skills from SKILL_PATTERNS
    for (const skill of SKILL_PATTERNS) {
      const skillLower = skill.toLowerCase();
      if (lineLower.includes(skillLower)) {
        // Build a meaningful description from the line context
        const skillDesc = buildSkillDescription(line, skill);
        if (!isDuplicateSkill(reqs, skillDesc)) {
          const match = matchSkillClaim(skill, claims);
          reqs.push({
            type: 'skill',
            description: cleanDescription(skillDesc),
            priority: linePriority,
            match: match.status,
            evidence: match.evidence,
          });
        }
      }
    }

    // ---- Education ----
    if (/\bbachelor[''\u2019]?s?\b|\bmaster[''\u2019]?s?\b|\bmba\b|\bdegree\b/i.test(lineLower)) {
      const desc = cleanDescription(line);
      const descNorm = normalizeExpDescription(desc);
      if (desc && !addedEducationNorm.has(descNorm)) {
        addedEducationNorm.add(descNorm);
        reqs.push({
          type: 'education',
          description: desc,
          priority: linePriority,
          match: 'Missing', // User would need to verify manually
        });
      }
    }

    // ---- Certifications ----
    if (/\bcertified\b|\bcertification\b|\blicensed?\b/i.test(lineLower)) {
      const desc = cleanDescription(line);
      const descNorm = normalizeExpDescription(desc);
      if (desc && !addedCertNorm.has(descNorm)) {
        addedCertNorm.add(descNorm);
        reqs.push({
          type: 'certification',
          description: desc,
          priority: linePriority,
          match: 'Missing',
        });
      }
    }
  }

  // Sort: Must first, then by type
  reqs.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'Must' ? -1 : 1;
    const typeOrder = ['experience', 'skill', 'tool', 'education', 'certification', 'other'];
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  });

  return reqs;
}

// ============================================================
// Skill description builder
// ============================================================

/**
 * Build a user-friendly skill description from a JD line and the matched
 * skill keyword. Tries to use the full line context (trimmed) but falls
 * back to the pattern name if the line is too generic.
 */
function buildSkillDescription(line: string, skill: string): string {
  // Use the full line if it looks like a bullet point item
  const stripped = line.replace(BULLET_PREFIX_RE, '').trim();
  // If the line is short enough and contains meaningful text, use it
  if (stripped.length > 0 && stripped.length <= 150) {
    return stripped;
  }
  // Otherwise, just return the skill name itself
  return capitalizeFirst(skill);
}

// ============================================================
// Claim Matching Helpers
// ============================================================

interface MatchResult {
  status: RequirementMatch;
  evidence?: string;
}

// Stop words to exclude when computing keyword match scores.
// These add noise and inflate match ratios for unrelated claims.
const KEYWORD_STOP_WORDS = new Set([
  'with', 'that', 'this', 'from', 'have', 'been', 'will', 'they',
  'their', 'them', 'than', 'also', 'over', 'into', 'such', 'more',
  'well', 'very', 'just', 'like', 'work', 'role', 'team', 'ability',
  'strong', 'knowledge', 'understanding', 'experience', 'including',
  'related', 'across', 'within', 'between', 'through',
]);

function matchExperienceClaim(yearsNeeded: number, description: string, claims?: Claim[]): MatchResult {
  if (!claims || claims.length === 0) return { status: 'Missing' };

  const descLower = description.toLowerCase();
  // Filter keywords: must be > 3 chars, not a stop word
  const keywords = descLower
    .split(/\s+/)
    .filter((w) => w.length > 3 && !KEYWORD_STOP_WORDS.has(w));

  for (const claim of claims) {
    // Calculate approximate years at this role
    const years = estimateClaimYears(claim);

    // Check if claim responsibilities/outcomes match the description
    const allText = [
      claim.role,
      ...claim.responsibilities,
      ...claim.outcomes.map((o) => o.description),
    ].join(' ').toLowerCase();

    // Weight longer keywords more heavily:
    // Each keyword gets weight = max(1, keyword.length - 3).
    // This means "marketing" (9 chars, weight 6) counts more than "data" (4 chars, weight 1).
    let totalWeight = 0;
    let matchedWeight = 0;
    for (const kw of keywords) {
      const weight = Math.max(1, kw.length - 3);
      totalWeight += weight;
      if (allText.includes(kw)) {
        matchedWeight += weight;
      }
    }

    // Also check claim.tools for tool-like keywords in the description
    for (const tool of claim.tools) {
      const toolLower = tool.toLowerCase();
      if (descLower.includes(toolLower)) {
        // Boost: treat tool match as significant evidence
        matchedWeight += Math.max(1, toolLower.length - 3);
        totalWeight += Math.max(1, toolLower.length - 3);
      }
    }

    const keywordMatchRatio = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    // Threshold: 40% weighted match required for "Met"
    if (keywordMatchRatio >= 0.4) {
      if (years >= yearsNeeded) {
        return {
          status: 'Met',
          evidence: `${claim.role} at ${claim.company} (${years}+ yrs)`,
        };
      } else if (years >= yearsNeeded * 0.6) {
        return {
          status: 'Partial',
          evidence: `${claim.role} at ${claim.company} (${years} yrs, need ${yearsNeeded})`,
        };
      }
    }
  }

  // Check across all claims for total years
  const totalYears = claims.reduce((sum, c) => sum + estimateClaimYears(c), 0);
  if (totalYears >= yearsNeeded) {
    return {
      status: 'Partial',
      evidence: `${totalYears} total years across ${claims.length} role${claims.length !== 1 ? 's' : ''}`,
    };
  }

  return { status: 'Missing' };
}

function matchToolClaim(tool: string, claims?: Claim[]): MatchResult {
  if (!claims || claims.length === 0) return { status: 'Missing' };

  const toolLower = tool.toLowerCase();

  for (const claim of claims) {
    // Check tools array (case-insensitive, normalized)
    if (claim.tools.some((t) => normalizeToolName(t) === normalizeToolName(toolLower))) {
      return {
        status: 'Met',
        evidence: `Used at ${claim.company} (${claim.role})`,
      };
    }

    // Check responsibilities/outcomes text
    const allText = [
      ...claim.responsibilities,
      ...claim.outcomes.map((o) => o.description),
    ].join(' ').toLowerCase();

    if (allText.includes(toolLower)) {
      return {
        status: 'Met',
        evidence: `Referenced in ${claim.role} at ${claim.company}`,
      };
    }
  }

  return { status: 'Missing' };
}

/**
 * Match a skill keyword against claims.
 * Looks for the skill keyword in responsibilities, outcomes, and role text.
 */
function matchSkillClaim(skill: string, claims?: Claim[]): MatchResult {
  if (!claims || claims.length === 0) return { status: 'Missing' };

  const skillLower = skill.toLowerCase();

  for (const claim of claims) {
    const allText = [
      claim.role,
      ...claim.responsibilities,
      ...claim.outcomes.map((o) => o.description),
    ].join(' ').toLowerCase();

    if (allText.includes(skillLower)) {
      return {
        status: 'Met',
        evidence: `Demonstrated in ${claim.role} at ${claim.company}`,
      };
    }
  }

  return { status: 'Missing' };
}

function estimateClaimYears(claim: Claim): number {
  if (!claim.startDate) return 0;

  const start = parseClaimDate(claim.startDate);
  const end = claim.endDate ? parseClaimDate(claim.endDate) : new Date();

  if (!start) return 0;
  const endDate = end || new Date();

  const diffMs = endDate.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
}

function parseClaimDate(dateStr: string): Date | null {
  // Try "Month Year" format
  const match = dateStr.match(/(\w+)\s+(\d{4})/);
  if (match) {
    const months: Record<string, number> = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5,
      jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
      oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
    };
    const monthNum = months[match[1].toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(match[2]), monthNum, 1);
    }
  }

  // Try just year
  const yearMatch = dateStr.match(/^(\d{4})$/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }

  return null;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================
// Parse compensation from JD text
// ============================================================

export function parseCompFromText(text: string): { min?: number; max?: number; range?: string } {
  const patterns = [
    /\$(\d{3}),?(\d{3})\s*[-–]\s*\$(\d{3}),?(\d{3})/,
    /\$(\d{3})k\s*[-–]\s*\$(\d{3})k/i,
    /(\d{3}),?(\d{3})\s*[-–]\s*(\d{3}),?(\d{3})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 5) {
        const min = parseInt(match[1] + match[2]);
        const max = parseInt(match[3] + match[4]);
        if (min >= 50000 && max <= 1000000) {
          return { min, max, range: `$${min.toLocaleString()} - $${max.toLocaleString()}` };
        }
      } else if (match.length === 3) {
        const min = parseInt(match[1]) * 1000;
        const max = parseInt(match[2]) * 1000;
        if (min >= 50000 && max <= 1000000) {
          return { min, max, range: `$${min.toLocaleString()} - $${max.toLocaleString()}` };
        }
      }
    }
  }

  return {};
}

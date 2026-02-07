// Job Filter v2 — Deterministic Fit Scoring Engine
// Client-side, no AI cost. Calibratable via weight adjustments.
// See docs/MASTER_PLAN.md section 9 for spec.

import type { Job, FitLabel, Profile, Requirement } from '../types';

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

export function scoreJob(job: Partial<Job>, profile: Profile): ScoringResult {
  const jd = (job.jobDescription || '').toLowerCase();
  const title = (job.title || '').toLowerCase();

  const disqualifiers: string[] = [];
  const reasonsToPursue: string[] = [];
  const reasonsToPass: string[] = [];
  const redFlags: string[] = [];
  const requirements: Requirement[] = [];

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
  if (job.compMax && job.compMax < profile.compFloor) {
    disqualifiers.push(`Max compensation ($${job.compMax.toLocaleString()}) is below floor ($${profile.compFloor.toLocaleString()})`);
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
      requirementsExtracted: requirements,
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
  // Extract requirements
  // ----------------------------------------------------------

  requirements.push(...extractRequirements(jd));

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
// Requirement Extraction (simple keyword-based)
// ============================================================

function extractRequirements(jd: string): Requirement[] {
  const reqs: Requirement[] = [];
  const lines = jd.split(/[.\n]/);

  const yearsPattern = /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?(.+)/i;
  const toolPatterns = [
    'salesforce', 'hubspot', 'marketo', 'pardot', 'segment', 'amplitude',
    'mixpanel', 'google analytics', 'ga4', 'tableau', 'looker', 'dbt',
    'snowflake', 'bigquery', 'braze', 'iterable', 'klaviyo', 'mailchimp',
    'meta ads', 'google ads', 'linkedin ads', 'tiktok ads',
  ];

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) continue;

    // Years of experience
    const yearsMatch = trimmed.match(yearsPattern);
    if (yearsMatch) {
      reqs.push({
        type: 'experience',
        description: yearsMatch[2].trim(),
        yearsNeeded: parseInt(yearsMatch[1]),
      });
    }

    // Tools
    for (const tool of toolPatterns) {
      if (trimmed.includes(tool)) {
        const exists = reqs.some((r) => r.type === 'tool' && r.description.toLowerCase() === tool);
        if (!exists) {
          reqs.push({ type: 'tool', description: tool.charAt(0).toUpperCase() + tool.slice(1) });
        }
      }
    }

    // Education
    if (trimmed.includes("bachelor") || trimmed.includes("master") || trimmed.includes("mba") || trimmed.includes("degree")) {
      const exists = reqs.some((r) => r.type === 'education');
      if (!exists) {
        reqs.push({ type: 'education', description: line.trim() });
      }
    }
  }

  return reqs;
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

// Job Filter v2 — Asset Generation (Template-based, no API cost for v1)
// Uses claim ledger + job data + research to fill templates.
// Logs every generation for experimentation tracking.

import type { Job, Claim, ResearchBrief } from '../types';

// ============================================================
// Generation Context & Validation
// ============================================================

export interface GenerationContext {
  job: Job;
  userName: string;
  claims: Claim[];
  research?: ResearchBrief;
  contactName?: string;
  contactRole?: string;
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates that a GenerationContext has the required data before generation.
 * Returns { valid, missing, warnings }.
 * - job.title, job.company, and userName are required (blocks generation).
 * - At least 1 claim is recommended but not blocking (warning only).
 */
export function validateContext(ctx: {
  job?: Partial<Job>;
  userName?: string;
  claims?: Claim[];
}): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!ctx.job?.title) {
    missing.push('job.title');
  }
  if (!ctx.job?.company) {
    missing.push('job.company');
  }
  if (!ctx.userName) {
    missing.push('userName');
  }
  if (!ctx.claims || ctx.claims.length === 0) {
    warnings.push('No claims provided — generated content will use generic fallbacks.');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// ============================================================
// Outreach Email Generator
// ============================================================

export function generateOutreachEmail(ctx: GenerationContext): string {
  const { job, userName, contactName, claims, research } = ctx;
  const topClaims = getTopClaims(claims, 2);
  const companyInsight = research?.companyOverview
    ? extractInsightSentence(research.companyOverview)
    : '';

  const greeting = contactName ? `Hi ${contactName},` : `Hi there,`;

  return `${greeting}

I came across the ${job.title} role at ${job.company}${companyInsight ? ` and was struck by ${companyInsight}` : ''}.

${topClaims[0] ? `At ${topClaims[0].company}, I ${topClaims[0].summary}` : 'My background spans building growth systems from strategy through execution.'}

${topClaims[1] ? `Previously at ${topClaims[1].company}, I ${topClaims[1].summary}` : 'I specialize in translating growth strategy into measurable revenue outcomes.'}

I put together a brief growth plan outlining how I would approach the first year in this role. It covers a 30-day diagnostic, quarterly execution plan, and the strategic bets I would prioritize based on what I see in ${job.company}'s market position.

Would it be worth 20 minutes to walk through it? Happy to share the plan in advance.

Best,
${userName}`;
}

// ============================================================
// LinkedIn Connect Note (300 char max)
// ============================================================

export function generateLinkedInConnect(params: {
  job: Job;
  userName: string;
  claims: Claim[];
  contactName?: string;
}): string {
  const { job, claims, contactName } = params;
  const topClaim = getTopClaims(claims, 1)[0];

  let note = `Hi${contactName ? ` ${contactName}` : ''}, I saw the ${job.title} opening at ${job.company}.`;

  if (topClaim) {
    note += ` I led ${topClaim.shortSummary} at ${topClaim.company}.`;
  }

  note += ` I put together a growth plan for the role. Happy to share.`;

  // Truncate to 300 chars
  if (note.length > 300) {
    note = note.substring(0, 297) + '...';
  }

  return note;
}

// ============================================================
// Cover Letter Generator
// ============================================================

export function generateCoverLetter(params: {
  job: Job;
  userName: string;
  claims: Claim[];
  research?: ResearchBrief;
}): string {
  const { job, userName, claims, research } = params;
  const topClaims = getTopClaims(claims, 3);
  const companyInsight = research?.companyOverview
    ? extractInsightSentence(research.companyOverview)
    : `${job.company}'s growth trajectory`;

  const claimBullets = topClaims
    .map((c) => `- At ${c.company}: ${c.summary}`)
    .join('\n');

  return `Dear Hiring Team,

I am writing regarding the ${job.title} position at ${job.company}. Having studied ${companyInsight}, I see a clear opportunity to build systematic growth infrastructure that compounds over time.

My background is built on a simple thesis: marketing leadership is revenue leadership. Every system I build connects directly to measurable business outcomes.

${claimBullets || '- Built and led growth functions from strategy through execution across multiple industries'}

What excites me about this role is the chance to apply these systems at ${job.company}'s current stage. I have drafted a detailed Annual Growth Plan that outlines:
- A 30-day diagnostic to identify the highest-leverage opportunities
- A quarterly execution roadmap for year one
- Strategic bets for years two and three

I would welcome the chance to walk through this plan with your team. It is designed to show how I think, not just what I have done.

Best regards,
${userName}`;
}

// ============================================================
// Follow-up Email Generator
// ============================================================

export function generateFollowUpEmail(params: {
  job: Job;
  userName: string;
  contactName?: string;
  originalDate?: string;
  newInsight?: string;
}): string {
  const { job, userName, contactName, originalDate, newInsight } = params;
  const greeting = contactName ? `Hi ${contactName},` : `Hi there,`;
  const dateRef = originalDate ? ` on ${originalDate}` : ' recently';

  return `${greeting}

I reached out${dateRef} about the ${job.title} role at ${job.company}. I wanted to follow up with something that might be useful.

${newInsight || `I have been digging deeper into ${job.company}'s market and mapped out a few specific growth hypotheses based on my research. One angle in particular could unlock meaningful upside in the first 90 days.`}

The growth plan I mentioned is still available. It is specific to ${job.company}'s situation, not a generic template.

Worth a quick conversation?

Best,
${userName}`;
}

// ============================================================
// Growth Memo Generator (skeleton with claim ledger integration)
// ============================================================

export function generateGrowthMemo(params: {
  job: Job;
  userName: string;
  claims: Claim[];
  research?: ResearchBrief;
}): string {
  const { job, userName, claims, research } = params;
  const topClaims = getTopClaims(claims, 4);
  const companyOverview = research?.companyOverview || `[Research ${job.company} to fill this section]`;
  const competitors = research?.competitors || '[Competitor analysis needed]';
  const gtm = research?.gtmChannels || '[GTM channel analysis needed]';

  const claimEvidence = topClaims
    .map((c) => `- **${c.company}** (${c.role}): ${c.summary}`)
    .join('\n');

  return `# Annual Growth Plan: ${job.company}
## ${job.title} | Prepared by ${userName}

---

## Executive Summary

This plan outlines a systematic approach to building growth infrastructure at ${job.company}. It covers a 30-day diagnostic phase, a quarter-by-quarter execution plan for year one, and a strategic vision for years two and three. Every recommendation is grounded in market reality and my direct experience building similar systems.

---

## 1. Company Context

${companyOverview}

### Market Position
${competitors}

### Current GTM Signals
${gtm}

---

## 2. 30-Day Diagnostic

**Objective:** Map the current state, identify the highest-leverage opportunities, and validate assumptions before committing resources.

**Week 1-2: Audit**
- Map current acquisition channels and their unit economics
- Audit the marketing tech stack and data infrastructure
- Interview key stakeholders (sales, product, CS, leadership)
- Analyze historical campaign performance and attribution

**Week 3-4: Hypothesize & Prioritize**
- Identify the top 3-5 growth levers based on audit findings
- Build a prioritized backlog using ICE scoring (Impact, Confidence, Ease)
- Present diagnostic findings and proposed roadmap to leadership
- Align on OKRs and resource requirements

---

## 3. Quarterly Plan: Year One

### Q1: Foundation (Months 1-3)
- Complete diagnostic and secure alignment on priorities
- Fix measurement infrastructure (attribution, reporting, dashboards)
- Launch 2-3 high-confidence experiments on top growth levers
- Establish weekly growth metrics cadence

### Q2: Acceleration (Months 4-6)
- Scale winning experiments from Q1
- Build systematic content/demand generation engine
- Implement lifecycle marketing (onboarding, activation, retention)
- Begin building the team where gaps exist

### Q3: Optimization (Months 7-9)
- Shift from channel-level to system-level optimization
- Implement experimentation framework (A/B testing, incrementality)
- Deepen attribution and multi-touch modeling
- Expand into 1-2 new channels based on Q1-Q2 learnings

### Q4: Compounding (Months 10-12)
- Demonstrate clear ROI on growth investments
- Present year-one results and year-two strategic plan
- Begin planning international/new-segment expansion if applicable
- Document systems and playbooks for team scale

---

## 4. Years 2-3 Vision

**Year 2: Scale**
- Expand team and specialize by function
- Move from channel marketing to growth systems
- Build predictive models for LTV, churn, and expansion revenue

**Year 3: Defensibility**
- Create proprietary growth advantages (data moats, brand, community)
- Establish ${job.company} as a category leader in growth execution
- Mentor and develop next-generation growth leaders

---

## 5. Assumptions, Risks & Mitigations

| Assumption | Risk if Wrong | Mitigation |
|---|---|---|
| Leadership supports systematic approach | Short-term pressure for quick wins | Deliver quick wins in parallel with infrastructure |
| Data infrastructure is fixable in Q1 | Delayed measurement delays everything | Propose budget for tools/resources in diagnostic |
| Team gaps can be filled in Q2-Q3 | Execution bottleneck | Use contractors/agencies as bridge |
| Market conditions remain stable | Strategy becomes irrelevant | Build quarterly review and pivot protocols |

---

## 6. Why Me

My approach is built on evidence, not theory. Here is what I have delivered in similar situations:

${claimEvidence || '[Upload resume or LinkedIn experience to populate claim ledger]'}

Every system I have built follows the same pattern: diagnose before prescribing, measure before scaling, and compound before expanding. This plan reflects that discipline applied to ${job.company}'s specific situation.

---

*This plan is a starting point for conversation, not a finished strategy. The real plan emerges from the 30-day diagnostic with your team's input and data.*`;
}

// ============================================================
// Application Answer Generator
// ============================================================

export function generateApplicationAnswer(params: {
  job: Job;
  userName: string;
  claims: Claim[];
  research?: ResearchBrief;
  question: string;
}): { answer: string; sources: string[] } {
  const { job, userName, claims, research, question } = params;
  const topClaims = getTopClaims(claims, 3);
  const sources: string[] = [];

  // Build claim-backed evidence lines
  const evidenceLines: string[] = [];
  for (const claim of topClaims) {
    evidenceLines.push(`At ${claim.company} (${claim.role}), I ${claim.summary}`);
    sources.push(`Claim: ${claim.role} at ${claim.company}`);
  }

  // Pull in research context if available
  let researchContext = '';
  if (research?.companyOverview) {
    const insight = extractInsightSentence(research.companyOverview);
    if (insight) {
      researchContext = `Having researched ${job.company}, I understand ${insight}. `;
      sources.push(`Research: ${job.company} company overview`);
    }
  }
  if (research?.gtmChannels) {
    sources.push(`Research: ${job.company} GTM channels`);
  }

  // Compose the answer
  const questionLower = question.toLowerCase();

  let answer: string;

  if (questionLower.includes('why') && (questionLower.includes('company') || questionLower.includes('role') || questionLower.includes('position') || questionLower.includes('interested'))) {
    // "Why are you interested in this role/company?" pattern
    answer = `${researchContext}The ${job.title} role at ${job.company} aligns directly with how I approach growth: systematically, with measurable outcomes. ${evidenceLines[0] ? evidenceLines[0] + '.' : ''} I see a clear opportunity to apply that same discipline at ${job.company}.`;
  } else if (questionLower.includes('experience') || questionLower.includes('background') || questionLower.includes('qualif')) {
    // Experience / background / qualifications pattern
    const bullets = evidenceLines.map((line) => `- ${line}`).join('\n');
    answer = `My background is built on translating growth strategy into revenue outcomes:\n\n${bullets || '- Built and led growth functions from strategy through execution across multiple industries.'}\n\nEach of these roles required building systems from scratch and demonstrating measurable impact, which is exactly what the ${job.title} role at ${job.company} demands.`;
  } else if (questionLower.includes('strength') || questionLower.includes('superpower') || questionLower.includes('best at')) {
    // Strengths pattern
    answer = `My core strength is building systematic growth infrastructure that compounds over time. ${evidenceLines[0] ? `For example, ${evidenceLines[0].toLowerCase()}.` : ''} I do not rely on one-off tactics — I build repeatable engines that scale.`;
  } else if (questionLower.includes('salary') || questionLower.includes('compensation') || questionLower.includes('pay')) {
    // Compensation pattern (keep it professional, defer specifics)
    answer = `I am focused on finding the right fit where I can make a meaningful impact. I am happy to discuss compensation details once we have explored mutual alignment on the role and expectations.`;
  } else {
    // Generic fallback — ground in claims and role context
    answer = `${researchContext}In the context of the ${job.title} role at ${job.company}, I would draw on my track record of building growth systems that deliver measurable results. ${evidenceLines[0] ? evidenceLines[0] + '.' : ''} ${evidenceLines[1] ? evidenceLines[1] + '.' : ''} I am happy to elaborate on any of these experiences in more detail.`;
  }

  // Append a subtle sign-off if the answer is substantial
  if (answer.length > 200) {
    answer += `\n\n— ${userName}`;
  }

  return { answer, sources };
}

// ============================================================
// Helpers
// ============================================================

interface ClaimSummary {
  company: string;
  role: string;
  summary: string;
  shortSummary: string;
}

function getTopClaims(claims: Claim[], count: number): ClaimSummary[] {
  return claims.slice(0, count).map((claim) => {
    const topOutcome = claim.outcomes[0];
    const summary = claim.claimText
      ? claim.claimText
      : topOutcome
      ? topOutcome.description
      : claim.responsibilities[0] || 'led growth initiatives';
    const shortSummary = summary.length > 60 ? summary.substring(0, 57) + '...' : summary;

    return {
      company: claim.company,
      role: claim.role,
      summary,
      shortSummary,
    };
  });
}

function extractInsightSentence(overview: string): string {
  // Take the first meaningful sentence
  const sentences = overview.split(/[.!]\s+/);
  for (const sentence of sentences) {
    if (sentence.length > 20 && sentence.length < 150) {
      return sentence.trim().toLowerCase();
    }
  }
  return '';
}

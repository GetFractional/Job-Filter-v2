// Job Filter v2 — Asset Generation (Template-based, no API cost for v1)
// Uses claim ledger + job data + research to fill templates.
// Logs every generation for experimentation tracking.

import type { Job, Claim, ResearchBrief } from '../types';
import { buildExperienceBundles } from './claimLedger.ts';

// ============================================================
// Outreach Email Generator
// ============================================================

export function generateOutreachEmail(params: {
  job: Job;
  contactName?: string;
  contactRole?: string;
  claims: Claim[];
  research?: ResearchBrief;
  signerName?: string;
}): string {
  const { job, contactName, claims, research, signerName } = params;
  const signoffName = signerName?.trim() || 'Candidate';
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
${signoffName}`;
}

// ============================================================
// LinkedIn Connect Note (300 char max)
// ============================================================

export function generateLinkedInConnect(params: {
  job: Job;
  contactName?: string;
  claims: Claim[];
}): string {
  const { job, contactName, claims } = params;
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
  claims: Claim[];
  research?: ResearchBrief;
  signerName?: string;
}): string {
  const { job, claims, research, signerName } = params;
  const signoffName = signerName?.trim() || 'Candidate';
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
${signoffName}`;
}

// ============================================================
// Follow-up Email Generator
// ============================================================

export function generateFollowUpEmail(params: {
  job: Job;
  contactName?: string;
  originalDate?: string;
  newInsight?: string;
  signerName?: string;
}): string {
  const { job, contactName, originalDate, newInsight, signerName } = params;
  const signoffName = signerName?.trim() || 'Candidate';
  const greeting = contactName ? `Hi ${contactName},` : `Hi there,`;
  const dateRef = originalDate ? ` on ${originalDate}` : ' recently';

  return `${greeting}

I reached out${dateRef} about the ${job.title} role at ${job.company}. I wanted to follow up with something that might be useful.

${newInsight || `I noticed ${job.company}'s market is evolving, and I mapped out a few specific growth hypotheses based on my research. One angle in particular could unlock meaningful upside in the first 90 days.`}

The growth plan I mentioned is still available. It is specific to ${job.company}'s situation, not a generic template.

Worth a quick conversation?

Best,
${signoffName}`;
}

// ============================================================
// Growth Memo Generator (skeleton with claim ledger integration)
// ============================================================

export function generateGrowthMemo(params: {
  job: Job;
  claims: Claim[];
  research?: ResearchBrief;
  signerName?: string;
}): string {
  const { job, claims, research, signerName } = params;
  const memoOwner = signerName?.trim() || 'Candidate';
  const topClaims = getTopClaims(claims, 4);
  const companyIdentity = research?.companyIdentity
    ? `Identity confirmation: ${research.companyIdentity}`
    : `Identity confirmation pending. Validate legal entity, website, and HQ for ${job.company} before external use.`;
  const companyOverview =
    research?.companyOverview ||
    `No approved research snapshot is attached yet. Run Research for ${job.company} and attach the brief before finalizing this memo.`;
  const competitors =
    research?.competitors ||
    `Competitor and market-position analysis is pending an approved research snapshot for ${job.company}.`;
  const gtm =
    research?.gtmChannels ||
    `GTM channel signals are pending approved research for ${job.company}.`;

  const claimEvidence = topClaims
    .map((c) => `- **${c.company}** (${c.role}): ${c.summary}`)
    .join('\n');

  return `# Annual Growth Plan: ${job.company}
## ${job.title} | Prepared by ${memoOwner}

---

## Executive Summary

This plan outlines a systematic approach to building growth infrastructure at ${job.company}. It covers a 30-day diagnostic phase, a quarter-by-quarter execution plan for year one, and a strategic vision for years two and three. Every recommendation is grounded in market reality and my direct experience building similar systems.

---

## 1. Company Context

${companyIdentity}

### Business Snapshot
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

${claimEvidence || '- No approved claims are linked yet. Add and approve claims in Settings before approving this memo.'}

Every system I have built follows the same pattern: diagnose before prescribing, measure before scaling, and compound before expanding. This plan reflects that discipline applied to ${job.company}'s specific situation.

---

*This plan is a starting point for conversation, not a finished strategy. The real plan emerges from the 30-day diagnostic with your team's input and data.*`;
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
  const bundles = buildExperienceBundles(claims);
  return bundles.slice(0, count).map((bundle) => {
    const topOutcome = bundle.outcomes[0];
    const summary = topOutcome
      ? topOutcome.description
      : bundle.responsibilities[0] || bundle.skills[0] || 'led growth initiatives';
    const shortSummary = summary.length > 60 ? summary.substring(0, 57) + '...' : summary;

    return {
      company: bundle.company,
      role: bundle.role,
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

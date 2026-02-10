import { buildExperienceBundles } from './claimLedger.ts';
import type { BoundGenerationContext } from './generationContext';

export interface AnswerTrace {
  jobId: string;
  company: string;
  claimsSnapshotId: string;
  claimIds: string[];
  claimEvidence: string[];
  researchEvidence: string[];
}

export interface GeneratedApplicationAnswer {
  answer: string;
  trace: AnswerTrace;
}

function firstSentence(text?: string): string | undefined {
  if (!text) return undefined;
  const parts = text
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[0];
}

function rankClaimEvidence(context: BoundGenerationContext): { claimIds: string[]; lines: string[] } {
  const bundles = buildExperienceBundles(context.approvedClaims);
  const topBundles = bundles.slice(0, 2);
  const lines: string[] = [];
  const claimIds: string[] = [];

  for (const bundle of topBundles) {
    claimIds.push(bundle.id);
    const topOutcome = bundle.outcomes[0]?.description;
    const summary = topOutcome || bundle.responsibilities[0] || bundle.skills[0] || bundle.tools[0] || 'led growth work';
    lines.push(`${bundle.role} at ${bundle.company}: ${summary}`);
  }

  return { claimIds, lines };
}

export function parseApplicationQuestions(input: string): string[] {
  if (!input.trim()) return [];

  const rows = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);

  const expanded: string[] = [];
  for (const row of rows) {
    if (row.includes('?')) {
      const parts = row
        .split(/(?<=\?)\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      expanded.push(...parts);
    } else {
      expanded.push(row);
    }
  }

  return [...new Set(expanded)];
}

export function generateApplicationAnswer(
  question: string,
  context: BoundGenerationContext
): GeneratedApplicationAnswer {
  const normalizedQuestion = question.trim();
  const lower = normalizedQuestion.toLowerCase();
  const evidence = rankClaimEvidence(context);

  const researchSignals = [
    firstSentence(context.approvedResearchSnapshot?.companyOverview),
    firstSentence(context.approvedResearchSnapshot?.businessModel),
    firstSentence(context.approvedResearchSnapshot?.gtmChannels),
  ].filter((line): line is string => !!line);

  const intro = `I am interested in the ${context.jobTitle} role at ${context.company} because it aligns with the way I build measurable growth systems.`;
  const proof = evidence.lines.length > 0
    ? `Relevant examples from my experience include ${evidence.lines.join('; ')}.`
    : 'I have led cross-functional growth work across acquisition, retention, and revenue analytics.';
  const companyTie = researchSignals[0]
    ? `This is especially relevant given ${researchSignals[0]}.`
    : `I would tailor execution to ${context.company}'s current stage and GTM model.`;

  let answer = `${intro}\n\n${proof}\n\n${companyTie}`;

  if (/why (do you want|this|our|company)/i.test(lower)) {
    answer = `${intro}\n\n${companyTie}\n\n${proof}`;
  } else if (/biggest (strength|achievement)|accomplishment|proud/i.test(lower)) {
    answer = `${proof}\n\n${companyTie}\n\nIn this role, I would apply the same discipline with clear KPIs and weekly operating cadence.`;
  } else if (/weakness|challenge|mistake|failure/i.test(lower)) {
    answer = `One challenge I have learned from is balancing speed and certainty in early experiments.\n\nI now run faster validation loops with explicit guardrails, which improved decision quality in later roles.\n\n${companyTie}`;
  }

  return {
    answer,
    trace: {
      jobId: context.jobId,
      company: context.company,
      claimsSnapshotId: context.claimsSnapshotId,
      claimIds: evidence.claimIds,
      claimEvidence: evidence.lines,
      researchEvidence: researchSignals,
    },
  };
}

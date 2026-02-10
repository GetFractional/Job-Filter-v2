import type { Claim, Job, ResearchBrief } from '../types';
import { validateResearchCompanyMatch } from './research.ts';

export type GenerationFlow = 'assets' | 'research' | 'qa';

export interface GenerationContextError {
  code:
    | 'missing-job-id'
    | 'missing-job-title'
    | 'missing-company'
    | 'missing-approved-claims'
    | 'missing-research'
    | 'mismatched-research-company';
  field: 'job.id' | 'job.title' | 'job.company' | 'claims' | 'job.researchBrief';
  message: string;
}

export interface GenerationContextOptions {
  flow: GenerationFlow;
  job: Partial<Job> | null | undefined;
  claims?: Claim[];
  requireApprovedClaims?: boolean;
  requireResearch?: boolean;
}

export interface BoundGenerationContext {
  flow: GenerationFlow;
  jobId: string;
  companyId?: string;
  jobTitle: string;
  company: string;
  companyName: string;
  approvedClaims: Claim[];
  claimsSnapshotId: string;
  resumeVersionId: string;
  approvedResearchSnapshot?: ResearchBrief;
  researchSnapshotId?: string;
  createdAt: string;
}

type BindResult =
  | { ok: true; context: BoundGenerationContext }
  | { ok: false; errors: GenerationContextError[] };

function buildClaimsSnapshotId(claims: Claim[]): string {
  const ids = claims.map((claim) => claim.id).sort().join(',');
  return `claims:${ids || 'none'}`;
}

function buildResearchSnapshotId(brief: ResearchBrief): string {
  return `research:${brief.createdAt}`;
}

function buildResumeVersionId(claims: Claim[]): string {
  if (claims.length === 0) return 'resume:none';
  const latestUpdate = claims
    .map((claim) => claim.updatedAt || claim.createdAt)
    .filter(Boolean)
    .sort()
    .pop();
  return `resume:${latestUpdate || 'unknown'}`;
}

function approvedClaims(claims: Claim[]): Claim[] {
  return claims.filter((claim) => claim.verificationStatus === 'Approved');
}

export function validateGenerationContext(options: GenerationContextOptions): GenerationContextError[] {
  const errors: GenerationContextError[] = [];
  const job = options.job;
  const claims = options.claims || [];
  const approved = approvedClaims(claims);

  if (!job?.id) {
    errors.push({
      code: 'missing-job-id',
      field: 'job.id',
      message: 'Select an active job before generating content.',
    });
  }

  if (!job?.title?.trim()) {
    errors.push({
      code: 'missing-job-title',
      field: 'job.title',
      message: 'Job title is required for generation.',
    });
  }

  if (!job?.company?.trim()) {
    errors.push({
      code: 'missing-company',
      field: 'job.company',
      message: 'Company name is required for generation.',
    });
  }

  if (options.requireApprovedClaims && approved.length === 0) {
    errors.push({
      code: 'missing-approved-claims',
      field: 'claims',
      message: 'Approve at least one claim in Settings before generating this draft.',
    });
  }

  if (options.requireResearch && !job?.researchBrief) {
    errors.push({
      code: 'missing-research',
      field: 'job.researchBrief',
      message: 'Research brief is required. Generate and save research first.',
    });
  }

  if (options.requireResearch && job?.researchBrief && job.company?.trim()) {
    const sourceText = [
      job.researchBrief.companyIdentity,
      job.researchBrief.companyOverview,
      job.researchBrief.businessModel,
      job.researchBrief.rawPasteContent,
    ]
      .filter(Boolean)
      .join('\n');

    const match = validateResearchCompanyMatch(sourceText, job.company);
    if (!match.isMatch || match.confidence < 0.45) {
      errors.push({
        code: 'mismatched-research-company',
        field: 'job.researchBrief',
        message: `Saved research may not match ${job.company}. Re-run research for the active company before generating.`,
      });
    }
  }

  return errors;
}

export function bindGenerationContext(options: GenerationContextOptions): BindResult {
  const errors = validateGenerationContext(options);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const job = options.job!;
  const claims = options.claims || [];
  const approved = approvedClaims(claims);
  const research = job.researchBrief;

  return {
    ok: true,
    context: {
      flow: options.flow,
      jobId: job.id!,
      companyId: job.companyId,
      jobTitle: job.title!.trim(),
      company: job.company!.trim(),
      companyName: job.company!.trim(),
      approvedClaims: approved,
      claimsSnapshotId: buildClaimsSnapshotId(approved),
      resumeVersionId: buildResumeVersionId(approved),
      approvedResearchSnapshot: research,
      researchSnapshotId: research ? buildResearchSnapshotId(research) : undefined,
      createdAt: new Date().toISOString(),
    },
  };
}

export function describeGenerationContext(context: BoundGenerationContext): string[] {
  return [
    `Job: ${context.jobTitle} at ${context.company}`,
    `Approved claims: ${context.approvedClaims.length}`,
    `Resume snapshot: ${context.resumeVersionId}`,
    context.researchSnapshotId
      ? `Research snapshot: ${context.researchSnapshotId}`
      : 'Research snapshot: not attached',
    `Claims snapshot: ${context.claimsSnapshotId}`,
  ];
}

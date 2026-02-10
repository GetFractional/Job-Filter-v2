import type { Claim, ClaimVerificationStatus, ClaimOutcome } from '../types';

export interface ExperienceBundle {
  id: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities: string[];
  skills: string[];
  tools: string[];
  outcomes: ClaimOutcome[];
  confidence: number;
  verificationStatus: ClaimVerificationStatus;
}

export interface DuplicateClaimGroup {
  key: string;
  type: Claim['type'];
  targetId: string;
  sourceIds: string[];
  label: string;
}

export function normalizeClaimText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isExperienceClaim(claim: Claim): boolean {
  return claim.type === 'Experience' || (!!claim.role && !!claim.company);
}

export function buildExperienceBundles(claims: Claim[]): ExperienceBundle[] {
  const experiences = claims.filter(isExperienceClaim);
  const bundles: ExperienceBundle[] = experiences.map((exp) => ({
    id: exp.id,
    company: exp.company || 'Unknown Company',
    role: exp.role || exp.text || 'Unknown Role',
    startDate: exp.startDate,
    endDate: exp.endDate,
    location: exp.location,
    responsibilities: [...(exp.responsibilities || [])],
    skills: [],
    tools: [],
    outcomes: [],
    confidence: exp.confidence ?? 0.5,
    verificationStatus: exp.verificationStatus || 'Review Needed',
  }));

  const bundleMap = new Map<string, ExperienceBundle>();
  bundles.forEach((bundle) => {
    bundleMap.set(bundle.id, bundle);
  });
  const experienceMap = new Map<string, Claim>();
  experiences.forEach((experience) => {
    experienceMap.set(experience.id, experience);
  });

  for (const claim of claims) {
    if (isExperienceClaim(claim) || !claim.experienceId) continue;

    const bundle = bundleMap.get(claim.experienceId);
    if (!bundle) continue;

    if (claim.type === 'Skill' && claim.text) {
      bundle.skills.push(claim.text);
      continue;
    }

    if (claim.type === 'Tool' && claim.text) {
      bundle.tools.push(claim.text);
      continue;
    }

    if (claim.type === 'Outcome' && claim.text) {
      bundle.outcomes.push({
        description: claim.text,
        metric: claim.metric,
        isNumeric: !!claim.isNumeric,
        verified: claim.verificationStatus === 'Approved',
      });
    }
  }

  for (const bundle of bundles) {
    const experience = experienceMap.get(bundle.id);
    bundle.responsibilities = [...new Set(bundle.responsibilities.map((r) => r.trim()).filter(Boolean))];
    bundle.skills = [...new Set(bundle.skills.map((s) => s.trim()).filter(Boolean))];
    if (bundle.tools.length === 0 && experience?.tools?.length) {
      bundle.tools.push(...experience.tools);
    }
    bundle.tools = [...new Set(bundle.tools.map((t) => t.trim()).filter(Boolean))];
    if (bundle.outcomes.length === 0 && experience?.outcomes?.length) {
      bundle.outcomes.push(...experience.outcomes);
    }
    const seenOutcomeKeys = new Set<string>();
    bundle.outcomes = bundle.outcomes.filter((outcome) => {
      const key = `${(outcome.description || '').toLowerCase().trim()}|${(outcome.metric || '').toLowerCase().trim()}`;
      if (!key || seenOutcomeKeys.has(key)) return false;
      seenOutcomeKeys.add(key);
      return true;
    });
  }

  return bundles;
}

export function claimReviewQueue(claims: Claim[]): Claim[] {
  return claims
    .filter((claim) => claim.verificationStatus === 'Review Needed')
    .sort((a, b) => {
      const confidenceDelta = (a.confidence ?? 0) - (b.confidence ?? 0);
      if (confidenceDelta !== 0) return confidenceDelta;
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    });
}

export function groupClaimsByType(claims: Claim[]): Record<string, Claim[]> {
  return {
    Experience: claims.filter((c) => isExperienceClaim(c)),
    Skill: claims.filter((c) => c.type === 'Skill'),
    Tool: claims.filter((c) => c.type === 'Tool'),
    Outcome: claims.filter((c) => c.type === 'Outcome'),
  };
}

function duplicateKey(claim: Claim): string {
  if (isExperienceClaim(claim)) {
    const role = normalizeClaimText(claim.role || claim.text || '');
    const company = normalizeClaimText(claim.company || '');
    const start = normalizeClaimText(claim.startDate || '');
    const end = normalizeClaimText(claim.endDate || '');
    if (!role || !company) return '';
    return `Experience|${role}|${company}|${start}|${end}`;
  }

  if (!claim.normalizedText) return '';
  return `${claim.type}|${claim.normalizedText}|${claim.experienceId || 'unlinked'}`;
}

function duplicateLabel(claim: Claim): string {
  if (isExperienceClaim(claim)) {
    const role = claim.role || claim.text || 'Experience';
    const company = claim.company ? ` @ ${claim.company}` : '';
    return `${role}${company}`;
  }
  return claim.text || claim.type;
}

export function findDuplicateClaimGroups(claims: Claim[]): DuplicateClaimGroup[] {
  const grouped = new Map<string, Claim[]>();
  for (const claim of claims) {
    const key = duplicateKey(claim);
    if (!key) continue;
    const items = grouped.get(key) || [];
    items.push(claim);
    grouped.set(key, items);
  }

  const groups: DuplicateClaimGroup[] = [];
  for (const [key, items] of grouped.entries()) {
    if (items.length < 2) continue;
    const sorted = [...items].sort((a, b) => {
      const createdDelta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (createdDelta !== 0) return createdDelta;
      return a.id.localeCompare(b.id);
    });
    const [target, ...sources] = sorted;
    groups.push({
      key,
      type: target.type,
      targetId: target.id,
      sourceIds: sources.map((item) => item.id),
      label: duplicateLabel(target),
    });
  }

  return groups.sort((a, b) => b.sourceIds.length - a.sourceIds.length);
}

import type {
  Claim,
  ClaimReviewStatus,
  DigitalResume,
  Profile,
  ResumeCompany,
  ResumeHighlight,
  ResumeOutcome,
  ResumeRole,
} from '../types';

const DEFAULT_STATUS: ClaimReviewStatus = 'active';

function normalizeTagValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildRoleKey(claim: Pick<Claim, 'company' | 'role' | 'startDate' | 'endDate'>): string {
  return [
    claim.company.trim().toLowerCase(),
    claim.role.trim().toLowerCase(),
    claim.startDate.trim().toLowerCase(),
    (claim.endDate || '').trim().toLowerCase(),
  ].join('::');
}

function createHighlight(claim: Claim): ResumeHighlight | null {
  const text = (claim.claimText || claim.responsibilities[0] || '').trim();
  if (!text) return null;

  return {
    id: claim.id,
    text,
    status: claim.reviewStatus || DEFAULT_STATUS,
    rawEvidenceRefs: claim.rawSnippet ? [claim.rawSnippet] : [],
  };
}

function createOutcome(claim: Claim): ResumeOutcome | null {
  const metricText = claim.outcomes[0]?.description?.trim() || claim.claimText?.trim() || '';
  const metric = claim.metric;
  if (!metricText && !metric?.value) return null;

  return {
    id: `${claim.id}-outcome`,
    text: metricText || 'Impact statement',
    metricValue: metric?.value,
    metricUnit: metric?.unit,
    metricContext: metric?.context,
    status: claim.reviewStatus || DEFAULT_STATUS,
    rawEvidenceRefs: claim.rawSnippet ? [claim.rawSnippet] : [],
  };
}

export function claimsToDigitalResume(claims: Claim[], profile?: Profile | null): DigitalResume {
  const companyMap = new Map<string, ResumeCompany>();
  const roleMap = new Map<string, ResumeRole>();
  const collectedTools: string[] = [];

  for (const claim of claims) {
    const companyName = claim.company.trim() || 'Unknown Company';
    const roleTitle = claim.role.trim() || 'Unknown Role';
    const roleKey = buildRoleKey(claim);
    const companyKey = companyName.toLowerCase();

    if (!companyMap.has(companyKey)) {
      companyMap.set(companyKey, {
        companyId: `company-${companyMap.size + 1}`,
        companyName,
        roles: [],
      });
    }

    if (!roleMap.has(roleKey)) {
      const role: ResumeRole = {
        roleId: `role-${roleMap.size + 1}`,
        title: roleTitle,
        startDate: claim.startDate,
        endDate: claim.endDate,
        highlights: [],
        outcomes: [],
        tools: [],
        skills: [],
        rawEvidenceRefs: [],
      };
      roleMap.set(roleKey, role);
      companyMap.get(companyKey)?.roles.push(role);
    }

    const role = roleMap.get(roleKey);
    if (!role) continue;

    const highlight = createHighlight(claim);
    if (highlight) {
      role.highlights.push(highlight);
    }

    const outcome = createOutcome(claim);
    if (outcome) {
      role.outcomes.push(outcome);
    }

    role.tools = normalizeTagValues([...role.tools, ...claim.tools]);
    if (claim.rawSnippet) {
      role.rawEvidenceRefs = normalizeTagValues([...(role.rawEvidenceRefs || []), claim.rawSnippet]);
    }

    collectedTools.push(...claim.tools);
  }

  const companies = [...companyMap.values()];

  return {
    companies,
    globalSkills: normalizeTagValues(profile?.skills || []),
    globalTools: normalizeTagValues([...(profile?.tools || []), ...collectedTools]),
    source: 'claims',
    lastImportedAt: new Date().toISOString(),
  };
}

function outcomeToClaimText(outcome: ResumeOutcome): string {
  if (outcome.text.trim()) return outcome.text.trim();
  const value = outcome.metricValue?.trim() || '';
  const unit = outcome.metricUnit?.trim() || '';
  return `${value}${unit}`.trim();
}

export function digitalResumeToClaims(resume: DigitalResume): Claim[] {
  const claims: Claim[] = [];
  const now = new Date().toISOString();

  for (const company of resume.companies) {
    for (const role of company.roles) {
      const roleTools = normalizeTagValues([...(role.tools || []), ...(resume.globalTools || [])]);

      const allHighlights = role.highlights || [];
      const allOutcomes = role.outcomes || [];

      const highlightClaims = allHighlights.map((highlight, index) => {
        const status = highlight.status || DEFAULT_STATUS;
        return {
          id: `${role.roleId}-highlight-${index + 1}`,
          company: company.companyName,
          role: role.title,
          startDate: role.startDate,
          endDate: role.endDate,
          claimText: highlight.text.trim(),
          rawSnippet: highlight.rawEvidenceRefs?.[0] || highlight.text.trim(),
          reviewStatus: status,
          autoUse: status === 'active',
          responsibilities: [highlight.text.trim()].filter(Boolean),
          tools: roleTools,
          outcomes: [],
          createdAt: now,
        } satisfies Claim;
      });

      const outcomeClaims = allOutcomes.map((outcome, index) => {
        const status = outcome.status || DEFAULT_STATUS;
        const text = outcomeToClaimText(outcome);
        return {
          id: `${role.roleId}-outcome-${index + 1}`,
          company: company.companyName,
          role: role.title,
          startDate: role.startDate,
          endDate: role.endDate,
          claimText: text,
          rawSnippet: outcome.rawEvidenceRefs?.[0] || text,
          reviewStatus: status,
          autoUse: status === 'active',
          metric: {
            value: outcome.metricValue,
            unit: outcome.metricUnit,
            context: outcome.metricContext,
          },
          responsibilities: [],
          tools: roleTools,
          outcomes: [{
            description: text,
            metric: `${outcome.metricValue || ''}${outcome.metricUnit || ''}`.trim() || undefined,
            isNumeric: Boolean(outcome.metricValue),
            verified: false,
          }],
          createdAt: now,
        } satisfies Claim;
      });

      claims.push(...highlightClaims, ...outcomeClaims);
    }
  }

  return claims;
}

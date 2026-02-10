import type { Claim, ClaimVerificationStatus } from '../types';

export type ClaimValidationCode =
  | 'missing-experience-anchor'
  | 'missing-experience-link'
  | 'invalid-experience-link'
  | 'missing-experience-identity'
  | 'missing-claim-text'
  | 'missing-approved-outcome-metric';

export class ClaimValidationError extends Error {
  code: ClaimValidationCode;

  constructor(code: ClaimValidationCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ClaimValidationError';
  }
}

export function isExperienceAnchor(claim: Partial<Claim>): boolean {
  return claim.type === 'Experience' || Boolean(claim.role && claim.company);
}

interface ValidateClaimContextParams {
  type: Claim['type'];
  claims: Claim[];
  text?: string;
  role?: string;
  company?: string;
  metric?: string;
  verificationStatus?: ClaimVerificationStatus;
  experienceId?: string;
  currentClaimId?: string;
}

export function validateClaimContext({
  type,
  claims,
  text,
  role,
  company,
  metric,
  verificationStatus,
  experienceId,
  currentClaimId,
}: ValidateClaimContextParams): void {
  const normalizedRole = (role || '').trim();
  const normalizedCompany = (company || '').trim();
  const normalizedText = (text || '').trim();

  if (type === 'Experience') {
    if (!normalizedRole || !normalizedCompany) {
      throw new ClaimValidationError(
        'missing-experience-identity',
        'Experience claims must include both role and company.'
      );
    }
    return;
  }

  if (!normalizedText) {
    throw new ClaimValidationError(
      'missing-claim-text',
      'Claim text is required for Skills, Tools, and Outcomes.'
    );
  }

  const anchors = claims.filter(
    (claim) => isExperienceAnchor(claim) && claim.id !== currentClaimId
  );

  if (anchors.length === 0) {
    throw new ClaimValidationError(
      'missing-experience-anchor',
      'Add at least one Experience claim before adding Skills, Tools, or Outcomes.'
    );
  }

  if (!experienceId) {
    throw new ClaimValidationError(
      'missing-experience-link',
      'Link this claim to an Experience entry so evidence stays coherent.'
    );
  }

  if (!anchors.some((anchor) => anchor.id === experienceId)) {
    throw new ClaimValidationError(
      'invalid-experience-link',
      'The selected Experience link no longer exists. Select a valid Experience entry.'
    );
  }

  if (type === 'Outcome' && verificationStatus === 'Approved' && !(metric || '').trim()) {
    throw new ClaimValidationError(
      'missing-approved-outcome-metric',
      'Approved outcome claims must include a metric for traceability.'
    );
  }
}

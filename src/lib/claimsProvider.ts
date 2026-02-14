import type { Claim } from '../types';

export type ClaimsRuntimeStatus = 'active' | 'conflict' | 'needs_review';

type StatusAwareClaim = Claim & {
  status?: ClaimsRuntimeStatus;
};

export interface ClaimsAvailability {
  totalClaims: number;
  autoUsableClaims: number;
  conflictClaims: number;
  needsReviewClaims: number;
  warnings: string[];
}

export interface ClaimsProvider {
  getClaims(): Promise<Claim[]>;
  getAutoUsableClaims(): Promise<Claim[]>;
  getAvailability(): Promise<ClaimsAvailability>;
}

export class LocalClaimsProvider implements ClaimsProvider {
  private readonly reader: () => Claim[] | Promise<Claim[]>;

  constructor(reader: () => Claim[] | Promise<Claim[]>) {
    this.reader = reader;
  }

  async getClaims(): Promise<Claim[]> {
    const claims = await this.reader();
    return [...claims];
  }

  async getAutoUsableClaims(): Promise<Claim[]> {
    return filterAutoUsableClaims(await this.getClaims());
  }

  async getAvailability(): Promise<ClaimsAvailability> {
    return summarizeClaimsAvailability(await this.getClaims());
  }
}

export class FutureRemoteClaimsProvider implements ClaimsProvider {
  async getClaims(): Promise<Claim[]> {
    return [];
  }

  async getAutoUsableClaims(): Promise<Claim[]> {
    return [];
  }

  async getAvailability(): Promise<ClaimsAvailability> {
    return {
      totalClaims: 0,
      autoUsableClaims: 0,
      conflictClaims: 0,
      needsReviewClaims: 0,
      warnings: ['Remote claims provider is not configured yet.'],
    };
  }
}

export function getClaimStatus(claim: Claim): ClaimsRuntimeStatus {
  const status = (claim as StatusAwareClaim).status;
  if (status === 'conflict') return 'conflict';
  if (status === 'needs_review') return 'needs_review';
  return 'active';
}

export function filterAutoUsableClaims(claims: Claim[]): Claim[] {
  return claims.filter((claim) => getClaimStatus(claim) === 'active');
}

export function summarizeClaimsAvailability(claims: Claim[]): ClaimsAvailability {
  const totalClaims = claims.length;
  const conflictClaims = claims.filter((claim) => getClaimStatus(claim) === 'conflict').length;
  const needsReviewClaims = claims.filter((claim) => getClaimStatus(claim) === 'needs_review').length;
  const autoUsableClaims = filterAutoUsableClaims(claims).length;
  const warnings: string[] = [];

  if (totalClaims === 0) {
    warnings.push('Claims missing. Generated assets use generic fallback language.');
  } else if (autoUsableClaims === 0) {
    warnings.push('All claims are unresolved. Resolve conflicts in Settings before auto-use.');
  }

  if (conflictClaims > 0) {
    warnings.push(`${conflictClaims} conflicting claim${conflictClaims === 1 ? '' : 's'} excluded from auto-use.`);
  }

  if (needsReviewClaims > 0) {
    warnings.push(`${needsReviewClaims} claim${needsReviewClaims === 1 ? '' : 's'} need review before reliable auto-use.`);
  }

  return {
    totalClaims,
    autoUsableClaims,
    conflictClaims,
    needsReviewClaims,
    warnings,
  };
}

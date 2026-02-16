import type { Claim } from '../types';

export function isClaimAutoUsable(claim: Claim): boolean {
  if (claim.autoUse === true) return true;
  if (claim.autoUse === false) return false;

  if (!claim.reviewStatus) return true;
  return claim.reviewStatus === 'active';
}

export function getAutoUsableClaims(claims: Claim[]): Claim[] {
  return claims.filter(isClaimAutoUsable);
}

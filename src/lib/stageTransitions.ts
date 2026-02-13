import type { PipelineStage } from '../types';

/**
 * Closed Won is terminal for positive outcomes and must not be downgraded to Closed Lost.
 * This protects funnel outcome integrity when downstream logic requests a stage change.
 */
export function isClosedWonDemotionBlocked(
  currentStage: PipelineStage,
  requestedStage: PipelineStage
): boolean {
  return currentStage === 'Closed Won' && requestedStage === 'Closed Lost';
}

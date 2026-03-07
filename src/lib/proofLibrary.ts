import type {
  AssetType,
  Claim,
  ClaimOutcome,
  ImportDraftItem,
  ImportDraftRole,
  ImportItemStatus,
  ImportSession,
  ProofStatus,
  SourceRef,
} from '../types';

type StatusLike = ImportItemStatus | ProofStatus | undefined;

const STATUS_MAP: Record<string, ProofStatus> = {
  active: 'active',
  needs_review: 'needs_review',
  conflict: 'conflict',
  rejected: 'rejected',
  accepted: 'active',
  needs_attention: 'needs_review',
};

const PROOF_REFERENCE_COUNT_BY_ASSET: Record<AssetType, number> = {
  'Outreach Email': 2,
  'LinkedIn Connect': 1,
  'Cover Letter': 3,
  'Follow-up Email': 0,
  'Growth Memo': 4,
  'Interview Prep': 0,
  'Negotiation Script': 0,
  'Application Answer': 3,
};

export interface BuildProofPayloadOptions {
  companyId?: string;
  sourceMeta?: ImportSession['sourceMeta'];
  importSessionId?: string;
  parseMode?: ImportSession['mode'];
  normalizedLineLookup?: Record<number, string>;
  rawLineLookup?: Record<number, string>;
}

export type ProofPayload = Omit<Claim, 'id' | 'createdAt'>;

function toUniqueLineIndexes(refs: SourceRef[]): number[] {
  return [...new Set(refs.map((ref) => ref.lineIndex).filter((lineIndex) => Number.isInteger(lineIndex) && lineIndex >= 0))]
    .sort((left, right) => left - right);
}

function toOutcomePayload(item: ImportDraftItem): ClaimOutcome | null {
  const description = item.text.trim();
  if (!description) return null;

  return {
    description,
    metric: item.metric?.trim() || undefined,
    isNumeric: Boolean(item.metric?.trim()) || /\d/.test(description),
    verified: false,
  };
}

function includeTextItem(item: ImportDraftItem): boolean {
  return normalizeProofStatus(item.status) !== 'rejected' && item.text.trim().length > 0;
}

function collectRoleSourceRefs(role: ImportDraftRole): SourceRef[] {
  return [
    ...role.sourceRefs,
    ...role.highlights.flatMap((item) => item.sourceRefs),
    ...role.outcomes.flatMap((item) => item.sourceRefs),
    ...role.tools.flatMap((item) => item.sourceRefs),
    ...role.skills.flatMap((item) => item.sourceRefs),
  ];
}

export function normalizeProofStatus(status: StatusLike): ProofStatus {
  if (!status) return 'active';
  return STATUS_MAP[status] ?? 'active';
}

export function isProofUnresolved(status: StatusLike): boolean {
  const normalized = normalizeProofStatus(status);
  return normalized === 'needs_review' || normalized === 'conflict';
}

export function defaultAutoUseForStatus(status: StatusLike): boolean {
  return normalizeProofStatus(status) === 'active';
}

export function isProofAutoUseEnabled(claim: Claim): boolean {
  if (typeof claim.autoUse === 'boolean') return claim.autoUse;
  return defaultAutoUseForStatus(claim.status);
}

export function deriveRoleProofStatus(role: ImportDraftRole): ProofStatus {
  const statuses = [
    role.status,
    ...role.highlights.map((item) => item.status),
    ...role.outcomes.map((item) => item.status),
    ...role.tools.map((item) => item.status),
    ...role.skills.map((item) => item.status),
  ].map(normalizeProofStatus);

  if (statuses.includes('conflict')) return 'conflict';
  if (statuses.includes('needs_review')) return 'needs_review';
  if (statuses.includes('active')) return 'active';
  return 'rejected';
}

export function buildProofPayloadFromRole(
  role: ImportDraftRole,
  companyName: string,
  options: BuildProofPayloadOptions = {},
): ProofPayload | null {
  const status = deriveRoleProofStatus(role);

  const responsibilities = role.highlights
    .filter(includeTextItem)
    .map((item) => item.text.trim());
  const outcomes = role.outcomes
    .filter(includeTextItem)
    .map(toOutcomePayload)
    .filter((item): item is ClaimOutcome => item !== null);
  const tools = role.tools
    .filter(includeTextItem)
    .map((item) => item.text.trim());

  const hasAnyEvidence = responsibilities.length > 0 || outcomes.length > 0 || tools.length > 0;
  if (!hasAnyEvidence && status !== 'rejected') {
    return null;
  }

  const sourceLineIndexes = toUniqueLineIndexes(collectRoleSourceRefs(role));
  const sourceSnippets = sourceLineIndexes
    .map((lineIndex) => options.normalizedLineLookup?.[lineIndex] ?? options.rawLineLookup?.[lineIndex])
    .filter((snippet): snippet is string => Boolean(snippet))
    .slice(0, 10);
  const lineageItemIds = [
    ...role.highlights.map((item) => item.id),
    ...role.outcomes.map((item) => item.id),
    ...role.tools.map((item) => item.id),
    ...role.skills.map((item) => item.id),
  ];

  return {
    company: companyName,
    role: role.title,
    startDate: role.startDate,
    endDate: role.currentRole || !role.endDate?.trim() ? undefined : role.endDate,
    responsibilities,
    tools,
    outcomes,
    status,
    autoUse: defaultAutoUseForStatus(status),
    sourceMeta: {
      inputKind: options.sourceMeta?.inputKind ?? 'manual',
      fileName: options.sourceMeta?.fileName,
      fileSizeBytes: options.sourceMeta?.fileSizeBytes,
      mimeType: options.sourceMeta?.mimeType,
      importSessionId: options.importSessionId,
      parseMode: options.parseMode,
      sourceLineIndexes,
      sourceSnippets,
    },
    lineage: {
      companyId: options.companyId,
      roleId: role.id,
      itemIds: lineageItemIds,
      sourceLineIndexes,
    },
    assetRefs: [],
  };
}

export function getAutoUsableProofs(claims: Claim[]): Claim[] {
  return claims.filter((claim) => {
    if (normalizeProofStatus(claim.status) !== 'active') return false;
    return isProofAutoUseEnabled(claim);
  });
}

export function getUnresolvedProofs(claims: Claim[]): Claim[] {
  return claims.filter((claim) => isProofUnresolved(claim.status));
}

export function getProofIdsForAsset(type: AssetType, claims: Claim[]): string[] {
  const maxProofs = PROOF_REFERENCE_COUNT_BY_ASSET[type] ?? 0;
  if (maxProofs <= 0) return [];
  return getAutoUsableProofs(claims).slice(0, maxProofs).map((claim) => claim.id);
}

export function getUnresolvedProofIds(claims: Claim[]): string[] {
  return getUnresolvedProofs(claims).map((claim) => claim.id);
}

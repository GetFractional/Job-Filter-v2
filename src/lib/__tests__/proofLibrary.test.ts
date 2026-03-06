import { describe, expect, it } from 'vitest';
import type { Claim, ImportDraftRole } from '../../types';
import {
  buildProofPayloadFromRole,
  getAutoUsableProofs,
  getProofIdsForAsset,
  getUnresolvedProofIds,
  normalizeProofStatus,
} from '../proofLibrary';

function makeRole(overrides: Partial<ImportDraftRole> = {}): ImportDraftRole {
  return {
    id: overrides.id ?? 'role-1',
    title: overrides.title ?? 'Growth Lead',
    startDate: overrides.startDate ?? 'Jan 2021',
    endDate: overrides.endDate ?? 'Present',
    confidence: overrides.confidence ?? 0.85,
    status: overrides.status ?? 'active',
    sourceRefs: overrides.sourceRefs ?? [{ lineIndex: 1 }],
    highlights: overrides.highlights ?? [{
      id: 'highlight-1',
      type: 'highlight',
      text: 'Built lifecycle experimentation program',
      confidence: 0.8,
      status: 'needs_review',
      sourceRefs: [{ lineIndex: 2 }],
    }],
    outcomes: overrides.outcomes ?? [{
      id: 'outcome-1',
      type: 'outcome',
      text: 'Increased pipeline by 34%',
      metric: '34%',
      confidence: 0.82,
      status: 'active',
      sourceRefs: [{ lineIndex: 3 }],
    }],
    tools: overrides.tools ?? [],
    skills: overrides.skills ?? [],
  };
}

describe('proofLibrary', () => {
  it('normalizes legacy statuses to proof statuses', () => {
    expect(normalizeProofStatus('accepted')).toBe('active');
    expect(normalizeProofStatus('needs_attention')).toBe('needs_review');
    expect(normalizeProofStatus('conflict')).toBe('conflict');
  });

  it('builds proof payloads with unresolved status and auto-use disabled by default', () => {
    const payload = buildProofPayloadFromRole(makeRole(), 'Acme Corp', {
      companyId: 'company-1',
      importSessionId: 'session-1',
      parseMode: 'bullets',
      sourceMeta: {
        inputKind: 'upload',
        fileName: 'resume.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
      },
      normalizedLineLookup: {
        2: 'Built lifecycle experimentation program',
      },
      rawLineLookup: {
        2: 'Built lifecycle experimentation program',
      },
    });

    expect(payload).not.toBeNull();
    expect(payload?.status).toBe('needs_review');
    expect(payload?.autoUse).toBe(false);
    expect(payload?.sourceMeta?.importSessionId).toBe('session-1');
    expect(payload?.lineage?.companyId).toBe('company-1');
    expect(payload?.lineage?.itemIds.length).toBeGreaterThan(0);
  });

  it('selects proof IDs for assets from active auto-use proof only', () => {
    const claims: Claim[] = [
      {
        id: 'proof-active-1',
        company: 'Acme',
        role: 'Growth Lead',
        startDate: '2021',
        responsibilities: ['Built pipeline'],
        tools: [],
        outcomes: [],
        status: 'active',
        autoUse: true,
        createdAt: '2026-03-06T00:00:00.000Z',
      },
      {
        id: 'proof-needs-review',
        company: 'Beta',
        role: 'Marketing Lead',
        startDate: '2020',
        responsibilities: ['Needs review'],
        tools: [],
        outcomes: [],
        status: 'needs_review',
        autoUse: false,
        createdAt: '2026-03-06T00:00:00.000Z',
      },
      {
        id: 'proof-conflict',
        company: 'Gamma',
        role: 'VP Growth',
        startDate: '2019',
        responsibilities: ['Conflicting evidence'],
        tools: [],
        outcomes: [],
        status: 'conflict',
        autoUse: true,
        createdAt: '2026-03-06T00:00:00.000Z',
      },
    ];

    expect(getAutoUsableProofs(claims).map((claim) => claim.id)).toEqual(['proof-active-1']);
    expect(getProofIdsForAsset('Outreach Email', claims)).toEqual(['proof-active-1']);
    expect(getUnresolvedProofIds(claims)).toEqual(['proof-needs-review', 'proof-conflict']);
  });
});

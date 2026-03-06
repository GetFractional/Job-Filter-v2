import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Asset, Claim } from '../../types';

const claimsData = new Map<string, Claim>();
const assetsData = new Map<string, Asset>();
let idCounter = 0;

const dbMock = {
  claims: {
    add: vi.fn(async (claim: Claim) => {
      claimsData.set(claim.id, structuredClone(claim));
      return claim.id;
    }),
    get: vi.fn(async (id: string) => {
      const claim = claimsData.get(id);
      return claim ? structuredClone(claim) : undefined;
    }),
    update: vi.fn(async (id: string, updates: Partial<Claim>) => {
      const current = claimsData.get(id);
      if (!current) return 0;
      claimsData.set(id, { ...current, ...updates });
      return 1;
    }),
  },
  assets: {
    where: vi.fn(() => ({
      equals: (jobId: string) => ({
        filter: (predicate: (asset: Asset) => boolean) => ({
          count: async () =>
            [...assetsData.values()].filter((asset) => asset.jobId === jobId && predicate(asset)).length,
        }),
      }),
    })),
    add: vi.fn(async (asset: Asset) => {
      assetsData.set(asset.id, structuredClone(asset));
      return asset.id;
    }),
    get: vi.fn(async (id: string) => {
      const asset = assetsData.get(id);
      return asset ? structuredClone(asset) : undefined;
    }),
    update: vi.fn(async (id: string, updates: Partial<Asset>) => {
      const current = assetsData.get(id);
      if (!current) return 0;
      assetsData.set(id, { ...current, ...updates });
      return 1;
    }),
  },
};

vi.mock('../../db', () => ({
  db: dbMock,
  generateId: () => {
    idCounter += 1;
    return `id-${idCounter}`;
  },
  seedDefaultProfile: vi.fn(async () => {}),
}));

describe('useStore proof lineage sync', () => {
  beforeEach(async () => {
    claimsData.clear();
    assetsData.clear();
    idCounter = 0;
    vi.resetModules();
  });

  it('removes stale proof back-links when an asset switches proof references on regenerate', async () => {
    const { useStore } = await import('../useStore');

    useStore.setState({ refreshData: async () => {} });
    const store = useStore.getState();

    const proofA = await store.addClaim({
      company: 'Acme',
      role: 'Growth Lead',
      startDate: 'Jan 2021',
      responsibilities: ['Built lifecycle strategy'],
      outcomes: [],
      tools: [],
      status: 'active',
      autoUse: true,
    });

    const proofB = await store.addClaim({
      company: 'Beta',
      role: 'VP Growth',
      startDate: 'Jan 2022',
      responsibilities: ['Scaled revenue engine'],
      outcomes: [],
      tools: [],
      status: 'active',
      autoUse: true,
    });

    const asset = await store.addAsset({
      jobId: 'job-test',
      type: 'Outreach Email',
      content: 'Generated with proof A',
      proofIdsUsed: [proofA.id],
      unresolvedProofIds: [],
    });
    await store.linkAssetToProofs(asset.id, [proofA.id], []);

    await store.updateAsset(asset.id, {
      content: 'Regenerated with proof B',
      proofIdsUsed: [proofB.id],
      unresolvedProofIds: [],
    });
    await store.linkAssetToProofs(asset.id, [proofB.id], [proofA.id]);

    const persistedAsset = assetsData.get(asset.id);
    const persistedProofA = claimsData.get(proofA.id);
    const persistedProofB = claimsData.get(proofB.id);

    expect(persistedAsset?.proofIdsUsed).toEqual([proofB.id]);
    expect(persistedProofA?.assetRefs ?? []).not.toContain(asset.id);
    expect(persistedProofB?.assetRefs ?? []).toContain(asset.id);
  });
});

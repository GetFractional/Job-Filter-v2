import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STORAGE_KEY,
  clearJobFilterLocalState,
  createEmptyProfile,
} from '../profileState';

function createStorageMock(seed: Record<string, string>) {
  const store = new Map(Object.entries(seed));
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    has(key: string) {
      return store.has(key);
    },
  };
}

describe('profileState', () => {
  it('creates an empty profile baseline', () => {
    const profile = createEmptyProfile('2026-02-16T00:00:00.000Z');

    expect(profile.id).toBe('default');
    expect(profile.name).toBe('');
    expect(profile.targetRoles).toEqual([]);
    expect(profile.compFloor).toBe(0);
    expect(profile.compTarget).toBe(0);
    expect(profile.locationPreference).toBe('');
    expect(profile.requiredBenefits).toEqual([]);
    expect(profile.preferredBenefits).toEqual([]);
    expect(profile.disqualifiers).toEqual([]);
    expect(profile.updatedAt).toBe('2026-02-16T00:00:00.000Z');
  });

  it('clears app-owned local storage keys', () => {
    const storage = createStorageMock({
      [ONBOARDING_STORAGE_KEY]: 'true',
      'jf2-feature-flag': 'on',
      unrelated: 'keep',
    });

    const removedKeys = clearJobFilterLocalState(storage);

    expect(removedKeys.sort()).toEqual([ONBOARDING_STORAGE_KEY, 'jf2-feature-flag'].sort());
    expect(storage.has(ONBOARDING_STORAGE_KEY)).toBe(false);
    expect(storage.has('jf2-feature-flag')).toBe(false);
    expect(storage.has('unrelated')).toBe(true);
  });
});

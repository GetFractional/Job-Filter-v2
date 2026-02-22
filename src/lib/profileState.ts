import type { Profile } from '../types';
import { DEFAULT_HARD_FILTERS } from './profilePreferences';

export const DEFAULT_PROFILE_ID = 'default';
export const ONBOARDING_STORAGE_KEY = 'jf2-onboarding-complete';
const LOCAL_STORAGE_PREFIX = 'jf2-';

export function createEmptyProfile(timestamp = new Date().toISOString()): Profile {
  return {
    id: DEFAULT_PROFILE_ID,
    name: '',
    firstName: '',
    lastName: '',
    targetRoles: [],
    compFloor: 0,
    compTarget: 0,
    requiredBenefits: [],
    preferredBenefits: [],
    requiredBenefitIds: [],
    preferredBenefitIds: [],
    locationPreference: '',
    disqualifiers: [],
    locationPreferences: [],
    willingToRelocate: false,
    hardFilters: { ...DEFAULT_HARD_FILTERS },
    updatedAt: timestamp,
  };
}

export function clearJobFilterLocalState(
  storage: Pick<Storage, 'length' | 'key' | 'removeItem'>,
): string[] {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
  return keysToRemove;
}

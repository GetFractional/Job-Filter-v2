import type { HardFilters, LocationPreference, LocationPreferenceType } from '../types';

export const DEFAULT_HARD_FILTERS: HardFilters = {
  requiresVisaSponsorship: false,
  minBaseSalary: 0,
  maxOnsiteDaysPerWeek: 5,
  maxTravelPercent: 100,
  employmentType: 'exclude_contract',
};

export function createLocationPreference(type: LocationPreferenceType = 'Remote'): LocationPreference {
  return {
    id: crypto.randomUUID(),
    type,
    city: '',
    radiusMiles: type === 'Remote' ? undefined : 25,
    willingToRelocate: false,
  };
}

export function sanitizeHardFilters(input: Partial<HardFilters> | undefined): HardFilters {
  const source = input ?? {};

  return {
    requiresVisaSponsorship: Boolean(source.requiresVisaSponsorship),
    minBaseSalary: clampNumber(source.minBaseSalary, 0, 2_000_000),
    maxOnsiteDaysPerWeek: clampNumber(source.maxOnsiteDaysPerWeek, 0, 5),
    maxTravelPercent: clampNumber(source.maxTravelPercent, 0, 100),
    employmentType: source.employmentType === 'ft_only' ? 'ft_only' : 'exclude_contract',
  };
}

export function sanitizeLocationPreferences(preferences: LocationPreference[] | undefined): LocationPreference[] {
  return (preferences ?? []).map((preference) => {
    const city = (preference.city ?? '').trim();
    const radius = preference.radiusMiles;

    return {
      id: preference.id || crypto.randomUUID(),
      type: preference.type,
      city,
      radiusMiles: preference.type === 'Remote'
        ? undefined
        : (radius === undefined || Number.isNaN(radius) ? undefined : clampNumber(radius, 1, 500)),
      willingToRelocate: Boolean(preference.willingToRelocate),
    };
  });
}

export function summarizeLocationPreferences(preferences: LocationPreference[]): string {
  if (preferences.length === 0) return '';

  return preferences.map((preference) => {
    if (preference.type === 'Remote') return 'Remote';

    const city = preference.city?.trim();
    const radius = preference.radiusMiles ? `${preference.radiusMiles} mi` : '';

    if (city && radius) return `${preference.type} in ${city} (${radius})`;
    if (city) return `${preference.type} in ${city}`;
    if (radius) return `${preference.type} (${radius})`;
    return preference.type;
  }).join('; ');
}

export function locationPreferenceFromHint(hint: string): LocationPreference {
  const normalized = hint.toLowerCase();
  let type: LocationPreferenceType = 'Remote';

  if (normalized.includes('hybrid')) type = 'Hybrid';
  if (normalized.includes('onsite') || normalized.includes('on-site') || normalized.includes('in-person')) type = 'Onsite';

  return {
    ...createLocationPreference(type),
    city: type === 'Remote' ? '' : hint,
  };
}

function clampNumber(value: number | undefined, min: number, max: number): number {
  if (value === undefined || Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

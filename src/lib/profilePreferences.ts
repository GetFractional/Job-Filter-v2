import type {
  HardFilterEmploymentType,
  HardFilters,
  LocationPreference,
  LocationPreferenceType,
} from '../types';

export const EMPLOYMENT_TYPE_OPTIONS: Array<{ id: HardFilterEmploymentType; label: string }> = [
  { id: 'full_time_w2', label: 'Full-time (W2)' },
  { id: 'contract', label: 'Contract' },
  { id: 'contract_to_hire', label: 'Contract-to-hire' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'internship', label: 'Internship' },
  { id: 'temporary', label: 'Temporary' },
];

export const STANDARD_RADIUS_MILES = [10, 25, 50, 100] as const;

const EMPLOYMENT_TYPE_SET = new Set(EMPLOYMENT_TYPE_OPTIONS.map((option) => option.id));

const LEGACY_EXCLUDE_CONTRACT_DEFAULT: HardFilterEmploymentType[] = [
  'full_time_w2',
  'contract_to_hire',
  'part_time',
  'internship',
  'temporary',
];

const EMPLOYMENT_TYPE_DEFAULT: HardFilterEmploymentType[] = EMPLOYMENT_TYPE_OPTIONS.map((option) => option.id);

export const DEFAULT_HARD_FILTERS: HardFilters = {
  requiresVisaSponsorship: false,
  minBaseSalary: 0,
  maxOnsiteDaysPerWeek: 5,
  maxTravelPercent: 100,
  employmentTypes: [...EMPLOYMENT_TYPE_DEFAULT],
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
  const source = (input ?? {}) as Partial<HardFilters> & { employmentType?: 'ft_only' | 'exclude_contract' };
  const legacyEmploymentType = source.employmentType;
  let normalizedEmploymentTypes: HardFilterEmploymentType[];

  if (Array.isArray(source.employmentTypes)) {
    normalizedEmploymentTypes = source.employmentTypes.filter(
      (type): type is HardFilterEmploymentType => EMPLOYMENT_TYPE_SET.has(type as HardFilterEmploymentType),
    );
  } else if (legacyEmploymentType === 'ft_only') {
    normalizedEmploymentTypes = ['full_time_w2'];
  } else if (legacyEmploymentType === 'exclude_contract') {
    normalizedEmploymentTypes = [...LEGACY_EXCLUDE_CONTRACT_DEFAULT];
  } else {
    normalizedEmploymentTypes = [...EMPLOYMENT_TYPE_DEFAULT];
  }

  return {
    requiresVisaSponsorship: Boolean(source.requiresVisaSponsorship),
    minBaseSalary: clampNumber(source.minBaseSalary, 0, 2_000_000),
    maxOnsiteDaysPerWeek: clampNumber(source.maxOnsiteDaysPerWeek, 0, 5),
    maxTravelPercent: clampNumber(source.maxTravelPercent, 0, 100),
    employmentTypes: normalizedEmploymentTypes.length > 0
      ? Array.from(new Set<HardFilterEmploymentType>(normalizedEmploymentTypes))
      : [...EMPLOYMENT_TYPE_DEFAULT],
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
      willingToRelocate: false,
    };
  });
}

export function applyGlobalRelocationPreference(
  preferences: LocationPreference[] | undefined,
  willingToRelocate: boolean,
): LocationPreference[] {
  return (preferences ?? []).map((preference) => ({
    ...preference,
    willingToRelocate,
  }));
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

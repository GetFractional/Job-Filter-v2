const RECENT_CITY_STORAGE_KEY = 'jf2-recent-cities-v1';
const RECENT_CITY_LIMIT = 12;

export interface CityOption {
  id: string;
  label: string;
  state: string;
  country: string;
}

const TOP_US_CITIES: CityOption[] = [
  { id: 'new-york-ny-us', label: 'New York', state: 'NY', country: 'US' },
  { id: 'los-angeles-ca-us', label: 'Los Angeles', state: 'CA', country: 'US' },
  { id: 'chicago-il-us', label: 'Chicago', state: 'IL', country: 'US' },
  { id: 'houston-tx-us', label: 'Houston', state: 'TX', country: 'US' },
  { id: 'phoenix-az-us', label: 'Phoenix', state: 'AZ', country: 'US' },
  { id: 'philadelphia-pa-us', label: 'Philadelphia', state: 'PA', country: 'US' },
  { id: 'san-antonio-tx-us', label: 'San Antonio', state: 'TX', country: 'US' },
  { id: 'san-diego-ca-us', label: 'San Diego', state: 'CA', country: 'US' },
  { id: 'dallas-tx-us', label: 'Dallas', state: 'TX', country: 'US' },
  { id: 'san-jose-ca-us', label: 'San Jose', state: 'CA', country: 'US' },
  { id: 'austin-tx-us', label: 'Austin', state: 'TX', country: 'US' },
  { id: 'jacksonville-fl-us', label: 'Jacksonville', state: 'FL', country: 'US' },
  { id: 'fort-worth-tx-us', label: 'Fort Worth', state: 'TX', country: 'US' },
  { id: 'columbus-oh-us', label: 'Columbus', state: 'OH', country: 'US' },
  { id: 'charlotte-nc-us', label: 'Charlotte', state: 'NC', country: 'US' },
  { id: 'indianapolis-in-us', label: 'Indianapolis', state: 'IN', country: 'US' },
  { id: 'seattle-wa-us', label: 'Seattle', state: 'WA', country: 'US' },
  { id: 'denver-co-us', label: 'Denver', state: 'CO', country: 'US' },
  { id: 'washington-dc-us', label: 'Washington', state: 'DC', country: 'US' },
  { id: 'boston-ma-us', label: 'Boston', state: 'MA', country: 'US' },
  { id: 'nashville-tn-us', label: 'Nashville', state: 'TN', country: 'US' },
  { id: 'atlanta-ga-us', label: 'Atlanta', state: 'GA', country: 'US' },
  { id: 'miami-fl-us', label: 'Miami', state: 'FL', country: 'US' },
  { id: 'portland-or-us', label: 'Portland', state: 'OR', country: 'US' },
  { id: 'minneapolis-mn-us', label: 'Minneapolis', state: 'MN', country: 'US' },
  { id: 'detroit-mi-us', label: 'Detroit', state: 'MI', country: 'US' },
  { id: 'orlando-fl-us', label: 'Orlando', state: 'FL', country: 'US' },
  { id: 'raleigh-nc-us', label: 'Raleigh', state: 'NC', country: 'US' },
  { id: 'tampa-fl-us', label: 'Tampa', state: 'FL', country: 'US' },
  { id: 'salt-lake-city-ut-us', label: 'Salt Lake City', state: 'UT', country: 'US' },
  { id: 'chattanooga-tn-us', label: 'Chattanooga', state: 'TN', country: 'US' },
  { id: 'sacramento-ca-us', label: 'Sacramento', state: 'CA', country: 'US' },
];

function normalizeCity(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function formatCityLabel(option: CityOption): string {
  return `${option.label}, ${option.state}`;
}

export function loadRecentCities(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_CITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => normalizeCity(String(value)))
      .filter(Boolean)
      .slice(0, RECENT_CITY_LIMIT);
  } catch {
    return [];
  }
}

export function saveRecentCity(city: string): string[] {
  const normalized = normalizeCity(city);
  if (!normalized) return loadRecentCities();

  const next = [normalized, ...loadRecentCities().filter((entry) => entry.toLowerCase() !== normalized.toLowerCase())]
    .slice(0, RECENT_CITY_LIMIT);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(RECENT_CITY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore localStorage quota errors and continue.
    }
  }

  return next;
}

export function getCityTypeaheadOptions(query: string, recentCities: string[]): string[] {
  const normalizedQuery = normalizeCity(query).toLowerCase();

  const base = new Set<string>();
  for (const city of recentCities) {
    if (city) base.add(city);
  }
  for (const option of TOP_US_CITIES) {
    base.add(formatCityLabel(option));
  }

  const all = [...base];
  if (!normalizedQuery) {
    return all.slice(0, 20);
  }

  const startsWith = all.filter((city) => city.toLowerCase().startsWith(normalizedQuery));
  const includes = all.filter((city) => !city.toLowerCase().startsWith(normalizedQuery) && city.toLowerCase().includes(normalizedQuery));

  return [...startsWith, ...includes].slice(0, 20);
}

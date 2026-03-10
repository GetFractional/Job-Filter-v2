export interface PhoneCountryOption {
  code: string;
  iso2: string;
  name: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
}

export const DEFAULT_PHONE_COUNTRY_CODE = '+1';

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: '+1', iso2: 'US', name: 'United States / Canada', flag: '🇺🇸', minDigits: 10, maxDigits: 10 },
  { code: '+44', iso2: 'GB', name: 'United Kingdom', flag: '🇬🇧', minDigits: 10, maxDigits: 11 },
  { code: '+61', iso2: 'AU', name: 'Australia', flag: '🇦🇺', minDigits: 9, maxDigits: 9 },
  { code: '+64', iso2: 'NZ', name: 'New Zealand', flag: '🇳🇿', minDigits: 8, maxDigits: 10 },
  { code: '+91', iso2: 'IN', name: 'India', flag: '🇮🇳', minDigits: 10, maxDigits: 10 },
  { code: '+49', iso2: 'DE', name: 'Germany', flag: '🇩🇪', minDigits: 10, maxDigits: 12 },
  { code: '+33', iso2: 'FR', name: 'France', flag: '🇫🇷', minDigits: 9, maxDigits: 9 },
];

const PHONE_OPTION_BY_CODE = new Map(PHONE_COUNTRY_OPTIONS.map((option) => [option.code, option]));
const PHONE_FROM_TEXT_RE = /(?:\+?\d[\d().\s-]{8,}\d|\(\d{3}\)\s*\d{3}[-.\s]?\d{4})/g;

function formatUSNationalPhone(digits: string): string {
  if (!digits) return '';
  const trimmed = digits.slice(0, 11);
  if (trimmed.length <= 3) return trimmed;
  if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
  if (trimmed.length <= 10) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6, 10)} ${trimmed.slice(10)}`;
}

export function getPhoneCountryOption(code: string): PhoneCountryOption {
  return PHONE_OPTION_BY_CODE.get(code) ?? PHONE_COUNTRY_OPTIONS[0];
}

export function searchPhoneCountryOptions(query: string): PhoneCountryOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PHONE_COUNTRY_OPTIONS;

  return PHONE_COUNTRY_OPTIONS.filter((option) => {
    return option.name.toLowerCase().includes(normalized)
      || option.iso2.toLowerCase().includes(normalized)
      || option.code.toLowerCase().includes(normalized);
  });
}

export function formatNationalPhoneInput(rawValue: string, countryCode: string): string {
  if (countryCode === '+1') {
    const digits = rawValue.replace(/\D/g, '');
    return formatUSNationalPhone(digits);
  }

  return rawValue.replace(/\s+/g, ' ').trimStart();
}

export function countPhoneDigits(rawValue: string): number {
  return rawValue.replace(/\D/g, '').length;
}

export function isPhoneNumberComplete(rawValue: string, countryCode: string): boolean {
  const digits = countPhoneDigits(rawValue);
  if (digits === 0) return true;

  const option = PHONE_OPTION_BY_CODE.get(countryCode);
  if (!option) {
    return digits >= 7;
  }

  return digits >= option.minDigits && digits <= option.maxDigits;
}

export function extractPhonePrefillFromText(text: string): { phoneCountryCode?: string; phoneNational?: string } {
  const matches = Array.from(text.matchAll(PHONE_FROM_TEXT_RE), (match) => match[0]?.trim() ?? '')
    .filter(Boolean)
    .map((value) => value.replace(/\s+/g, ' '))
    .filter((value) => !/@/.test(value))
    .filter((value) => value.replace(/\D/g, '').length >= 10);

  if (matches.length === 0) return {};

  const preferred = ['+1', '+44', '+61', '+64', '+91', '+49', '+33'];
  const selected = matches.find((value) => preferred.some((prefix) => value.startsWith(prefix))) ?? matches[0];
  const digits = selected.replace(/\D/g, '');
  if (!digits) return {};

  if (selected.startsWith('+1') || (digits.length === 10 && !selected.startsWith('+'))) {
    return {
      phoneCountryCode: '+1',
      phoneNational: formatNationalPhoneInput(digits.slice(-10), '+1'),
    };
  }

  for (const code of preferred.slice(1)) {
    if (selected.startsWith(code)) {
      return {
        phoneCountryCode: code,
        phoneNational: formatNationalPhoneInput(digits.slice(code.length - 1), code),
      };
    }
  }

  return {};
}

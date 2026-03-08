export interface PhoneCountryOption {
  code: string;
  label: string;
}

export const DEFAULT_PHONE_COUNTRY_CODE = '+1';

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+64', label: 'NZ (+64)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+33', label: 'FR (+33)' },
];

function formatUSNationalPhone(digits: string): string {
  if (!digits) return '';
  const trimmed = digits.slice(0, 11);
  if (trimmed.length <= 3) return trimmed;
  if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
  if (trimmed.length <= 10) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6, 10)} ${trimmed.slice(10)}`;
}

export function formatNationalPhoneInput(rawValue: string, countryCode: string): string {
  if (countryCode === '+1') {
    const digits = rawValue.replace(/\D/g, '');
    return formatUSNationalPhone(digits);
  }

  return rawValue.replace(/\s+/g, ' ').trimStart();
}

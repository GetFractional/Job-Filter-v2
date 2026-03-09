import { describe, expect, it } from 'vitest';
import {
  countPhoneDigits,
  extractPhonePrefillFromText,
  formatNationalPhoneInput,
  isPhoneNumberComplete,
} from '../profilePhone';

describe('profilePhone', () => {
  it('formats US phone input while typing', () => {
    expect(formatNationalPhoneInput('6155551212', '+1')).toBe('(615) 555-1212');
  });

  it('detects incomplete phone numbers per country constraints', () => {
    expect(isPhoneNumberComplete('415-55', '+1')).toBe(false);
    expect(isPhoneNumberComplete('(415) 555-1212', '+1')).toBe(true);
    expect(countPhoneDigits('(415) 555-1212')).toBe(10);
  });

  it('extracts and normalizes US phones from resume text', () => {
    const extracted = extractPhonePrefillFromText('Alex Morgan\n(615) 555-1212\nalex@example.com');
    expect(extracted.phoneCountryCode).toBe('+1');
    expect(extracted.phoneNational).toBe('(615) 555-1212');
  });

  it('extracts international phones with supported country codes', () => {
    const extracted = extractPhonePrefillFromText('Jordan Lee\n+44 20 7123 4567\njordan@example.com');
    expect(extracted.phoneCountryCode).toBe('+44');
    expect(extracted.phoneNational).toBe('2071234567');
  });
});

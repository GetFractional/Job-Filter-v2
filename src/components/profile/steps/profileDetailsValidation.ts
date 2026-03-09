import { isPhoneNumberComplete } from './profilePhone';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'yopmail.com',
  'mailinator.com',
  'guerrillamail.com',
  'sharklasers.com',
  'tempmail.com',
  '10minutemail.com',
  'trashmail.com',
]);

const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'hotnail.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
};

export interface ProfileIdentityDetailsShape {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNational: string;
}

export interface ProfileDetailsValidation {
  firstNameError: string;
  lastNameError: string;
  emailError: string;
  phoneError: string;
}

function normalizedEmailDomain(value: string): string {
  const atIndex = value.lastIndexOf('@');
  if (atIndex < 0) return '';
  return value.slice(atIndex + 1).trim().toLowerCase();
}

export function isValidEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isDisposableEmailDomain(value: string): boolean {
  const domain = normalizedEmailDomain(value);
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function getEmailTypoSuggestion(value: string): string | null {
  const trimmed = value.trim();
  if (!isValidEmailAddress(trimmed)) return null;
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex < 0) return null;
  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  const suggestedDomain = EMAIL_DOMAIN_TYPOS[domain];
  if (!suggestedDomain || suggestedDomain === domain) return null;
  return `${localPart}@${suggestedDomain}`;
}

export function validateProfileDetails(value: ProfileIdentityDetailsShape): ProfileDetailsValidation {
  const firstNameError = !value.firstName.trim() ? 'First name is required.' : '';
  const lastNameError = !value.lastName.trim() ? 'Last name is required.' : '';

  const emailValue = value.email.trim();
  let emailError = '';
  if (!emailValue) {
    emailError = 'Email is required.';
  } else if (!isValidEmailAddress(emailValue)) {
    emailError = 'Enter a valid email address.';
  } else if (isDisposableEmailDomain(emailValue)) {
    emailError = 'Use an inbox you check regularly, disposable domains are not allowed.';
  }

  const phoneRaw = value.phoneNational.trim();
  const phoneError = phoneRaw && !isPhoneNumberComplete(phoneRaw, value.phoneCountryCode)
    ? 'Enter a complete mobile phone number.'
    : '';

  return {
    firstNameError,
    lastNameError,
    emailError,
    phoneError,
  };
}

export function canConfirmProfileDetails(value: ProfileIdentityDetailsShape): boolean {
  const validation = validateProfileDetails(value);
  return !validation.firstNameError
    && !validation.lastNameError
    && !validation.emailError
    && !validation.phoneError;
}

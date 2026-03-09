import { useMemo, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import {
  formatNationalPhoneInput,
  getPhoneCountryOption,
  searchPhoneCountryOptions,
} from './profilePhone';
import { getEmailTypoSuggestion, validateProfileDetails } from './profileDetailsValidation';

export interface ProfileIdentityDraft {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phoneCountryCode: string;
  phoneNational: string;
  location: string;
  linkedIn: string;
  website: string;
  portfolio: string;
}

interface ProfileDetailsStepProps {
  value: ProfileIdentityDraft;
  detailsSaved: boolean;
  prefillMessage?: string | null;
  onChange: (next: ProfileIdentityDraft) => void;
  onBack: () => void;
  onContinue: () => void;
}

type OptionalProfileField = {
  key: 'headline' | 'location' | 'linkedIn' | 'website' | 'portfolio';
  label: string;
  placeholder: string;
  type: 'text' | 'url';
  autoComplete?: string;
  inputMode?: 'text' | 'url';
};

const OPTIONAL_FIELDS: OptionalProfileField[] = [
  { key: 'headline', label: 'Target title', placeholder: 'Senior Growth Marketing Lead', type: 'text', autoComplete: 'organization-title' },
  { key: 'location', label: 'Location', placeholder: 'Austin, TX', type: 'text', autoComplete: 'address-level2' },
  { key: 'linkedIn', label: 'LinkedIn', placeholder: 'linkedin.com/in/alexmorgan', type: 'url', autoComplete: 'url', inputMode: 'url' },
  { key: 'website', label: 'Website', placeholder: 'alexmorgan.com', type: 'url', autoComplete: 'url', inputMode: 'url' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'portfolio.alexmorgan.com', type: 'url', autoComplete: 'url', inputMode: 'url' },
];

interface PhoneCountryPickerProps {
  countryCode: string;
  onChange: (countryCode: string) => void;
}

function PhoneCountryPicker({ countryCode, onChange }: PhoneCountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = getPhoneCountryOption(countryCode);
  const filtered = useMemo(
    () => searchPhoneCountryOptions(query).slice(0, 12),
    [query],
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="workspace-input flex items-center justify-between gap-2 text-left"
        aria-label="Phone country code"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>{selected.flag}</span>
          <span className="text-[13px] text-[var(--text-primary)]">{selected.code}</span>
        </span>
        <ChevronsUpDown size={14} className="text-[var(--text-muted)]" aria-hidden />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-[260px] rounded-[12px] border border-[var(--border-subtle)] bg-white p-2 shadow-[0_12px_24px_rgba(12,22,18,0.18)]">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="workspace-input"
            placeholder="Search country or dial code"
            aria-label="Search country code"
          />
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
            {filtered.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  onChange(option.code);
                  setOpen(false);
                  setQuery('');
                }}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-[var(--surface-bg)] ${
                  option.code === countryCode ? 'bg-[var(--surface-bg)]' : ''
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden>{option.flag}</span>
                  <span className="text-[var(--text-primary)]">{option.name}</span>
                </span>
                <span className="text-[var(--text-muted)]">{option.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-1 text-xs text-[var(--text-muted)]">No matching country codes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileDetailsStep({
  value,
  detailsSaved,
  prefillMessage,
  onChange,
  onBack,
  onContinue,
}: ProfileDetailsStepProps) {
  const [showValidation, setShowValidation] = useState(false);
  const [touched, setTouched] = useState<Record<'firstName' | 'lastName' | 'email' | 'phone', boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  });

  const {
    firstNameError,
    lastNameError,
    emailError,
    phoneError,
  } = validateProfileDetails(value);

  const emailSuggestion = getEmailTypoSuggestion(value.email);
  const hasRequiredErrors = Boolean(firstNameError || lastNameError || emailError || phoneError);

  const updateField = (key: keyof ProfileIdentityDraft, fieldValue: string) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  return (
    <section className="workspace-panel p-6 lg:p-7">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Confirm your details</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
        Keep contact and identity fields clean so every future asset starts from trusted basics.
      </p>
      {prefillMessage && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">{prefillMessage}</p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-semibold text-[var(--text-secondary)]">
          First name <span className="text-[var(--text-muted)]">*</span>
          <input
            type="text"
            value={value.firstName}
            name="firstName"
            inputMode="text"
            autoComplete="given-name"
            onChange={(event) => updateField('firstName', event.target.value)}
            onBlur={() => setTouched((previous) => ({ ...previous, firstName: true }))}
            placeholder="Alex"
            className={`workspace-input mt-1.5 ${showValidation || touched.firstName ? (firstNameError ? 'workspace-input-danger' : '') : ''}`}
            aria-invalid={Boolean((showValidation || touched.firstName) && firstNameError)}
          />
          {(showValidation || touched.firstName) && firstNameError && (
            <p className="mt-1 text-xs text-[var(--status-danger-text)]">{firstNameError}</p>
          )}
        </label>

        <label className="block text-xs font-semibold text-[var(--text-secondary)]">
          Last name <span className="text-[var(--text-muted)]">*</span>
          <input
            type="text"
            value={value.lastName}
            name="lastName"
            inputMode="text"
            autoComplete="family-name"
            onChange={(event) => updateField('lastName', event.target.value)}
            onBlur={() => setTouched((previous) => ({ ...previous, lastName: true }))}
            placeholder="Morgan"
            className={`workspace-input mt-1.5 ${showValidation || touched.lastName ? (lastNameError ? 'workspace-input-danger' : '') : ''}`}
            aria-invalid={Boolean((showValidation || touched.lastName) && lastNameError)}
          />
          {(showValidation || touched.lastName) && lastNameError && (
            <p className="mt-1 text-xs text-[var(--status-danger-text)]">{lastNameError}</p>
          )}
        </label>

        <label className="block text-xs font-semibold text-[var(--text-secondary)] md:col-span-2">
          Email <span className="text-[var(--text-muted)]">*</span>
          <input
            type="email"
            value={value.email}
            name="email"
            inputMode="email"
            autoComplete="email"
            onChange={(event) => updateField('email', event.target.value)}
            onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
            placeholder="alex@email.com"
            className={`workspace-input mt-1.5 ${showValidation || touched.email ? (emailError ? 'workspace-input-danger' : '') : ''}`}
            aria-invalid={Boolean((showValidation || touched.email) && emailError)}
          />
          {(showValidation || touched.email) && emailError && (
            <p className="mt-1 text-xs text-[var(--status-danger-text)]">{emailError}</p>
          )}
          {!emailError && emailSuggestion && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Did you mean{' '}
              <button
                type="button"
                onClick={() => updateField('email', emailSuggestion)}
                className="font-semibold text-[var(--color-brand-700)] underline"
              >
                {emailSuggestion}
              </button>
              ?
            </p>
          )}
        </label>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Mobile phone</p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
            <PhoneCountryPicker
              countryCode={value.phoneCountryCode}
              onChange={(nextCode) => {
                onChange({
                  ...value,
                  phoneCountryCode: nextCode,
                  phoneNational: formatNationalPhoneInput(value.phoneNational, nextCode),
                });
              }}
            />
            <input
              type="tel"
              value={value.phoneNational}
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              onChange={(event) => updateField('phoneNational', formatNationalPhoneInput(event.target.value, value.phoneCountryCode))}
              onBlur={() => setTouched((previous) => ({ ...previous, phone: true }))}
              placeholder={value.phoneCountryCode === '+1' ? '(555) 123-4567' : 'Mobile phone'}
              className={`workspace-input ${showValidation || touched.phone ? (phoneError ? 'workspace-input-danger' : '') : ''}`}
              aria-label="Mobile phone number"
              aria-invalid={Boolean((showValidation || touched.phone) && phoneError)}
            />
          </div>
          {(showValidation || touched.phone) && phoneError && (
            <p className="mt-1 text-xs text-[var(--status-danger-text)]">{phoneError}</p>
          )}
        </div>

        {OPTIONAL_FIELDS.map((field) => (
          <label key={field.key} className="block text-xs font-semibold text-[var(--text-secondary)]">
            {field.label}
            <input
              type={field.type}
              value={value[field.key]}
              name={field.key}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="workspace-input mt-1.5"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="workspace-btn-secondary">
          Back
        </button>
        <div className="flex items-center gap-3">
          {detailsSaved && (
            <span className="rounded-full border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-success-text)]">
              Details saved
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (hasRequiredErrors) {
                setShowValidation(true);
                setTouched({
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                });
                return;
              }
              onContinue();
            }}
            className="workspace-btn-primary"
          >
            Save and continue
          </button>
        </div>
      </div>
    </section>
  );
}

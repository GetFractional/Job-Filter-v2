import { useState } from 'react';
import {
  formatNationalPhoneInput,
  PHONE_COUNTRY_OPTIONS,
} from './profilePhone';

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

const OPTIONAL_FIELDS: Array<{ key: keyof ProfileIdentityDraft; label: string; placeholder: string }> = [
  { key: 'headline', label: 'Target title', placeholder: 'Senior Growth Marketing Lead' },
  { key: 'location', label: 'Location', placeholder: 'Austin, TX' },
  { key: 'linkedIn', label: 'LinkedIn', placeholder: 'linkedin.com/in/alexmorgan' },
  { key: 'website', label: 'Website', placeholder: 'alexmorgan.com' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'portfolio.alexmorgan.com' },
];

export function ProfileDetailsStep({
  value,
  detailsSaved,
  prefillMessage,
  onChange,
  onBack,
  onContinue,
}: ProfileDetailsStepProps) {
  const [showValidation, setShowValidation] = useState(false);
  const [touched, setTouched] = useState<Record<'firstName' | 'lastName' | 'email', boolean>>({
    firstName: false,
    lastName: false,
    email: false,
  });

  const firstNameError = !value.firstName.trim() ? 'First name is required.' : '';
  const lastNameError = !value.lastName.trim() ? 'Last name is required.' : '';
  const emailValue = value.email.trim();
  const emailError = !emailValue
    ? 'Email is required.'
    : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) ? '' : 'Enter a valid email address.');
  const hasRequiredErrors = Boolean(firstNameError || lastNameError || emailError);

  const updateField = (key: keyof ProfileIdentityDraft, fieldValue: string) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  return (
    <section className="workspace-panel rounded-[26px] p-7">
      <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Your details</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
        Add the basics employers look for first. These details power every resume version and outreach asset you build.
      </p>
      {prefillMessage && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">{prefillMessage}</p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-semibold text-[var(--text-secondary)]">
          First name <span className="text-[var(--text-muted)]">*</span>
          <input
            type="text"
            value={value.firstName}
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
            onChange={(event) => updateField('email', event.target.value.trim())}
            onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
            placeholder="alex@email.com"
            className={`workspace-input mt-1.5 ${showValidation || touched.email ? (emailError ? 'workspace-input-danger' : '') : ''}`}
            aria-invalid={Boolean((showValidation || touched.email) && emailError)}
          />
          {(showValidation || touched.email) && emailError && (
            <p className="mt-1 text-xs text-[var(--status-danger-text)]">{emailError}</p>
          )}
        </label>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Phone</p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
            <select
              value={value.phoneCountryCode}
              onChange={(event) => {
                const nextCode = event.target.value;
                onChange({
                  ...value,
                  phoneCountryCode: nextCode,
                  phoneNational: formatNationalPhoneInput(value.phoneNational, nextCode),
                });
              }}
              className="workspace-input"
              aria-label="Phone country code"
            >
              {PHONE_COUNTRY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={value.phoneNational}
              onChange={(event) => updateField('phoneNational', formatNationalPhoneInput(event.target.value, value.phoneCountryCode))}
              placeholder={value.phoneCountryCode === '+1' ? '(555) 123-4567' : 'Phone number'}
              className="workspace-input"
              aria-label="Phone number"
            />
          </div>
        </div>

        {OPTIONAL_FIELDS.map((field) => (
          <label key={field.key} className="block text-xs font-semibold text-[var(--text-secondary)]">
            {field.label}
            <input
              type="text"
              value={value[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="workspace-input mt-1.5"
            />
          </label>
        ))}
      </div>

      <div className="mt-5 rounded-[18px] border border-dashed border-[var(--border-subtle)] bg-white/70 px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Photo (optional)</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Optional. Use only when it supports your market and template. Upload support comes in a later packet.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="workspace-btn-secondary">
          Back
        </button>
        <div className="flex items-center gap-3">
          {detailsSaved && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              Details saved
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (hasRequiredErrors) {
                setShowValidation(true);
                setTouched({ firstName: true, lastName: true, email: true });
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

export interface ProfileIdentityDraft {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  website: string;
  portfolio: string;
}

interface ProfileDetailsStepProps {
  value: ProfileIdentityDraft;
  onChange: (next: ProfileIdentityDraft) => void;
  onBack: () => void;
  onContinue: () => void;
}

const FIELDS: Array<{ key: keyof ProfileIdentityDraft; label: string; placeholder: string }> = [
  { key: 'fullName', label: 'Full name', placeholder: 'Alex Morgan' },
  { key: 'headline', label: 'Headline / target title', placeholder: 'Senior Growth Marketing Lead' },
  { key: 'email', label: 'Email', placeholder: 'alex@email.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567' },
  { key: 'location', label: 'Location', placeholder: 'Austin, TX' },
  { key: 'linkedIn', label: 'LinkedIn', placeholder: 'linkedin.com/in/alexmorgan' },
  { key: 'website', label: 'Website', placeholder: 'alexmorgan.com' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'portfolio.alexmorgan.com' },
];

export function ProfileDetailsStep({ value, onChange, onBack, onContinue }: ProfileDetailsStepProps) {
  const updateField = (key: keyof ProfileIdentityDraft, fieldValue: string) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-[var(--shadow-panel)]">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Your details</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Add the basics employers expect to see first. You can update them anytime.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-xs font-semibold text-[var(--text-secondary)]">
            {field.label}
            <input
              type="text"
              value={value[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </label>
        ))}
      </div>

      <div className="mt-5 rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Photo</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Optional. Use only if it fits your market and template. Upload support is coming in a later packet.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} className="btn-ghost rounded-[var(--radius-control)] px-4 py-2 text-sm">
          Back
        </button>
        <button type="button" onClick={onContinue} className="btn-primary rounded-[var(--radius-control)] px-5 py-2.5 text-sm">
          Save and continue
        </button>
      </div>
    </section>
  );
}

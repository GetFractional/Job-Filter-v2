import type { ProfileWorkspaceSectionId } from '../../types';
import type { ProfileIdentityDraft } from './steps/ProfileDetailsStep';

interface ProfilePreviewPaneProps {
  activeStep: ProfileWorkspaceSectionId;
  identity: ProfileIdentityDraft;
  isImporting: boolean;
}

function FieldLine({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <p className="text-xs text-[var(--text-secondary)]">
      <span className="font-semibold text-[var(--text-primary)]">{label}:</span> {value}
    </p>
  );
}

function PreviewSkeleton() {
  return (
    <div data-testid="preview-build-animation" className="space-y-3">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={`preview-skeleton-${index}`}
          className="h-3 rounded-full bg-[var(--surface-strong)]"
          style={{
            width: index % 3 === 0 ? '85%' : index % 3 === 1 ? '72%' : '94%',
            animation: `jfPulse 1.2s ease-in-out ${index * 40}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function ProfilePreviewPane({ activeStep, identity, isImporting }: ProfilePreviewPaneProps) {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Live Preview</p>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
          Editorial Split
        </span>
      </div>

      <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-[var(--shadow-preview)]">
        <div className="border-b border-[var(--border-subtle)] pb-3">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-[1.35rem] leading-6 text-[var(--text-primary)]">
            {identity.fullName || 'Your Name'}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{identity.headline || 'Target title will appear here'}</p>
          <div className="mt-2 space-y-0.5">
            <FieldLine label="Email" value={identity.email} />
            <FieldLine label="Phone" value={identity.phone} />
            <FieldLine label="Location" value={identity.location} />
            <FieldLine label="LinkedIn" value={identity.linkedIn} />
            <FieldLine label="Website" value={identity.website || identity.portfolio} />
          </div>
        </div>

        <div className="pt-4">
          {activeStep === 'intro' && (
            <p className="text-sm text-[var(--text-secondary)]">
              Your profile preview will populate as you confirm details and experience.
            </p>
          )}
          {activeStep === 'details' && (
            <p className="text-sm text-[var(--text-secondary)]">
              You&apos;re building the profile employers will read first. Keep the details clear and complete.
            </p>
          )}
          {activeStep === 'experience' && (
            <>
              {isImporting ? (
                <PreviewSkeleton />
              ) : (
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">Experience timeline preview</p>
                  <p>Upload and start extraction to see your companies, roles, and date ranges fill in here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

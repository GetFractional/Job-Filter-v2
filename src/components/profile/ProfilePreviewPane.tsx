import type { ProfileWorkspaceSectionId } from '../../types';
import type { ProfileIdentityDraft } from './steps/ProfileDetailsStep';
import type { ExtractionBuildStage } from './steps/ProfileExperienceImportStep';

export interface ExperienceTimelineRolePreview {
  id: string;
  title: string;
  dateRange: string;
  responsibilities: string[];
  results: string[];
}

export interface ExperienceTimelineCompanyPreview {
  id: string;
  company: string;
  roles: ExperienceTimelineRolePreview[];
}

interface ProfilePreviewPaneProps {
  activeStep: ProfileWorkspaceSectionId;
  identity: ProfileIdentityDraft;
  extractionStage: ExtractionBuildStage;
  extractionGroups: ExperienceTimelineCompanyPreview[];
  revealedGroupCount: number;
}

function fullName(identity: ProfileIdentityDraft): string {
  return `${identity.firstName} ${identity.lastName}`.trim();
}

function phoneValue(identity: ProfileIdentityDraft): string {
  if (!identity.phoneNational.trim()) return '';
  return `${identity.phoneCountryCode} ${identity.phoneNational}`.trim();
}

function FieldLine({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="text-xs text-[var(--text-secondary)]">
      <span className="font-semibold text-[var(--text-primary)]">{label}:</span>{' '}
      <span className="break-all">{value}</span>
    </div>
  );
}

function PreviewSkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`preview-skeleton-row-${index}`}
          className="h-3 rounded-full bg-[var(--surface-strong)]"
          style={{
            width: index % 2 === 0 ? '90%' : '72%',
            animation: `jfPulse 1.1s ease-in-out ${index * 55}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ExperiencePreviewContent({
  extractionStage,
  extractionGroups,
  revealedGroupCount,
}: {
  extractionStage: ExtractionBuildStage;
  extractionGroups: ExperienceTimelineCompanyPreview[];
  revealedGroupCount: number;
}) {
  if (extractionStage === 'idle' && extractionGroups.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Confirm your details, upload your resume, and this preview will populate with your company, role, and date timeline.
      </p>
    );
  }

  if (extractionStage === 'error') {
    return (
      <p className="text-sm text-[var(--status-danger-text)]">
        We couldn&apos;t build a timeline preview from this file yet. Try another resume file or start manually.
      </p>
    );
  }

  const visibleCount = extractionStage === 'idle'
    ? extractionGroups.length
    : Math.max(0, revealedGroupCount);
  const visibleGroups = extractionGroups.slice(0, visibleCount);
  const hiddenCount = Math.max(0, extractionGroups.length - visibleGroups.length);

  return (
    <div className="min-w-0 space-y-3" data-testid="preview-build-animation">
      {visibleGroups.length > 0 && (
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <div key={group.id} className="min-w-0 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-3">
              <p className="break-words text-sm font-semibold text-[var(--text-primary)]">{group.company}</p>
              <div className="mt-2 space-y-1.5">
                {group.roles.map((role) => (
                  <div key={role.id} className="min-w-0 rounded-[10px] bg-[var(--surface-muted)] px-2.5 py-1.5">
                    <p className="break-words text-xs font-medium text-[var(--text-primary)]">{role.title}</p>
                    <p className="break-words text-[11px] text-[var(--text-secondary)]">{role.dateRange}</p>
                    {role.responsibilities.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {role.responsibilities.map((line, index) => (
                          <p key={`${role.id}-resp-${index}`} className="break-words text-[11px] text-[var(--text-secondary)]">
                            • {line}
                          </p>
                        ))}
                      </div>
                    )}
                    {role.results.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {role.results.map((line, index) => (
                          <p key={`${role.id}-result-${index}`} className="break-words text-[11px] font-medium text-[var(--text-primary)]">
                            ↳ {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(extractionStage === 'extracting_text' || extractionStage === 'mapping_timeline' || extractionStage === 'assembling_preview') && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {extractionStage === 'extracting_text'
              ? 'Reading content'
              : extractionStage === 'mapping_timeline'
                ? 'Mapping timeline'
                : 'Building preview'}
          </p>
          <PreviewSkeletonRows rows={Math.max(2, hiddenCount || 2)} />
        </div>
      )}

      {extractionStage === 'ready' && extractionGroups.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          Extraction finished but no clear company-role-date structure was detected yet. You can continue in manual mode.
        </p>
      )}
    </div>
  );
}

export function ProfilePreviewPane({
  activeStep,
  identity,
  extractionStage,
  extractionGroups,
  revealedGroupCount,
}: ProfilePreviewPaneProps) {
  return (
    <section className="workspace-glass min-w-0 w-full p-4 lg:sticky lg:top-6 2xl:p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Live preview</p>
      <div className="min-w-0 w-full max-w-full min-h-[74vh] max-h-[calc(100vh-6.75rem)] overflow-y-auto overflow-x-hidden rounded-[16px] border border-[var(--border-subtle)] bg-white p-5 shadow-[0_18px_36px_rgba(7,16,13,0.12)] sm:p-6 2xl:p-7">
        <div className="border-b border-[var(--border-subtle)] pb-3">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="break-words text-[1.55rem] leading-7 text-[var(--text-primary)]">
            {fullName(identity) || 'Your Name'}
          </h2>
          <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">{identity.headline || 'Target title'}</p>
          <div className="mt-2 space-y-0.5">
            <FieldLine label="Email" value={identity.email} />
            <FieldLine label="Mobile phone" value={phoneValue(identity)} />
            <FieldLine label="Location" value={identity.location} />
            <FieldLine label="LinkedIn" value={identity.linkedIn} />
            <FieldLine label="Website" value={identity.website || identity.portfolio} />
          </div>
        </div>

        <div className="pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Experience</p>
          {(activeStep === 'experience' || extractionStage !== 'idle') ? (
            <ExperiencePreviewContent
              extractionStage={extractionStage}
              extractionGroups={extractionGroups}
              revealedGroupCount={revealedGroupCount}
            />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Your experience timeline appears here as you move through confirmation.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

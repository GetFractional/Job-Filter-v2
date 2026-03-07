interface ProfileIntroStepProps {
  onBuildFromResume: () => void;
  onStartManually: () => void;
}

const PILLARS = [
  'Confirm your career story',
  'Reuse approved proof faster',
  'Keep every claim grounded',
];

export function ProfileIntroStep({ onBuildFromResume, onStartManually }: ProfileIntroStepProps) {
  return (
    <section
      className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-[var(--shadow-panel)]"
      aria-labelledby="profile-intro-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Profile Workspace</p>
      <h1
        id="profile-intro-heading"
        className="mt-3 text-[clamp(2rem,3vw,2.5rem)] leading-[1.1] font-[600] text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Build your profile once. Use it everywhere.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
        We&apos;ll turn your resume and edits into a reusable, proof-backed profile, so every resume variant, cover letter, and
        outreach draft starts from facts you trust.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar} className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2.5">
            <p className="text-sm font-medium text-[var(--text-primary)]">{pillar}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBuildFromResume} className="btn-primary rounded-[var(--radius-control)] px-5 py-2.5 text-sm">
          Build from my resume
        </button>
        <button
          type="button"
          onClick={onStartManually}
          className="text-sm font-medium text-[var(--text-secondary)] underline decoration-[var(--color-accent-500)] underline-offset-4 hover:text-[var(--text-primary)]"
        >
          No resume? Start manually
        </button>
      </div>
    </section>
  );
}

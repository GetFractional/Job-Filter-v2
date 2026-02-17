import { describe, expect, it } from 'vitest';
import { buildImportDraftFromText } from '../importDraftBuilder';
import marketingFixture from './fixtures/matt_marketing_director_sanitized.txt?raw';
import profileFixture from './fixtures/profile_linkedin_export_sanitized.txt?raw';

function summarize(result: ReturnType<typeof buildImportDraftFromText>) {
  const companies = result.draft.companies.length;
  const roles = result.draft.companies.reduce((sum, company) => sum + company.roles.length, 0);
  const items = result.draft.companies.reduce((sumCompanies, company) => {
    return (
      sumCompanies +
      company.roles.reduce((sumRoles, role) => sumRoles + role.highlights.length + role.outcomes.length, 0)
    );
  }, 0);

  return { companies, roles, items };
}

describe('import fixture thresholds', () => {
  it('keeps marketing director resume fixture above minimum structure thresholds', () => {
    const result = buildImportDraftFromText(marketingFixture, { mode: 'default' });
    const summary = summarize(result);

    expect(summary.companies).toBeGreaterThanOrEqual(3);
    expect(summary.roles).toBeGreaterThanOrEqual(3);
    expect(summary.items).toBeGreaterThanOrEqual(20);
    expect(result.diagnostics.bulletCandidatesCount).toBeGreaterThanOrEqual(20);
  });

  it('keeps profile export fixture above minimum structure thresholds', () => {
    const result = buildImportDraftFromText(profileFixture, { mode: 'default' });
    const summary = summarize(result);

    expect(summary.companies).toBeGreaterThanOrEqual(5);
    expect(summary.roles).toBeGreaterThanOrEqual(5);
    expect(summary.items).toBeGreaterThanOrEqual(30);
    expect(result.diagnostics.bulletCandidatesCount).toBeGreaterThanOrEqual(30);
  });
});

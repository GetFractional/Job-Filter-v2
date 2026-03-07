import { describe, expect, it } from 'vitest';
import { buildBestImportDraftFromText, buildImportDraftFromText } from '../importDraftBuilder';
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

function summarizeTimeline(result: ReturnType<typeof buildImportDraftFromText>) {
  return result.draft.companies.map((company) => ({
    company: company.name,
    status: company.status,
    roles: company.roles.map((role) => ({
      title: role.title,
      startDate: role.startDate,
      endDate: role.endDate ?? '',
      currentRole: Boolean(role.currentRole),
    })),
  }));
}

describe('import fixture thresholds', () => {
  it('keeps exact marketing fixture timeline structure stable', () => {
    const result = buildImportDraftFromText(marketingFixture, { mode: 'default' });

    expect(summarizeTimeline(result)).toEqual([
      {
        company: 'Acme Growth Labs',
        status: 'active',
        roles: [
          {
            title: 'Marketing Director',
            startDate: 'Sep 2023',
            endDate: 'Nov 2025',
            currentRole: false,
          },
        ],
      },
      {
        company: 'Northwind Software',
        status: 'active',
        roles: [
          {
            title: 'Senior Demand Generation Manager',
            startDate: 'Jan 2021',
            endDate: 'Aug 2023',
            currentRole: false,
          },
        ],
      },
      {
        company: 'Summit Commerce',
        status: 'active',
        roles: [
          {
            title: 'Growth Marketing Manager',
            startDate: 'Mar 2018',
            endDate: 'Dec 2020',
            currentRole: false,
          },
        ],
      },
    ]);
    expect(result.diagnostics.reasonCodes).toEqual([]);
  });

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

  it('auto-mode chooser returns scored candidates and selected winner for marketing fixture', () => {
    const result = buildBestImportDraftFromText(marketingFixture);
    const candidates = result.diagnostics.candidateModes ?? [];

    expect(candidates.length).toBe(4);
    expect(result.diagnostics.selectedMode).toBeDefined();
    expect(candidates[0].score).toBeGreaterThanOrEqual(candidates[candidates.length - 1].score);
  });

  it('auto-mode chooser returns scored candidates and selected winner for profile fixture', () => {
    const result = buildBestImportDraftFromText(profileFixture);
    const candidates = result.diagnostics.candidateModes ?? [];

    expect(candidates.length).toBe(4);
    expect(result.diagnostics.selectedMode).toBeDefined();
    expect(candidates[0].score).toBeGreaterThanOrEqual(candidates[candidates.length - 1].score);
  });
});

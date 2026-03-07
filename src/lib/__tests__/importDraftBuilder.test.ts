import { describe, expect, it } from 'vitest';
import {
  buildBestImportDraftFromText,
  buildImportDraftFromText,
  hasUsableImportDraft,
  isLikelySuspiciousCompanyName,
} from '../importDraftBuilder';
import marketingFixture from './fixtures/matt_marketing_director_sanitized.txt?raw';
import profileFixture from './fixtures/profile_linkedin_export_sanitized.txt?raw';

describe('importDraftBuilder', () => {
  it('builds a company-first draft with confidence/status/source refs', () => {
    const input = [
      'Acme Corp',
      'Senior Growth Manager',
      'Jan 2021 - Present',
      '●',
      'Grew qualified pipeline by 42% in 2 quarters',
      '- Built lifecycle programs across email and in-app channels',
      '- Managed HubSpot and Salesforce reporting',
    ].join('\n');

    const result = buildImportDraftFromText(input, { mode: 'default' });

    expect(result.draft.companies.length).toBeGreaterThanOrEqual(1);
    const company = result.draft.companies[0];
    expect(company.roles.length).toBeGreaterThanOrEqual(1);

    const role = company.roles[0];
    expect(role.confidence).toBeGreaterThanOrEqual(0);
    expect(role.confidence).toBeLessThanOrEqual(1);
    expect(['active', 'needs_review', 'conflict', 'rejected']).toContain(role.status);

    const allItems = [...role.highlights, ...role.outcomes, ...role.tools];
    expect(allItems.length).toBeGreaterThan(0);
    expect(allItems.every((item) => item.sourceRefs.every((ref) => ref.lineIndex >= 0))).toBe(true);
    expect(hasUsableImportDraft(result.draft)).toBe(true);
  });

  it('returns deterministic reason codes for empty input', () => {
    const result = buildImportDraftFromText('   ');
    expect(result.draft.companies.length).toBe(0);
    expect(result.diagnostics.reasonCodes).toContain('TEXT_EMPTY');
  });

  it('applies segmentation mode retries', () => {
    const collapsed = 'Senior Growth Manager at Acme Corp Jan 2021 - Present ● Built pipeline engine; ● Increased conversion by 18%';

    const defaultResult = buildImportDraftFromText(collapsed, { mode: 'default' });
    const retryResult = buildImportDraftFromText(collapsed, { mode: 'bullets' });

    const defaultItemCount = defaultResult.diagnostics.bulletsCount;
    const retryItemCount = retryResult.diagnostics.bulletsCount;

    expect(retryItemCount).toBeGreaterThanOrEqual(defaultItemCount);
  });

  it('strips zero-width characters and merges bullet-only continuation lines', () => {
    const input = [
      'Acme Corp',
      'Growth Lead',
      'Jan 2021 - Present',
      '●\u200b',
      'Built lifecycle strategy across paid and owned channels',
      '+ Coordinated launch planning with sales and CS leaders',
      '(lifted conversion 12%)',
    ].join('\n');

    const result = buildImportDraftFromText(input, { mode: 'default' });
    const mergedItemsText = result.draft.companies
      .flatMap((company) => company.roles)
      .flatMap((role) => [...role.highlights, ...role.outcomes])
      .map((item) => item.text)
      .join(' ');
    const statuses = result.draft.companies
      .flatMap((company) => company.roles)
      .flatMap((role) => [role.status, ...role.highlights.map((item) => item.status), ...role.outcomes.map((item) => item.status)]);

    expect(result.diagnostics.bulletCandidatesCount).toBeGreaterThan(0);
    expect(mergedItemsText).toContain('Built lifecycle strategy across paid and owned channels');
    expect(mergedItemsText).toContain('Coordinated launch planning with sales and CS leaders');
    expect(statuses).not.toContain('rejected');
  });

  it('never auto-rejects low-confidence parsed items', () => {
    const input = ['●\u200b', 'short proof line'].join('\n');
    const result = buildImportDraftFromText(input, { mode: 'default' });
    const statuses = result.draft.companies.flatMap((company) =>
      company.roles.flatMap((role) => [
        role.status,
        ...role.highlights.map((item) => item.status),
        ...role.outcomes.map((item) => item.status),
      ]),
    );

    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses).not.toContain('rejected');
  });

  it('auto-selects the strongest segmentation candidate for known fixtures', () => {
    const marketingResult = buildBestImportDraftFromText(marketingFixture);
    const profileResult = buildBestImportDraftFromText(profileFixture);

    expect(marketingResult.diagnostics.selectedMode).toBeDefined();
    expect(profileResult.diagnostics.selectedMode).toBeDefined();
    expect(marketingResult.diagnostics.candidateModes?.length).toBe(4);
    expect(profileResult.diagnostics.candidateModes?.length).toBe(4);
  });

  it('flags obvious date or location headers as suspicious company identities', () => {
    expect(isLikelySuspiciousCompanyName('TN | Jun 2020')).toBe(true);
    expect(isLikelySuspiciousCompanyName('BC | Aug 2019')).toBe(true);
    expect(isLikelySuspiciousCompanyName('CA | Jan 2017')).toBe(true);
    expect(isLikelySuspiciousCompanyName('San Francisco, CA')).toBe(true);
    expect(isLikelySuspiciousCompanyName('Acme Corp')).toBe(false);
  });

  it('routes suspicious company headers into needs-review status', () => {
    const input = [
      'TN | Jun 2020',
      'Dec 2021 - Present',
      '- Built lifecycle campaign architecture',
    ].join('\n');

    const result = buildImportDraftFromText(input, { mode: 'default' });
    const suspiciousCompany = result.draft.companies.find((company) => company.name === 'TN | Jun 2020');

    expect(suspiciousCompany).toBeDefined();
    expect(suspiciousCompany?.status).toBe('needs_review');
  });

  it('marks Present roles as currentRole in timeline structure', () => {
    const input = [
      'Acme Corp',
      'Growth Lead',
      'Jan 2020 - Present',
      '- Built lifecycle program',
    ].join('\n');

    const result = buildImportDraftFromText(input, { mode: 'default' });
    const role = result.draft.companies[0]?.roles[0];

    expect(role).toBeDefined();
    expect(role?.currentRole).toBe(true);
    expect(role?.endDate ?? '').toBe('');
  });
});

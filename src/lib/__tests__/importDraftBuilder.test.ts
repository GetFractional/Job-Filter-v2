import { describe, expect, it } from 'vitest';
import { buildImportDraftFromText, hasUsableImportDraft } from '../importDraftBuilder';

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
    expect(['accepted', 'needs_attention', 'rejected']).toContain(role.status);

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
});

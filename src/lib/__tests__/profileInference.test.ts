import { describe, expect, it } from 'vitest';
import type { ImportDraft, ParseDiagnostics } from '../../types';
import { inferProfilePrefillSuggestion } from '../profileInference';

function buildDiagnostics(lines: string[]): ParseDiagnostics {
  return {
    extractedTextLength: lines.join('\n').length,
    detectedLinesCount: lines.length,
    bulletCandidatesCount: 0,
    bulletOnlyLineCount: 0,
    sectionHeadersDetected: 0,
    companyCandidatesDetected: 0,
    roleCandidatesDetected: 0,
    finalCompaniesCount: 0,
    rolesCount: 0,
    bulletsCount: 0,
    reasonCodes: [],
    previewLines: lines.map((line, index) => `${index + 1}: ${line}`),
    rawPreviewLinesWithNumbers: lines.map((line, index) => ({ line: index + 1, text: line })),
  };
}

describe('profileInference', () => {
  it('infers all-caps heading names, title-cases target roles, and preserves Mt. in location hints', () => {
    const diagnostics = buildDiagnostics([
      'MATT DIMOCK',
      'MARKETING DIRECTOR',
      'Mt. Juliet, TN',
      'mattdim805@gmail.com',
    ]);

    const draft: ImportDraft = { companies: [] };
    const suggestion = inferProfilePrefillSuggestion(diagnostics, draft);

    expect(suggestion.firstName).toBe('Matt');
    expect(suggestion.lastName).toBe('Dimock');
    expect(suggestion.locationHints).toContain('Mt. Juliet, TN');
    expect(suggestion.targetRoles).toContain('Marketing Director');
  });

  it('skips unassigned draft roles and keeps plausible role titles', () => {
    const diagnostics = buildDiagnostics(['Alex Morgan', 'Senior Growth Marketing Manager']);

    const draft: ImportDraft = {
      companies: [
        {
          id: 'company-1',
          name: 'Acme',
          confidence: 0.9,
          status: 'active',
          sourceRefs: [],
          roles: [
            {
              id: 'role-1',
              title: 'Unassigned',
              startDate: '2022',
              endDate: '',
              currentRole: true,
              confidence: 0.4,
              status: 'needs_review',
              sourceRefs: [],
              highlights: [],
              outcomes: [],
              tools: [],
              skills: [],
            },
            {
              id: 'role-2',
              title: 'Senior Growth Marketing Manager',
              startDate: '2020',
              endDate: '2022',
              currentRole: false,
              confidence: 0.8,
              status: 'active',
              sourceRefs: [],
              highlights: [],
              outcomes: [],
              tools: [],
              skills: [],
            },
          ],
        },
      ],
    };

    const suggestion = inferProfilePrefillSuggestion(diagnostics, draft);
    expect(suggestion.targetRoles).toContain('Senior Growth Marketing Manager');
    expect(suggestion.targetRoles).not.toContain('Unassigned');
  });
});

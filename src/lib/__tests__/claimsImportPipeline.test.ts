import { describe, expect, it } from 'vitest';
import {
  getClaimsImportAcceptValue,
  parseClaimsImport,
  parseClaimsImportText,
  validateClaimsImportFile,
} from '../claimsImportPipeline';

describe('claimsImportPipeline', () => {
  it('validates supported file extensions and mime types', () => {
    expect(
      validateClaimsImportFile({
        name: 'profile.pdf',
        type: 'application/pdf',
        size: 1024,
      } as File),
    ).toBeNull();

    expect(
      validateClaimsImportFile({
        name: 'resume.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
      } as File),
    ).toBeNull();

    expect(
      validateClaimsImportFile({
        name: 'notes.txt',
        type: 'text/plain',
        size: 256,
      } as File),
    ).toBeNull();
  });

  it('rejects unsupported or oversized files', () => {
    expect(
      validateClaimsImportFile({
        name: 'resume.rtf',
        type: 'application/rtf',
        size: 2048,
      } as File),
    ).toBe('Unsupported file type. Upload PDF, DOCX, or TXT.');

    expect(
      validateClaimsImportFile({
        name: 'big.pdf',
        type: 'application/pdf',
        size: 6 * 1024 * 1024,
      } as File),
    ).toBe('File is too large. Maximum size is 5MB.');
  });

  it('parses normalized text through the standard claims parser', () => {
    const claims = parseClaimsImportText(
      'Role at Company\r\nJan 2021 - Present\r\n- Increased pipeline by 40%',
    );
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].company).toContain('Company');
  });

  it('returns diagnostics and preserves parse metadata', () => {
    const result = parseClaimsImport(
      'Role at Company\nJan 2021 - Present\n- Increased pipeline by 40%',
      { pageCount: 2 },
    );

    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.diagnostics.pageCount).toBe(2);
    expect(result.diagnostics.detectedLinesCount).toBeGreaterThan(0);
    expect(result.lowConfidence).toBe(false);
  });

  it('supports alternate segmentation mode retries', () => {
    const text = 'Role at Company\nJan 2021 - Present\n● first bullet ● second bullet';
    const defaultResult = parseClaimsImport(text, { segmentationMode: 'default' });
    const bulletModeResult = parseClaimsImport(text, { segmentationMode: 'bullets' });

    expect(bulletModeResult.diagnostics.bulletsCount).toBeGreaterThanOrEqual(
      defaultResult.diagnostics.bulletsCount,
    );
  });

  it('exposes accept string for file picker', () => {
    const accept = getClaimsImportAcceptValue();
    expect(accept).toContain('.pdf');
    expect(accept).toContain('.docx');
    expect(accept).toContain('.txt');
  });
});

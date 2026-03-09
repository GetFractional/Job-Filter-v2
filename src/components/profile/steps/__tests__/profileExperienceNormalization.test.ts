import { describe, expect, it } from 'vitest';

import { normalizeSentenceCaseLineStart } from '../profileLineNormalization';

describe('normalizeSentenceCaseLineStart', () => {
  it('capitalizes the first alphabetical character for simple lowercase starts', () => {
    expect(normalizeSentenceCaseLineStart('retained 1+ year through final restructuring.'))
      .toBe('Retained 1+ year through final restructuring.');
    expect(normalizeSentenceCaseLineStart('"generated 30K+ leads at 55% conversion"'))
      .toBe('"Generated 30K+ leads at 55% conversion"');
  });

  it('preserves acronyms and already-correct casing', () => {
    expect(normalizeSentenceCaseLineStart('AWS + AI + CRM integration across SMS lifecycle'))
      .toBe('AWS + AI + CRM integration across SMS lifecycle');
    expect(normalizeSentenceCaseLineStart('Built acquisition systems with AWS and CRM tooling'))
      .toBe('Built acquisition systems with AWS and CRM tooling');
  });

  it('does not force title case for branded or mixed tokens', () => {
    expect(normalizeSentenceCaseLineStart('iMarket migration planning'))
      .toBe('iMarket migration planning');
    expect(normalizeSentenceCaseLineStart('n8n workflow orchestration'))
      .toBe('n8n workflow orchestration');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { Claim, Job, Profile } from '../src/types';
import { parseResumeStructured } from '../src/lib/claimParser';
import { generateOutreachEmail, validateContext } from '../src/lib/assets';
import { scoreJob } from '../src/lib/scoring';

const PROFILE_PDF_PATHS = [
  process.env.CLAIMS_PROFILE_PDF_PATH,
  '/Users/mattdimock/Downloads/Profile.pdf',
  '/mnt/data/Profile.pdf',
].filter((value): value is string => Boolean(value));

const PROFILE: Profile = {
  id: 'proof-profile',
  name: 'Matt',
  targetRoles: ['Director of Growth', 'VP of Growth'],
  compFloor: 150000,
  compTarget: 180000,
  requiredBenefits: ['Medical'],
  preferredBenefits: ['401(k)', 'Equity'],
  locationPreference: 'Remote',
  disqualifiers: [],
  updatedAt: new Date().toISOString(),
};

const SAMPLE_JOB: Partial<Job> = {
  id: 'proof-job',
  title: 'Director of Growth',
  company: 'ProofCo',
  jobDescription: `
    We are hiring a Director of Growth to lead lifecycle strategy and demand generation.
    Requirements:
    - 7+ years of growth marketing experience
    - Hands-on HubSpot and Salesforce experience
    - Strong analytical rigor and experimentation mindset
    Compensation: $180,000 - $220,000
  `,
  locationType: 'Remote',
  employmentType: 'Full-time',
  compMin: 180000,
  compMax: 220000,
};

async function extractTextFromPdf(path: string): Promise<string> {
  const bytes = new Uint8Array(readFileSync(path));
  const loadingTask = getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  await pdf.destroy();
  return pages.join('\n').trim();
}

function toClaims(parsedClaims: ReturnType<typeof parseResumeStructured>): Claim[] {
  return parsedClaims.map((parsedClaim, index) => ({
    id: `proof-claim-${index + 1}`,
    company: parsedClaim.company,
    role: parsedClaim.role,
    startDate: parsedClaim.startDate,
    endDate: parsedClaim.endDate || undefined,
    responsibilities: parsedClaim.responsibilities,
    tools: parsedClaim.tools,
    outcomes: parsedClaim.outcomes.map((outcome) => ({
      description: outcome.description,
      metric: outcome.metric,
      isNumeric: outcome.isNumeric,
      verified: false,
    })),
    createdAt: new Date().toISOString(),
  }));
}

describe('proof harness golden path', () => {
  it('imports claims, scores a job, and generates an asset', async () => {
    const pdfPath = PROFILE_PDF_PATHS.find((candidate) => existsSync(candidate));
    expect(pdfPath, 'No Profile.pdf found. Set CLAIMS_PROFILE_PDF_PATH to run harness.').toBeTruthy();

    const text = await extractTextFromPdf(pdfPath!);
    expect(text.length).toBeGreaterThan(100);

    const parsedClaims = parseResumeStructured(text);
    expect(parsedClaims.length, 'No claims parsed from PDF text').toBeGreaterThan(0);

    const claims = toClaims(parsedClaims);
    const scored = scoreJob(SAMPLE_JOB, PROFILE, claims);
    const validation = validateContext({ job: SAMPLE_JOB, userName: PROFILE.name, claims });
    const outreach = generateOutreachEmail({
      job: {
        ...(SAMPLE_JOB as Job),
        stage: 'Captured',
        stageTimestamps: {},
        disqualifiers: [],
        reasonsToPursue: [],
        reasonsToPass: [],
        redFlags: [],
        requirementsExtracted: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      userName: PROFILE.name,
      claims,
    });

    expect(validation.valid).toBe(true);
    expect(scored.fitScore).toBeGreaterThanOrEqual(0);
    expect(outreach.length).toBeGreaterThan(100);
    expect(outreach).toContain('ProofCo');

    console.log('[proof-harness] report', {
      pdfPath,
      parsedClaims: parsedClaims.length,
      usedClaims: claims.length,
      fitScore: scored.fitScore,
      fitLabel: scored.fitLabel,
      warningCount: validation.warnings.length,
    });
  });
});

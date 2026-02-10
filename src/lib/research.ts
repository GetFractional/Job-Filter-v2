// Job Filter v2 — Perplexity Research Runner
// Single master prompt with structured output. No API cost.
// User runs in Perplexity with their subscription, pastes results back.

import type { Job, ResearchBrief } from '../types';

// ============================================================
// Types
// ============================================================

export interface ResearchPrompt {
  id: string;
  label: string;
  prompt: string;
}

export interface ResearchContext {
  /** Optional company clarification (e.g. "Apple Inc., the tech company" vs "Apple Federal Credit Union") */
  companyContext?: string;
  /** Optional known industry */
  industry?: string;
  /** Optional headquarters location */
  hqLocation?: string;
}

export interface ResearchCompanyMatch {
  isMatch: boolean;
  confidence: number;
  reason: string;
}

// ============================================================
// Generate Single Master Research Prompt
// ============================================================

export function generateResearchPrompt(job: Job, context?: ResearchContext): ResearchPrompt {
  const company = job.company;
  const title = job.title;
  const industry = context?.industry || extractIndustry(job.jobDescription);

  // Build company identifier with disambiguation
  let companyRef = company;
  if (context?.companyContext) {
    companyRef = `${company} (${context.companyContext})`;
  }
  if (context?.hqLocation) {
    companyRef += `, headquartered in ${context.hqLocation}`;
  }

  const prompt = `I'm evaluating a **${title}** role at **${companyRef}**${industry ? ` in the ${industry} space` : ''}. I need a comprehensive research brief. Please organize your response using the EXACT section headers below.

## COMPANY IDENTITY CONFIRMATION
Confirm we have the right company entity. Include legal/company name, primary website, headquarters location, and one-sentence disambiguation note if multiple companies share this name.

## COMPANY OVERVIEW
What does ${company} do? Core products/services, value proposition, founding year, and current employee count estimate.

## BUSINESS MODEL
How do they make money? Revenue streams, pricing model, estimated revenue/ARR if available, and target market (B2B, B2C, or both).

## IDEAL CUSTOMER PROFILE
Who is their target buyer? Company size, industry verticals, buyer persona, and buying motion (self-serve, sales-led, hybrid).

## COMPETITORS
Top 3-5 direct competitors, how ${company} differentiates, market share/position, and whether the market is growing or mature.

## GTM CHANNELS
Observable marketing and growth channels: paid, organic, content, events, partnerships. Website traffic estimates. Notable martech stack signals from job postings or integration pages.

## ORGANIZATION & LEADERSHIP
CEO background. CMO/VP Marketing/Head of Growth (or is this a new function?). Marketing/growth team size estimate. Who this ${title} role likely reports to. Any recent leadership changes.

## COMPENSATION SIGNALS
Comparable ${title} pay ranges from Glassdoor, Levels.fyi, or similar. Benefits package signals. Other open roles suggesting team growth.

## RISKS
Any concerns: recent layoffs, negative press, leadership turnover, competitive threats, financial instability, culture red flags from Glassdoor reviews.

## INTERVIEW HYPOTHESES
Based on everything above, suggest 3-5 specific hypotheses I should validate in interviews. Format each as a brief statement of what might be true and what question to ask.

Please use facts and cite sources where possible. Use the exact section headers above (## COMPANY OVERVIEW, etc.) so I can parse the output.`;

  return {
    id: 'master-research',
    label: `Full Research Brief — ${company}`,
    prompt,
  };
}

// Keep the old API shape for backwards compat but delegate to master prompt
export function generateResearchPrompts(job: Job): ResearchPrompt[] {
  return [generateResearchPrompt(job)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateResearchCompanyMatch(rawText: string, company: string): ResearchCompanyMatch {
  const normalizedCompany = company.trim().toLowerCase();
  const normalizedText = rawText.trim().toLowerCase();

  if (!normalizedCompany || !normalizedText) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'Missing company name or research content.',
    };
  }

  const fullPattern = new RegExp(`\\b${escapeRegExp(normalizedCompany)}\\b`, 'g');
  const fullMatches = normalizedText.match(fullPattern) || [];
  if (fullMatches.length > 0) {
    const confidence = Math.min(0.98, 0.55 + fullMatches.length * 0.12);
    return {
      isMatch: true,
      confidence,
      reason: `Found "${company}" ${fullMatches.length} time${fullMatches.length === 1 ? '' : 's'} in research text.`,
    };
  }

  const companyTokens = normalizedCompany.split(/\s+/).filter((token) => token.length > 2);
  const tokenHits = companyTokens.filter((token) => normalizedText.includes(token));
  const tokenRatio = companyTokens.length > 0 ? tokenHits.length / companyTokens.length : 0;

  if (tokenRatio >= 0.75 && companyTokens.length > 1) {
    return {
      isMatch: true,
      confidence: Math.min(0.74, 0.45 + tokenRatio * 0.35),
      reason: `Most company name tokens were found (${tokenHits.join(', ')}).`,
    };
  }

  return {
    isMatch: false,
    confidence: tokenRatio * 0.35,
    reason: `The pasted research does not clearly reference "${company}".`,
  };
}

// ============================================================
// Parse Research Results (structured section extraction)
// ============================================================

const SECTION_HEADERS: { key: keyof ResearchBrief; patterns: RegExp[] }[] = [
  {
    key: 'companyIdentity',
    patterns: [/^#{1,3}\s*COMPANY\s*IDENTITY/i, /^#{1,3}\s*IDENTITY\s*CONFIRMATION/i, /^\*\*COMPANY\s*IDENTITY/i],
  },
  {
    key: 'companyOverview',
    patterns: [/^#{1,3}\s*COMPANY\s*OVERVIEW/i, /^#{1,3}\s*Overview/i, /^\*\*COMPANY\s*OVERVIEW\*\*/i],
  },
  {
    key: 'businessModel',
    patterns: [/^#{1,3}\s*BUSINESS\s*MODEL/i, /^\*\*BUSINESS\s*MODEL\*\*/i],
  },
  {
    key: 'icp',
    patterns: [/^#{1,3}\s*IDEAL\s*CUSTOMER/i, /^#{1,3}\s*ICP/i, /^\*\*IDEAL\s*CUSTOMER/i],
  },
  {
    key: 'competitors',
    patterns: [/^#{1,3}\s*COMPETITORS?/i, /^#{1,3}\s*COMPETITIVE/i, /^\*\*COMPETITORS?\*\*/i],
  },
  {
    key: 'gtmChannels',
    patterns: [/^#{1,3}\s*GTM/i, /^#{1,3}\s*GO.TO.MARKET/i, /^\*\*GTM/i],
  },
  {
    key: 'orgLeadership',
    patterns: [/^#{1,3}\s*ORGANIZATION/i, /^#{1,3}\s*LEADERSHIP/i, /^\*\*ORGANIZATION/i],
  },
  {
    key: 'compSignals',
    patterns: [/^#{1,3}\s*COMPENSATION/i, /^#{1,3}\s*COMP\s*SIGNALS/i, /^\*\*COMPENSATION/i],
  },
  {
    key: 'risks',
    patterns: [/^#{1,3}\s*RISKS?/i, /^\*\*RISKS?\*\*/i],
  },
];

export function parseResearchPaste(rawText: string): ResearchBrief {
  const jsonBrief = parseResearchJson(rawText);
  if (jsonBrief) {
    return jsonBrief;
  }

  const lines = rawText.split('\n');
  const sections: Partial<Record<keyof ResearchBrief, string[]>> = {};
  let currentKey: keyof ResearchBrief | null = null;
  const hypothesesLines: string[] = [];
  let inHypotheses = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for interview hypotheses section
    if (/^#{1,3}\s*INTERVIEW\s*HYPOTHES/i.test(trimmed) || /^\*\*INTERVIEW\s*HYPOTHES/i.test(trimmed)) {
      inHypotheses = true;
      currentKey = null;
      continue;
    }

    // Check for section headers
    let matched = false;
    for (const { key, patterns } of SECTION_HEADERS) {
      if (patterns.some((p) => p.test(trimmed))) {
        currentKey = key;
        inHypotheses = false;
        if (!sections[key]) sections[key] = [];
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Accumulate content
    if (inHypotheses) {
      if (trimmed) hypothesesLines.push(trimmed);
    } else if (currentKey) {
      if (!sections[currentKey]) sections[currentKey] = [];
      sections[currentKey]!.push(line);
    }
  }

  // If no structured sections found, fall back to keyword-based parsing
  const hasStructuredSections = Object.keys(sections).length >= 3;
  if (!hasStructuredSections) {
    return fallbackParse(rawText);
  }

  // Parse interview hypotheses
  const hypotheses = parseHypotheses(hypothesesLines);

  // Build brief
  const brief: ResearchBrief = {
    createdAt: new Date().toISOString(),
    rawPasteContent: rawText,
  };

  for (const [key, lines] of Object.entries(sections)) {
    const content = (lines as string[]).join('\n').trim();
    if (content) {
      assignSectionContent(brief, key as keyof ResearchBrief, content);
    }
  }

  if (hypotheses.length > 0) {
    brief.interviewHypotheses = hypotheses;
  }

  return brief;
}

function parseResearchJson(rawText: string): ResearchBrief | null {
  const candidates: string[] = [];
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    candidates.push(trimmed);
  }

  const fencedMatches = [...rawText.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fencedMatches) {
    const body = (match[1] || '').trim();
    if (body) candidates.push(body);
  }

  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(rawText.slice(firstBrace, lastBrace + 1).trim());
  }

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeJsonCandidate(candidate);
    const parseAttempts = [candidate, normalizedCandidate].filter(
      (value, index, arr) => value && arr.indexOf(value) === index
    );
    for (const attempt of parseAttempts) {
      try {
        const parsed = JSON.parse(attempt);
        const mapped = mapJsonResearchPayload(parsed, rawText);
        if (mapped) return mapped;
      } catch {
        continue;
      }
    }
  }

  return null;
}

function normalizeJsonCandidate(candidate: string): string {
  return candidate
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^json\s*/i, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // tolerate trailing commas in object/array literals
    .replace(/,\s*([}\]])/g, '$1');
}

function pickJsonField(payload: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (payload[alias] !== undefined && payload[alias] !== null) {
      return payload[alias];
    }
  }
  return undefined;
}

function coerceText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const cleaned = value.trim();
    return cleaned || undefined;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join('\n');
    return joined || undefined;
  }
  if (value && typeof value === 'object') {
    const nested = Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => {
        if (typeof nestedValue === 'string') {
          const cleaned = nestedValue.trim();
          return cleaned ? `${key}: ${cleaned}` : '';
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
    return nested || undefined;
  }
  return undefined;
}

function coerceHypotheses(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof value === 'string') {
    const normalized = value
      .split(/\r?\n|[;]+/)
      .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((line) => line.length > 0);
    return normalized.length > 0 ? normalized : undefined;
  }
  return undefined;
}

function mapJsonResearchPayload(payload: unknown, rawText: string): ResearchBrief | null {
  const root = unwrapResearchRoot(payload);
  if (!root || typeof root !== 'object') return null;

  const record = root as Record<string, unknown>;
  const sectionsValue = pickJsonField(record, ['sections', 'section_map', 'sectionMap']);
  const sections = sectionsValue && typeof sectionsValue === 'object'
    ? (sectionsValue as Record<string, unknown>)
    : null;

  const getField = (aliases: string[]): unknown => {
    const direct = pickJsonField(record, aliases);
    if (direct !== undefined) return direct;
    if (!sections) return undefined;
    return pickJsonField(sections, aliases);
  };

  const brief: ResearchBrief = {
    createdAt: new Date().toISOString(),
    rawPasteContent: rawText,
  };

  brief.companyIdentity = coerceText(getField([
    'companyIdentity',
    'company_identity',
    'companyIdentityConfirmation',
    'company_identity_confirmation',
    'identityConfirmation',
  ]));
  brief.companyOverview = coerceText(getField(['companyOverview', 'company_overview', 'overview']));
  brief.businessModel = coerceText(getField(['businessModel', 'business_model']));
  brief.icp = coerceText(getField(['icp', 'idealCustomerProfile', 'ideal_customer_profile']));
  brief.competitors = coerceText(getField(['competitors', 'competition', 'competitiveLandscape']));
  brief.gtmChannels = coerceText(getField(['gtmChannels', 'gtm_channels', 'goToMarketChannels']));
  brief.orgLeadership = coerceText(getField(['orgLeadership', 'organizationLeadership', 'leadership']));
  brief.compSignals = coerceText(getField(['compSignals', 'compensationSignals', 'compensation_signals']));
  brief.risks = coerceText(getField(['risks', 'riskMap', 'risk_map']));
  brief.interviewHypotheses = coerceHypotheses(
    getField(['interviewHypotheses', 'interview_hypotheses', 'hypotheses'])
  );

  const hasSectionData = Boolean(
    brief.companyIdentity ||
      brief.companyOverview ||
      brief.businessModel ||
      brief.icp ||
      brief.competitors ||
      brief.gtmChannels ||
      brief.orgLeadership ||
      brief.compSignals ||
      brief.risks ||
      (brief.interviewHypotheses && brief.interviewHypotheses.length > 0)
  );

  return hasSectionData ? brief : null;
}

function unwrapResearchRoot(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.find((entry) => entry && typeof entry === 'object');
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const direct = payload as Record<string, unknown>;
  const nestedCandidates = [
    direct.data,
    direct.result,
    direct.output,
    direct.payload,
    direct.research,
    direct.response,
  ];

  for (const candidate of nestedCandidates) {
    if (candidate && typeof candidate === 'object') {
      if (Array.isArray(candidate)) {
        const arrayRoot = candidate.find((entry) => entry && typeof entry === 'object');
        if (arrayRoot) return arrayRoot;
      } else {
        return candidate;
      }
    }
  }

  return payload;
}

function parseHypotheses(lines: string[]): string[] {
  const hypotheses: string[] = [];
  let current = '';
  const itemPattern = /^(\d+[.)]|\*|-|•)/;

  for (const line of lines) {
    // Numbered items or bullet points
    if (itemPattern.test(line)) {
      if (current.trim()) hypotheses.push(current.trim());
      current = line.replace(itemPattern, '').trim();
    } else {
      current += ' ' + line;
    }
  }

  if (current.trim()) hypotheses.push(current.trim());

  return hypotheses.filter((h) => h.length > 10);
}

function assignSectionContent(brief: ResearchBrief, key: keyof ResearchBrief, content: string): void {
  switch (key) {
    case 'companyIdentity':
      brief.companyIdentity = content;
      break;
    case 'companyOverview':
      brief.companyOverview = content;
      break;
    case 'businessModel':
      brief.businessModel = content;
      break;
    case 'icp':
      brief.icp = content;
      break;
    case 'competitors':
      brief.competitors = content;
      break;
    case 'gtmChannels':
      brief.gtmChannels = content;
      break;
    case 'orgLeadership':
      brief.orgLeadership = content;
      break;
    case 'compSignals':
      brief.compSignals = content;
      break;
    case 'risks':
      brief.risks = content;
      break;
    case 'rawPasteContent':
      brief.rawPasteContent = content;
      break;
    case 'createdAt':
      brief.createdAt = content;
      break;
    case 'interviewHypotheses':
      break;
    default:
      break;
  }
}

// Fallback parser for unstructured pastes (original keyword approach)
function fallbackParse(rawText: string): ResearchBrief {
  const sections: Record<string, string> = {};
  const lines = rawText.split('\n');

  let currentSection = 'general';
  let buffer: string[] = [];

  const sectionKeywords: Record<string, string[]> = {
    companyIdentity: ['identity', 'legal name', 'headquarters', 'hq', 'website', 'disambiguation'],
    companyOverview: ['overview', 'about', 'company', 'what does', 'business model', 'core product'],
    businessModel: ['revenue', 'pricing', 'business model', 'monetization', 'how they make money'],
    icp: ['icp', 'ideal customer', 'target market', 'target audience', 'customer profile'],
    competitors: ['competitor', 'competitive', 'market position', 'versus', 'alternative'],
    gtmChannels: ['go-to-market', 'gtm', 'marketing channel', 'acquisition', 'growth strategy'],
    orgLeadership: ['leadership', 'ceo', 'cmo', 'team', 'organization', 'report to'],
    risks: ['risk', 'concern', 'challenge', 'threat', 'weakness'],
    compSignals: ['compensation', 'salary', 'pay', 'benefits', 'equity', 'bonus', 'glassdoor'],
  };

  for (const line of lines) {
    const lower = line.toLowerCase();
    let matched = false;
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some((kw) => lower.includes(kw)) && (line.startsWith('#') || line.startsWith('**') || line.endsWith(':'))) {
        if (buffer.length > 0) {
          sections[currentSection] = (sections[currentSection] || '') + buffer.join('\n');
        }
        currentSection = section;
        buffer = [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    sections[currentSection] = (sections[currentSection] || '') + buffer.join('\n');
  }

  const hypotheses = extractHypotheses(rawText);

  return {
    companyIdentity: sections.companyIdentity?.trim(),
    companyOverview: sections.companyOverview?.trim() || sections.general?.trim(),
    businessModel: sections.businessModel?.trim(),
    icp: sections.icp?.trim(),
    competitors: sections.competitors?.trim(),
    gtmChannels: sections.gtmChannels?.trim(),
    orgLeadership: sections.orgLeadership?.trim(),
    risks: sections.risks?.trim(),
    compSignals: sections.compSignals?.trim(),
    interviewHypotheses: hypotheses,
    rawPasteContent: rawText,
    createdAt: new Date().toISOString(),
  };
}

function extractHypotheses(text: string): string[] {
  const hypotheses: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('growth') || lower.includes('scaling')) {
    hypotheses.push('Company is in growth mode. Likely values systematic scaling approaches over scrappy tactics.');
  }
  if (lower.includes('series') || lower.includes('funding')) {
    hypotheses.push('Recently funded. May have aggressive growth targets tied to the raise.');
  }
  if (lower.includes('new role') || lower.includes('first hire') || lower.includes('building the team')) {
    hypotheses.push('This may be a new function. Expect to define process and build from scratch.');
  }
  if (lower.includes('pivot') || lower.includes('transition') || lower.includes('restructur')) {
    hypotheses.push('Company may be in transition. Probe for clarity on strategic direction and stability.');
  }

  return hypotheses;
}

function extractIndustry(jd: string): string {
  const lower = jd.toLowerCase();
  const industries: Record<string, string[]> = {
    'SaaS / Software': ['saas', 'software', 'platform', 'cloud'],
    'E-commerce': ['ecommerce', 'e-commerce', 'dtc', 'direct-to-consumer', 'shopify'],
    'Fintech': ['fintech', 'financial technology', 'payments', 'banking'],
    'Healthcare': ['health', 'medical', 'clinical', 'pharma'],
    'EdTech': ['edtech', 'education', 'learning'],
    'MarTech': ['martech', 'marketing technology', 'adtech'],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return industry;
    }
  }

  return '';
}

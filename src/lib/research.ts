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

// ============================================================
// Parse Research Results (structured section extraction)
// ============================================================

const SECTION_HEADERS: { key: keyof ResearchBrief; patterns: RegExp[] }[] = [
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
      (brief as Record<string, unknown>)[key] = content;
    }
  }

  if (hypotheses.length > 0) {
    brief.interviewHypotheses = hypotheses;
  }

  return brief;
}

function parseHypotheses(lines: string[]): string[] {
  const hypotheses: string[] = [];
  let current = '';

  for (const line of lines) {
    // Numbered items or bullet points
    if (/^(\d+[.)]|\*|-|•)/.test(line)) {
      if (current.trim()) hypotheses.push(current.trim());
      current = line.replace(/^(\d+[.)]|\*|-|•)\s*/, '');
    } else {
      current += ' ' + line;
    }
  }

  if (current.trim()) hypotheses.push(current.trim());

  return hypotheses.filter((h) => h.length > 10);
}

// Fallback parser for unstructured pastes (original keyword approach)
function fallbackParse(rawText: string): ResearchBrief {
  const sections: Record<string, string> = {};
  const lines = rawText.split('\n');

  let currentSection = 'general';
  let buffer: string[] = [];

  const sectionKeywords: Record<string, string[]> = {
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

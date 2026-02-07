// Job Filter v2 — Perplexity Research Runner
// Generates prompt packs for Perplexity Pro. No API cost.
// User runs in Perplexity with their subscription, pastes results back.

import type { Job, ResearchBrief } from '../types';

// ============================================================
// Generate Research Prompt Pack
// ============================================================

export function generateResearchPrompts(job: Job): ResearchPrompt[] {
  const company = job.company;
  const title = job.title;
  const industry = extractIndustry(job.jobDescription);

  return [
    {
      id: 'company-overview',
      label: 'Company Overview & Business Model',
      prompt: `Research ${company} thoroughly. I need:
1. What does ${company} do? Core products/services and value proposition.
2. Business model: How do they make money? Pricing, revenue streams, target market.
3. Company stage: Funding history, revenue estimates, employee count, growth trajectory.
4. Recent news: Any major announcements, product launches, pivots, or leadership changes in the last 12 months.
5. Glassdoor/culture signals: What do employees say about working there?

Focus on facts. Cite sources where possible.`,
    },
    {
      id: 'gtm-channels',
      label: 'GTM Strategy & Marketing Channels',
      prompt: `Analyze ${company}'s go-to-market strategy and marketing approach:
1. What marketing channels do they use? (paid, organic, content, events, partnerships, etc.)
2. What does their website traffic look like? (estimate from SimilarWeb or similar)
3. What is their content strategy? (blog, podcast, social media presence)
4. Who is their ICP (ideal customer profile)? B2B, B2C, or both?
5. What is their buying motion? (self-serve, sales-led, hybrid)
6. Any observable marketing tech stack? (check job postings, case studies, integrations pages)

I'm evaluating a ${title} role there, so focus on what a marketing/growth leader would need to know.`,
    },
    {
      id: 'competitors',
      label: 'Competitors & Market Position',
      prompt: `Map ${company}'s competitive landscape:
1. Who are their top 3-5 direct competitors?
2. How does ${company} differentiate? (product, pricing, market position)
3. What is their market share or position relative to competitors?
4. Are they in a growing, mature, or declining market?
5. What competitive threats should a new marketing/growth leader be aware of?
${industry ? `6. Key trends in the ${industry} industry that affect their positioning.` : ''}`,
    },
    {
      id: 'org-leadership',
      label: 'Organization & Leadership',
      prompt: `Research ${company}'s leadership and organizational structure:
1. Who is the CEO? Background and leadership style signals.
2. Who is the CMO/VP Marketing/Head of Growth? (or is this role being filled for the first time?)
3. How big is the marketing/growth team? Any LinkedIn signals?
4. Who would this ${title} role likely report to?
5. Any recent leadership changes, departures, or reorgs?
6. Board members or investors who might influence strategy.`,
    },
    {
      id: 'comp-signals',
      label: 'Compensation & Role Intelligence',
      prompt: `Research compensation and role details for a ${title} at ${company}:
1. What do similar roles at ${company} pay? Check Glassdoor, Levels.fyi, Blind, Payscale.
2. What do comparable ${title} roles pay at similar companies in this space?
3. What benefits does ${company} offer? (medical, dental, 401k, equity, bonus)
4. Are there any other open roles that suggest team growth or organizational changes?
5. What does the interview process typically look like for leadership roles at ${company}?`,
    },
  ];
}

export interface ResearchPrompt {
  id: string;
  label: string;
  prompt: string;
}

// ============================================================
// Parse Research Results
// ============================================================

export function parseResearchPaste(rawText: string): ResearchBrief {
  // Simple section detection from pasted Perplexity output
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

    // Check if this line starts a new section
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

  // Flush remaining buffer
  if (buffer.length > 0) {
    sections[currentSection] = (sections[currentSection] || '') + buffer.join('\n');
  }

  // Extract interview hypotheses from the content
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

  // Generate hypotheses based on content signals
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
  if (lower.includes('competitor') && (lower.includes('behind') || lower.includes('catching up'))) {
    hypotheses.push('Competitive pressure may create urgency. Validate that expectations are realistic.');
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

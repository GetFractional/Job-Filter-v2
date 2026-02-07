---
id: perplexity-research-v1
type: prompt-pack
version: 1
default_model_tier: tier-2
tone: "Research-oriented, specific, designed to extract actionable intelligence from Perplexity AI. Each prompt should yield structured, cited output."
variables:
  - company_name
  - job_title
  - industry
---

# Perplexity Research Prompt Pack: {{company_name}}

**Target role:** {{job_title}}
**Industry:** {{industry}}

Use the following prompts in Perplexity AI to build a research dossier on {{company_name}}. Run each prompt separately for best results. Save the outputs as source material for the growth memo, outreach email, and cover letter.

---

## Prompt 1: Company Overview and Business Model

```
Give me a detailed overview of {{company_name}} in the {{industry}} space. Cover:
- What the company does and who it serves
- Primary revenue model (SaaS, marketplace, services, etc.)
- Current scale (revenue, headcount, customers if available)
- Key products or service lines
- Founding story and mission

Cite all sources.
```

---

## Prompt 2: Go-to-Market Strategy and Channels

```
How does {{company_name}} acquire and retain customers? Cover:
- Primary marketing and sales channels (inbound, outbound, PLG, partnerships, etc.)
- Pricing strategy and packaging
- Target customer segments and ICP
- Any publicly known CAC, LTV, or conversion benchmarks
- Recent GTM shifts or experiments mentioned in press, podcasts, or blog posts

Cite all sources.
```

---

## Prompt 3: Leadership and Organizational Structure

```
Who are the key leaders at {{company_name}}? Cover:
- CEO, founders, and C-suite executives
- VP or Director of Marketing, Growth, or the team most relevant to the {{job_title}} role
- Board members or notable investors
- Recent leadership changes or key hires
- Company culture signals from Glassdoor, LinkedIn, or interviews

Cite all sources.
```

---

## Prompt 4: Competitors and Market Positioning

```
Who are {{company_name}}'s primary competitors in the {{industry}} market? Cover:
- Direct competitors (same product category)
- Indirect competitors (alternative solutions to the same problem)
- How {{company_name}} differentiates (pricing, features, brand, distribution)
- Market share or ranking if available
- Strengths and weaknesses vs. top 3 competitors

Cite all sources.
```

---

## Prompt 5: Recent News, Funding, and Strategic Moves

```
What has happened at {{company_name}} in the last 12 months? Cover:
- Funding rounds, valuations, or financial milestones
- Product launches or major feature releases
- Partnerships, acquisitions, or market expansions
- Press coverage, awards, or notable mentions
- Any layoffs, restructuring, or strategic pivots

Cite all sources.
```

---

## How to Use These Outputs

1. Save each response in your research folder for this company.
2. Extract key insights that map to the role you are targeting.
3. Identify 2-3 company-specific insights for use in `{{company_insight}}` fields across outreach and cover letter templates.
4. Flag any red flags or risks for the growth memo assumptions section.
5. Note the names and roles of people you may want to contact for outreach.

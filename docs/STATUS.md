# Status -- 2026-02-07

> **Purpose:** Daily snapshot of project health. Update this file whenever meaningful progress occurs. Keep it honest and brief.

---

## What's Working End-to-End

- **PWA app shell** -- Mobile-first layout with bottom navigation (Pipeline, Dashboard, Contacts, Settings). Builds as installable PWA with service worker.
- **Job capture** -- Slide-up modal captures title, company, URL, location, location type, source, and full job description paste.
- **Instant fit scoring** -- Deterministic client-side scoring engine evaluates: role scope (30pts), compensation (25pts), company stage (20pts), domain fit (15pts), risk flags (-10pts). Hard disqualifiers for paid media operator, seed-stage, comp below floor.
- **Pipeline view** -- Jobs grouped by stage categories (Sourcing, Qualification, Conversion, Revenue) with summary stats. Tap any job to open workspace.
- **Job workspace** -- Tabbed workspace per job: Score | Research | Assets | CRM. Score tab shows animated score dial, fit label, disqualifiers, reasons to pursue/pass, red flags, requirements extracted, score breakdown bars, stage navigation buttons.
- **Perplexity research runner** -- Generates 5-prompt pack tailored to company/role. Copy-to-clipboard per prompt. "Open Perplexity" button. Paste results back and parse into structured research brief.
- **Asset generation** -- Template-based generation (no API cost) for: Outreach Email, LinkedIn Connect Note (300 char), Cover Letter, Follow-up Email, Annual Growth Plan memo. All claim-ledger-aware. Copy-to-clipboard, approve/version tracking.
- **Mini-CRM** -- Add contacts linked to companies, log activities with channel/direction/outcome/follow-up dates. Activity timeline view.
- **Executive dashboard** -- Captured/week with trend delta, pursue rate, outreach volume, response rate, pipeline-by-stage bar chart, conversion rate metrics.
- **Bottleneck dashboard** -- Stage conversion funnel, median time-in-stage, stalled jobs list.
- **Settings** -- Profile editor (target roles, comp floor/target, benefits, disqualifiers), claim ledger (paste resume/LinkedIn, parse into structured claims), data export (JSON), data clear.
- **Design system** -- Tailwind v4 with custom brand palette, neutral palette, status colors, premium typography, smooth transitions.
- **Data layer** -- IndexedDB via Dexie.js with 11 tables. Zustand store for reactive state. Offline-first.
- **Template library** -- 7 template files with YAML frontmatter (ID, type, version, model tier, variables).
- **Generation logging** -- Every asset generation logs model_used, template_id, model_tier, estimated_cost for experimentation.

---

## What's Next

1. **Test with real job data** -- Capture 3-5 real job postings and validate scoring accuracy.
2. **Claim ledger population** -- Matt provides resume/LinkedIn text, populate ledger, verify asset personalization.
3. **Airtable sync layer** -- Once Airtable base details are provided, add sync adapter.
4. **Score calibration** -- After accumulating outcomes, adjust scoring weights.
5. **Unit tests** -- Add tests for scoring engine and metrics calculations.
6. **Deploy to hosting** -- Vercel or Netlify deployment for mobile access.

---

## What's Blocked

| Item | Blocked By | Severity | Workaround |
|------|-----------|----------|------------|
| Airtable sync | Need API key + base ID from Matt | Low | IndexedDB local storage works fully |
| Claim ledger personalization | Need resume/LinkedIn text from Matt | Low | Assets generate with placeholder claims |
| Real model API integration | Need API keys for OpenAI/Anthropic/etc | Low | Template-fill works at tier-0 cost ($0) |

---

## Key Metrics (will populate after first real usage)

- Jobs captured: --
- Jobs scored: --
- Pursue rate: --
- Outreach sent: --
- Response rate: --

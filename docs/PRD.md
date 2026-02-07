# Product Requirements Document

> **Source of truth:** [MASTER_PLAN.md](./MASTER_PLAN.md) is the comprehensive reference for vision, architecture, data model, scoring rubric, UX spec, and execution phases. This PRD is a concise summary for quick orientation. When in doubt, defer to the master plan.

---

## 1. Target User

A single senior marketing/growth executive (Director, Head, VP level) actively searching for roles at $150K-$200K+ base with full benefits (medical + dental for dependents). The user:

- Evaluates 15-25 job opportunities per week across multiple sources (LinkedIn, Indeed, career pages, referrals).
- Needs to quickly disqualify poor fits (paid media operator roles, seed-stage companies, low comp).
- Manually manages outreach, follow-ups, and interview prep across spreadsheets, notes, and memory.
- Has a Perplexity subscription for research but no structured workflow for using it.
- Operates primarily from a phone, with occasional desktop sessions.

---

## 2. Problem

Job searching at the executive level is a conversion funnel, but it is managed with consumer-grade tools that provide no pipeline visibility, no scoring discipline, no template optimization, and no outcome attribution. This leads to:

- **Wasted time** on roles that are obvious misfits (wrong level, wrong comp, wrong stage).
- **Inconsistent outreach** with no way to know which messages work.
- **Lost context** when juggling 20+ active opportunities across stages.
- **Risk of fabricated claims** when drafting materials under time pressure.
- **No feedback loop** to improve targeting or messaging over time.

---

## 3. Solution

Job Filter v2 is a mobile-first PWA that operates as a personal "job revenue cockpit." It provides:

- **Fast capture and qualification:** Paste a job description, get a fit score in under 1 second, and move to the next action.
- **Pipeline management:** Kanban and table views across 11 defined stages from Discovered to Closed Won/Lost.
- **Research workflow:** Structured prompt packs for Perplexity, with structured research briefs stored per job.
- **Asset generation:** Template-based outreach, cover letters, and growth memos with claim ledger enforcement (no hallucinated facts).
- **Mini-CRM:** Contacts, activities, and follow-up tracking per job.
- **Dashboards:** Executive funnel view and bottleneck analysis.
- **Experimentation:** Template versioning and A/B testing with outcome attribution.

All data is stored locally (IndexedDB) with no server dependency. The system works offline.

---

## 4. MVP Scope (M0-M1)

The MVP delivers the core loop: **capture a job, score it, and manage it through the pipeline.**

### In scope:

- PWA scaffold with mobile-first responsive design
- Job capture form (title, company, URL, location, paste JD)
- Deterministic scoring engine with hard disqualifiers and weighted rubric
- Score display: fit score, label (Pursue/Maybe/Pass), reasons, red flags
- Pipeline kanban view with drag-and-drop stage management
- Pipeline table view with sorting and filtering
- Job workspace shell (tabbed: Score / Research / Assets / CRM / Notes)
- IndexedDB persistence via Dexie.js
- Offline functionality
- Data export/import (JSON)

### Out of scope for MVP:

- AI model API integration (clipboard workflow only)
- Airtable sync
- Desktop capture extension
- Research runner (M2)
- Asset generation (M2)
- CRM and dashboards (M3)
- Experimentation framework (M4)

---

## 5. Success Metrics

### MVP success (after 2 weeks of use):

| Metric | Target | Rationale |
|--------|--------|-----------|
| Time-to-qualify | < 20 seconds | Must be faster than current manual scan |
| Jobs captured per week | 15+ | Must not create friction that reduces throughput |
| False positive rate | < 30% | Initial tolerance; calibrate down to < 20% |
| PWA used on mobile | 3+ days/week | Must be genuinely mobile-usable, not desktop-only |
| Data survives page reload | 100% | IndexedDB persistence must be reliable |

### Full product success (after M3):

| Metric | Target | Rationale |
|--------|--------|-----------|
| Time-to-outreach | < 2 minutes from capture | Speed is the primary leverage point |
| Response rate | 15-25% | Competitive for cold/warm outreach at this level |
| Pursue-to-screen conversion | 20%+ | Validates scoring + outreach quality |
| False positive rate | < 20% | Calibrated scoring is working |
| Template with measurable winner | 1+ | Experimentation framework produces actionable data |

---

## 6. Constraints

### Technical constraints:

- **No backend server.** The PWA is a static client-side application. All logic runs in the browser. This simplifies deployment but means no server-side API proxying.
- **No real-time collaboration.** Single-user system. Multi-user is explicitly out of scope (MASTER_PLAN Section 4.4).
- **Browser storage limits.** IndexedDB is the persistence layer. While limits are generous (hundreds of MB), there is no cloud backup until Airtable sync is implemented.
- **PWA limitations on iOS.** Safari's service worker and IndexedDB support has improved but has edge cases. Test on real devices.

### Product constraints:

- **LinkedIn safety is non-negotiable.** No scraping, no automation, no DOM injection. Paste-only capture. See COMPLIANCE.md.
- **Claim ledger enforcement is non-negotiable.** No hallucinated professional claims in generated assets. See COMPLIANCE.md.
- **Cost control.** AI model costs must be logged and capped. Default to clipboard workflow; real APIs are opt-in.
- **Scope discipline.** Features not in the current milestone are deferred, not hacked in. See IMPLEMENTATION_PLAN.md.

### Design constraints:

- **Mobile-first.** Every screen must be fully functional on a 375px viewport (iPhone SE). Desktop is a progressive enhancement.
- **Premium aesthetic.** The UI must feel like a professional tool, not a hackathon project. Typography, spacing, and interaction quality matter.
- **Low cognitive load.** "Next best action" should always be obvious. No dead ends, no ambiguous states.

---

## 7. Dependencies

| Dependency | Status | Risk |
|-----------|--------|------|
| Node.js 18+ | Available | None |
| Dexie.js | Stable, well-maintained | Low |
| Zustand | Stable, well-maintained | Low |
| vite-plugin-pwa | Stable | Low |
| Tailwind CSS | Stable | Low |
| AI model APIs (OpenAI, Anthropic) | Not needed for MVP | Deferred |
| Airtable API | Not needed for MVP | Deferred |
| Perplexity subscription | User has one | External dependency for research workflow |

---

## 8. Open Questions

| Question | Impact | Decision Needed By |
|---------|--------|-------------------|
| What is the company stage floor? (Series A+ vs B+ vs profitable only) | Affects disqualifier rules | Before scoring engine ships (M1) |
| Should seed-stage exceptions exist? (e.g., base >= $200K and resourced) | Affects disqualifier rules | Before scoring engine ships (M1) |
| Which Perplexity prompts produce the best research briefs? | Affects research runner templates | Before M2 |
| What outreach tone converts best for this user's target roles? | Affects template library | Iterative, experiment-driven |

---

## 9. References

- [MASTER_PLAN.md](./MASTER_PLAN.md) -- Comprehensive product vision and architecture
- [SCHEMA.md](./SCHEMA.md) -- Data model for all 9 entities
- [DECISIONS.md](./DECISIONS.md) -- Architectural decision log
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) -- Milestone tracker
- [COMPLIANCE.md](./COMPLIANCE.md) -- Safety and guardrails
- [EVALUATION.md](./EVALUATION.md) -- Metrics and calibration methodology
- [RUNBOOK.md](./RUNBOOK.md) -- Setup and deployment guide

# Job Filter v2 — Master Plan, PRD, and Orchestrated Expert Team (MECE, Thorough)

> **Purpose:** A premium, mobile-first system that finds, qualifies, researches, and converts job opportunities into **Closed Won** offers—while continuously optimizing itself with measurable feedback loops.

---

## 0) Executive overview

### 0.1 Vision

A premium “job revenue cockpit” that reduces cognitive load and maximizes your odds of landing **Director/Head/VP** Marketing/Growth/Revenue roles at **\$180K+** base (floor **\$150K**) with **medical + dental (you + kids)** and ideally **401(k), bonus, equity/shares**.

### 0.2 North Star outcome

**Closed Won** offers with:

- highest defensible total comp
- highest role leverage (scope/authority/resources)
- lowest mismatch risk (no “paid media operator” trap)

### 0.3 Non-negotiables

- **Truthfulness:** assets must not invent your experience (claim ledger enforced).
- **Cost control:** model routing (cheap where possible; premium where it matters).
- **Low cognitive load:** “next-best action” oriented.
- **Works across job sources:** LinkedIn + Indeed + ATS + career pages + referrals.
- **Mobile-first:** core workflow usable from phone.

### 0.4 Primary KPI set

**Speed & throughput**

- Time-to-qualify a captured job: < 20 seconds
- Time-to-outreach from capture: < 2 minutes

**Funnel conversion**

- Pursue rate (qualified share)
- Response rate (by channel)
- Screen rate
- Interview advance rate
- Offer rate
- Closed won rate

**Outcome**

- Total comp achieved (base + bonus + equity value)
- Time-to-offer (median and p90)

**Quality control**

- False positives (bad fits labeled pursue)
- False negatives (great fits labeled pass)

---

## 1) First principles and reasoning frameworks

### 1.1 First principles (what job search really is)

A job search is a measurable conversion funnel:

1. **Supply**: discover roles
2. **Qualification**: score fit + disqualify bad fits
3. **Conversion**: outreach → interviews
4. **Revenue**: offer → negotiation → close

Therefore Job Filter must operate like a growth system:

- standardized inputs
- consistent decision logic
- instrumentation + attribution
- feedback loops that improve targeting and messaging

### 1.2 Inversion (what we must prevent)

- Spending time on roles you can’t win
- Getting hired into a role that expects hands-on paid account management
- Seed-stage pressure where you become the “make it viable” scapegoat
- Non-verifiable claims that get exposed in interviews
- Paying premium inference costs for low-leverage tasks
- Fragile capture workflows that break on different sites

### 1.3 Second-order thinking (downstream impacts)

- If the workflow is complex, usage drops → no data → no optimization
- If you lose LinkedIn access, future job leverage drops
- If you don’t measure template performance, you will optimize for “what feels good,” not what converts

### 1.4 Systems thinking (inputs → decisions → outputs → outcomes)

**Inputs:** job text, company signals, your profile ledger, research intel
**Decisions:** pass/maybe/pursue, who to contact, what message to use, what assets to generate
**Outputs:** research brief, assets, outreach messages, interview prep
**Outcomes:** replies, screens, interviews, offers, comp
**Feedback:** adjust scoring weights, template selection, job targeting

---

## 2) Orchestrated expert team (MECE) — roles, deliverables, and orchestration

> You are the client. I run the team like a product studio. Each role has clear outputs and acceptance criteria.

### 2.1 Product + Strategy

1. **Product Lead / Systems Architect (orchestrator)**

- Own PRD, scope control, sequencing, decision discipline
- Define success metrics, instrumentation, and iteration cadence

2. **Business Strategist (monetization & wedge)**

- Define v1 (you) and v2 (market) ICPs
- Identify defensible differentiation and pricing path

3. **Market Research Analyst (competitive teardown)**

- Feature parity map vs leading job trackers
- Identify “table stakes” vs “wedge” vs “delighters”

### 2.2 UX + Brand (premium feel)

4. **UX Architect (mobile-first)**

- Information architecture, navigation, minimal steps
- One job = one workspace

5. **UI Designer (design system)**

- Typography, spacing, components, states
- Premium aesthetic, accessibility, responsive polish

6. **UX Writer (microcopy & guidance)**

- Stage labels, CTAs, empty states, warnings
- Mentor-like tone: crisp, calm, directive

### 2.3 Engineering

7. **Tech Lead (architecture)**

- Repo standards, CI gates, performance budgets
- Data + API design

8. **Frontend Engineer (PWA)**

- Mobile-first implementation
- Offline-first queue for capture/outreach drafts

9. **Capture Accelerator Engineer (desktop helper)**

- Chrome side panel and capture utilities
- Site support + fallback modes

10. **Data/Integrations Engineer (Airtable + sync)**

- Schema mapping, sync reliability, audit trails

### 2.4 AI + Evaluation

11. **LLM Engineer (model routing & adapters)**

- Task-to-model mapping, provider adapters, cost controls

12. **Evaluation Scientist (calibration)**

- Score calibration, false positive/negative analysis
- Experiment design for templates/models

13. **Template Librarian (Alen-style output system)**

- Template library + versioning
- Output constraints: no hallucinations, proof-led structure

### 2.5 Compliance + Security

14. **Risk/Compliance Advisor**

- Guardrails for platform behavior and sensitive actions
- Default safe capture flows

15. **Security Engineer (lightweight v1)**

- Secrets handling, minimal permissions
- OAuth hygiene if email integration is added later

### 2.6 Orchestration model (how the team executes)

- **Weekly cadence:** Plan → Build → Measure → Improve
- **Definition of Done:** feature meets acceptance criteria + instrumentation + tests
- **Decision log:** all key decisions recorded (scope, weights, thresholds, models)

---

## 3) Design thinking process (practical)

### 3.1 Discover

- Map your current workflow end-to-end
- Identify time sinks and emotional friction

### 3.2 Define

- Lock your non-negotiables: comp, benefits, remote/hybrid, disqualifiers
- Define win conditions for each role type

### 3.3 Ideate

- Multiple capture modes
- Research runner without API costs
- Templates + experimentation + attribution

### 3.4 Prototype

- Clickable prototype of the PWA flows
- Then build MVP with only the essentials

### 3.5 Test

- Weekly funnel metrics + template leaderboards
- Kill/keep decisions based on outcomes

---

## 4) MoSCoW scope (avoid overengineering)

### 4.1 MUST (ship in v1)

- Mobile-first **PWA** (core cockpit)
- Jobs pipeline with clear stages
- Fast fit score + disqualifiers
- Research runner workflow (Perplexity without API spend)
- Asset generation v1: growth memo + cover letter + outreach
- Mini-CRM v1: companies, contacts, activity log
- Dashboards v1: funnel + bottlenecks
- Claim ledger: no invented facts
- Model routing + per-task model selection
- Versioning for assets and outreach templates

### 4.2 SHOULD

- Desktop capture accelerator (extension or bookmarklet)
- Experiment dashboard (templates + models)
- Next-best-action recommendations

### 4.3 COULD

- Email auto-log (Gmail/Outlook)
- SMS integration (Twilio)
- Automated discovery feeds (alerts parsing, ATS JSON)
- Bandit optimization for templates

### 4.4 WON’T (for v1)

- Auto-apply at scale
- Anything that materially increases account risk
- Multi-user enterprise features

---

## 5) Product shape and platform choices

### 5.1 Recommended form factor

- **Core:** PWA (mobile + desktop)
- **Optional accelerator:** desktop capture helper

### 5.2 Why this structure works

- PWA supports your mobile-first goal
- Desktop helper increases capture speed when you’re at a computer
- Airtable remains system-of-record while UI hides complexity

### 5.3 Capture interoperability (desktop ↔ mobile)

- Any job captured anywhere becomes a “workspace” you can complete later
- Offline queue on mobile to draft outreach/assets, then sync

---

## 6) End-to-end user flows (fast, low-friction)

### Flow A — Discover and capture

1. Add job via URL + title + company
2. Add JD (paste or highlight-to-capture)
3. Auto-parse and store

### Flow B — Qualify

1. Fit score and disqualifiers
2. One tap: Pass / Maybe / Pursue
3. If Pursue: auto-generate next actions (research, identify contacts, outreach)

### Flow C — Research runner

1. Click “Run Research”
2. App generates Perplexity prompt pack (copy/open)
3. Paste structured output back

### Flow D — Assets

1. Choose asset type
2. Choose model (default recommended)
3. Generate → edit → approve
4. Versioned, templated, attributed

### Flow E — Outreach + follow-up

1. Choose contact + channel
2. Generate personalized message
3. Copy/paste and send
4. Log activity + schedule follow-up

---

## 7) Pipeline stages (job funnel definitions)

### 7.1 Stages (MECE)

**Sourcing**

1. **Discovered**: found/ingested but not yet fully captured
2. **Captured**: URL + JD stored

**Qualification**
3\) **Scored**: Pass/Maybe/Pursue decided
4\) **Researched**: intel complete

**Conversion**
5\) **Assets Ready**: core assets created for this role
6\) **Outreach Sent**: first contact attempt logged
7\) **Response/Screen Scheduled**
8\) **Interviewing**: rounds + assignments tracked

**Revenue**
9\) **Offer**
10\) **Negotiation**
11\) **Closed Won / Closed Lost**

### 7.2 Stage entry/exit rules (avoid ambiguity)

- A job can’t move to Captured without a JD
- A job can’t move to Researched without a structured research brief
- A job can’t move to Outreach Sent without an activity log event

---

## 8) Data model (CRM + funnel + experimentation)

> **Goal:** every insight and automation depends on clean data.

### 8.1 Core entities (MECE)

1. **Profile** (your truth source)
2. **Jobs**
3. **Companies**
4. **Contacts**
5. **Activities** (messages, calls, meetings)
6. **Assets** (memo, cover letter, outreach, interview pack)
7. **Templates** (prompt + output templates)
8. **Experiments** (A/B tests, comparisons)
9. **Outcomes** (stage events + offer/close)

### 8.2 Required fields (v1)

**Jobs**

- Job ID (canonical)
- Title, company, URL, location, remote/hybrid
- Employment type, comp range (if known)
- Stage, stage timestamps
- Fit score, fit label, disqualifiers
- Requirements extracted (skills, years, tools)
- “Why pursue” and “why pass” arrays

**Companies**

- Name, website
- Stage estimate (seed/A/B/C/public/profitable)
- Industry, business model guess
- Notes + risk flags

**Contacts**

- Name, role, channel handles (email/LI/phone)
- Relationship type (recruiter, HM, referrer)

**Activities**

- Channel, date/time
- Contact link + job link
- Template ID used (if outbound)
- Outcome tag (reply, screen scheduled, etc.)

**Assets**

- Asset type
- Version
- Model used
- Template ID
- Approved flag
- Link to job

**Templates**

- Template ID, asset type
- Prompt text
- Variables required
- Default model

**Experiments**

- Experiment ID
- Type (A/B, multivariate, bandit later)
- Variant definitions (template IDs)
- Start/end dates
- Success metric

---

## 9) Scoring engine (deterministic + calibratable)

### 9.1 Hard disqualifiers (instant Pass)

- Paid account management as core expectation (performance marketing operator)
- Seed-stage (unless explicit override)
- Base salary clearly below \$150K
- Benefits clearly exclude dependents for medical/dental

### 9.2 Weighted score (0–100)

A) Role scope & authority (30)

- Systems ownership, strategy, cross-functional leverage

B) Compensation & benefits (25)

- Base ≥ 150K; bonus points for ≥ 180K
- Medical/dental; 401(k); bonus; equity

C) Company stage / ability to pay (20)

- Penalize seed; reward established

D) Domain fit (15)

- Growth systems, lifecycle, GTM ops, ecom/B2C preference

E) Risk flags (−0 to −10)

- “miracle needed,” vague scope, unrealistic KPIs without resources

### 9.3 Score outputs per job

- Fit label: Pursue / Maybe / Pass
- Reasons to pursue (top 5)
- Reasons to pass (top 5)
- Red flags
- Interview focus areas
- 30/60/90 day hypotheses

### 9.4 Calibration loop

- Track conversion outcomes by score band
- Adjust weights if high-score jobs underperform or low-score jobs overperform

---

## 10) Claim ledger (no hallucinations)

### 10.1 Profile ingestion options

- Upload resume OR paste LinkedIn experience text

### 10.2 Structured outputs

- Roles, companies, dates
- Responsibilities
- Tools and platforms
- Outcomes/metrics (only if explicitly present)

### 10.3 Claim enforcement

Every asset must:

- cite a ledger claim, OR
- use safe, non-numeric capability language

---

## 11) Research system (Perplexity workflow without API costs)

### 11.1 Research brief schema (structured)

- Company overview + business model
- ICP + buying motion
- Competitors + positioning
- GTM channels + funnel assumptions
- Org + leadership signals
- Risks + mitigations
- Interview hypothesis list
- Compensation signals (if discoverable)

### 11.2 Research runner

- Generates a “prompt pack” tailored to job type and company
- You run in Perplexity with your subscription
- Paste back results → system structures fields

---

## 12) AI system (model routing + cost optimization)

### 12.1 Principle

Use the cheapest model that reliably completes the task.

### 12.2 Task routing defaults

**Tier 0 (free/local)**

- Extraction, classification, disqualifiers, structuring

**Tier 1 (low-cost)**

- First drafts of outreach, summaries, structured transforms

**Tier 2 (premium)**

- Growth memo, executive outreach, negotiation scripts, interview pack

### 12.3 Model selection UI

Settings → Models:

- Scoring model
- Outreach model
- Memo model
- Interview pack model
- Negotiation model

Every generation logs:

- model
- template ID
- prompt ID
- estimated cost
- downstream outcome attribution

---

## 13) Asset system (standard library + versioning)

### 13.1 Required assets (v1)

- Annual Growth Plan memo (strategic exec memo)

  - 30-day diagnostic
  - quarterly plan for year 1
  - years 2–3 vision
  - assumptions, risks, mitigations
  - “Why me” anchored to claim ledger

- Cover letter

  - open-loop teaser to the memo
  - proof-led bullets (claims only)

- Outreach

  - email version
  - 300-char connect note
  - follow-up sequence (optional)

### 13.2 Optional assets (v2)

- Interview pack
- Negotiation pack

### 13.3 Template governance

- Each template has: ID, purpose, variables, default model, tone
- Each output has: version, approvals, outcomes

---

## 14) Mini-CRM (contacts + correspondence)

### 14.1 Entities

- Company
- Contact
- Job
- Activity

### 14.2 Channels

- Email (manual log v1; integration later)
- LinkedIn (manual)
- Text (manual v1)

### 14.3 Outcome tracking per contact

- reply received
- call scheduled
- referral offered

---

## 15) BI dashboards (actionable, not vanity)

### 15.1 Executive dashboard (daily)

- Captured per week
- Pursue rate
- Outreach volume
- Response rate
- Interviews scheduled
- Offers
- Pipeline inventory by stage

### 15.2 Bottleneck dashboard

- Conversion by stage
- Time-in-stage (median, p90)
- Stalled items (no activity > X days)

### 15.3 Experiment dashboard (templates + models)

- Template leaderboards (response/interview/offer rate)
- Asset version impact
- Model cost vs outcome lift

### 15.4 Coach dashboard (recommendations)

- Next-best actions
- Suggested follow-ups
- Suggested templates to use
- Suggested role types to prioritize based on outcomes

---

## 16) Premium UX/UI spec (what “beautiful” means)

### 16.1 UX principles

- One job = one workspace
- Few clicks, keyboard-friendly on desktop
- Smart defaults set by your profile
- Next-best action always visible

### 16.2 UI principles

- Premium typography scale, clear hierarchy
- Consistent spacing, calm color system
- Subtle motion for state transitions
- Excellent empty states and loading states

### 16.3 Screens (v1)

1. Today (next actions)
2. Pipeline (kanban + table)
3. Job Workspace (Score / Research / Assets / CRM)
4. Companies
5. Contacts
6. Analytics
7. Settings

---

## 17) Technical architecture (v1)

### 17.1 Systems

- PWA frontend
- Airtable as system-of-record
- Model adapter layer (pluggable)
- Optional desktop capture helper

### 17.2 Reliability

- Offline-first local queue
- Sync conflict handling
- Versioned assets and stage timestamps

### 17.3 Performance budgets

- Fast load
- Minimal network calls
- Background sync

---

## 18) Security, privacy, and guardrails

### 18.1 Security baseline

- Minimal permissions
- Secrets never stored in client unencrypted
- Rate limiting and logging for external calls

### 18.2 Privacy baseline

- Clear separation of personal profile data
- Export/delete capability

### 18.3 Guardrails

- Default to safe behavior on high-risk sites
- Avoid automated actions that could jeopardize accounts

---

## 19) Execution plan (phased, with deliverables)

### Phase 0 — Decisions + design sprint (2–3 days)

Deliverables:

- Locked pipeline + definitions
- Locked scoring v1 + disqualifiers
- Wireframes + IA
- Data model + schema map

### Phase 1 — MVP PWA (1–2 weeks)

Deliverables:

- PWA pipeline + job workspace
- Fit scoring + disqualifier engine
- Research runner + structured research brief
- Asset generator v1 + versioning
- Mini-CRM + activity log
- Executive + bottleneck dashboards

### Phase 2 — Capture accelerator (1–2 weeks)

Deliverables:

- Desktop helper (extension/bookmarklet)
- Multi-site capture modes + fallbacks
- Clipboard assist

### Phase 3 — Optimization loop (2–4 weeks)

Deliverables:

- Experiment tracking
- Template/model leaderboards
- Weekly optimization report
- Recommendations engine v1

### Phase 4 — Productization (optional)

Deliverables:

- Multi-user settings
- Onboarding + billing scaffolding
- Compliance and privacy hardening

---

## 20) Decision log (must answer to remove ambiguity)

1. Optimize for:

- Highest total comp
- Fastest offer
- Highest offer probability

2. Company-stage floor:

- Series A+
- Series B+
- Profitable only

3. Seed-stage exceptions:

- Absolute ban
- Exceptions allowed if base ≥ \$200K and clearly resourced

4. Desktop capture helper:

- Extension
- Bookmarklet-first


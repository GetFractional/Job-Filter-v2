# Job Filter PRD v2

Last updated: 2026-03-06

## 1. Document Intent

This PRD replaces broad founder-brain planning with a build-ready product narrative that is:

- narrower on who the first customer is
- explicit about current state versus target state
- strict about truthfulness and anti-hallucination controls
- detailed enough for Codex to execute without inventing product behavior

## 2. Reality Check

### 2.1 Verified current product state

The current repo is not yet an integrated SaaS plus extension product.

It is a local-first PWA with:

- deterministic scoring
- pipeline and job workspace views
- claims import and review flows
- research and asset-generation helpers
- CRM and dashboard surfaces
- offline persistence through IndexedDB

It does not yet contain verified production-grade implementations for:

- Chrome extension capture
- backend auth
- multi-tenant SaaS data model
- billing and entitlements
- referral tracking
- real model-routing infrastructure

### 2.2 Verified workflow state

ClickUp currently shows two active `in development` tasks and two open GitHub PRs tied to claims review and onboarding/job-feeds UX. That means the near-term implementation baseline is still trust hardening and activation, not full SaaS expansion.

### 2.3 Consequence

The product plan must describe three layers separately:

1. Current product reality
2. Next validated build phases
3. Longer-range target-state SaaS vision

If those layers are blended together, future AI agents will overstate what already exists.

## 3. Product Thesis

Job Filter should be built as a truthful job conversion operating system for serious operators, not as a generic job tracker and not as an auto-apply robot.

The wedge is:

- multi-lane targeting
- explainable qualification
- proof-grounded assets
- premium strategic outputs like Research Briefs and Annual Plans
- instrumentation that shows what actually improves interview yield

## 4. Framework Synthesis

### 4.1 Design Thinking

Empathize:

- The user is anxious, time-poor, and skeptical of AI shortcuts.
- They fear wasted effort, bad fits, and reputational damage.

Define:

- The main problem is not "writing faster."
- The main problem is choosing the right roles, telling the truth persuasively, and maintaining momentum without chaos.

Ideate:

- The product must reduce cognitive load and surface the next best action.
- Human review must remain present at every high-risk decision.

Prototype and test:

- Start with one flagship flow and a narrow ICP.
- Measure whether that flow improves interview creation, not just click activity.

### 4.2 First Principles

Job search is a conversion system.

Therefore Job Filter must optimize:

- input quality, which jobs enter the pipeline
- decision quality, which jobs deserve effort
- output quality, which assets and outreach get sent
- learning quality, which patterns improve outcomes

### 4.3 Second-Order Thinking

If Job Filter over-optimizes application speed:

- it will attract lower-intent users
- degrade trust
- increase hallucination pressure
- compress margins because usage rises faster than value

If Job Filter over-optimizes strategic assets and trust:

- it will attract a smaller but higher-value ICP
- justify seasonal and premium pricing
- create referral-worthy results

### 4.4 Inversion

To succeed, Job Filter must avoid becoming:

- an AI cover-letter commodity
- a spray-and-pray auto-apply engine
- a black-box ATS score manipulator
- a bloated tracker with weak guidance

### 4.5 JTBD

The product must solve this sequence cleanly:

1. Decide if a role is worth pursuing.
2. Tailor truthful positioning to that specific role.
3. Execute the application and outreach cleanly.
4. Track stage movement and relationships.
5. Learn what is working by lane, asset type, and company profile.
6. Sustain momentum over a 90-day job-search season.

### 4.6 MECE Segmentation

The market is not one blob. Separate it into:

- P1: senior operator / job-changer
- P2: high-volume applier
- P3: early-career applicant
- P4: coach or consultant

Decision:

- Beachhead is P1.
- Expansion path is P4.
- P2 and P3 are later segments once trust, speed, and monetization are proven.

### 4.7 Bloom's Taxonomy

Job Filter should move the user through:

- Remember: understand role-fit language and benchmarks
- Apply: tailor to a real job
- Analyze: compare outcomes by lane and asset
- Evaluate: decide what to double down on
- Create: produce strategic memos, outreach, and interview narratives

### 4.8 Critical Thinking and Deductive Reasoning

If the premium wedge depends on truthful strategic leverage, then:

- Proof Library quality is a prerequisite
- Research Brief quality is a prerequisite
- Annual Plan credibility is a prerequisite
- billing, referrals, and coach plans are downstream, not upstream

## 5. Beachhead User

### 5.1 Primary ICP

Senior operator or job-changer.

Profile:

- 8 to 15+ years of experience
- remote-first or nationally distributed search
- multiple adjacent role lanes
- strong need for speed, trust, and control
- willing to pay for leverage if it directly improves interview quality

### 5.2 Why This ICP First

- already values strategic artifacts
- already feels the pain of multi-lane chaos
- has enough experience to benefit from a Proof Library
- has greater willingness to pay than generic high-volume users

### 5.3 Expansion ICP

Career coach or consultant.

Why second:

- can reuse the same Proof Library, research, and annual plan flows
- has higher LTV through multi-client workspaces
- can become a distribution channel through referrals and affiliates

### 5.4 Not-Now ICPs

High-volume appliers and early-career users should not shape the first product architecture.

They can be served later with lighter templates and guardrailed workflows once the trust layer is solid.

## 6. Core Value Proposition

Job Filter helps serious job seekers target fewer, better roles and convert them more effectively by combining:

- faster qualification
- clearer decision-making
- truthful positioning
- structured strategic research
- measurable iteration

Category statement:

Job Filter is a truthful, experiment-driven job conversion OS.

## 7. Flagship Workflow

### 7.1 Name

Capture to Conviction.

### 7.2 Outcome

Turn one promising real job into a grounded application package and a tracked operating plan in under 30 minutes, with most repeat cycles becoming materially faster.

### 7.3 Steps

1. Capture a real job.
2. Assign or confirm lane.
3. Generate an explainable Fit Score.
4. Inspect deal-breakers and missing evidence.
5. Generate a Research Brief grounded in company-specific facts.
6. Generate or refine a Proof-Library-backed Annual Plan.
7. Build supporting assets:
   - resume variant
   - cover letter
   - outreach note
   - application Q&A
8. Commit the job to a workspace with stage, tasks, contacts, and next action.
9. Log activity and outcome.
10. Feed results back into scoring, templates, and targeting.

### 7.4 Magic Moment

Within the first 24 hours, the user should:

- capture at least 3 real jobs
- see explainable scores
- complete at least 1 truthful, tailored application package

## 8. Product Pillars

### 8.1 Pillar A - Truth Layer

The Proof Library is the product's credibility engine.

Requirements:

- every material claim is reviewable
- every generated asset can point back to source proof
- missing proof blocks high-risk outputs or marks them as draft only
- users can approve, discard, and edit extracted claims before use

### 8.2 Pillar B - Capture and Qualification

Requirements:

- fast manual capture remains available
- extension capture becomes assistive, not hidden automation
- Fit Score is deterministic and explainable
- lane-aware weighting is visible and adjustable

### 8.3 Pillar C - Strategic Asset Engine

Requirements:

- Research Brief is company-specific, recent, and useful downstream
- Annual Plan is executive-ready, proof-backed, and non-fabricated
- supporting assets inherit truth and context from those upstream artifacts

### 8.4 Pillar D - Workspace and Learning Loop

Requirements:

- each job gets a workspace
- stages, contacts, assets, and notes stay together
- the system shows what is working by lane, source, template, and company profile

### 8.5 Pillar E - Monetization and Trust

Requirements:

- simple entry offer
- premium value clearly tied to high-leverage outputs
- honest billing and cancellation
- no dark patterns and no fake automation promises

## 9. Scope by Phase

### 9.1 Phase 0 - Current Baseline

Purpose:

- stabilize the current PWA
- harden claims review
- improve onboarding and activation

Exit criteria:

- claims import and review are reliable
- onboarding creates a usable profile and initial job feeds
- `npm run verify` remains green

### 9.2 Phase 1 - Proof Layer Hardening

In scope:

- explicit Proof Library terminology
- approval and discard workflow
- source snapshots and claim lineage
- gating rules for asset generation

Out of scope:

- backend sync
- external research automation

Exit criteria:

- no generated asset uses unapproved proof without clear draft labeling
- proof coverage and rejection telemetry exist

### 9.3 Phase 2 - Capture and Qualification Expansion

In scope:

- extension-first job capture for top boards
- lane assignment
- explainable scoring panel
- handoff into Job Workspace

Out of scope:

- one-click auto-apply
- broad ATS automation coverage

Exit criteria:

- user can capture three jobs from supported sources with clear confirmation
- capture failure paths degrade gracefully to manual mode

### 9.4 Phase 3 - Strategic Asset Engine

In scope:

- productized Research Brief
- productized Annual Plan
- derived resume, cover letter, outreach, and Q&A flows
- grounded editing workflow

Out of scope:

- autonomous sending
- speculative KPI fabrication

Exit criteria:

- downstream assets can reference upstream research and proof
- invented numbers are blocked or clearly labeled as assumptions

### 9.5 Phase 4 - Workspace Learning Loop

In scope:

- activity timelines
- stage movement and outcomes
- analytics by lane, source, and template
- benchmark views

Out of scope:

- employer-side ATS workflows

Exit criteria:

- user can tell what is helping or hurting interview creation

### 9.6 Phase 5 - SaaS Foundation and Monetization

In scope:

- auth
- tenancy
- billing
- credits
- referrals
- coach-ready permissions design

Out of scope:

- native mobile apps
- broad marketplace integrations

Exit criteria:

- paid user entitlements match product access
- billing lifecycle is transparent and reversible

## 10. Detailed Non-Goals

- No fully autonomous apply engine
- No fake precision or invented metrics
- No black-box scoring model for MVP
- No segment expansion that weakens the beachhead experience
- No billing complexity before the premium workflow proves value

## 11. Monetization Strategy

### 11.1 Core Offer Stack

- Free: light qualification and workspace value
- Seasonal Pass: default 90-day offer for active searchers
- Pro plus credits: premium research and annual-plan usage
- Coach or consultant: later expansion for multi-client workflows

### 11.2 Why Seasonal First

Job search is cyclical. A 90-day framing:

- matches real buying behavior
- fits the emotional arc of a search
- reduces resistance versus indefinite subscription thinking

### 11.3 What People Actually Pay For

They are not paying for tokens or an AI wrapper.

They are paying for:

- clarity
- conviction
- credible strategic positioning
- speed without dishonesty
- higher interview yield

## 12. KPI Tree

### 12.1 North Star

Verified interviews per active user per 90-day season.

### 12.2 Leading Indicators

- jobs captured in first 24 hours
- percent of captured jobs with completed score
- percent of scored jobs that become pursued jobs
- percent of pursued jobs with research and at least one tailored asset
- time from capture to first outbound action

### 12.3 Quality Guardrails

- heavy-edit rate on generated assets
- proof coverage ratio
- hallucination incident count
- score false-positive rate
- capture failure rate
- cancellation reason mix

### 12.4 Economic Guardrails

- LLM cost per active paid user
- margin by plan
- research and annual-plan usage per paid cohort

## 13. Roles and Orchestration

### 13.1 Human and AI Team

| Role | Primary job | Main deliverables | Best lead |
| --- | --- | --- | --- |
| Founder / GM | final product and business decisions | priorities, offers, tradeoffs | Human |
| Product strategist | convert pains into specs | PRD, feature sequence, experiments | GPT-5.4 with human review |
| UX / service designer | simplify core flows | IA, state handling, copy guidance | GPT-5.4 with human review |
| AI systems architect | ground all generation | prompt contracts, evals, model routing | GPT-5.4 plus human review |
| Staff engineer | implement and review | code, tests, migrations, refactors | GPT-5.3-Codex |
| Data and experimentation lead | instrument learning | KPI tree, telemetry, dashboards | GPT-5.4 with human review |
| Growth / pricing lead | sharpen offer and funnel | pricing, lifecycle, referral, launch | GPT-5.4 with human review |
| Trust / security lead | prevent product harm | permissions, privacy, abuse controls | Human with Codex support |
| Domain SME panel | validate usefulness | artifact quality feedback | Human |

### 13.2 Leadership Rule

The orchestrator must keep these streams aligned:

- product truth
- repo truth
- ClickUp truth
- user truth

If one drifts, stop and reconcile before building more.

## 14. Open Questions

- Which exact role lanes should ship as defaults for P1 onboarding?
- How many premium credits should a Seasonal Pass include without margin damage?
- Should Research Briefs and Annual Plans be generated in-app first or staged through a review draft gate?
- When does the current repo merit a monorepo split for extension plus backend work?

## 15. Build-Ready Exit Criteria For This PRD

This PRD is considered execution-ready only if:

- each epic has an implementation packet
- each packet distinguishes current state from target state
- telemetry names are defined
- test commands are explicit
- rollback is explicit
- ClickUp task mapping is explicit

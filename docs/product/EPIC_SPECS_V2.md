# Job Filter Epic Specs v2

Last updated: 2026-03-06

## 1. How To Use This File

Each epic below is intended to be turned into one parent ClickUp task with smaller child tasks. Every child task should include:

- exact objective
- in-scope and out-of-scope boundaries
- acceptance criteria
- telemetry additions
- test commands
- rollback notes

Do not start implementation from the PRD alone. Start from the relevant epic packet plus current repo context.

### 1.1 Foundation Series governance overlay

Before implementation work touches design-governed chapters, use:

- `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- `docs/product/packets/868hukucf.md`
- `docs/product/packets/868hunzqm.md`
- `docs/product/packets/868huafcx.md`

Current governance locks:

- `868hukucf` owns Foundation Series chapters 01, 02, 03, and 05
- `868hunzqm` owns chapter 04 and the public-funnel decisions
- chapter 06 requires a new task
- `868huafcx` remains blocked until chapters 01 through 05 are approved and the `FS8` packet reset is complete
- entry model = `Free tier`
- broader MVP app IA = design-locked now
- auto-apply = future-state only

## 2. Epic Sequence

1. Truth Layer and Proof Library
2. Capture and Intake Expansion
3. Lane-Aware Qualification
4. Strategic Asset Engine
5. Workspace, CRM, and Learning Loop
6. SaaS Control Plane

## 3. Epic 1 - Truth Layer and Proof Library

### Objective

Turn the current claims import and review flows into a canonical Proof Library that blocks or clearly labels unsupported generated content.

### Why now

This is the trust foundation for everything else. Without it, research, annual plans, and outreach become fragile or dishonest.

### Current repo baseline

- claims parsing and normalization in `src/lib/claimParser.ts` and `src/lib/claimsImportPipeline.ts`
- import-draft shaping in `src/lib/importDraftBuilder.ts`
- digital resume and claims review UX in `src/components/resume/DigitalResumeBuilder.tsx`
- active ClickUp and GitHub work already exists here

### Suggested ClickUp mapping

- Active task: [FEATURE: Claims Ledger deterministic PDF import + Claims Health panel](https://app.clickup.com/t/868hgfqjm)
- Active task: [P0: Claims Review pre-commit editor with per-role grouping and explicit Approve/Discard](https://app.clickup.com/t/868hgg067)

### In scope

- rename user-facing terminology from Claims Ledger to Proof Library where appropriate
- explicit proof statuses: imported, approved, rejected, edited, used-in-asset
- lineage metadata: file source, import session, role, timestamp
- clear generation gating when proof coverage is weak
- proof usage ledger on each generated asset

### Out of scope

- live external résumé enrichment
- coach/team shared proof libraries

### Acceptance criteria

- user can import source material and review extracted proof items before they become active
- each proof item has a stable ID and status
- asset generation can point to proof IDs used in the output
- unsupported proof causes a visible warning or a block for high-risk outputs

### Telemetry

- `proof_import_started`
- `proof_import_completed`
- `proof_item_approved`
- `proof_item_rejected`
- `proof_item_edited`
- `asset_generation_blocked_missing_proof`

### Verification

- `npm run test -- src/lib/__tests__/claimParser.test.ts src/lib/__tests__/claimsImportPipeline.test.ts src/lib/__tests__/importDraftBuilder.test.ts`
- `npm run test -- src/lib/__tests__/profileState.test.ts`
- `npm run verify`

### Manual smoke checklist

- import PDF or text resume
- approve and reject at least one proof item each
- confirm approved proof persists after reload
- generate one asset and confirm proof references are visible

### Risks

- terminology change can confuse existing tests and UI copy
- over-blocking may frustrate users if draft mode is unclear

### Rollback

- revert proof-status schema additions and user-facing copy in one patch
- keep parser reliability improvements even if gating UX is rolled back

## 4. Epic 2 - Capture and Intake Expansion

### Objective

Expand from manual capture and onboarding feeds to compliant extension-assisted intake plus clearer role-feed creation.

### Why now

Capture quality determines whether the rest of the workflow matters. Better intake gives better fit scoring, research, and analytics.

### Current repo baseline

- manual job capture modal in `src/components/jobs/CaptureModal.tsx`
- onboarding job-feed setup in `src/components/onboarding/OnboardingWizard.tsx`
- no extension code exists yet in this repo

### Suggested ClickUp mapping

- Existing epic: [EPIC: Job Feed + Link Validity + Pruning](https://app.clickup.com/t/868hgd5k3)
- Existing child: [FEATURE: Job Feed page (source visibility + filtering)](https://app.clickup.com/t/868hgd5mg)
- Existing child: [BUG: Detect and mark/remove dead job links (scheduled validation)](https://app.clickup.com/t/868hgd5mj)
- Existing child: [FEATURE: Retention policy (TTL, caps, dedupe, archive)](https://app.clickup.com/t/868hgd5mm)

### In scope

- role-lane-aware job feeds in the PWA
- source visibility, dedupe, and dead-link handling
- extension capture spec and scaffolding for top-priority sites
- user-confirmed field cleaning before save
- graceful manual fallback when unsupported

### Out of scope

- hidden background scraping
- one-click apply
- every ATS in MVP

### Acceptance criteria

- users can create, edit, activate, and pause feeds by lane
- captured jobs always show source and capture method
- unsupported sites fail safely into manual copy/paste mode
- extension permissions and trust copy are explicit before use

### Telemetry

- `job_capture_started`
- `job_capture_completed`
- `job_capture_failed`
- `job_capture_fallback_used`
- `job_feed_created`
- `job_feed_paused`
- `dead_link_detected`

### Verification

- `npm run verify`
- add a future required gate before merge: `npm run test:extension-smoke`

### Manual smoke checklist

- create feeds from onboarding roles
- confirm dedupe behavior across similar roles
- confirm dead-link state appears correctly
- on supported extension prototype pages, capture job and open workspace

### Risks

- extension scope can balloon quickly
- permissions and trust copy can become vague if not designed first

### Rollback

- keep feed and dead-link work in the PWA
- hold extension work behind explicit feature flags or a separate surface

## 5. Epic 3 - Lane-Aware Qualification

### Objective

Upgrade the current deterministic scoring engine into a lane-aware qualification system with clear explanations, must-have gating, and user overrides.

### Why now

Qualification is the main decision engine. It must be right enough to save time without feeling like a black box.

### Current repo baseline

- scoring logic in `src/lib/scoring.ts`
- score band logic in `src/lib/scoreBands.ts`
- stage and workflow constraints in `src/lib/stageTransitions.ts`
- score rendering in job workspace views

### Suggested ClickUp mapping

- carry forward lessons from prior A2 scoring work
- attach follow-ups under [EPIC: MVP Launch - Job intake -> job feed health -> asset generation -> application acceleration](https://app.clickup.com/t/868hgfcxx)

### In scope

- per-lane weights and preferences
- must-have requirement gating
- explanation panel with score contributions
- user-defined hard filters that cap or block scores
- score versioning when inputs change

### Out of scope

- opaque ML ranking
- employer-side benchmarking claims without data

### Acceptance criteria

- every score can explain why it exists
- users can change lane assumptions and see re-scoring results
- must-have failures are visually distinct from soft weaknesses
- score state can be reproduced from stored inputs

### Telemetry

- `fit_score_calculated`
- `fit_score_recalculated`
- `fit_score_override_changed`
- `must_have_failed`
- `score_explanation_viewed`

### Verification

- `npm run test -- src/lib/__tests__/scoring.test.ts src/lib/__tests__/scoreBands.test.ts src/lib/__tests__/stageTransitions.test.ts`
- `npm run test -- src/pages/__tests__/JobWorkspacePage.test.tsx`
- `npm run verify`

### Manual smoke checklist

- score a job with defaults
- change lane or hard filters
- confirm explanation panel updates
- confirm must-have failures prevent false confidence

### Risks

- too many knobs can increase cognitive load
- historical scores can become misleading if inputs mutate without versioning

### Rollback

- preserve deterministic scoring core
- roll back only lane-configurability or advanced explanation UX if needed

## 6. Epic 4 - Strategic Asset Engine

### Objective

Make Research Briefs and Annual Plans the flagship premium workflow, grounded in proof and company-specific facts.

### Why now

This is the strongest differentiation and the clearest path to premium willingness-to-pay for the beachhead ICP.

### Current repo baseline

- research helpers in `src/lib/research.ts`
- asset generation utilities in `src/lib/assets.ts`
- asset surfaces in `src/components/assets/AssetsTab.tsx`
- canonical prompt references exist outside the repo and should be productized carefully

### In scope

- structured Research Brief flow
- structured Annual Plan flow
- downstream asset generation that references proof and research
- draft-review-publish lifecycle
- clear factual-lock policy and missing-data handling

### Out of scope

- autonomous outbound sending
- invented financial models or KPI estimates without labeled assumptions

### Acceptance criteria

- Research Briefs follow a stable schema and preserve source context
- Annual Plans respect a strict non-fabrication policy
- downstream assets can reference upstream insights
- unsupported claims or invented metrics are blocked or marked as unresolved

### Telemetry

- `research_brief_started`
- `research_brief_completed`
- `annual_plan_started`
- `annual_plan_completed`
- `asset_generated`
- `asset_edited`
- `asset_published`

### Verification

- `npm run test -- src/lib/__tests__/research.test.ts src/lib/__tests__/assets.test.ts`
- `npm run verify`

### Manual smoke checklist

- create research brief from a real job
- confirm company-specific insights exist
- create annual plan from the brief
- verify unsupported numbers are not fabricated

### Risks

- weak research quality creates premium disappointment
- prompt contracts can rot if not versioned and evaluated

### Rollback

- keep upstream research as a draft-only artifact
- disable annual-plan publication if truth checks fail

## 7. Epic 5 - Workspace, CRM, and Learning Loop

### Objective

Turn the workspace into a real operating cockpit that shows what is happening, what to do next, and what is working over time.

### Why now

Without the learning loop, the product remains a toolset instead of an operating system.

### Current repo baseline

- workspace page in `src/pages/JobWorkspacePage.tsx`
- CRM tab in `src/components/crm/CRMTab.tsx`
- dashboard surfaces in `src/pages/DashboardPage.tsx`
- metrics logic in `src/lib/metrics.ts`

### Suggested ClickUp mapping

- existing pipeline and QA tasks under the MVP launch epic are the nearest current fit

### In scope

- job timeline and activity history
- stage movement with data-integrity invariants
- contact and follow-up management
- lane, source, and asset analytics
- benchmark and bottleneck views

### Out of scope

- employer ATS workflow
- multi-user collaboration for MVP

### Acceptance criteria

- every job has a clear next action and recent activity trail
- stage transitions respect invariant rules
- dashboards show lane and source performance without overstating statistical confidence
- users can compare asset types and role lanes over time

### Telemetry

- `stage_changed`
- `follow_up_created`
- `contact_added`
- `dashboard_viewed`
- `experiment_variant_selected`
- `interview_logged`
- `offer_logged`

### Verification

- `npm run test -- src/lib/__tests__/metrics.test.ts src/lib/__tests__/stageTransitions.test.ts`
- `npm run test -- src/pages/__tests__/PipelinePage.test.tsx src/pages/__tests__/JobWorkspacePage.test.tsx`
- `npm run verify`

### Manual smoke checklist

- move jobs across stages
- add a contact and follow-up
- confirm dashboard reflects changes
- verify blocked transitions remain blocked

### Risks

- analytics can imply certainty before enough data exists
- workflow density can overwhelm mobile usability

### Rollback

- preserve core workspace and stage engine
- hide low-confidence analytics modules until data volume supports them

## 8. Epic 6 - SaaS Control Plane

### Objective

Add the control plane required for a monetizable SaaS product without losing the current local-first reliability ethos.

### Why now

This should start only after the flagship workflow shows real value and trust. It is not the first wedge, but it is necessary for scale and monetization.

### Current repo baseline

- no verified auth, backend API, billing, or tenant boundaries in the current codebase

### Candidate ClickUp mapping

- historical placeholder: [Feature 009: SaaS foundation (auth, tenant isolation, security controls)](https://app.clickup.com/t/868hery5c)
- create new child tasks under the canonical docs program task before implementation starts

### In scope

- auth model
- tenant isolation
- billing and entitlements
- credits
- cancellation flows
- referral and affiliate instrumentation

### Out of scope

- enterprise SSO
- native mobile app stores
- full coach workspace collaboration in v1

### Acceptance criteria

- app access respects entitlement state
- billing state is explainable and reversible
- data boundaries are explicit
- cancellation has no dark patterns

### Telemetry

- `signup_completed`
- `plan_started`
- `plan_changed`
- `credit_pack_purchased`
- `subscription_cancel_requested`
- `subscription_cancelled`
- `referral_signup`

### Verification

- current gate: `npm run verify`
- future required gates before merge:
  - `npm run test:auth`
  - `npm run test:billing`
  - `npm run test:entitlements`

### Manual smoke checklist

- create free account
- upgrade to paid
- confirm entitlements unlock
- downgrade or cancel
- confirm access and data state behave as promised

### Risks

- backend complexity can outpace product validation
- billing edge cases can erode trust fast

### Rollback

- keep paid access behind invite or manual flag if billing flows are unstable
- roll back entitlements without removing local data access

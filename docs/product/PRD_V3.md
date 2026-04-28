# Job Filter PRD V3

Last updated: 2026-04-23  
Status: active Product OS draft  
ClickUp owner: [`868jc3gbn`](https://app.clickup.com/t/868jc3gbn)  
Primary anchor: `Apply with confidence to roles you can prove you fit.`

## 1. Summary

Job Filter helps people build better careers by making better opportunity decisions. It does that by helping them choose roles worth pursuing, prove fit from approved evidence, and send reviewed application materials without unsupported claims.

The broad market is anyone trying to pursue the right next opportunity with more clarity, proof, and control. The early commercial wedge is people who care more about fit quality than application volume, including broad-history professionals, focused climbers, switchers, returners, and skeptical AI users.

This PRD supersedes `PRD_V2.md` for product strategy and package shape. It does not replace the Foundation Series or active task packets. Instead, it indexes the Product OS package that turns the Foundation Series into a build, launch, and measurement system.

## 2. Authority

Use this order when sources disagree:

1. verified ClickUp task packets and read-after-write sync receipts
2. current repo reality
3. `docs/product/job-filter-foundation-series-governing-packet-v7.md`
4. active task packets under `docs/product/packets/`
5. live Foundation Series chapters
6. this PRD V3 package
7. `PRD_V2.md`, `EPIC_SPECS_V2.md`, and older wrappers

The complete authority map lives in [`product-os/source-of-truth-map.md`](./product-os/source-of-truth-map.md).

## 3. Product Thesis

Most job-search tools help users save jobs, tune resumes, score keywords, or apply faster. Job Filter should help users apply better by answering five questions:

1. Target: Which roles are worth pursuing?
2. Fit: Can I credibly do this job?
3. Proof: What evidence supports that fit?
4. Story: How should I explain the fit?
5. Execution: What should I do next?

Every feature must reduce at least one of those uncertainties. Features that do not reduce one of them are deferred.

## 4. Target Customer

Primary market:

People trying to build the most effective career possible by consistently pursuing the right opportunities as they become available.

Best-fit active buyer:

People in or near an active search who want better decisions, more reusable proof, and more control than resume builders, job trackers, or auto-apply tools provide.

Initial wedge segments:

- Burnt-out applicants who want fewer weak-fit applications and less rewriting.
- Sophisticated skeptics who distrust black-box AI and need proof, control, and review.
- Broad-history role explorers who can credibly move in more than one direction.
- Focused climbers who know the next role they want but need stronger evidence and positioning.
- Switchers, returners, and signal-builders who need help turning uneven experience into a credible story.

The full customer brief lives in [`product-os/customer-jtbd-and-persona-brief.md`](./product-os/customer-jtbd-and-persona-brief.md). The funnel and audience progression model lives in [`product-os/customer-ascension-funnel.md`](./product-os/customer-ascension-funnel.md).

## 5. Strategic Position

Customer-facing promise:

`Apply with confidence to roles you can prove you fit.`

Brand-level framing:

`Pursue the best opportunities for your career with clarity, proof, and control.`

Support copy:

`Build a reusable career profile from your real experience, see which opportunities are worth pursuing, and review every claim before it moves into an application.`

Differentiation:

- not a resume-only builder
- not a generic job tracker
- not an auto-apply engine
- not a black-box match score
- not a keyword-stuffing workflow
- not a dashboard that celebrates application volume

Job Filter should own proof-backed application confidence.

## 6. Product Principles

- Fit before assets: decide whether a job is worth pursuing before generating documents.
- Proof before claims: generated material must trace to approved user evidence or be labeled unsupported.
- Review before send: no claim, answer, resume edit, or autofill output ships without user approval.
- Fewer better applications: optimize qualified applications and interviews, not raw submission count.
- User-owned lanes: multiple role directions are normal and should be explicit.
- Explainable decisions: show used, missing, excluded, risky, and disqualifying signals.
- Free tier trust: the free path must create a real first win and must not hold exports hostage.

## 7. Product Spine

Signed-out:

`Home -> How It Works -> Pricing -> Job Profile Worksheet -> Auth`

Signed-in:

`Profile -> Role Discovery -> Jobs -> Review -> Applications -> Workspace`

Canonical signed-in routes:

| Route | Surface | Product job |
| --- | --- | --- |
| `/profile` | Profile | Build reusable truth, verify work history, approve proof, create role lanes. |
| `/jobs` | Jobs | Search, capture, organize, and inspect opportunities by lane. |
| `/jobs/review/:jobId` | Review | Decide apply, hold, or reject before active application work. |
| `/applications` | Applications | Manage committed applications and next actions. |
| `/applications/:applicationId` | Workspace | Execute one application with grounded assets, notes, context, and follow-up. |
| `/settings` | Settings | Manage account, privacy, data export, integrations, and preferences. |

The detailed IA and screen contracts live in [`product-os/product-ia-and-screen-contract.md`](./product-os/product-ia-and-screen-contract.md).

## 8. Product Objects

Core objects:

- `Profile`
- `Company`
- `Role`
- `Claim`
- `Evidence`
- `Provenance`
- `RoleLane`
- `Job`
- `Requirement`
- `FitAssessment`
- `Application`
- `Asset`

Truth states:

- `Imported`: extracted but not verified
- `Conflict`: contradicts another source or required field
- `Verified`: approved for reuse
- `Excluded`: explicitly not usable downstream
- `Unsupported`: generated or inferred content without adequate evidence

The data and API contract lives in [`product-os/truth-engine-data-api-contract.md`](./product-os/truth-engine-data-api-contract.md).

## 9. Competitive Wedge

Competitor table stakes:

- free resume import/build/export
- job tracker with table controls
- browser job capture
- job detail workspace
- resume versions from a master resume
- manual fallback paths
- data export and portability

Job Filter wedge:

- proof-first profile
- requirements matrix instead of one match score
- role-lane strategy before application work
- opportunity-cost view for deciding what not to apply to
- source lineage for claims and assets
- review-before-send as visible product behavior
- qualified applications and interview outcomes over volume

The teardown lives in [`product-os/competitive-teardown-category.md`](./product-os/competitive-teardown-category.md).

## 10. MVP And Phases

### MVP

- Profile D2 `Check your history` vertical slice
- role history verification with company-grouped table and drawer editing
- provenance and conflict handling
- Role Discovery entry gate
- first job capture, manual fallback, and job requirements parsing
- Review surface with proof coverage and apply/hold/reject decision
- Applications list and first Workspace shell
- exportable profile and application data

### P1

- reviewed asset generation with source lineage
- dense Jobs manager table
- improved company/context research
- lightweight contact/referral pathing
- launch telemetry and outcome capture

### P2

- Chrome extension save flow
- richer resume and cover-letter builder controls
- interview and outreach support from the same proof base
- broader data portability

### P3 / Future

- field-level autofill with explicit user controls
- adaptive learning loops from outcomes
- cohort dashboards
- role-market intelligence

### Explicit Rejects

- auto-apply as a current-state promise
- hidden submission
- single universal fit score
- unsupported AI claims
- keyword stuffing as the main workflow

## 11. Metrics

North Star:

`Qualified interviews per active search cycle`

Primary activation metric:

`Verified profile + first fit decision completed`

Guardrails:

- unsupported-claim rate
- review-before-send completion rate
- profile verification completion
- export and deletion success
- application quality over submission volume

The metrics and roadmap plan lives in [`product-os/metrics-telemetry-and-rice-roadmap.md`](./product-os/metrics-telemetry-and-rice-roadmap.md).

## 12. Product OS Package

| Artifact | Purpose |
| --- | --- |
| [`product-os/README.md`](./product-os/README.md) | Package map and operating rules. |
| [`product-os/source-of-truth-map.md`](./product-os/source-of-truth-map.md) | Authority ladder, owners, stale-doc treatment, and repo reality. |
| [`product-os/customer-jtbd-and-persona-brief.md`](./product-os/customer-jtbd-and-persona-brief.md) | Personas, JTBD, anxieties, triggers, objections, and success criteria. |
| [`product-os/competitive-teardown-category.md`](./product-os/competitive-teardown-category.md) | Category-wide teardown and screenshot plan. |
| [`product-os/product-ia-and-screen-contract.md`](./product-os/product-ia-and-screen-contract.md) | Route, page, component, copy, state, and acceptance criteria contract. |
| [`product-os/truth-engine-data-api-contract.md`](./product-os/truth-engine-data-api-contract.md) | Product objects, states, endpoints, provenance, and API rules. |
| [`product-os/metrics-telemetry-and-rice-roadmap.md`](./product-os/metrics-telemetry-and-rice-roadmap.md) | KPI tree, event model, RICE roadmap, and launch gates. |
| [`product-os/copy-and-naming-decision-pack.md`](./product-os/copy-and-naming-decision-pack.md) | Positioning, copy rules, naming gates, and naming rubric. |
| [`product-os/qa-release-and-launch-gates.md`](./product-os/qa-release-and-launch-gates.md) | QA, audits, smoke flows, release gates, and rollback. |
| [`product-os/public-funnel-launch-plan.md`](./product-os/public-funnel-launch-plan.md) | Public funnel, free-tier framing, beta launch, and experiments. |

## 13. Acceptance Criteria

- Every feature maps to target, fit, proof, story, or execution uncertainty.
- Every page has a user job, primary action, component set, state model, copy, and acceptance criteria.
- Every AI or generated-output feature includes lineage, confidence state, and review-before-send behavior.
- RICE includes table stakes, wedge features, and explicit rejects.
- Competitor teardown includes dated official sources and screenshots or a documented blocker.
- Naming work is gated until product thesis, category wedge, and customer language are stable.

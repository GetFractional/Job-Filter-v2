# Foundation Series 05, Activation and Core App

Last updated: 2026-03-22  
Status: active living chapter  
Primary owner: `868hukucf`  
Upstream sources: [`01-market-intelligence.md`](./01-market-intelligence.md), [`02-brand-strategy.md`](./02-brand-strategy.md), [`03-product-system.md`](./03-product-system.md), [`04-website-public-funnel.md`](./04-website-public-funnel.md)

## Chapter objective

Define the canonical signed-in Job Filter app for activation and the first usable core workflow. This chapter governs signed-in IA, route inventory, route roles, the activation path, role-lane handling, proof structure, first-job capture, review-before-send behavior, and the handoff into `Applications` and `Workspace`.

This chapter exists so later architecture specs, desktop and mobile artifacts, and the later `FS8` implementation reset build from one coherent product model instead of inheriting structure from old shells or prototype assumptions.

## How Chapter 05 relates to Chapters 01 through 04

| Upstream chapter | What it locks | How Chapter 05 must respond |
| --- | --- | --- |
| Chapter 01, Market Intelligence | setup is tolerated only when it becomes reusable leverage | activation must make `Profile` feel like a compounding asset, not intake admin |
| Chapter 01, Market Intelligence | multiple adjacent role directions are normal | the product must support user-owned `Role Lanes` as first-class search structures |
| Chapter 01, Market Intelligence | guided storytelling is core value | stories, proof, and metrics must be extracted and approved before recommendations or downstream assets carry real weight |
| Chapter 01, Market Intelligence | inspectable reasoning and review-before-send are trust architecture | role fit, job fit, and proof usage must stay inspectable and reversible |
| Chapter 01, Market Intelligence | the product is a job-search system, not a drafting toy | signed-in IA must connect profile truth, jobs, proof, and later learning loops |
| Chapter 02, Brand Strategy | `Build my job profile`, `Continue setup`, free-to-start clarity, and no-auto-apply boundary | signed-in controls and handoff language must preserve the locked CTA and trust system |
| Chapter 03, Shared Visual and Product System | calm premium containment, trusted rationale surfaces, `used` / `missing` / `excluded`, and component discipline | Chapter 05 must inherit those qualities without forcing a top-heavy wizard pattern into the signed-in app |
| Chapter 04, Website and Public Funnel | signed-out IA, pricing-entry framing, worksheet role, auth handoff, and Profile-first entry | Chapter 05 begins after auth handoff and must not reopen signed-out ownership |

### Current chapter reset

The previous Chapter 05 direction over-indexed on lane recommendation too early and kept a broad reading of the step-rail grammar. That is now superseded.

The new Chapter 05 center of gravity is:

`Source Capture -> Experience Normalization -> Stories + Proof -> Role Discovery -> First Job Capture -> Review -> Applications -> Workspace`

Role recommendations must not appear before the system has enough verified truth to justify them.

## Core app thesis

Job Filter is a signed-in job-search workspace that turns approved profile truth into role-aware, reviewable action. The app should help a serious applicant:

- capture usable source material quickly
- normalize real work history and constraints
- extract and approve stories, metrics, and proof
- discover which roles are actually supported by that truth
- organize those roles into reusable `Role Lanes`
- capture one real job through search or manual entry
- review grounded assets before anything carries forward
- continue execution in a per-job workspace

The core app is not:

- a dashboard-first shell
- a generic draft generator
- a black-box AI recommender
- a job board wrapper

The core belief the product must make obvious:

`Profile` builds reusable leverage, `Jobs` turns opportunities into decisions, `Applications` keeps active work organized, and review-before-send stays visible all the way through.

## Supersession map

| Old authority | New authority | File updated | Status |
| --- | --- | --- | --- |
| top-level IA `Profile`, `Jobs`, `Proof` | top-level IA `Profile`, `Jobs`, `Applications` | `05-activation-and-core-app.md` | `synced` |
| top-level `Proof Library` route | proof states stay visible inside `Profile` in the first slice, and `Proof Library` is only the reserved later support-surface title if density requires it | `05-activation-and-core-app.md` | `synced` |
| post-review handoff direct to `Job Workspace` | post-review promote to `Applications`, then open `Workspace` | `05-activation-and-core-app.md` | `synced` |
| `Job Workspace` as authoritative child-surface label | `Workspace` as the authoritative child surface under `Applications` | `05-activation-and-core-app.md` | `synced` |
| separate page-like proof step plus top-level proof route assumptions | proof and readiness verification run as an embedded mode inside the `Profile` history workspace for the first slice; standalone `Proof Library` is deferred | `05-activation-and-core-app.md` | `synced` |

## User modes and primary jobs

| User mode | Primary job | What the app must feel like | What it must not feel like |
| --- | --- | --- | --- |
| First-run builder | turn broad experience into usable structured truth | calm, focused, credible, progress-oriented | a bloated wizard or a form tax |
| Truth normalizer | make work history accurate enough to reason from | high-control, reversible, low-noise | parser theater or hidden automation |
| Proof reviewer | approve what is actually safe to claim | inspectable, structured, reviewable | a black-box summary engine |
| Role explorer | understand which role directions are actually supported | analytical, evidence-backed, flexible | flattering guesswork or personality-test theater |
| Per-job operator | connect one target job to the right lane and assets | contextual, operational, job-specific | an isolated document editor |
| Returning search manager | resume work, review status, and keep momentum | stateful, organized, search-aware | a blank home screen or content feed |

## Signed-in IA and route inventory

### Canonical signed-in route set

| Route / surface | User-facing name | Primary job | Primary owner in this chapter |
| --- | --- | --- | --- |
| `/profile` | `Profile` | build and maintain reusable job-search foundation, including proof review and role-lane creation | activation authority |
| `/jobs` | `Jobs` | search, capture, organize, and progress jobs by role lane | core-app authority |
| `/jobs/review/:jobId` | `Review` | complete the explicit review-before-work boundary for one saved job | core-app authority |
| `/applications` | `Applications` | manage active applications and enter active-work detail | core-app authority |
| `/applications/:applicationId` | `Workspace` | run per-application work, asset review, notes, and next-step action | core-app authority |
| `/settings` | `Settings` | manage account, preferences, privacy, and reversibility controls | shared signed-in authority |

### Canonical route model

- `Profile` is the default signed-in destination while activation is incomplete.
- `Jobs` is available during activation but does not become the center of gravity until at least one `Role Lane` exists.
- `Review` is the explicit boundary between a saved job and active application work.
- `Applications` becomes primary only after at least one reviewed job is promoted into active management.
- `Workspace` is a child surface under `Applications`, not a peer to the primary routes.
- proof states stay visible inside `Profile` during the first implementation slice, with no standalone `Proof Library` surface yet.
- `Proof Library` remains the reserved later support-surface title under `Profile` ownership if embedded proof management becomes too dense.
- `Settings` stays in the account menu, not in the main work navigation.

### Supporting surfaces

These are part of the signed-in system but should not become top-level routes in the first branded pass:

- source-import issue drawer
- proof filter panel or proof-detail drawer inside `Profile`
- role-fit drawer
- job-fit drawer
- proof detail drawer or sheet
- lane-opportunity or market-context sheet
- add-first-job modal or sheet

### Not canonical signed-in IA

The following should not become the default signed-in authority for the first branded Chapter 05 pass:

- dashboard-first landing
- CRM-first nav
- global asset gallery as the main entry
- analytics home
- LinkedIn optimization or interview-prep routes

## Route-level roles and boundaries

| Route | What it owns | What it does not own |
| --- | --- | --- |
| `Profile` | source capture, experience normalization, embedded proof and readiness verification, role discovery, lane creation, and reusable truth stewardship | broad jobs management, active application work, public-funnel handoff |
| `Jobs` | job search, manual capture, lane-aware feed and saved-job management | canonical profile truth editing, proof governance, active application execution |
| `Review` | the mandatory review-before-work boundary for one saved job | global profile editing, long-term application management |
| `Applications` | list-first active application management after review, including status, due date, reminder, lane context, and latest-contact summary | discovery, role discovery, or reusable-proof governance |
| `Workspace` | one application's active assets, notes, fit snapshot, proof snapshot, lightweight company context, lightweight message log, and next-step execution | rewriting shared foundation truth or acting like a separate top-level route |
| `Settings` | account, preferences, privacy, integrations, future extension controls, reversible rules | first-run activation, role discovery, or job review |

### Ownership boundary with Chapter 04

Chapter 04 owns:

- signed-out page set
- public CTA map
- worksheet role
- auth entry states
- post-auth routing rules at the moment of sign-in

Chapter 05 owns:

- what the signed-in user lands inside after that handoff
- how incomplete activation behaves
- how `Profile`, `Jobs`, `Review`, `Applications`, and `Workspace` relate
- how job capture, proof, review, and per-job work behave once the user is inside the app

## Activation path options and chosen model

### Path options

| Path | Shape | Verdict | Why |
| --- | --- | --- | --- |
| Role-first | source -> experience -> role recommendation -> stories/proof -> jobs | reject | recommends direction before enough truth exists |
| Job-first | source -> first job -> assets -> later foundation | reject | creates shallow job-specific output too early |
| Progressive foundation | source -> experience -> stories/proof -> role discovery -> first job -> review -> applications -> workspace | approve | preserves trust, improves recommendation quality, and connects setup cleanly to ongoing application management |

### Chosen activation path

1. `Source Capture`
2. `Experience Normalization`
3. `Stories + Proof`
4. `Role Discovery`
5. `First Job Capture`
6. `Review`
7. `Applications`
8. `Workspace`

## Canonical activation sequence and state transitions

### Activation sequence

1. `Profile` start and source capture
2. `Experience` normalization
3. `Stories + Proof` extraction and approval inside the same `Profile` workspace
4. `Role Discovery` and role-lane creation
5. `Jobs` first-job entry
6. `Job Review`
7. `Applications`
8. `Workspace`

### Activation state model

| State | What the user is doing | Required output before next state | Next state |
| --- | --- | --- | --- |
| `Profile start` | choose resume, LinkedIn, or manual entry path | usable source material exists or manual path is confirmed | `Experience` |
| `Experience` | confirm roles, dates, scope, tools, responsibilities, KPIs, and outcomes | reusable normalized truth with unresolved items clearly isolated | `Stories + Proof` |
| `Stories + Proof` | review extracted stories, proof items, and metrics inside the same `Profile` workspace until the profile is verified for reuse | verified profile exists and unsafe claims are excluded or softened | `Role Discovery` |
| `Role Discovery` | inspect supported role directions and create one or more role lanes | at least one user-owned role lane exists | `Jobs` first-job entry |
| `First Job Capture` | search or manually add one target job | one saved job exists with enough context to analyze | `Job Review` |
| `Job Review` | inspect fit, proof coverage, and job-specific assets | accepted or intentionally deferred job-ready state exists | `Applications` |
| `Applications` | move a reviewed job into active management | active application exists with explicit status and workspace entry | `Workspace` |
| `Workspace` | continue execution for one real application | first-job value achieved | ongoing use |

### Routing rules after sign-in

| User state | Destination |
| --- | --- |
| no usable source material yet | `Profile` start |
| source exists but experience is incomplete | `Profile`, experience state |
| experience exists but stories/proof are not yet verified for reuse | `Profile`, history workspace with embedded verify-for-reuse mode |
| proof foundation exists but no role lane exists | `Profile`, role discovery state |
| role lane exists but no saved job exists | `Jobs`, first-job entry state |
| saved job exists and job review is pending | `Review` for that job |
| one reviewed job exists and no active application manager decision has been made | `Applications`, with the promoted application selected |
| activation is complete and one or more applications exist | `Applications`, with the most relevant application visible and `Workspace` one click away |

### Activation rules

- The app must never drop a newly signed-in user onto a generic dashboard first.
- The activation path should be sequential in logic, but revisitable in practice.
- `Continue setup` remains a signed-in progress control inside `Profile` states only.
- Role recommendations are blocked until work history plus stories and proof are sufficiently verified.
- The first job may be captured through search or manual entry, and both are first-class launch paths.

## Route-state detail

### `Profile` states

| State | Primary job | Required outputs | Dominant CTA |
| --- | --- | --- | --- |
| `P0 Start` | choose how to begin and get raw material into the product | import started or manual path selected | `Add your experience` |
| `P1 Experience` | confirm factual work history inside the main `Profile` workspace | normalized experience truth and visible proof states | local confirmation only |
| `P2 Verify for reuse` | verify which reusable evidence and wording may move forward inside the same `Profile` workspace | verified profile ready for role comparison | `Continue to Role Discovery` |
| `P3 Role Discovery` | create trackable role lanes from approved truth | at least one role lane | `Create role lane` |

### `Jobs` states

| State | Primary job | Required outputs | Dominant CTA |
| --- | --- | --- | --- |
| `J0 Add a job` | bring in the first real job | one saved job ready for review | `Add a job` |
| `JL0 Jobs manager` | manage feed and saved jobs by lane | organized jobs with feed and saved continuity | `Open job` or `Add a job` |
| `J1 Review` | inspect fit, proof coverage, and draft readiness before active work | accepted or intentionally deferred review state | `Start application` |
| `A0 Applications` | manage active applications after review | active application list with explicit status and workspace entry | `Open Workspace` |
| `W0 Workspace` | execute one application with context | reviewed or in-progress application work | `Review next action` |

## Role model and multi-role handling

### User-facing language

- Use `Role Discovery` for the recommendation and comparison stage.
- Use `Role Lane` for the user-owned search bucket.

### Internal model

A `Role Lane` is a reusable search direction owned by the user. It should include:

- lane name
- recommended category
- included role titles
- primary rationale
- supporting proof coverage
- unresolved proof count
- linked jobs

### Multi-role handling rules

- One lane can include multiple close role titles such as `Marketing Director`, `Director of Marketing`, and `Head of Marketing`.
- The user can name the lane freely.
- The system suggests a recommended category for grouping and reporting.
- One job belongs to one primary lane.
- A job may carry secondary role tags for analysis, but only one primary lane owns its workflow.
- Adding or editing lanes must not reset verified profile truth.

## Stories, proof, and metrics model

### Embedded proof and readiness model for the first slice

The first implementation slice keeps proof management inside `Profile` instead of shipping a standalone `Proof Library` surface.

The embedded proof model must still unify:

- story records
- proof items
- metrics
- exclusions
- provenance
- safe wording
- usage states such as `used`, `missing`, and `excluded`

If later density proves that `Profile` needs a dedicated reusable-truth support surface, the reserved title remains `Proof Library`.

### Story and proof rules

- Story extraction begins from approved experience truth, not from freeform drafting.
- Stories, proof items, and metrics remain structurally distinct, even when they are reviewed together.
- The system may suggest a story or metric framing, but suggestion and approval must remain visibly distinct.
- Metrics inherit proof state and may be softened when exact numeric usage is not approved.
- Shared ownership, support roles, and contextual contribution must remain expressible in the proof layer.

## Jobs route, job search, and job capture model

### Launch requirements

At launch, `Jobs` must support both:

- in-product job search
- manual capture through link, paste, or description entry

Future Chrome extension capture should use the same ingest contract and job schema, but it is not part of the current slice.

### First-job entry behavior

The first-job path should begin with one dominant `Add a job` action. Inside that flow, the user chooses between two equal entry tabs:

- `Search`
- `Paste/Link`

### Jobs route requirements

The `Jobs` route must support:

- role-lane-aware job organization
- board view
- sheet view
- sort
- filter
- configurable visible fields
- editable lane assignment
- clear continuity into `Review`, `Applications`, and `Workspace`

### Job review and generation relationship

Job review must be tied to:

- one selected primary role lane
- approved stories and proof
- one specific target job
- explicit proof usage states

Generation should create reviewable outputs, not silent finals.

## Review, trust, and reasoning visibility

### Hard boundaries

- No auto-apply in the current-state product.
- No hidden send behavior.
- No unsupported claims promoted into approved truth.
- No role recommendation before the proof foundation is ready.

### Required trust behaviors

- visible difference between suggested and approved truth
- visible `used`, `missing`, and `excluded`
- recoverable exclusions
- visible rationale for role fit and job fit
- safe wording when proof confidence is thin
- review-before-send before assets carry forward

## Visual and interaction direction

### App-shell direction

The signed-in app should use:

- a minimal persistent sidebar or equivalent persistent left navigation
- local section progress within `Profile`
- one stable shell and background system across linked `Profile` states
- one main workspace plus one optional right-side drawer
- one main-canvas swap model inside `Profile` rather than separate screen families for `D1` and `D2`
- dense, row-first information display where it improves clarity

The signed-in app should not use:

- a chunky top-heavy wizard rail repeated on every screen
- oversized rounded card stacks
- decorative glassmorphism as the main UI identity
- equal-weight three-column dashboards during incomplete activation

### Product-surface rules

- restrained radius, roughly `8px` to `12px`
- flat or lightly elevated surfaces
- generous page padding with compact internal density
- one strong sans serif inside product windows
- clear dividers and section headings
- one dominant CTA per state
- trust cues only at the decision point

## SLA target

Target: `30` to `45` minutes from sign-in to first job-ready workspace when the user already has a resume or LinkedIn profile ready.

Suggested time budget:

- `3` to `5` minutes, source capture
- `8` to `12` minutes, experience normalization
- `10` to `15` minutes, stories + proof verification
- `5` to `8` minutes, role discovery and first lane creation
- `5` to `8` minutes, first job capture and parse
- `3` to `5` minutes, review and workspace handoff

## What is explicitly deferred

The following are outside the Chapter 05 first-pass authority:

- Chrome extension capture
- auto-apply
- outreach CRM
- interview-prep surfaces
- deep research workflows beyond lightweight company context
- LinkedIn optimization route
- broad analytics home
- premium research expansions beyond the first job slice
- standalone `Proof Library` support surface until embedded proof and readiness verification become too dense
- lifecycle email and nurture

## Binding requirements for later architecture, artifact, and `FS8` work

1. Treat this chapter as the signed-in source authority, not the current desktop artifact.
2. `Profile` remains the default signed-in destination while activation is incomplete.
3. The first usable implementation slice must preserve this sequence: source capture -> experience normalization -> embedded verify-for-reuse mode inside `Profile` -> role discovery -> first job capture -> review -> applications -> workspace.
4. `Role Discovery` may not recommend or prioritize roles until work history plus stories and proof are sufficiently verified.
5. The product must support user-owned `Role Lanes` that can group multiple close role titles.
6. `Jobs` must support both search and manual job capture at launch.
7. One job must belong to one primary role lane, with optional secondary tags only for analysis.
8. Proof states must remain unified, reusable, and visible inside `Profile` in the first slice.
9. Review-before-send and visible proof lineage must remain explicit before job-specific assets are accepted.
10. No current-state implementation may imply auto-apply, hidden submission, or invisible AI actions.
11. Chapter 04 website ownership remains intact. Signed-in work must not reopen signed-out IA.
12. Top-level signed-in IA for this chapter is `Profile`, `Jobs`, and `Applications`.
13. `Proof Library` remains the reserved later support-surface title under `Profile`, but it does not ship as a standalone surface in the first slice.
14. `Workspace` is the authoritative child surface under `Applications`.

# Packet 868huafcx

Task: [FEATURE: Complete remaining /profile steps (Skills & Tools, Extras, Preferences)](https://app.clickup.com/t/868huafcx)  
Status: `FS8R2 readiness reset, blocked until explicit unblock conditions are met`  
Primary lane after approval: `D2-first implementation slice, once unblocked`

## Objective

Replace the stale `/profile` implementation packet with a repo-true, authority-aligned build packet for the first real signed-in slice: `Profile / Check your history`.

## Blocked / Unblock

This packet is now the correct implementation reset source, but it is still blocked as executable build authority.

### Chapter 04 sufficiency rule

Locked decision:

- Chapter 04 strategy-source approval plus the signed-out-to-`Profile` handoff is sufficient for the signed-in D2 implementation reset
- final Chapter 04 website page comps do **not** block `868huafcx`

Why:

- the first implementation slice is a signed-in D2 workspace, not more website work
- the implementation dependency from Chapter 04 is the public-to-signed-in handoff and route ownership, which is already defined in the approved Chapter 04 strategy source
- holding `868huafcx` on final website page comps would create a false dependency between signed-out composition polish and signed-in D2 implementation readiness

### Remaining unblock conditions

Builder work remains blocked until all of the following are true:

1. the Chapter 04 sufficiency rule above is treated as satisfied by the existing strategy source and signed-out-to-`Profile` handoff
2. the reopened D2 design lane under `868hukucf` has an explicit lead-thread artifact QA pass after the latest D1+D2 repair
3. the stable ClickUp task packet is refreshed and read-after-write verified to match this implementation reset
4. WIP is available under policy before a new coding lane starts
5. the repo worktree is clean or the lead thread has isolated a checkpoint commit for existing local work

Until those conditions are satisfied together, this packet is governance-ready but not yet active build authority.

## FS8R2 Build Readiness Reset, 2026-04-28

### Build readiness verdict

`blocked`.

Why:

- `868huafcx` is still `backlog` in ClickUp.
- the latest D1+D2 artifact repair under `868hukucf` needs explicit lead-thread artifact QA before it can be treated as implementation-facing authority.
- Job Filter already has two coding tasks in `in development`: `868hy1280` and `868huzwnf`.
- the local repo worktree must be clean or checkpointed before a new build lane starts.

### Active packet and ClickUp task

- ClickUp task: [`868huafcx`](https://app.clickup.com/t/868huafcx)
- Local packet: `docs/product/packets/868huafcx.md`
- Upstream design authority task: [`868hukucf`](https://app.clickup.com/t/868hukucf)
- Public-funnel sufficiency task: [`868hunzqm`](https://app.clickup.com/t/868hunzqm)

### Source-of-truth map

| Source | Owns | Build implication |
| --- | --- | --- |
| verified ClickUp task packet and comments | task status, AC, DoD, critical path | must be read-after-write verified before claiming unblock |
| current repo reality | stack, available code, tests, dirty files | build starts from Vite + React Router + current app shell |
| `job-filter-foundation-series-governing-packet-v7.md` | blocking logic and task ownership | `868huafcx` remains blocked until D2 QA, packet sync, WIP, and clean-state gates clear |
| `05-activation-and-core-app.md` | signed-in IA and activation sequence | first slice stays inside `Profile`, not a dashboard or proof route |
| `05-activation-architecture-spec.md` | high-fidelity interaction and state architecture | `Check your history` embeds proof/readiness inside the Profile history workspace |
| `868hukucf-fs5s7-desktop-screen-contract.md` | exact D2 screen contract and layout | grouped company master view, right drawer, sticky readiness bar |
| `868hukucf-fs5s6-user-system-definition.md` | D2 data/product model | company -> role -> claim structure, control types, readiness model |
| `868hukucf-fs5s3c1-activation-copy-system.md` | locked copy and terminology | use `Blockers`, `Verification progress`, `Source evidence`, and `Continue to Role Discovery` |

### Screen contract

#### Route and state

- Route: `/profile`
- User-facing route: `Profile`
- Local state: `Check your history`
- Internal state family: combined `P1` experience review plus embedded `P2` proof/readiness verification
- Entry condition: user has signed in and has either imported or manually started source material that can produce role-history records
- Exit condition: `Continue to Role Discovery` is enabled only when at least one included role exists, required categories are verified, and no blocking conflicts remain

#### User job

Help a skeptical, overloaded applicant verify the few facts that change downstream job-search decisions, keep chronology context visible, and leave with reusable truth instead of import anxiety.

#### User anxieties

- "Will this invent or overstate my experience?"
- "Do I have to clean every tiny field before getting value?"
- "Can I see where this fact came from?"
- "Will old resume or LinkedIn wording silently become approved truth?"
- "Can I fix one role without losing the table context?"

#### Information hierarchy

1. In-panel route-context row: `Profile • Check your history`
2. H1: `Clean the few facts that will decide where your search can go next.`
3. Supporting copy: `Review only the roles, responsibilities, outcomes, and skills that change downstream decisions. When this workspace is clean, Job Filter can help without making you recheck the same history on every role.`
4. Sticky `Verification progress` bar with category progress and `Continue to Role Discovery`
5. Grouped company master table
6. Right-side role detail drawer, closed by default until row selection
7. Inline source evidence, blockers, and proof actions attached to owning fields or records

#### Required components

- signed-in app shell with `Profile` active
- compact route-context row
- D2 page title and supporting copy
- sticky `Verification progress` readiness bar
- grouped company master table
- frozen `Company` structural lane with quiet role carry-label
- one-row toolbar ordered as search, filter icon, columns icon, sort icon, `Add role`
- collapsible company groups
- role rows with `Role`, `Dates`, `Status`, and `Blockers`
- preview signals for responsibilities, outcomes, and skills/tools
- insert-in-place `Add role`
- right-side role detail drawer with explicit close control
- editable role identity, timeline, responsibilities, outcomes/proof, skills/tools, and compensation groups
- inline `Source evidence` and `See source` controls where provenance exists
- autosave status such as `Saved just now`
- field-level validation and conflict resolution controls

#### Exact copy

- route-context row: `Profile • Check your history`
- H1: `Clean the few facts that will decide where your search can go next.`
- supporting copy: `Review only the roles, responsibilities, outcomes, and skills that change downstream decisions. When this workspace is clean, Job Filter can help without making you recheck the same history on every role.`
- readiness title: `Verification progress`
- readiness body: `Once you verify crucial info like roles, responsibilities, outcomes, and skills, Job Filter can confidently help you find and apply to roles best suited for you.`
- dominant readiness action: `Continue to Role Discovery`
- blocking-review label: `Blockers`
- company summary pattern: `{Role_Count} Roles • {Verified_Claims}/{Total_Claims} Claims Verified`
- source evidence label: `Source evidence`
- provenance labels: `From your resume`, `From LinkedIn`, `Added by you`, `Needs confirmation`
- role actions: `Add role`, `Insert role`, `Edit details`, `Archive role`, `Remove role`, `Close drawer`, `Move up`, `Move down`, `Saved just now`
- proof actions: `Use this`, `Use safer wording`, `Keep out`, `Not accurate`, `Needs proof`, `See source`
- empty state: `No roles yet` and `Add your first role to keep building your profile.`
- trust-boundary copy when needed: `Blockers stay visible until you resolve the facts that still make reuse risky.`

#### Data objects

- `Profile`
- `Company`
- `Role`
- `RoleFieldProvenance`
- `Claim`
- `ClaimProvenance`
- `ImportSession`
- readiness rollups for profile, company, role, and required categories
- UI state for selected role, drawer open/closed, table sort/filter/columns, search, collapse state, and autosave state

#### Interactions

- select a role row to open the right-side drawer
- close the drawer without losing table position
- add a role from the toolbar or insert-in-place inside a company group
- collapse and expand company groups
- search company, role title, tools, and responsibilities
- filter, sort, show/hide, and reorder approved columns only
- edit role identity fields, dates, present-role state, responsibilities, outcomes, skills, tools, and compensation
- resolve conflicts with the field-level question pattern `Which is your truth?`
- view `Source evidence` and `See source` from the owning field or record
- approve, soften, exclude, or reject reusable proof at the item level
- reorder companies, roles, responsibilities, and outcomes with drag-and-drop plus arrow-button fallback
- autosave edits and refresh readiness rollups
- click conflict hotspots in `Verification progress` to jump to the affected company or role
- continue to Role Discovery only after the gate clears

#### Empty, loading, error, success, and conflict states

- Empty: show `No roles yet`, `Add your first role to keep building your profile.`, and the same `Add role` action used in the loaded state.
- Loading: preserve the shell and table frame while profile history, readiness rollups, or provenance load.
- Error: show field-level errors beside the affected control when possible; route-level errors explain what could not load or save and preserve user edits.
- Success: autosave confirms with restrained saved-state copy such as `Saved just now`; verified rows and companies use subtle completion checks.
- Conflict: field-level or claim-level blockers show the affected field, competing values, source labels, resolution actions, and a jump target. Blocking conflicts disable `Continue to Role Discovery`.

#### Proof lineage requirements

- extracted, suggested, edited, approved, excluded, and rejected states remain distinct.
- imported facts keep field-level provenance through `role_field_provenance`.
- claims keep claim-level provenance through `claim_provenance`.
- manual edits resolve canonical values without deleting source history.
- exact metrics and unsafe claims require approved provenance or approved safer wording before reuse.
- `Used`, `Missing`, and `Excluded` remain available for downstream rationale surfaces.
- no extracted or suggested fact becomes eligible for fit, role discovery, or assets without explicit approval or a verified safe state.

#### Accessibility requirements

- all toolbar controls, table rows, drawer controls, conflict hotspots, and reorder controls are keyboard reachable.
- icon-first controls have accessible labels and visible focus states.
- drag-and-drop reorder has arrow-button fallback.
- drawer has explicit close control and focus management.
- field errors are programmatically associated with fields.
- tooltips are readable on hover and focus and render above drawer/table layers.
- color is not the only indicator for `Imported`, `Conflict`, `Verified`, or `Blockers`.

#### Responsive behavior

- Desktop checkpoints: `1440`, `1280`, and `1024`.
- Toolbar stays on one row at all three desktop checkpoints.
- `Company` stays frozen during horizontal scroll.
- compact search may expand only within remaining toolbar space and cannot wrap the toolbar.
- long skill/tool tokens may wrap to a second line or use restrained truncation with tooltip, but never clip invisibly.
- Mobile is out of scope for this first implementation slice unless a later packet reopens it.

#### Explicitly out of scope

- D4 and later
- mobile
- website/public-funnel work
- standalone `Proof Library` route
- full platform migration or hidden Next.js rewrite
- broad auth rewrite
- arbitrary custom column builder
- Education and Certificates/Courses in the first D2 master view
- visa, languages, target-title setup, target-industry setup, and compensation-floor gating outside approved D2 fields
- D1 source-capture UI implementation
- D1 import-surface build
- D1 artifact rebuild

### Acceptance criteria for a future coding prompt

- `/profile` renders the `Profile • Check your history` D2 workspace without replacing approved D1 authority.
- The master table groups roles by company and keeps `Company` frozen during horizontal scroll.
- The toolbar order is search, filter, columns, sort, `Add role`, and it stays on one row at `1440`, `1280`, and `1024`.
- Role selection opens a real right-side editable drawer that is closed by default and can be explicitly closed.
- Role identity, timeline, responsibilities, outcomes/proof, skills/tools, and compensation fields use real controls, not static cards.
- Autosave persists edits through the approved API/state path and refreshes readiness rollups.
- Field-level and claim-level provenance stays inspectable as `Source evidence` / `See source`.
- `Continue to Role Discovery` is disabled until at least one included role exists, required categories are verified, and blocking conflicts are resolved.
- Proof-safety states preserve extracted versus suggested versus approved versus excluded truth.
- Tests cover readiness gating, conflict handling, autosave/persistence, provenance separation, and no auto-approval of extracted facts.

### File scope for a future coding prompt

Expected files, to be narrowed by the lead thread immediately before handoff:

- `src/pages/ProfileWorkspacePage.tsx`
- `src/components/profile/ProfileWorkspaceShell.tsx`
- `src/components/profile/steps/*`
- `src/lib/profileState.ts`
- `src/lib/proofLibrary.ts`
- `src/types/index.ts`
- API/client/store files that own the future Worker boundary
- nearby tests under `src/pages/__tests__/`, `src/components/profile/__tests__/`, and `src/lib/__tests__/`

Do not add dependencies without lead approval.

### Test plan for a future coding prompt

- run the smallest targeted Vitest suites for profile workspace, profile state, proof/provenance, and operator-core regressions
- add or update tests for readiness gating, autosave, conflict resolution, provenance separation, and fresh/resume behavior
- run `npm run typecheck`
- run `npm test`
- run `npm run build`
- run `npm run verify` before PR readiness
- for UI readiness, verify desktop `1440`, `1280`, and `1024`, keyboard focus, empty/loading/error/success/conflict states, and proof-safety behavior

### QA and audit plan

- Heuristic audit for the D2 history workspace.
- Task-based audit for role add/edit, conflict resolution, source inspection, proof approval/exclusion, and continue gating.
- Consistency audit against Chapter 03 controls, Chapter 05 shell, and D2 packet copy.
- Bug bash high-severity first: data loss, autosave failures, provenance collapse, false readiness, inaccessible drawer/table controls, and responsive toolbar breakage.
- Proof-safety QA must explicitly confirm no extracted or suggested content becomes downstream-approved user truth automatically.

### Rollback plan

- Revert the future implementation branch or restore touched files to the checkpoint commit.
- Keep this packet and ClickUp task in `backlog` if D2 QA, WIP, or verification fails.
- Do not expand scope into D1, D4+, website, mobile, platform migration, or broader Profile modules as a workaround for D2 issues.

## FS8 Canonical Reset

This packet supersedes the earlier assumption that `868huafcx` would resume by finishing the old `/profile` wizard steps.

From this reset onward:

- do not treat the existing `/profile` implementation as the canonical product shape
- do not assume a greenfield Next.js rewrite
- do not treat local Dexie data or static artifact state as the real persistence boundary
- do treat the approved Chapter 05 and `868hukucf` packet stack as the signed-in product authority
- do treat the current repo stack as the implementation starting point for the first vertical slice

## Current repo reality

The current app is:

- Vite
- React 19
- React Router with `BrowserRouter`
- Dexie / IndexedDB for local persistence
- existing Zustand-style store and route-level app shell

The current app is not:

- Next.js App Router
- Cloudflare-native yet
- D1-backed yet
- KV-backed yet
- already wired to a real Worker API

Implementation planning must start from that reality. A platform migration is not allowed to hide inside the first D2 build slice.

## Authority and dependency order

Use this order for all implementation decisions under this packet:

1. `docs/product/job-filter-foundation-series-governing-packet-v7.md`
2. `docs/product/foundation-series/05-activation-and-core-app.md`
3. `docs/product/foundation-series/05-activation-architecture-spec.md`
4. `docs/product/packets/868hukucf-fs5s7-desktop-screen-contract.md`
5. `docs/product/packets/868hukucf-fs5s6-user-system-definition.md`
6. `docs/product/packets/868hukucf-fs5s3c1-activation-copy-system.md`
7. current repo entry points and type reality

Chapter 04 authority remains intact for signed-out and public-funnel work. This packet does not reopen website ownership.
Chapter 04 is a sufficiency input for signed-out-to-`Profile` handoff only. Final website page comps are not an unblock requirement for this task.

## Platform decision for the first vertical slice

The first real D2 slice ships on the current frontend stack:

- Vite
- React Router
- current app shell
- current store/fetch pattern
- Dexie only as support cache

The first real slice also introduces Cloudflare-ready backend boundaries:

- Cloudflare Worker API as the real network boundary
- D1 as the canonical truth store
- KV only for ephemeral cache or import/session support where appropriate

Locked decision:

- do **not** make Next.js a hidden prerequisite for the first D2 build
- if a Next.js migration is still wanted later, it must be scoped as a separate migration packet after the D2 vertical slice is proven

## First real build slice

The first implementation slice is `Profile / Check your history` only.

This slice becomes executable only after the unblock conditions in this packet are satisfied.

### In scope

- real grouped company table
- real role drawer editing
- real Worker-backed persistence
- real autosave
- real conflict detection
- real readiness gating for `Continue to Role Discovery`
- real `Add role` flow inside the D2 table toolbar
- real `Columns`, `Filter`, `Sort`, and search behavior on approved D2 fields
- real profile-history reads from D1 through the Worker API
- local Dexie support cache for performance and resilience, not truth

### Out of scope

- D4 and later
- broader Profile modules outside first-slice role history
- website work
- mobile
- full platform migration
- broad auth and public-funnel work
- D1 import-surface implementation
- Worker code generation in this pass
- D1 migrations in this pass
- Baseline / Targeting HUD expansion from older architecture drafts
- visa, education, languages, or comp-floor gating for the first `Continue to Role Discovery` gate

## D2-first route contract

The first real build slice does not start by rebuilding the whole activation flow.

It starts with the signed-in D2 history workspace:

- route: `/profile`
- page purpose: `Check your history`
- build target: grouped company master view + role drawer editor + verification progress + continue gate

Important boundary:

- approved D1 remains the design authority for earlier activation, but it is not the first implementation slice under this packet
- the first build must support data contracts that future D1 import flows can write into, without requiring D1 UI implementation now

## Truth-engine schema v1

The schema cannot stop at only `profiles`, `companies`, `roles`, and `claims`.

The first-slice relational model is:

### `profiles`

Canonical profile root for one signed-in user.

Required responsibilities:

- own the history workspace
- own overall readiness state
- own top-level timestamps and sync metadata

### `companies`

Reusable company record under one profile.

Required responsibilities:

- stable grouping anchor for the D2 master view
- company-level ordering in the table
- company-level rollup of verified role counts

Required fields include:

- `id`
- `profile_id`
- `name`
- `sort_order`
- `included_in_history`
- `verified_roles_count`
- `total_roles_count`
- timestamps

### `roles`

Primary work-history container under a company.

Required responsibilities:

- own role identity and timeline fields
- own grouped chronology ordering
- own company-level verification rollup input
- own D2 row state and drawer state targets

Required fields include:

- `id`
- `profile_id`
- `company_id`
- `title`
- `start_month`
- `start_year`
- `end_month`
- `end_year`
- `is_current`
- `location_city`
- `location_region`
- `work_mode`
- `employment_type`
- `base_salary`
- `target_salary`
- `currency`
- `sort_order`
- `verification_state`
- `included_in_history`
- timestamps

### `role_field_provenance`

Field-level provenance for role-owned facts such as title, dates, location, work mode, employment type, and compensation.

Required responsibilities:

- support field-level comparison across sources
- support manual overrides without losing source history
- support conflict detection on role identity and timeline

Required fields include:

- `id`
- `role_id`
- `field_name`
- `source_kind`
- `import_session_id`
- `source_locator`
- `source_excerpt`
- `raw_value`
- `normalized_value`
- `is_manual_edit`
- `sort_order`
- timestamps

### `claims`

`Claim` is the technical aggregate noun for reusable role-level statements. It is the correct v1 aggregate.

Claims belong to one role and power user-facing modules like responsibilities, outcomes, hard skills, soft skills, and tools.

Required fields include:

- `id`
- `role_id`
- `claim_kind`
- `body`
- `safe_body`
- `metric_value`
- `metric_unit`
- `authoring_mode`
- `sort_order`
- `verification_state`
- `included_in_reuse`
- timestamps

### `claim_provenance`

Many-to-one provenance rows for each claim.

Required responsibilities:

- support more than one source per claim
- support manual edits and safe-wording lineage
- support proof inspection without flattening provenance to a single source label

Required fields include:

- `id`
- `claim_id`
- `source_kind`
- `import_session_id`
- `source_locator`
- `source_excerpt`
- `raw_value`
- `normalized_value`
- `is_manual_edit`
- `sort_order`
- timestamps

### `import_sessions`

Audit and import-session boundary for source ingestion.

Required responsibilities:

- record resume and LinkedIn ingestion events
- retain parse/import metadata without forcing UI to depend on artifact fixtures
- let D2 reason from imported records and provenance instead of fake seed data

Required fields include:

- `id`
- `profile_id`
- `source_kind`
- `source_file_name`
- `source_file_hash`
- `parse_mode`
- `state`
- `diagnostics_json`
- timestamps

## Claim model

Locked decision:

- `Claim` remains the technical aggregate noun in v1
- user-facing module names stay explicit in the UI

Claim kinds for the first slice:

- `responsibility`
- `outcome`
- `hard_skill`
- `soft_skill`
- `tool`

Ownership rule:

- every claim belongs to exactly one role in v1
- company-level grouping happens through `company -> role -> claim`
- user-facing modules remain separated in the drawer even though they share the technical `Claim` model

## Outcome template rule

Use `[Action Verb] + [Context] + [Metric]` as:

- authoring guidance
- optional validation guidance
- tooltip and example support

Do **not** hard-enforce it as a rigid database constraint in v1.

Allowed v1 behavior:

- outcomes may be saved without all three parts
- missing structure may lower readiness or keep the item in `Imported` or `Conflict`
- the UI may guide toward stronger structure without rejecting truthful, incomplete input

## API and persistence model

The first real slice must use a real data boundary.

Locked boundary:

- frontend calls a Cloudflare Worker API
- Worker owns validation, write orchestration, and D1 persistence
- D1 is the canonical truth store
- Dexie is a support cache only
- KV may support ephemeral cache or import-session assistance only, never canonical profile truth

This slice may not ship with:

- mock data
- static artifact data
- a fake local-only loop presented as the real app

### Minimum API surface for the first slice

The packet locks these real boundary needs, even though code is deferred:

- read grouped history workspace data for one profile
- create a role inside a company or create a new company plus role
- update role-owned fields
- update claim records
- read verification-progress rollups
- evaluate `Continue to Role Discovery` gating

Exact endpoint naming can be finalized in the build lane, but these capabilities are mandatory.

## Client fetch and state strategy

Locked decision:

- stay on the current store and fetch pattern for the first slice
- do **not** silently add `useSWR` or `React Query`

Why:

- the repo already has a working app shell, router, local store, and Dexie layer
- the first slice needs a narrow vertical build, not a hidden state-management rewrite
- dependency expansion is only justified later if the verified slice shows clear need

First-slice client pattern:

- typed API client in the frontend
- store-backed async actions for route load, row selection, drawer save, and readiness refresh
- optimistic UI only where reconciliation is explicit and reversible
- Dexie cache used for support reads or warm-starts, not truth

If a query library is proposed later, it must be raised as a separate dependency decision.

## Conflict detection loop

Conflict detection in the first slice is field-level and claim-level, not a vague screen badge.

### Comparison rules

- compare normalized imported values within the same role field or claim
- compare imported source rows from multiple active sources, including resume, LinkedIn, and manual edits where relevant
- mark `Conflict` when required facts disagree and there is no accepted canonical resolution yet

### Resolution rules

- a manual user edit may resolve the canonical value
- provenance rows remain inspectable after resolution
- safe-wording choices resolve claim reuse language, not source history

### UI update rules

- field-level conflicts surface inline inside the owning drawer module
- row-level state rolls up to the role row
- company-level verification rolls up to the company group
- route-level readiness rolls up to the sticky `Verification progress` system

### Readiness impact

- required unresolved conflicts keep the owning role from `Verified`
- non-blocking optional fields may remain incomplete without blocking the route-level gate
- required conflicts keep `Continue to Role Discovery` disabled

## Gatekeeper logic for `Continue to Role Discovery`

First-slice gate:

1. at least one included role exists
2. every included role clears required history categories
3. no required included record remains in `Imported`
4. no required included record remains in `Conflict`

Required first-slice categories:

- role identity and timeline
- responsibilities
- outcomes and proof
- skills and tools

Not part of the first-slice gate:

- education
- certificates or courses
- visa rules
- languages
- target-title setup
- target-industry setup
- compensation-floor preferences outside the role fields already approved in D2

## Deployment strategy

Locked decision:

- preview deployments on PRs
- production deployment on `main` only after verify gates, environment configuration, and migration discipline are defined

Do **not** default this packet to automatic production deploys on every push to `main` without those safeguards.

## Implementation sequencing after this packet

1. `FS8` packet reset approved
2. build the first D2 vertical slice on the current frontend stack
3. run UI, data, and readiness QA on that slice
4. ship preview deployment on PR
5. define production deploy discipline and migration handling
6. consider optional platform migration later only if still justified

## Explicit defers

- no code implementation in this packet pass
- no D1 migrations in this packet pass
- no Worker code in this packet pass
- no Next.js migration in this packet pass
- no new dependency installation in this packet pass
- no D4+ scope
- no broader Profile-module expansion beyond first-slice role history
- no website work
- no mobile work
- no auth-system rewrite
- no public-funnel rewrite
- no Baseline / Targeting HUD expansion
- no visa, education, languages, or comp-floor gating expansion

## Verification

This packet is correct only if all of the following are true:

- it explicitly resolves the Chapter 04 sufficiency rule
- it explicitly states the unblock conditions for builder work
- it no longer assumes a greenfield Next.js rewrite by default
- it explicitly chooses the first-slice platform strategy
- it explicitly defines the D2-first vertical slice
- it defines a truth-engine schema more complete than four tables
- it defines provenance, ordering, and import-session handling
- it defines real API and persistence boundaries
- it explicitly defines what is deferred
- the stable ClickUp task packet contains a matching `FS8 Canonical Scope Override`

## Risks and rollback

- Risk: implementation still drifts by treating the current local prototype as final product shape.
- Risk: D2 build scope balloons into broader Profile or platform migration work.
- Risk: provenance is underspecified and conflicts become impossible to explain cleanly in the UI.
- Rollback: keep implementation blocked, revise this packet, and do not start the build lane until the reset is approved.

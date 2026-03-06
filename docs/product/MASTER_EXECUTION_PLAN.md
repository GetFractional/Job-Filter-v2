# Job Filter Master Execution Plan

Last updated: 2026-03-06

## 1. Purpose

This is the canonical execution plan that turns the PRD package into a build order.

Its job is to keep ClickUp, GitHub, the repo, and the model split aligned so future work starts from verified reality instead of stale branches or old planning artifacts.

## 2. Success Conditions

This plan is successful when all of the following are true:

1. ClickUp, GitHub, and the repo agree about what is active, stale, shipped, cancelled, and queued.
2. The Truth Layer is complete enough that proof can be imported, reviewed, approved, traced into assets, and safely excluded when unresolved.
3. GPT-5.4 and GPT-5.3-Codex operate as separate lanes with explicit authority boundaries.
4. Only one decision-complete implementation packet is active at a time.
5. Future threads can start from repo-local execution artifacts instead of reconstructing context from chat history.

## 3. Verified Baseline After Phase 0 Cleanup

### 3.1 Repo

- Fresh `main` was verified on 2026-03-06.
- `main` contains merge commit `9725e4c3cf42f0e3bbbda0e25649ca9803359f9f` from PR #28.
- `npm run verify` passed on fresh `main`.

### 3.2 GitHub

- Open PR count: 0
- PR #19 was audited as stale and dirty against current `main`, then closed.
- PR #27 was audited as stale and behind current `main`, then closed.

### 3.3 ClickUp

- Sync heartbeat verified on [SYSTEM: Delivery OS Sync Log](https://app.clickup.com/t/868hgd4n1)
- Job Filter tasks in `in development`: 0
- Status drift corrected:
  - [868hrjj5h](https://app.clickup.com/t/868hrjj5h) -> `shipped`
  - [868hgfqjm](https://app.clickup.com/t/868hgfqjm) -> `shipped`
  - [868hgg067](https://app.clickup.com/t/868hgg067) -> `cancelled`
- Replacement packets created:
  - [868hrqhgf](https://app.clickup.com/t/868hrqhgf), Proof Library closeout
  - [868hrqhgu](https://app.clickup.com/t/868hrqhgu), deferred onboarding job-feed setup refresh
  - [868hrqhfy](https://app.clickup.com/t/868hrqhfy), governance recovery and Codex handoff

## 4. What The PR Audits Decided

### 4.1 PR #19, claims review editor

Branch: `codex/868hgg067-claims-review-editor`

Decision:

- Do not merge as-is.
- Treat as a stale reference branch only.
- Rebuild the still-desired Truth Layer delta from fresh `main` under [868hrqhgf](https://app.clickup.com/t/868hrqhgf).

Already in `main`:

- parser diagnostics and recovery paths
- import reliability hardening
- digital resume/editor groundwork
- later onboarding and import improvements that landed through follow-on PRs

Missing and still desired:

- grouped proof review gate on current `main`
- explicit proof status contract
- default auto-use guard for unresolved proof
- source metadata and lineage
- downstream asset proof references and unresolved-fact handling

Obsolete or superseded:

- stale onboarding rewrites
- stale contract scaffolding not aligned to current `main`
- entangled branch drift across assets, store, and onboarding

### 4.2 PR #27, onboarding job feeds

Branch: `codex/868hgg067-b1-8-activation-ux-completion`

Decision:

- Do not merge as-is.
- Preserve only the still-desired capture work in [868hrqhgu](https://app.clickup.com/t/868hrqhgu).
- Defer that work until Truth Layer and reliability gates are complete.

Missing and still desired later:

- persisted `jobFeeds` profile shape
- derived feed suggestions from target roles
- onboarding or early-capture feed setup UI with active toggles

Obsolete or superseded:

- broad `Accountability` terminology replacement from the stale branch
- any logic that conflicts with the Truth Layer-first sequence

## 5. Authority Split

### 5.1 GPT-5.4 lead thread

Owns:

- product sequencing
- task packet authoring
- ClickUp mutations
- GitHub review, close, and merge decisions
- QA charter
- UX and strategy critique
- anti-hallucination enforcement

Does not own:

- bulk implementation
- opportunistic refactors
- code changes outside an approved packet

### 5.2 GPT-5.3-Codex build thread

Owns:

- repo-grounded implementation
- fresh-branch state scan
- targeted tests and verification
- diff summaries
- code-level risk notes

Does not own:

- ClickUp mutations
- product scope changes
- pricing or trust-policy decisions
- GitHub close or merge decisions unless explicitly instructed

### 5.3 User

Owns:

- final product and business decisions
- exceptions to the current sequence
- approval when the strategy changes materially

## 6. Execution Order

### Phase 1, Truth Layer closeout

Current next implementation packet:

- [868hrqhgf](https://app.clickup.com/t/868hrqhgf), `ready for development`

Objective:

- finish the Proof Library foundation so downstream assets cannot silently rely on unresolved proof

Required outputs:

- proof status contract
- review gate on current `main`
- source metadata and lineage
- proof references on assets
- unresolved-proof gating or clear warning states

Blocking rule:

- no job-feed expansion starts before this packet is built and verified

### Phase 2, Post-Truth stabilization

Order:

1. [868hgfd1u](https://app.clickup.com/t/868hgfd1u), reliability and data-integrity invariants
2. [868hgfd1r](https://app.clickup.com/t/868hgfd1r), top 5 usability fixes

Reason:

- trust without invariants is fragile
- invariants without usable flows still leak confidence

### Phase 3, Capture and job-feed expansion

Order:

1. [868hgd5mg](https://app.clickup.com/t/868hgd5mg), Job Feed page
2. [868hgd5mj](https://app.clickup.com/t/868hgd5mj), dead-link validation
3. [868hgd5mm](https://app.clickup.com/t/868hgd5mm), retention policy
4. [868hgfczj](https://app.clickup.com/t/868hgfczj), active-jobs-only guardrails
5. [868hrqhgu](https://app.clickup.com/t/868hrqhgu), onboarding job-feed setup refresh

Blocking rule:

- do not start this phase until Phase 1 and Phase 2 are shipped or explicitly paused by the user

### Phase 4, Strategic Asset Engine

Objective:

- productize Research Briefs and Annual Plans after proof integrity is trustworthy

Required work before start:

- create clean task packets for Research Brief flow
- create clean task packets for Annual Plan flow
- create asset proof reference and unresolved-fact surfacing packet
- create adversarial QA and eval packet

### Phase 5, Workspace learning loop

Candidate queue:

- activity timeline hardening
- outcome logging
- asset and lane analytics
- source conversion views
- low-confidence benchmark treatment

### Phase 6, SaaS control plane

Scope, only after the flagship workflow proves value:

- auth
- tenant isolation
- billing and entitlements
- credits
- cancellation flows
- referral instrumentation

## 7. Current Operating Rules

### 7.1 WIP

- maximum active coding WIP: 2
- current verified coding WIP: 0
- preferred steady state: 1 major build packet plus 1 smaller follow-on or QA lane

### 7.2 Build packet rule

No implementation starts without:

- an existing ClickUp task packet
- a fresh branch from current `main`
- explicit scope in and scope out
- exact verification commands

### 7.3 Evidence rule

Every ClickUp mutation requires:

- the mutation itself
- a read-after-write fetch
- a sync receipt in the final output

### 7.4 GitHub rule

- one branch per task
- one PR per coherent scope
- do not reopen stale branches just because they contain partially useful code

## 8. Next Build Packet Contract

The next GPT-5.3-Codex thread should implement only [868hrqhgf](https://app.clickup.com/t/868hrqhgf).

It should:

1. start from fresh `main`
2. read this directory in the documented order
3. inspect current baseline files before editing
4. implement only the Proof Library closeout packet
5. run targeted tests first, then `npm run verify`
6. stop after producing a branch, diff summary, test summary, and risks

The exact prompt for that thread lives in [`GPT_5_3_CODEX_PROMPT.md`](./GPT_5_3_CODEX_PROMPT.md).

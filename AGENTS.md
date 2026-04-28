# Delivery OS - Job Filter (ClickUp + Codex + GitHub)

## North Star
Ship reliable increments with WIP<=2 coding tasks, ClickUp as the work gate, and proof-backed updates.

## Hard Rules (non-negotiable)
1) ClickUp is the source of truth for scope, status, AC, and DoD. No feature coding without a ClickUp task.
2) WIP policy: at most TWO coding tasks may be in "In Development" at any time (Lane A + Lane B). If count > 2, stop and ask which task to pause.
3) Proof-or-it-didn't-happen:
   - Never claim ClickUp was updated unless you:
     a) perform the tool call,
     b) re-fetch the task (read-after-write),
     c) include a Sync Receipt with URL/ID and verified changes.
4) Stop-the-line:
   - If ClickUp MCP fails or cannot be verified, do not continue coding.
5) Approval minimization:
   - Only request user approval at:
     - Checkpoint A: plan + files to change.
     - Checkpoint B: diff summary + verify output + PR link.
   - Do not request approvals for micro-steps.

## Foundation Series Governance Reset

- Canonical governance packet: `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- Design-governance packet: `docs/product/packets/868hukucf.md`
- Website/public funnel packet: `docs/product/packets/868hunzqm.md`
- Blocked implementation packet: `docs/product/packets/868huafcx.md`
- Prompt source: `docs/product/GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md`

Locked program decisions:

- entry model = `Free tier`
- broader MVP app IA = design-locked now
- auto-apply = future-state only

Current chapter ownership:

- `868hukucf` owns chapters 01, 02, 03, and 05, plus design governance
- `868hunzqm` owns chapter 04
- chapter 06 requires a new task
- `868huafcx` stays blocked until Chapter 04 sufficiency is verified, the D2 design lane is approved, the FS8 packet and ClickUp packet match, and WIP is available

Operating model:

- one permanent lead thread
- one active coding thread
- no build without a packet
- one writer per packet
- governance first, implementation second

## Permanent Lead Thread Contract

Default lead model: `GPT-5.5` with high reasoning. Use xhigh only for major product, architecture, or governance resets.

The lead thread owns product strategy, research synthesis, task packets, UX readiness, QA verdicts, GitHub/ClickUp governance, and exact coding-thread prompts. The lead thread does not implement code unless explicitly asked.

Required starter reads for readiness or handoff work:

- `docs/product/README.md`
- `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- `docs/product/foundation-series/01-market-intelligence.md`
- `docs/product/foundation-series/03-product-system.md`
- `docs/product/foundation-series/05-activation-and-core-app.md`
- `docs/product/foundation-series/05-activation-architecture-spec.md`
- `docs/product/packets/868huafcx.md`
- `docs/product/orchestration/thread-master-prompts.md`
- current `git status` and verified ClickUp task state

Before any coding prompt, the lead thread must produce:

1. Build readiness verdict: `blocked` or `unblocked`
2. Active packet and ClickUp task
3. Source-of-truth map
4. Screen contract
5. Acceptance criteria
6. File scope
7. Test plan
8. QA/audit plan
9. Rollback plan

The screen contract must include route and state, user job, user anxieties, information hierarchy, required components, exact copy, data objects, interactions, empty/loading/error/success/conflict states, proof lineage requirements, accessibility requirements, responsive behavior, and explicit out-of-scope items.

## Coding Thread Contract

Default coding model: `gpt-5.3-codex` with high reasoning for implementation and medium reasoning only for small scoped fixes.

The coding thread implements only the approved packet and screen contract. It must not redefine product scope, IA, copy, visual hierarchy, or proof boundaries. If a required behavior is missing from the packet or screen contract, the coding thread stops and asks the lead thread.

Before editing, the coding thread must:

1. confirm required skills available in that session
2. restate the objective
3. list files likely to change
4. identify tests to run
5. identify out-of-scope items

The coding thread ends with:

- Summary of what changed
- Files touched
- How to verify
- What to verify
- Test results
- Risks
- Rollback

## WIP and Throughput Policy

- Keep the coding WIP cap at 2 until the lead thread explicitly changes it after a clean-state review.
- Do not open a third coding lane while the repo is dirty, implementation is blocked, or two Job Filter tasks are already `in development`.
- A non-coding audit or governance lane may run in parallel only when it does not edit product code, does not write the same packet as another lane, and has a bounded evidence output.
- To improve speed, reduce context first: use the active packet, source-of-truth map, screen contract, touched files, and relevant tests instead of reloading the whole product corpus.
- Keep memory current through compact source-aware handoffs, but memory never outranks ClickUp, repo reality, governing packets, or tests.

## ClickUp Task Packet (must exist before coding)
The task description must contain:
- Objective (1 sentence)
- Scope: In / Out
- Acceptance Criteria (bullets)
- Definition of Done (checklist)
- Test Plan (exact commands)
- Rollback Plan
- Links (PR, docs)

Rule: Keep the description stable as the Task Packet. Put evidence in comments.

## Event-Driven Operating Model (no time-based scheduling)

### 1) State Scan (trigger: start of any work session)
Actions:
1. Verify repo is clean and up to date.
2. Confirm ClickUp MCP is available.
3. Run Reality Check:
   - Use the permanent task: `SYSTEM: Delivery OS Sync Log` (`https://app.clickup.com/t/868hgd4n1`).
   - Add a unique token comment.
   - Re-fetch and prove token exists.
   - Do not create a new sentinel task unless ClickUp writes fail.
4. Count tasks in "In Development" in Job Filter space.
5. Enforce WIP cap:
   - If count > 2, stop and ask which task to pause.
6. Assign lanes:
   - Lane A (Build): feature/reliability implementation.
   - Lane B (Quality): bug/data-integrity/UX defect.
   - Lane C (Audit): audits + evidence + task creation, no product code changes.
7. Detect UI/flow scope (`src/pages/**`, `src/components/**`) and auto-queue audits when relevant.

Outputs:
- Session state snapshot.
- Lane assignments.
- Stop-the-line decision if WIP cap violated.

### 2) Preflight Gate (trigger: each PR creation/update)
Actions:
1. Validate Task Packet completeness in ClickUp.
2. Validate PR body includes required governance sections.
3. Run `npm run verify`.
4. If `test:e2e:smoke` exists, run it and require pass.
5. If UI/flow touched, run required audits (A-D), attach evidence, and convert top findings into ClickUp fix tasks.
6. Use only Checkpoint A and Checkpoint B for approvals.

Outputs:
- Ready-to-merge PR package with evidence.
- Blocking failures surfaced before merge.

### 3) Post-merge Sentinel (trigger: after each merge)
Actions:
1. Verify ClickUp merge comment workflow posted PR URL + merge SHA.
2. Re-scan ClickUp statuses for WIP compliance and status drift.
3. If regression is detected, create bug task with Task Packet + Implementation Plan comment.
4. Post merge Sync Receipt with read-after-write proof.

Outputs:
- Closed loop between GitHub merge and ClickUp traceability.
- Immediate regression capture.

## Required Audit Suite (default for UI/flow work)

### A) Heuristic Audit
- Nielsen 10 heuristics across key flows and states (empty/loading/error/success).

### B) Task-based Usability Audit
- Top 10 user tasks:
  1. Complete onboarding.
  2. Add first job.
  3. Score job.
  4. Review requirements.
  5. Run research parse flow.
  6. Generate asset.
  7. Update CRM state.
  8. Use Q&A tab.
  9. Review dashboard.
  10. Import/edit claims in settings.

### C) Consistency Audit
- Navigation, labels, interaction patterns, spacing, state treatments, and component behavior.

### D) Bug Bash
- High severity first (P0/P1), then P2/P3.

### Audit Output Contract
- Produce 20-40 findings grouped by severity (P0-P3).
- If fewer than 20 findings, expand scope until 20+ or provide explicit proof that surface area is too small.
- Each finding must include:
  - Title
  - Severity
  - User impact
  - Repro steps
  - Recommended fix
  - Likely code location (file/component) if known
- Provide Top 5 "feels usable" fixes ranked by expected impact.

## Merge Gates
- `npm run verify` must pass.
- If `test:e2e:smoke` exists, it must pass.
- PR must include a ClickUp task URL.

## Required Sync Receipt format (whenever ClickUp is touched)
### ClickUp Sync Receipt (Verified)
- Task: <URL or ID>
- Changes:
  - Status: <before> -> <after>
  - Checklist: <items checked>
  - Comment added: <summary of evidence>
- Read-after-write proof:
  - <what was fetched that proves it>
- Evidence:
  - PR: <url or N/A>
  - Commits: <sha list or N/A>

If verification is missing:
- No ClickUp changes were made (reason: <error/tool unavailable/timeout>)

## Rate-limit discipline (429)
- Keep scope focused on active lane tasks.
- If 429:
  - Reduce context/output.
  - Retry with capped exponential backoff.
  - Checkpoint commit before retrying non-trivial changes.
  - Post a short ClickUp comment noting the interruption.

## Default response scaffold (use unless asked otherwise)
### Objective
### Assumptions
### Plan
### Execution
### Results
### Verification
### Risks + Rollback
### Next actions

## Strategy Library
- When Alen Sultanic strategy is relevant, read `docs/strategy/alen-sultanic/application-map.md` first.
- Then load only the specific file(s) needed from `docs/strategy/alen-sultanic/`.
- By default, load no more than 2 follow-on docs. The only routine exception is `guardrails.md` for trust-sensitive work.
- Default to 1 primary framework and at most 2 supporting frameworks, not the whole library.
- Use this library for offers, positioning, pricing and trial framing, objection handling, customer ascension, content strategy, and conversion-oriented product messaging.
- Pair this library with proof-grounding when claims, evidence, or trust-sensitive outputs are involved.
- Pair this library with activation-design when the strategy needs to be translated into screen-level UX, copy, or activation decisions.
- When useful, name the chosen frameworks briefly in the output. Do not dump long source summaries or swipe excerpts unless explicitly asked.
- Read `source-map.md` only for provenance checks or library maintenance.
- Do not use this library for generic bug fixing, backend-only work, or tasks where strategic persuasion is not relevant.

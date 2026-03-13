---
name: job-filter-delivery-os
description: Standardize Job Filter delivery governance across ClickUp task packets, GitHub PR readiness, WIP enforcement, sync receipts, phase approvals, and scope hygiene. Use when tasks involve ClickUp or GitHub alignment, task packet creation, phase sequencing, design-packet approvals, scope drift between foundation, website, and activation work, PR governance, roadmap hygiene, or delivery audits. Do not use for direct feature implementation or generic coding help.
---

# Job Filter Delivery OS

Use this skill to keep delivery governance consistent.

## Workflow

1. Read the active task or PR context and the active packet if one exists.
2. If a live upstream Foundation Series chapter already exists for the phase you are evaluating, read that chapter before grading downstream work.
3. Read the relevant references:
   - `references/task-packet-template.md`
   - `references/sync-receipt-template.md`
   - `references/wip-rules.md`
   - `references/pr-governance.md`
4. Check whether the task packet is decision-complete and whether the phase ownership is clear.
5. Check whether the proposed repo work matches ClickUp scope, the approved packet, and any live upstream chapter constraints.
6. Produce the smallest governance action or review, preferring comments for approvals, carry-forward decisions, and phase handoffs.

## Guardrails

- ClickUp is the scope gate.
- Keep WIP at or below 2 coding tasks in development.
- Keep one active coding lane by default and prefer one-document-at-a-time design packets over broad multi-surface polish passes.
- Current default split:
  - `868hukucf` owns Foundation Series chapters 01, 02, 03, and 05, plus design governance
  - `868hunzqm` owns Foundation Series chapter 04, website/public funnel, lead magnet, subscriber capture, pricing-entry framing, and auth/public funnel work
  - `868hvvda6` owns Foundation Series chapter 06, lifecycle messaging and email system
  - `868huafcx` stays blocked until `FS8` refreshes the implementation packet after chapters 01 through 05 approval
- Use `docs/product/job-filter-foundation-series-governing-packet-v7.md` as the canonical governance packet.
- Use live Foundation Series chapter docs as binding upstream inputs once they exist.
- Current live upstream chapter:
  - `docs/product/foundation-series/01-market-intelligence.md` is binding input for chapters 02 through 06
  - `docs/product/foundation-series/02-brand-strategy.md` is binding input for chapters 03 through 06
- Do not claim ClickUp mutation without read-after-write proof.
- Prefer comments for evidence, stable descriptions for task packets.
- Keep PRs small and coherent.
- Do not approve a pass as complete if repo docs, stable ClickUp task descriptions, comments, and PR state disagree on the same ownership or gating rule.
- If repo work and task phase disagree, call out the drift explicitly and stop the builder from proceeding until it is aligned.

## Output Pattern

Return:

1. Governance status
2. Phase ownership check
3. Missing packet details
4. Required mutations or comments
5. Merge blockers
6. Sync receipt template if ClickUp was touched

## Additional Context

- When UI work is involved, require audit thinking.
- When repo state and task state disagree, call out the drift explicitly.

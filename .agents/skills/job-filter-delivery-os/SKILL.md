---
name: job-filter-delivery-os
description: Standardize Job Filter delivery governance across ClickUp task packets, GitHub PR readiness, WIP enforcement, sync receipts, and audit output structure. Use when tasks involve ClickUp or GitHub alignment, task packet creation, PR governance, merge readiness, roadmap hygiene, or delivery audits. Do not use for direct feature implementation or generic coding help.
---

# Job Filter Delivery OS

Use this skill to keep delivery governance consistent.

## Workflow

1. Read the active task or PR context.
2. Read the relevant references:
   - `references/task-packet-template.md`
   - `references/sync-receipt-template.md`
   - `references/wip-rules.md`
   - `references/pr-governance.md`
3. Check whether the task packet is decision-complete.
4. Check whether the proposed repo work matches ClickUp scope.
5. Produce the smallest governance action or review.

## Guardrails

- ClickUp is the scope gate.
- Keep WIP at or below 2 coding tasks in development.
- Do not claim ClickUp mutation without read-after-write proof.
- Prefer comments for evidence, stable descriptions for task packets.
- Keep PRs small and coherent.

## Output Pattern

Return:

1. Governance status
2. Missing packet details
3. Required mutations or comments
4. Merge blockers
5. Sync receipt template if ClickUp was touched

## Additional Context

- When UI work is involved, require audit thinking.
- When repo state and task state disagree, call out the drift explicitly.

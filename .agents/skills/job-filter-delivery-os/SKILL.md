---
name: job-filter-delivery-os
description: Standardize Job Filter delivery governance across ClickUp task packets, GitHub PR readiness, WIP enforcement, sync receipts, phase approvals, and scope hygiene. Use when tasks involve ClickUp or GitHub alignment, task packet creation, phase sequencing, design-packet approvals, scope drift, PR governance, roadmap hygiene, or delivery audits. Do not use for direct feature implementation.
---

# Job Filter Delivery OS

Canonical source: `codex-operating-system/skills/job-filter/job-filter-delivery-os/SKILL.md`

Use this skill to keep Job Filter delivery governance consistent.

## Workflow

1. Read the active task or PR context and active packet.
2. Read the relevant governance references.
3. Check whether packet ownership and phase ownership are clear.
4. Check whether proposed repo work matches ClickUp scope and approved docs.
5. Enforce WIP discipline.
6. Produce the smallest governance action, review, or mutation plan.

## Guardrails

- ClickUp is the scope gate.
- Keep WIP at or below the active cap.
- Never claim ClickUp mutation without read-after-write proof.
- Keep PRs small and coherent.
- If repo work and task phase disagree, call out the drift explicitly and stop the builder.

## Output Pattern

Return:

1. Governance status
2. Phase ownership check
3. Missing packet details
4. Required mutations or comments
5. Merge blockers
6. Sync receipt template if ClickUp was touched

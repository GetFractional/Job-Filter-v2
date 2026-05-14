---
name: job-filter-proof-grounding
description: Protect Job Filter's truth-preserving behavior across Profile, story extraction, proof approval, application tracking, assets, rationale, Q&A, and scoring. Use when tasks touch proof contracts, extraction confidence, grounding rules, suggested-versus-approved separation, lineage, truth-preserving transformations, compare options, or any flow that could silently invent or overstate user facts. Do not use for generic styling or unrelated UI polish.
---

# Job Filter Proof Grounding

Canonical source: `codex-operating-system/skills/job-filter/job-filter-proof-grounding/SKILL.md`

Use this skill to review or specify work that could weaken truthfulness.

## Workflow

1. Read the active packet first when one exists.
2. Read the trust-sensitive Foundation Series chapters needed for the flow.
3. Read the relevant proof and grounding references.
4. Inspect the code path or artifact being changed.
5. Identify where data is:
   - extracted
   - suggested
   - transformed
   - approved
   - reused
6. State clearly whether the change is safe, risky, or disallowed.
7. Recommend the smallest safe fix or packet.

## Guardrails

- Do not allow unapproved facts to flow into assets.
- Preserve `used`, `missing`, and `excluded` when rationale surfaces are involved.
- Preserve lineage from approved proof into downstream assets and states.
- Do not let copy simplification or growth pressure weaken grounding states.
- Prefer confidence ranking and human confirmation over invention.

## Output Pattern

Return:

1. Contract impact
2. Safe or unsafe behaviors
3. Required tests
4. Edge cases
5. Lineage and status-surface notes
6. Rollback notes

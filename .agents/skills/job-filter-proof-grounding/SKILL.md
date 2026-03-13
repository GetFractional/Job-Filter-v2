---
name: job-filter-proof-grounding
description: Protect Job Filter's truth-preserving behavior across Profile, story extraction, proof approval, application tracking, assets, Why this draft, Q&A, and scoring. Use when tasks touch proof contracts, extraction confidence, grounding rules, suggested-versus-approved separation, lineage, truth-preserving transformations, compare options, or any flow that could silently invent or overstate user facts. Do not use for generic styling or unrelated UI polish.
---

# Job Filter Proof Grounding

Use this skill to review or specify work that could weaken truthfulness.

## Workflow

1. Read the active packet first when one exists.
2. Read the relevant references:
   - `references/proof-contracts.md`
   - `references/grounding-rules.md`
   - `references/extraction-decision-rules.md`
   - `references/regression-checklist.md`
3. Inspect the code path or artifact being changed.
4. Identify where data is:
   - extracted
   - suggested
   - transformed
   - approved
   - reused
5. State clearly whether the change is safe, risky, or disallowed.
6. Recommend the smallest safe fix or packet.

## Guardrails

- Do not allow unapproved facts to flow into assets.
- Do not allow extracted or suggested story fragments to silently become approved truth.
- Preserve the distinction between `used`, `missing`, and `excluded` when rationale surfaces are involved.
- Preserve lineage from approved Profile or proof into downstream assets, application-tracking states, and rationale surfaces.
- Do not let copy simplification or growth pressure weaken grounding states.
- Do not allow compare-option logic to hide meaningful structural differences.
- Prefer confidence ranking and human confirmation over invention.
- Preserve lineage where proof is reused downstream.
- Treat responsibilities and results as separate review surfaces.

## Output Pattern

Return:

1. Contract impact
2. Safe / unsafe behaviors
3. Required tests
4. Edge cases
5. Lineage and status-surface notes
6. Rollback notes

## Additional Context

- Read the shipped proof-core types and lib files first when needed.
- Use product docs only to resolve behavior, not to invent missing facts.

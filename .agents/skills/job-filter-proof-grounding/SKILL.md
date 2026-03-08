---
name: job-filter-proof-grounding
description: Protect Job Filter's proof-grounded, no-hallucination behavior across claims, import drafts, extraction candidates, career profile mapping, assets, Q&A, and scoring. Use when tasks touch proof contracts, extraction confidence, grounding rules, truth-preserving transformations, compare options, or any flow that could silently invent or overstate user facts. Do not use for generic styling or unrelated UI polish.
---

# Job Filter Proof Grounding

Use this skill to review or specify work that could weaken truthfulness.

## Workflow

1. Read the relevant references:
   - `references/proof-contracts.md`
   - `references/grounding-rules.md`
   - `references/extraction-decision-rules.md`
   - `references/regression-checklist.md`
2. Inspect the code path being changed.
3. Identify where data is:
   - extracted
   - transformed
   - approved
   - reused
4. State clearly whether the change is safe, risky, or disallowed.
5. Recommend the smallest safe fix or packet.

## Guardrails

- Do not allow unapproved facts to flow into assets.
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
5. Rollback notes

## Additional Context

- Read the shipped proof-core types and lib files first when needed.
- Use product docs only to resolve behavior, not to invent missing facts.

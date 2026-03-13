---
name: job-filter-proof-grounding
description: Protect Job Filter's truth-preserving behavior across Profile, story extraction, proof approval, application tracking, assets, Why this draft, Q&A, and scoring. Use when tasks touch proof contracts, extraction confidence, grounding rules, suggested-versus-approved separation, lineage, truth-preserving transformations, compare options, or any flow that could silently invent or overstate user facts. Do not use for generic styling or unrelated UI polish.
---

# Job Filter Proof Grounding

Use this skill to review or specify work that could weaken truthfulness.

## Workflow

1. Read the active packet first when one exists.
2. When trust, claims, or downstream rationale are in scope, read `docs/product/foundation-series/01-market-intelligence.md` before evaluating the change.
3. When trust-sensitive copy, messaging, or rationale presentation is in scope, read `docs/product/foundation-series/02-brand-strategy.md` before evaluating the change.
4. When system states, rationale surfaces, or downstream review behavior are in scope, read `docs/product/foundation-series/03-product-system.md` before evaluating the change.
5. Read the relevant references:
   - `references/proof-contracts.md`
   - `references/grounding-rules.md`
   - `references/extraction-decision-rules.md`
   - `references/regression-checklist.md`
6. Inspect the code path or artifact being changed.
7. Identify where data is:
   - extracted
   - suggested
   - transformed
   - approved
   - reused
8. State clearly whether the change is safe, risky, or disallowed.
9. Recommend the smallest safe fix or packet.

## Guardrails

- Do not allow unapproved facts to flow into assets.
- Do not allow extracted or suggested story fragments to silently become approved truth.
- Preserve the distinction between `used`, `missing`, and `excluded` when rationale surfaces are involved.
- Preserve lineage from approved Profile or proof into downstream assets, application-tracking states, and rationale surfaces.
- Do not let copy simplification or growth pressure weaken grounding states.
- Respect chapter-01 trust constraints:
  - no auto-apply in current-state promise
  - review-before-send is visible product behavior
  - inspectable reasoning is trust architecture, not optional polish
- Respect chapter-02 brand constraints:
  - mechanism before outcome
  - no proof-risk language that outruns product truth
  - no trust copy that hides review boundaries
- Respect chapter-03 system constraints:
  - suggestion and approved truth remain visually distinct
  - `used`, `missing`, and `excluded` stay explicit on rationale surfaces
  - preview and rationale remain close enough to preserve review-before-send visibility
  - no hidden auto-apply cues or misleading automation states
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

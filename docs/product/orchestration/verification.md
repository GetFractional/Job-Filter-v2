# Orchestration Verification

Last updated: 2026-04-28

## Trigger Fixtures

Use these prompts to confirm the right primary route is chosen.

| Prompt | Expected primary route | Expected support |
| --- | --- | --- |
| "Help me decide what MVP surface to build next for Job Filter" | `startup-mvp-orchestrator` | `expert-orchestrator` |
| "Turn ClickUp task 868huafcx into a build-ready packet" | `mvp-packetizer` | `product-delivery-os` |
| "Implement packet 868huafcx in the repo" | lead readiness gate before `build-from-packet` | `product-delivery-os` |
| "Review this diff against packet 868huafcx" | `evidence-qa` | none by default |
| "Map the marketing website and pricing flow into activation" | `startup-mvp-orchestrator` | `alen-sultanic` |
| "Write pricing and trial recommendations for the website" | `startup-mvp-orchestrator` | `alen-sultanic` |
| "Check whether these research claims are safe to use" | `startup-mvp-orchestrator` | future `truth-and-evidence` |
| "We have WIP drift between ClickUp and GitHub" | `startup-mvp-orchestrator` | `product-delivery-os` |
| "Create the smallest packet for a dead-link validation fix" | `mvp-packetizer` | `product-delivery-os` |
| "QA says the packet failed acceptance criterion 3, what now?" | `build-from-packet` | none by default |

Target: correct primary route on at least 8 of 10 prompts.

## Context Discipline Checks

- `build-from-packet` must be able to operate with:
  - `project-profile.md`
  - one active packet
  - one lead-approved screen contract
  - verified ClickUp task state
  - touched code and tests
- If broader docs are loaded, the builder should explain why the packet was insufficient.

## Readiness Gate Checks

- The lead handoff must include build readiness verdict, active packet and ClickUp task, source-of-truth map, screen contract, acceptance criteria, file scope, test plan, QA/audit plan, and rollback plan.
- If the verdict is `blocked`, no product-code implementation prompt should be issued.
- If the task is UI or proof-sensitive, the screen contract must include exact copy, data objects, state coverage, proof lineage, accessibility, responsive behavior, and explicit out-of-scope items.

## QA Loop Checks

- Simulate one FAIL verdict with criterion-mapped evidence.
- Simulate one PASS verdict with explicit evidence.
- Every QA finding must identify:
  - the failed packet criterion
  - the likely file or behavior
  - the retry instruction

## Memory Follow-On Gate

Do not add memory until router v1 is proven with:

- 3 packet-first pilots
- at least 1 caught issue before merge
- fewer restart prompts caused by context loss
- stable use of packet plus profile as the default build context

## Outcome Checks Across Three Pilots

- Prompt bulk is lower than the current full-canon start pattern.
- Human role stays focused on approval, prioritization, and final judgment.
- Build and QA handoffs use the template without dragging full chat history forward.

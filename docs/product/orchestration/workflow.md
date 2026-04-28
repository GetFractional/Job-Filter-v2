# Packet-First Workflow

Last updated: 2026-04-28

## Entry Rules

| Task shape | Start with | Add when needed | Output |
| --- | --- | --- | --- |
| Ambiguous, strategic, or cross-functional | `startup-mvp-orchestrator` | `expert-orchestrator` | chosen lane, next skill, exact next prompt |
| Scoped but no packet | `mvp-packetizer` | `product-delivery-os` if tracker state matters | decision-complete packet |
| Packet exists and work must ship | lead readiness gate first, then `build-from-packet` | `product-delivery-os` for branch or PR drift | readiness verdict, screen contract, diff, tests, QA handoff |
| Diff exists or task is "done" | `evidence-qa` | `product-delivery-os` if tracker state must change | PASS or FAIL verdict |
| Offer, website, pricing, or trial work | `startup-mvp-orchestrator` | `alen-sultanic` | route plus conversion-aware packet |
| Trust-sensitive claims or research | `startup-mvp-orchestrator` | future `truth-and-evidence` | verified facts vs blocked claims |

## Lane Model

- One active build lane by default
- At most two coding lanes, and only when packets and write sets are disjoint
- One QA lane only when the builder has a real diff or completion claim
- No second build lane until the first has:
  - a ClickUp task
  - a packet
  - a branch path or explicit branch note
  - a QA verdict path
- No third coding lane while the repo is dirty, implementation is blocked, or two Job Filter tasks are already `in development`
- Non-coding audit or governance support can run in parallel only with a bounded evidence output and no product-code write set

## Load Order

Builder and QA sessions should load context in this order:

1. `docs/product/orchestration/project-profile.md`
2. the active packet under `docs/product/packets/`
3. the lead-approved source-of-truth map and screen contract
4. verified ClickUp task state
5. relevant memory recall only when the packet references a prior handoff, QA verdict, or durable decision
6. touched code and tests
7. one extra reference only if the packet explicitly requires it

Escalate to the broader canon only when:

- product scope changes
- the packet is stale or contradictory
- strategy or positioning is the real task

## Memory Timing

- Memory is now available as a local recall layer
- Memory stores stable summaries only
- Memory does not replace ClickUp packets, Git history, or repo-local docs

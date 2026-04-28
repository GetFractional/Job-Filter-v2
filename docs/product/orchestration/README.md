# Job Filter Orchestration Package

Last updated: 2026-04-28

## Purpose

This package turns the broader product canon into a packet-first operating system for Codex.

Use it to keep session starts small, route work into the right lane, and avoid reloading large planning docs when the active packet is already decision-complete.

## Reading Order

1. [`project-profile.md`](./project-profile.md)
2. [`thread-master-prompts.md`](./thread-master-prompts.md)
3. the active task packet in [`../packets/`](../packets/README.md)
4. [`workflow.md`](./workflow.md)
5. [`handoff-template.md`](./handoff-template.md)
6. [`memory.md`](./memory.md)
7. [`verification.md`](./verification.md)

## Rules

- The packet plus current code is the default build context.
- The full canon stays available, but only load it when the packet or product decision requires it.
- ClickUp and Git remain the source of truth for mutable delivery state.
- Memory is a local recall aid, not a source of truth and not a rollback system.
- Implementation handoffs require a build-readiness verdict, source-of-truth map, screen contract, file scope, test plan, QA/audit plan, and rollback plan.

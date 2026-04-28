# Handoff Template

Last updated: 2026-04-28

Use this template for packetizer -> builder, builder -> QA, and QA -> builder loops.

```md
## Current state
- Task:
- Packet:
- Status:
- Build readiness verdict:
- Scope checkpoint:
- Source-of-truth map:
- Screen contract:

## Files
- touched files or planned files:

## Criteria
- packet criteria in play:
- acceptance criteria:
- out of scope:

## Evidence required
- tests:
- manual checks:
- UI/a11y checks:
- proof-safety checks:
- tracker proof:
- rollback:

## Next owner
- lane:
- skill:
- exact next ask:
```

## Rules

- Pass the packet, the project profile, and the last verdict only.
- Do not pass whole chat history.
- Map every QA failure back to a packet criterion, test, or missing evidence line.
- Do not send a coding handoff unless readiness is `unblocked` or the handoff is explicitly for non-code packet repair.

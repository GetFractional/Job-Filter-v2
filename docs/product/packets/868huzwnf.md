# Packet 868huzwnf

Task: [FEATURE: Codex-native orchestration skills + packet-first workflow](https://app.clickup.com/t/868huzwnf)  
Status: `in development`  
Primary lane: router + packetizer + builder infra  
Support skills: `expert-orchestrator`, `product-delivery-os`, `alen-sultanic` when monetization packets are involved

## Objective

Build a thin Codex-native orchestration layer that reduces context bloat, standardizes packet-first delivery, and makes Job Filter easier to ship with smaller prompts and clearer handoffs.

## Current State

- Global skills exist for orchestration selection, delivery governance, pricing/growth, GitHub review handling, and Figma flows.
- There is no packet-first router, packetizer, build-from-packet skill, or evidence-driven QA skill.
- The repo has a strong canonical product package, but routine implementation still tends to start from broader docs than necessary.
- No memory MCP server is configured in the current environment.

## Target State

- New global skills exist for routing, packet creation, packet-first execution, and packet-based QA.
- Repo-local orchestration docs and task packets provide the default context for routine build and QA work.
- The first three pilots can run without loading the whole canon by default.

## Scope In

- Add global skills:
  - `startup-mvp-orchestrator`
  - `mvp-packetizer`
  - `build-from-packet`
  - `evidence-qa`
- Add repo-local orchestration docs:
  - project profile
  - workflow
  - handoff template
  - verification guide
- Add packet files for the first orchestration pilots

## Scope Out

- Memory MCP installation
- A large agent catalog
- Product features unrelated to orchestration and packet-first flow

## Acceptance Criteria

- All four required global skills exist with concise triggers, workflow rules, and output contracts
- `docs/product/orchestration/project-profile.md` exists and is usable as a stable session start
- `docs/product/packets/` contains real packet files for current and pilot work
- Routing rules name when to add `expert-orchestrator`, `product-delivery-os`, and `alen-sultanic`
- Verification docs define trigger tests, context-discipline checks, QA pass/fail expectations, and memory gating

## Verification

- Review skill metadata and SKILL instructions for each new skill
- Confirm packet docs are enough to start builder and QA lanes
- Run the smallest repo-local verification command available after doc and skill changes

## File Shortlist

- `docs/product/orchestration/`
- `docs/product/packets/`
- `/Users/mattdimock/.codex/skills/startup-mvp-orchestrator/`
- `/Users/mattdimock/.codex/skills/mvp-packetizer/`
- `/Users/mattdimock/.codex/skills/build-from-packet/`
- `/Users/mattdimock/.codex/skills/evidence-qa/`

## Dependencies

- Existing skills:
  - `expert-orchestrator`
  - `product-delivery-os`
  - `alen-sultanic`
- Current project package under `docs/product/`

## Risks and Rollback

- Risk: the skill set becomes another layer of overhead instead of reducing prompt bulk.
- Risk: packet files drift from ClickUp if they are not refreshed during active work.
- Rollback: remove the new skills and orchestration docs in one revert if pilots do not improve speed, quality, or token efficiency.

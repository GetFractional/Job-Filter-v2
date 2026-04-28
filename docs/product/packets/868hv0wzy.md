# Packet 868hv0wzy

Task: [FEATURE: Local MCP memory skill + packet-aware recall setup](https://app.clickup.com/t/868hv0wzy)  
Status: `testing`  
Primary lane: builder infra  
Support skills: `skill-creator`, `product-delivery-os`

## Objective

Add a local-first memory layer to Codex so stable project context, packet handoffs, QA verdicts, decisions, and open risks can be recalled across sessions without turning memory into the source of truth.

## Current State

- Packet-first routing and delivery skills exist.
- No memory MCP server is configured in Codex.
- No dedicated memory skill exists.
- The repo has packet-first docs, but no repo-local memory policy.

## Target State

- Codex config contains a local SQLite-backed memory MCP server entry.
- A validated global memory skill exists for recall and write discipline.
- Repo-local docs define what memory may store, what it must never store, and how memory fits under tracker and repo truth.

## Scope In

- Create the `project-memory` skill
- Add memory MCP config under `~/.codex/config.toml`
- Add repo-local memory guidance under `docs/product/orchestration/`
- Integrate memory references into the existing packet-first skills and docs where useful

## Scope Out

- Cloud memory services
- Memory as rollback
- Automatic migration of old chats or docs into memory
- Replacing ClickUp or packet files with memory state

## Acceptance Criteria

- `project-memory` exists and passes `quick_validate.py`
- Codex config includes a local MCP memory server entry using a real package reference
- `docs/product/orchestration/memory.md` exists and defines source priority, allowed memory classes, and session-start recall order
- Existing routing/build/QA skills reference memory only as an optional recall aid, not as authority

## Verification

- validate `project-memory` with `quick_validate.py`
- verify package existence for the configured MCP package
- confirm packet and memory docs exist
- confirm config file has the new memory server block

## File Shortlist

- `/Users/mattdimock/.codex/skills/project-memory/`
- `/Users/mattdimock/.codex/config.toml`
- `docs/product/orchestration/`
- `docs/product/packets/README.md`

## Risks and Rollback

- Risk: memory gets used as a shortcut around tracker or repo truth.
- Risk: low-signal memories accumulate and reduce recall quality.
- Rollback: remove the memory skill, remove the memory config block, and keep packet-first docs intact.

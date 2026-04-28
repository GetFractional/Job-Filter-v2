# Local Memory Rules

Last updated: 2026-04-28

## Purpose

This file defines how Job Filter should use local MCP memory without letting it become a shadow source of truth.

## Source Priority

1. ClickUp task packets and verified tracker state
2. current repo reality and tests
3. packet files under `docs/product/packets/`
4. canonical docs under `docs/product/`
5. local memory summaries

If memory conflicts with a higher source, memory loses.

## What Memory Is For

- restoring the latest handoff without pasting old chats
- recalling durable product or website decisions
- recalling the latest QA verdict and unresolved risks
- restoring user workflow preferences
- carrying forward packet summaries across sessions

## What Memory Is Not For

- secrets
- mutable task state without source reference
- full chat logs
- full PRDs or docs
- code rollback
- claiming that something is shipped without repo or tracker proof

## Accepted MCP Types

- `fact`
  - use for packet summaries, handoffs, decisions, QA verdicts, risks, and research notes
- `entity`
  - use for durable project or surface identity records such as the Job Filter profile
- `relationship`
  - use for dependency or ownership links when the relationship itself matters
- `self`
  - use for durable Matt workflow preferences

## Recommended Tags

- `project:job-filter`
- `surface:app`
- `surface:web`
- `lane:router`
- `lane:packetizer`
- `lane:builder`
- `lane:qa`
- `artifact:profile`
- `artifact:packet`
- `artifact:handoff`
- `artifact:decision`
- `artifact:qa-verdict`
- `artifact:risk`
- `artifact:research-note`
- `artifact:preference`
- `task:<clickup-id>`
- `status:<draft|active|failed|passed|shipped|blocked>`

## Recommended Entities

- `Job Filter`
- `Matt Dimock`
- `/profile`
- `pricing page`
- `Proof Library`
- `ClickUp <task-id>`
- `packet`
- `QA verdict`

## Session-Start Recall Order

1. project profile memory if one exists
2. latest active packet or handoff memory
3. latest QA verdict for the active task
4. open risks or blockers

Stop after the smallest useful recall set.

## Current Recall Phrase

Use this exact phrase for the current implementation gate:

`Job Filter FS8R2 readiness reset 868huafcx Profile Check your history`

The durable takeaway is that `868huafcx` is the D2 implementation reset packet, but builder work remains blocked until D2 artifact QA is explicit, the ClickUp packet is synced and read-after-write verified, WIP is available, and the repo is clean or checkpointed.

## Write Rules

Store memory only when the artifact is likely to matter in a later session.

Good candidates:

- packet refresh summary
- website IA decision
- pricing or offer decision
- builder handoff
- QA fail or QA pass with important caveats
- readiness reset or unblock verdict with source file, ClickUp task, and verification status

Bad candidates:

- raw lint output
- long brainstorming transcripts
- temporary branch noise

## Content Pattern

Use compact, source-aware content:

```text
Title: <durable summary>
Source: <task URL, file path, PR URL, or commit SHA>
Summary: <2-4 sentence durable takeaway>
Next relevance: <why later sessions should recall this>
```

Repeat the exact recall phrase you expect to use later. The live recall tool is query-sensitive, so literal wording beats broad summaries.

## Setup Notes

- The `project-memory` skill is only a workflow wrapper. Actual memory recall and storage require the memory MCP server to be loaded by Codex.
- The memory MCP server adds tools, not MCP resources, so resource-only checks are not a valid health check.
- After any change to `/Users/mattdimock/.codex/config.toml` or the local memory install, fully quit and reopen Codex. Opening a new thread in the same app session is not enough.
- If a fresh session still cannot see memory tools, check that `/Users/mattdimock/.codex/vendor/memory-mcp/node_modules/@whenmoon-afk/memory-mcp/dist/index.js` exists and that the `[mcp_servers.memory]` block points to it.

# Job Filter AI Operating Model

Last updated: 2026-03-12

## Purpose

This document defines the current Job Filter operating model for governance, packet creation, implementation, QA, and tracker mutation.

Use it together with:

- `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- `docs/product/packets/`
- `docs/product/GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md`

## Thread Model

- one permanent lead thread
- one active coding thread
- optional QA or audit thread only when a real diff exists
- one writer per packet

## Hard Rules

- no build without a packet
- governance first, implementation second
- ClickUp is the task source of truth
- current repo reality outranks chat memory
- no tracker mutation without read-after-write verification

## Current Role Split

| Surface | Primary owner | Output |
| --- | --- | --- |
| Governance and sequencing | GPT-5.4 lead thread | packets, ownership decisions, QA verdicts, prompt docs |
| Repo-grounded implementation | GPT-5.4 coding thread | code or docs diff, verification, risks |
| QA and audit | separate review pass only when needed | findings, regression risks, evidence |
| Final business and trust decisions | human | approval, tradeoffs, exception handling |

## Standard Operating Loop

1. Start from the governing packet and active task packet.
2. Confirm authority order and current repo reality.
3. Update or create the packet before implementation if scope is stale.
4. Implement only the packet-approved scope.
5. Verify locally before claiming completion.
6. If ClickUp or GitHub is in scope, mutate only after the diff is understood and re-fetch to prove the change.

## Authority Order

1. verified ClickUp task packets and sync receipts
2. current repo reality
3. `job-filter-foundation-series-governing-packet-v7.md`
4. active packet under `docs/product/packets/`
5. `project-profile.md`
6. PRD and epic docs

## Foundation Series Rule

When the work touches chapters 01 through 06, do not let a chapter doc or artifact board become a competing packet. Governance belongs in `v7` and the chapter-owner packet first.

## Mutation Rules

### ClickUp

- mutate only when task scope requires it
- always perform read-after-write verification
- include a sync receipt when reporting completion

### GitHub

- one branch and one coherent PR per packet
- docs-only work stays docs-only
- PR body must include the relevant ClickUp task URLs

## Prompt Source

Use `docs/product/GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md` for copy-paste lead-thread and coding-thread starter prompts.

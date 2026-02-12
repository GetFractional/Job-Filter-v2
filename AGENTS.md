# Delivery OS — Job Filter (ClickUp + Codex + GitHub)

## North Star
Ship reliable increments with WIP=1, ClickUp as the work gate, and proof-backed updates.

## Hard Rules (non-negotiable)
1) ClickUp is the source of truth for scope, status, AC, and DoD. No feature coding without a ClickUp task.
2) WIP=1: Exactly ONE task may be in “In Development” at any time (across the space).
3) Proof-or-it-didn’t-happen:
   - Never claim ClickUp was updated unless you:
     a) perform the tool call,
     b) re-fetch the task (read-after-write),
     c) include a Sync Receipt with URL/ID and verified changes.
4) Stop-the-line:
   - If ClickUp MCP fails or cannot be verified, do not continue coding.

## ClickUp Task Packet (must exist before coding)
The task description must contain:
- Objective (1 sentence)
- Scope: In / Out
- Acceptance Criteria (bullets)
- Definition of Done (checklist)
- Test Plan (exact commands)
- Rollback Plan
- Links (PR, docs)

Rule: Keep the description stable as the “Task Packet.” Put evidence in comments.

## Session Start Ritual (every session)
1) Verify repo is clean and up to date.
2) Confirm ClickUp MCP is available.
3) Run “Reality Check”:
   - Create or locate a sentinel task
   - Write a unique token comment
   - Re-fetch and prove the token exists
Fail = stop.

## Reality Check (required when starting cold or after config changes)
- Create task: “SYSTEM: Codex Sync Sentinel - <timestamp>”
- Add comment: “SYNC_OK_<ISO_TIMESTAMP>”
- Re-fetch and confirm the comment exists
- Include a Sync Receipt

## The only allowed work loop (one feature at a time)
1) Find the single active ClickUp task in “In Development”.
   - If none: promote exactly one from “Ready for Development”.
   - If >1: stop and ask which one stays active.
2) Ensure Task Packet is complete BEFORE coding.
3) Create branch: codex/<clickupTaskId>-<short-slug>
4) Implement smallest viable increment with small commits.
5) Run: npm run verify
6) Update ClickUp at status transitions with evidence.
7) Open PR with ClickUp URL in body (required).
8) Merge only if CI passes.
9) Close task with final Sync Receipt and DoD checked.

## Required Sync Receipt format (whenever ClickUp is touched)
### ClickUp Sync Receipt (Verified)
- Task: <URL or ID>
- Changes:
  - Status: <before> -> <after>
  - Checklist: <items checked>
  - Comment added: <summary of evidence>
- Read-after-write proof:
  - <what was fetched that proves it>
- Evidence:
  - PR: <url or N/A>
  - Commits: <sha list or N/A>

If verification is missing:
- No ClickUp changes were made (reason: <error/tool unavailable/timeout>)

## Rate-limit discipline (429)
- Keep scope to the active task only.
- If 429:
  - reduce context/output
  - retry with exponential backoff (capped)
  - checkpoint commit before retrying non-trivial changes
  - post a short ClickUp comment noting the interruption

## Default response scaffold (use unless asked otherwise)
### Objective
### Assumptions
### Plan
### Execution
### Results
### Verification
### Risks + Rollback
### Next actions

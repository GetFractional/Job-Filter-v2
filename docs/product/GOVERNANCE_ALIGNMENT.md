# ClickUp and GitHub Governance Alignment

Last updated: 2026-03-06

## 1. Verified Session Audit

### 1.1 Git

- Local branch at audit start: `codex/868hgg067-b1-8-activation-ux-completion`
- Fresh docs branch created for this work: `codex/868hrjj5h-prd-v2-package`
- Verified open PRs:
  - [PR #19](https://github.com/GetFractional/Job-Filter-v2/pull/19)
  - [PR #27](https://github.com/GetFractional/Job-Filter-v2/pull/27)

### 1.2 ClickUp

- Verified heartbeat write and read on [SYSTEM: Delivery OS Sync Log](https://app.clickup.com/t/868hgd4n1)
- WIP count in `in development`: 2 tasks
- New canonical docs task created: [PRD v2: Canonical product package + AI operating model](https://app.clickup.com/t/868hrjj5h)

## 2. Keep / Change / Archive Decisions

### 2.1 Keep active

- [868hgfqjm](https://app.clickup.com/t/868hgfqjm), current claims import and health work
- [868hgg067](https://app.clickup.com/t/868hgg067), current claims review gate work
- [868hgfcxx](https://app.clickup.com/t/868hgfcxx), current MVP launch epic
- [868hgd5k3](https://app.clickup.com/t/868hgd5k3), job feed and link validity epic
- [868hrjj5h](https://app.clickup.com/t/868hrjj5h), canonical product package task

### 2.2 Change

- Treat `docs/product/` as the canonical target-state docs directory.
- Treat legacy docs in `docs/` as historical or current-state reference unless explicitly refreshed.
- Require every future major feature to declare:
  - current repo state
  - target state
  - migration path

### 2.3 Archive or cancel

- [868herxhv](https://app.clickup.com/t/868herxhv), `SaaS Productization Master Plan v2 (Task-Driven Execution)`, should not remain an open backlog source because it is already marked as superseded.

## 3. Canonical Doc Rules

### 3.1 Entry point

Future agents should start with:

1. `docs/product/README.md`
2. `docs/product/PRD_V2.md`
3. relevant epic packet
4. current code and tests

### 3.2 Legacy handling

Do not delete older docs unless they are wrong and unused.

Instead:

- mark them as legacy or current-state reference
- update entry points so new work lands on canonical docs first

## 4. ClickUp Rules To Reduce Hallucination

- One parent task per major workstream
- Child tasks for implementation units
- Task packet must contain objective, in/out scope, AC, DoD, tests, rollback
- Evidence belongs in comments, not in mutable scope sections
- Superseded tasks move to `cancelled`, not `backlog`

## 5. GitHub Rules To Reduce Hallucination

- one branch per task
- one PR per coherent scope
- PR body must link its ClickUp task
- if a branch has an open PR, do not mix unrelated work into it
- docs-only governance work gets its own branch, as in this session

## 6. Delivery Rules For Future AI Work

- no feature coding without an existing ClickUp task
- no claim about product behavior without code or test evidence
- no claim about delivery status without verifying GitHub or ClickUp
- no target-state PRD statement should be written as if it is already shipped

## 7. Immediate Follow-Up After This Doc Package

- cancel the superseded master-plan task
- link this doc package back to the new canonical docs task
- create child tasks from the epic packets before new build work starts

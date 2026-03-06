# ClickUp and GitHub Governance Alignment

Last updated: 2026-03-06

## 1. Purpose

This file keeps the three execution surfaces aligned:

1. ClickUp, for scope, status, acceptance criteria, and definition of done
2. GitHub, for branches, pull requests, checks, and merge history
3. The repo, for code, tests, and canonical product docs

If those surfaces disagree, future agents drift into hallucination.

## 2. Current Verified Structure

### 2.1 ClickUp

Current canonical roadmap parent:

- [868hrrgb5](https://app.clickup.com/t/868hrrgb5), `PROGRAM: PRD v2 buildout roadmap`

Current phase parents:

- [868hrrgb8](https://app.clickup.com/t/868hrrgb8), Phase 1, Truth Layer and Proof Library
- [868hrrgba](https://app.clickup.com/t/868hrrgba), Phase 2, Post-Truth Stabilization Gate
- [868hrrgbh](https://app.clickup.com/t/868hrrgbh), Phase 3, Capture and Job Feed Expansion
- [868hrrmb3](https://app.clickup.com/t/868hrrmb3), Epic 3, Lane-Aware Qualification
- [868hrrgbv](https://app.clickup.com/t/868hrrgbv), Phase 4, Strategic Asset Engine
- [868hrrgbz](https://app.clickup.com/t/868hrrgbz), Phase 5, Workspace, CRM, and Learning Loop
- [868hrrgc0](https://app.clickup.com/t/868hrrgc0), Phase 6, SaaS Control Plane

Current next implementation packet:

- [868hrqhgf](https://app.clickup.com/t/868hrqhgf), `FEATURE: Proof Library closeout, review gate + lineage contracts`

Verified cleanup decisions already reflected in ClickUp:

- legacy Airtable backlog is cancelled
- superseded hidden-list planning backlog is cancelled
- stale open-roadmap containers are cancelled
- already-merged work that was still open has been corrected to `shipped`

### 2.2 GitHub

Canonical GitHub rules after cleanup:

- `main` is the only long-lived branch
- every implementation branch must map to exactly one ClickUp task
- every open PR must map to exactly one coherent scope
- stale closed branches are not resurrection points, they are audit references only

GitHub cleanup targets:

- merge or close any open PR that is not the current implementation lane
- delete remote branches for merged task work
- delete remote branches for closed stale task work
- do not keep placeholder future-work branches when no active work is happening on them

### 2.3 Repo

Canonical repo entrypoints:

1. [`/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/README.md`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/README.md)
2. [`/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/MASTER_EXECUTION_PLAN.md`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/MASTER_EXECUTION_PLAN.md)
3. [`/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/PRD_V2.md`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/PRD_V2.md)
4. [`/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/EPIC_SPECS_V2.md`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/EPIC_SPECS_V2.md)
5. [`/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/GPT_5_3_CODEX_PROMPT.md`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/GPT_5_3_CODEX_PROMPT.md)

The root README and [`/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/PRD.md`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/PRD.md) must both point to those files so a new thread does not need chat history to find them.

## 3. Source-of-Truth Ladder

1. Verified ClickUp task packets and read-after-write receipts
2. Current `main`, open PR state, and passing checks
3. Canonical docs under `docs/product/`
4. Legacy docs under `docs/`
5. Closed PR branches and historical notes

Higher sources win when they conflict with lower ones.

## 4. ClickUp Operating Rules

### 4.1 Roadmap structure

- One program parent for PRD v2
- One parent per phase or major cross-cutting epic
- One child task per implementation packet
- QA, governance, and release tasks can sit at program level when they span phases

### 4.2 Task packet minimum

Every coding task must define:

- objective
- scope in
- scope out
- acceptance criteria
- definition of done
- exact test commands
- rollback plan
- links to docs and PRs

### 4.3 Status discipline

- `ready for development` means scope is decision-complete
- `in development` means somebody is actively coding right now
- `in review` means PR or final review exists
- `shipped` means code is on `main`
- `cancelled` means intentionally not part of the active roadmap

## 5. GitHub Operating Rules

### 5.1 Branch naming

Use:

- `codex/<clickup-task-id>-<short-slug>` for task work
- `codex/<short-governance-slug>` for governance-only repo work

Avoid:

- reusing stale closed branches
- mixing multiple tasks in one branch
- creating future-work placeholder branches before implementation starts

### 5.2 Pull request discipline

- one PR per coherent scope
- PR title should match task scope, not broader aspirations
- PR body must include the ClickUp task URL
- do not leave stale PRs open once the branch is known to be superseded

### 5.3 Branch cleanup

Delete remote branches when they are:

- already merged to `main`
- tied to a closed stale PR
- placeholder branches with no unique surviving value

Keep remote branches only when they are:

- the source branch for an open PR
- actively being coded in the current lane
- intentionally preserved for a short-lived audit reason

## 6. Anti-Hallucination Controls

To reduce false claims about product or delivery state:

- never describe a PRD target as if it is shipped code
- never describe a closed stale branch as if it is active scope
- never claim a file is on `main` unless it exists on `origin/main`
- never claim a ClickUp cleanup happened unless the task was re-fetched after mutation
- never start a new GPT-5.3-Codex build thread from chat memory when the repo-local prompt file exists

## 7. Immediate Active Sequence

1. Finish governance/docs alignment and land it on `main`
2. Keep GitHub limited to one clean governance PR or one clean implementation PR at a time
3. Start the next implementation lane from [868hrqhgf](https://app.clickup.com/t/868hrqhgf)
4. Move next to [868hgfd1u](https://app.clickup.com/t/868hgfd1u), then [868hgfd1r](https://app.clickup.com/t/868hgfd1r)
5. Do not begin Phase 3 capture/feed work until Phase 1 and Phase 2 are actually shipped

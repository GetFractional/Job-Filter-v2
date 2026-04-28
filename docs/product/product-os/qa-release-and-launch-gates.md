# QA, Release, And Launch Gates

Last updated: 2026-04-22

## Purpose

Define the verification gates that keep Product OS work buildable, trustworthy, and releasable.

## Governance Gates

Before code work:

- ClickUp task exists
- task packet exists under `docs/product/packets/`
- WIP cap is respected
- branch state is known
- active packet and Foundation authority are loaded
- scope is clear

Before PR:

- PR links ClickUp task
- PR body includes objective, scope, verification, risk, rollback
- `npm run verify` passes
- UI/flow work includes audit evidence
- proof-sensitive work includes no-hallucination checks

After merge:

- merge comment workflow is verified
- ClickUp task is updated with evidence
- WIP state is checked
- regressions become bug tasks

## Required Audit Suite For UI / Flow Work

### A. Heuristic Audit

Use Nielsen heuristics across:

- onboarding
- Profile
- Jobs
- Review
- Applications
- Workspace
- Settings
- empty, loading, error, success states

### B. Task-Based Usability Audit

Top tasks:

1. Complete source capture.
2. Check history.
3. Verify proof for reuse.
4. Create a Role Lane.
5. Add first job.
6. Review job fit.
7. Decide apply, hold, or reject.
8. Generate or review an asset.
9. Move to Applications.
10. Open Workspace and take next action.

### C. Consistency Audit

Check:

- route labels
- CTA language
- table controls
- drawer behavior
- state colors
- proof labels
- review-before-send placement
- free-tier language
- responsive behavior

### D. Bug Bash

Prioritize:

- P0 data loss, false approval, unsupported export, broken auth, broken deletion
- P1 blocked activation, broken job review, broken export, privacy issue
- P2 confusing state, layout overflow, inaccessible controls
- P3 polish and copy issues

## Smoke Flows

### Flow 1: Public To Profile

1. Visit Home.
2. Select `Build my job profile`.
3. Create account.
4. Land in `Profile`, not dashboard.
5. Confirm `Free tier` is not overbearing app chrome.

### Flow 2: Profile Verification

1. Add source or manual role.
2. Open `Check your history`.
3. Edit role fields.
4. Resolve a blocker.
5. Verify required categories.
6. Confirm `Continue to Role Discovery` unlocks only after gate passes.

### Flow 3: Role Lane

1. Open Role Discovery.
2. Create lane.
3. See proof coverage and gaps.
4. Save lane.
5. Continue to Jobs.

### Flow 4: First Job Review

1. Add job manually.
2. Parse or paste requirements.
3. Review requirements matrix.
4. Inspect source evidence.
5. Decide apply, hold, or reject.

### Flow 5: Application Workspace

1. Promote reviewed job to Applications.
2. Open Workspace.
3. Review asset or next action.
4. Confirm source lineage.
5. Export or copy only after approval.

## Proof-Grounding Checks

- Imported facts do not become verified automatically.
- Generated claims do not become approved automatically.
- Unsupported claims cannot be exported as approved.
- Used, missing, and excluded states remain visible.
- Every asset has `Why this draft` or equivalent lineage.
- Excluding evidence updates downstream rationale.
- Conflict resolution is explicit and reversible where possible.

## Accessibility Checks

- keyboard navigation for tables, drawers, modals
- visible focus states
- no text overlap at mobile and desktop widths
- controls have accessible names
- color is not the only state indicator
- error messages are associated with fields
- exported assets are readable

## Release Gates

Do not launch publicly unless:

- public funnel routes work
- auth handoff works
- activation first win works
- no unsupported claim can be approved silently
- data export works
- deletion request path exists
- telemetry captures activation and proof-safety events
- rollback path is documented

## Rollback

Documentation rollback:

- revert Product OS files only
- leave existing Foundation Series and packet docs intact

Code rollback:

- use latest shippable branch or prior commit
- disable experimental route flags
- preserve user data
- do not reset user truth records without explicit migration plan

## Verification Commands

For code PRs:

```bash
npm run verify
```

For docs-only Product OS changes:

```bash
find docs/product/product-os -type f | sort
rg -n "apply with confidence|review-before-send|source lineage|RICE|target|fit|proof|story|execution" docs/product/PRD_V3.md docs/product/product-os
```


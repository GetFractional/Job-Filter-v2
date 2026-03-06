# Job Filter Canonical Product Package

Last updated: 2026-03-06

## Purpose

This directory is the canonical target-state product package for Job Filter.

Use it when you need to answer any of these questions:

- What are we actually building next?
- Who is the beachhead user?
- What is in scope now versus later?
- Which model should do which kind of work?
- Which ClickUp and GitHub artifacts are authoritative?

## Reading Order

1. [`MASTER_EXECUTION_PLAN.md`](./MASTER_EXECUTION_PLAN.md)
2. [`PRD_V2.md`](./PRD_V2.md)
3. [`EPIC_SPECS_V2.md`](./EPIC_SPECS_V2.md)
4. [`AI_OPERATING_MODEL.md`](./AI_OPERATING_MODEL.md)
5. [`GOVERNANCE_ALIGNMENT.md`](./GOVERNANCE_ALIGNMENT.md)
6. [`GPT_5_3_CODEX_PROMPT.md`](./GPT_5_3_CODEX_PROMPT.md)

## Source-of-Truth Ladder

1. Verified ClickUp task packets and read-after-write receipts
2. Current repo reality, including `src/`, `package.json`, tests, and open PR state
3. This canonical product package
4. Legacy docs in `docs/` such as `MASTER_PLAN.md`, `STATUS.md`, and older implementation notes

If a lower source conflicts with a higher source, the higher source wins.

## Current Reality Snapshot

As of 2026-03-06, the repo is a local-first React/Vite PWA with these verified surfaces:

- App shell and routes in [`src/App.tsx`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/src/App.tsx)
- Settings and profile/preferences flow in [`src/pages/SettingsPage.tsx`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/src/pages/SettingsPage.tsx)
- Multi-step onboarding in [`src/components/onboarding/OnboardingWizard.tsx`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/src/components/onboarding/OnboardingWizard.tsx)
- Claims import, scoring, research, assets, CRM, and pipeline logic under [`src/lib`](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/src/lib)

Verified GitHub state after Phase 0 cleanup:

- No open stale product PRs remain
- Stale PR #19 was audited, replaced by clean task [868hrqhgf](https://app.clickup.com/t/868hrqhgf), and closed
- Stale PR #27 was audited, replaced by clean task [868hrqhgu](https://app.clickup.com/t/868hrqhgu), and closed

Verified ClickUp state after Phase 0 cleanup:

- Sync log heartbeat task: [SYSTEM: Delivery OS Sync Log](https://app.clickup.com/t/868hgd4n1)
- WIP in `in development`: 0 tasks
- Canonical docs package task shipped: [PRD v2: Canonical product package + AI operating model](https://app.clickup.com/t/868hrjj5h)
- Current governance task: [PROGRAM: Phase 0 governance recovery + Codex execution handoff](https://app.clickup.com/t/868hrqhfy)
- Current next coding packet: [FEATURE: Proof Library closeout, review gate + lineage contracts](https://app.clickup.com/t/868hrqhgf)

## How To Use This Package

- Use `PRD_V2.md` for product truth and prioritization.
- Use `EPIC_SPECS_V2.md` for build packets and delivery sequencing.
- Use `AI_OPERATING_MODEL.md` when deciding how to split work across GPT-5.4, GPT-5.3-Codex, and human review.
- Use `GOVERNANCE_ALIGNMENT.md` before changing ClickUp structure, closing stale tasks, or preparing PRs.
- Use `MASTER_EXECUTION_PLAN.md` for the verified current sequence and active lane decisions.
- Use `GPT_5_3_CODEX_PROMPT.md` to start the implementation thread from a clean, current prompt instead of reconstructing context from chat.

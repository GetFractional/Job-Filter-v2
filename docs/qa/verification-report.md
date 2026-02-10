# Verification Report — 2026-02-10

## Environment
- Branch: `codex/claude-setup-product-studio-0wpe1`
- App URL: `http://127.0.0.1:4173/`
- Runtime mode: `Template Mode` (no provider key configured)

## What Was Fixed In This Pass
1. Claims ledger now enforces canonical structure:
   - `Experience` claims require both role and company.
   - `Skill`/`Tool`/`Outcome` claims require claim text.
   - Atomic claims must be linked to a valid `experienceId`.
   - `Outcome` claims marked `Approved` must include a metric.
2. Parser import hardening:
   - Safer experience text generation for parser imports.
   - Import flow now skips malformed included rows and reports skipped/failed counts.
3. Tests added for new claim validation guardrails.

## Automated Test Commands + Results

### 1) Lint
- Command: `npm run lint`
- Result: pass, no lint errors.

### 2) Unit + Integration Tests
- Command: `npm test`
- Result: pass, `44/44` tests.
- Includes deterministic checks for:
  - parser segmentation + normalization + dedupe
  - requirements extraction/mapping
  - context binding for assets/research/Q&A
  - wrong-company leakage prevention in templates
  - claims-ledger duplicate handling + canonical categories
  - claim context validation guardrails

### 3) Production Build
- Command: `npm run build`
- Result: pass.
- Note: Vite bundle size warning persists (`~596 KB` JS chunk).

## Smoke Evidence (Playwright Screenshots)

Captured from live app at `http://127.0.0.1:4173/`:

- `docs/qa/screenshots-after/final-build-2026-02-10/01-pipeline-v2.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/02-dashboard.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/03-contacts.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/04-settings-profile-v2.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/05-settings-claims-ledger-v2.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/workspace/06-workspace-score.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/workspace/07-workspace-requirements.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/workspace/08-workspace-research.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/workspace/09-workspace-assets.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/workspace/10-workspace-crm.png`
- `docs/qa/screenshots-after/final-build-2026-02-10/workspace/11-workspace-qa.png`

## Manual QA Checklist + Outcomes

1. Onboarding entry and progress flow
- Outcome: pass (existing screenshots and route flow present).

2. Pipeline creation and action visibility above fold
- Outcome: pass (header CTAs, next-best-actions, qualification columns visible).

3. Workspace requirements matrix rendering
- Outcome: pass (structured table with requirement category/evidence/match/gap).

4. Research generation guardrail for mismatched company context
- Outcome: pass via tests (`validateResearchCompanyMatch` + context binder tests).

5. Asset generation context binding (active job + approved claims + research)
- Outcome: pass via tests and UI gate messaging.

6. CRM contact-linking and timeline/follow-up behavior
- Outcome: pass (job-contact linking + follow-up date fields rendered).

7. Claims ledger canonical structure and validation
- Outcome: pass after this patch (enforced anchor + linking + metric rule for approved outcomes).

## Known Remaining Risks
1. No in-repo Playwright e2e test harness is configured yet (screenshots captured via external Playwright MCP run).
2. Bundle chunk is above 500 KB warning threshold.
3. Existing repository has a large pre-existing uncommitted diff; this report reflects current working tree behavior.

# Metrics, Telemetry, And RICE Roadmap

Last updated: 2026-04-23

## North Star

`Qualified interviews per active search cycle`

This is intentionally downstream of application volume. Job Filter should improve application quality, not simply increase submissions.

## Activation Metric

`Verified profile + first fit decision completed`

Definition:

- user verifies the minimum Profile history threshold
- user creates or accepts at least one Role Lane
- user adds or captures one job
- user completes Review with apply, hold, or reject

## KPI Tree

| Layer | Metric | Why it matters |
| --- | --- | --- |
| Acquisition | visitor to auth start | Measures public promise clarity. |
| Activation | verified profile rate | Measures setup becoming reusable leverage. |
| Activation | first fit decision rate | Measures product reaching decision value. |
| Quality | proof coverage per reviewed job | Measures whether applications are defensible. |
| Quality | unsupported claim block rate | Measures trust safety. |
| Execution | qualified application count | Measures committed effort, not raw saves. |
| Outcome | interview per qualified application | Measures real search effectiveness. |
| Retention | weekly active application workspaces | Measures ongoing operating value. |
| Guardrail | auto-generated approved without review | Must be zero. |

## Core Event Model

| Event | Required properties |
| --- | --- |
| `profile_source_added` | source_type, upload_method, parse_status |
| `role_field_verified` | role_id, field_key, previous_state, new_state |
| `claim_verified` | claim_id, claim_type, evidence_count |
| `conflict_resolved` | conflict_type, resolution_type |
| `role_lane_created` | lane_id, source, proof_coverage |
| `job_added` | source_type, lane_id, capture_confidence |
| `job_requirements_parsed` | job_id, requirement_count, parse_confidence |
| `fit_assessment_completed` | job_id, proven_count, missing_count, risky_count, decision |
| `application_created` | job_id, lane_id, decision_source |
| `asset_drafted` | asset_type, source_claim_count, unsupported_count |
| `asset_approved` | asset_type, review_duration, edits_count |
| `unsupported_claim_blocked` | asset_type, claim_type, reason |

## Guardrails

- no asset can be approved without review
- no unsupported claim can be exported as approved
- no current-state UI can imply auto-submit
- free users must complete at least one meaningful first-value loop
- data export and deletion must remain accessible

## RICE Roadmap

Scoring uses 1-5 for Reach, Impact, Confidence, and Effort. Higher final score means earlier product priority. Strategic fit can override raw score.

| Initiative | Reach | Impact | Confidence | Effort | Score | Phase | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Proof-first Profile D2 verification | 5 | 5 | 5 | 3 | 41.7 | MVP | Required foundation. |
| Role Discovery and Role Lanes | 4 | 5 | 4 | 3 | 26.7 | MVP | Core when users are weighing more than one credible path. |
| Job requirements matrix | 5 | 5 | 4 | 3 | 33.3 | MVP | Main Teal/Rezi differentiation. |
| Review apply/hold/reject boundary | 5 | 5 | 5 | 2 | 62.5 | MVP | Mandatory trust and quality gate. |
| Applications list | 4 | 4 | 4 | 2 | 32.0 | MVP | Turns decisions into execution. |
| Workspace shell | 4 | 4 | 3 | 3 | 16.0 | MVP | First operational loop. |
| Reviewed asset generation with lineage | 4 | 5 | 3 | 4 | 15.0 | P1 | High value, high trust risk. |
| Dense Jobs manager table | 4 | 3 | 4 | 3 | 16.0 | P1 | Table-stakes against Teal/Huntr. |
| Company/context research | 3 | 3 | 3 | 3 | 9.0 | P1 | Supports Review and interviews. |
| Contact/referral path | 3 | 3 | 3 | 3 | 9.0 | P2 | Useful, but avoid CRM bloat. |
| Chrome extension save flow | 4 | 4 | 3 | 4 | 12.0 | P2 | Category expectation, heavier build. |
| Field-level autofill | 3 | 3 | 2 | 5 | 3.6 | P3 | Defer until proof and review are strong. |
| Full template marketplace | 3 | 2 | 3 | 5 | 3.6 | Defer | Weak wedge. |
| Auto-apply as core promise | 5 | -5 | 5 | 5 | Reject | Reject | Strategic mismatch. |

## Roadmap

### MVP

- Profile D2 verification
- Role Discovery
- first job capture
- requirements matrix
- Review apply/hold/reject decision
- Applications list
- first Workspace shell
- telemetry and export basics

### P1

- reviewed asset generation with lineage
- dense Jobs table
- richer proof coverage views
- company/context research
- launch analytics dashboard

### P2

- Chrome extension save
- contacts/referral path
- outreach and interview prep from proof base
- richer exports and data portability

### P3

- field-level autofill
- outcome learning loop
- advanced role-market intelligence

## Launch Gates

- verified Profile flow passes smoke test
- first job Review can produce apply/hold/reject
- unsupported generated claims are blocked
- data export works
- public funnel routes to Profile correctly
- telemetry captures activation and proof-safety events
- rollback plan is documented per release

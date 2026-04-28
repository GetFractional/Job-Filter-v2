# Truth Engine Data And API Contract

Last updated: 2026-04-22  
Status: product contract, not implementation migration

## Purpose

Define the minimum truth, proof, job, fit, application, and asset model required to deliver the Product OS without weakening trust.

This contract aligns with the current repo reality: Vite, React, React Router, Dexie support cache, and future Cloudflare Worker + D1 truth boundary.

## Storage Boundary

Current first-slice rule:

- D1 should become canonical truth for profile history, jobs, fit, applications, assets, and provenance.
- Worker API should become the network boundary.
- Dexie can be a support cache, draft buffer, or offline resilience layer, not canonical truth.
- No Next.js migration is implied by this contract.

## Core Objects

### `Profile`

Root object for one signed-in user's reusable job-search truth.

Responsibilities:

- own source imports
- own companies, roles, claims, evidence
- own verification progress
- own role lanes
- own export and deletion boundaries

### `Company`

Grouping object for work history and job context.

Key fields:

- `id`
- `profile_id`
- `name`
- `sort_order`
- `included_in_history`
- `verified_roles_count`
- `total_roles_count`
- timestamps

### `Role`

Primary work-history row under a company.

Key fields:

- `id`
- `profile_id`
- `company_id`
- `title`
- `start_month`
- `start_year`
- `end_month`
- `end_year`
- `is_current`
- `location_city`
- `location_state`
- `work_mode`
- `employment_type`
- `base_salary`
- `target_salary`
- `currency`
- `verification_state`
- timestamps

### `Claim`

Reusable statement about work, scope, result, responsibility, skill, tool, or constraint.

Claim categories:

- responsibility
- outcome
- metric
- hard skill
- soft skill
- tool
- domain
- leadership
- scope
- preference

### `Evidence`

Source material that can support a claim.

Evidence types:

- resume import
- LinkedIn import
- manual entry
- artifact
- portfolio link
- performance review
- project document
- user note
- job description
- company research

### `Provenance`

Link between data and source.

Responsibilities:

- show source
- show extraction method
- show confidence
- show last user approval
- preserve auditability

### `RoleLane`

User-owned target direction.

Fields:

- name
- target titles
- proof coverage
- constraints
- preferred industries
- risk notes
- excluded titles or contexts

### `Job`

Concrete opportunity captured or added by the user.

Fields:

- company
- title
- source URL
- source type
- description
- location
- compensation range
- role lane
- saved status
- parsed requirements
- capture confidence

### `Requirement`

Extracted or manually added job requirement.

States:

- proven
- plausible
- missing
- risky
- disqualifying
- excluded

### `RequirementProofLink`

Join object connecting one requirement to supporting, weak, or missing proof.

Responsibilities:

- show which Profile claim supports the requirement
- show which evidence supports the claim
- preserve why a requirement was marked proven, plausible, missing, risky, disqualifying, or excluded
- distinguish role-history continuity from application-proof usage
- preserve user override and exclusion rationale

Key fields:

- `id`
- `requirement_id`
- `claim_id`
- `evidence_id`
- `state`
- `rationale`
- `confidence`
- `user_review_state`
- timestamps

### `FitAssessment`

Review object for one job against one profile and lane.

Responsibilities:

- hold requirements matrix
- hold proof coverage
- hold opportunity cost
- hold final user decision
- preserve reasoning and review timestamp

### `Application`

Committed pursuit created only after Review.

Fields:

- job
- status
- workspace
- next action
- due date
- follow-up date
- asset set
- contact/referral path

### `Asset`

Application output or working material.

Types:

- resume variant
- cover letter
- outreach email
- application answer
- interview story
- thank-you note
- follow-up

States:

- draft
- needs review
- approved
- exported
- superseded
- unsupported

### `AssetClaim`

Line-item object for any generated or edited bullet, skill, paragraph, answer, or message fragment used inside an asset.

Responsibilities:

- connect asset content to approved Profile truth
- record selected requirement(s)
- record included, excluded, and unsupported suggestions
- preserve edit history and user approval
- block export when unsupported claims remain

Key fields:

- `id`
- `asset_id`
- `content_type`
- `content_text`
- `source_claim_ids`
- `source_evidence_ids`
- `requirement_ids`
- `risk_state`
- `include_state`
- `include_rationale`
- `user_approval_state`
- timestamps

## Truth States

| State | Meaning | Downstream behavior |
| --- | --- | --- |
| Imported | Extracted or copied but not approved. | Can appear as suggestion, cannot be used as approved truth. |
| Conflict | Contradicts another source or rule. | Blocks relevant gate until resolved or excluded. |
| Verified | User approved for reuse. | Can support Role Discovery, Review, and assets. |
| Excluded | User explicitly removed from use. | Must stay visible in rationale if relevant. |
| Unsupported | Generated or inferred without evidence. | Cannot be exported as approved content. |

## Review-Before-Send Contract

Any generated or transformed content must include:

- source claim IDs
- source evidence IDs
- requirement IDs served
- confidence state
- risk state
- missing evidence list
- include or exclude rationale
- user approval state
- edit history
- export/copy timestamp if used

Generated content cannot become `approved` automatically.

## Minimum API Capabilities

Names are product-level capabilities, not final endpoint names.

### Profile

- create profile
- read profile summary
- update profile preferences
- export profile
- delete profile

### History

- list companies and roles
- create company
- create role
- update role
- reorder roles
- verify role field
- exclude role or claim
- resolve conflict
- read verification progress

### Evidence And Claims

- attach source
- list evidence
- list claims
- create claim
- update claim
- link claim to evidence
- verify claim
- exclude claim
- read provenance

### Role Lanes

- list lanes
- create lane
- update lane
- compare lanes
- compute proof coverage

### Jobs

- create manual job
- capture job from URL or extension
- parse job description
- list jobs
- update job status
- assign lane
- read requirements

### Review

- create fit assessment
- update requirement state
- attach proof to requirement
- exclude requirement with rationale
- decide apply, hold, reject
- promote to application

### Applications And Workspace

- list applications
- update application status
- open workspace
- update next action
- attach contact
- attach asset

### Assets

- draft asset from approved claims
- show lineage
- update asset claim include/exclude state
- classify extracted keyword as required, preferred, contextual, noise, or unsupported
- mark needs review
- approve asset
- export asset
- supersede asset

## API Rules

- Every mutation needs actor, timestamp, and source.
- Every generated asset needs lineage.
- Batch updates must preserve per-field provenance.
- Conflict resolution must be explicit.
- Local cache must never silently overwrite canonical truth.
- Import sessions must be recoverable and inspectable.
- Data export must include Profile, jobs, applications, assets, and provenance.

## Analytics Events

Minimum events:

- `profile_source_added`
- `role_field_verified`
- `claim_verified`
- `conflict_resolved`
- `role_lane_created`
- `job_added`
- `job_requirements_parsed`
- `fit_assessment_completed`
- `job_decision_recorded`
- `application_created`
- `asset_drafted`
- `asset_approved`
- `asset_exported`
- `unsupported_claim_blocked`
- `asset_claim_excluded`
- `keyword_noise_detected`

## First Slice Contract

The first executable vertical slice should focus on:

- `Profile / Check your history`
- company-grouped role table
- right drawer editing
- provenance
- autosave
- conflict detection
- verification progress
- `Continue to Role Discovery` gate

It should not include:

- full platform migration
- full Chrome extension
- auto-apply
- broad Profile modules beyond first-slice role history
- D4+ flows

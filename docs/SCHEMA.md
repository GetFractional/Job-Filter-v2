# Data Schema

> **Purpose:** Canonical reference for all data entities, their fields, types, relationships, and constraints. This schema drives the Dexie.js (IndexedDB) table definitions and the TypeScript type interfaces. Airtable column mapping is TBD and will be added when sync is implemented.
>
> **Storage:** IndexedDB via Dexie.js is the primary (and currently only) data store. All data lives on-device.

---

## Entity Relationship Overview

```
Profile (singleton)
  |
  +-- Claims[]

Jobs -----> Companies (many Jobs to one Company)
  |
  +-- Assets[] (one Job has many Assets)
  +-- Activities[] (one Job has many Activities)
  +-- Outcomes[] (one Job has many Outcomes)

Companies -----> Contacts[] (one Company has many Contacts)

Contacts -----> Activities[] (one Contact has many Activities)

Templates -----> Assets (one Template produces many Assets)
Templates -----> Experiments (one Experiment compares Template variants)

Experiments -----> Outcomes (Experiment variants link to Outcomes for attribution)
```

---

## 1. Profile

**Description:** Singleton record representing the user's professional identity. Source of truth for the claim ledger.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Always "default" (singleton) |
| `fullName` | `string` | Yes | User's full name |
| `headline` | `string` | No | Professional headline / title |
| `email` | `string` | No | Primary email |
| `phone` | `string` | No | Phone number |
| `linkedinUrl` | `string` | No | LinkedIn profile URL |
| `targetRoles` | `string[]` | Yes | Target role titles (e.g., "VP Marketing", "Head of Growth") |
| `targetCompMin` | `number` | Yes | Minimum acceptable base salary |
| `targetCompIdeal` | `number` | Yes | Ideal base salary |
| `mustHaveBenefits` | `string[]` | Yes | Non-negotiable benefits (e.g., "medical_dependents", "dental_dependents") |
| `preferredBenefits` | `string[]` | No | Nice-to-have benefits (e.g., "401k", "equity", "bonus") |
| `locationPrefs` | `string[]` | No | Acceptable locations or "remote" |
| `companyStageFloor` | `string` | Yes | Minimum company stage: "seed", "seriesA", "seriesB", "seriesC", "public", "profitable" |
| `disqualifiers` | `string[]` | Yes | Hard disqualifier keywords/patterns (e.g., "paid media operator", "hands-on PPC") |
| `claims` | `Claim[]` | Yes | Array of verified professional claims (see below) |
| `rawResumeText` | `string` | No | Original pasted resume text for reference |
| `updatedAt` | `number` | Yes | Unix timestamp of last update |

### Claim (embedded in Profile)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `type` | `enum` | Yes | "role" / "responsibility" / "tool" / "metric" / "credential" / "capability" |
| `text` | `string` | Yes | The claim statement |
| `company` | `string` | No | Company this claim relates to |
| `startDate` | `string` | No | ISO date string |
| `endDate` | `string` | No | ISO date string (null = current) |
| `source` | `enum` | Yes | "resume" / "linkedin" / "manual" |
| `verified` | `boolean` | Yes | User has confirmed this claim is accurate |

---

## 2. Jobs

**Description:** A job opportunity being tracked through the pipeline.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `title` | `string` | Yes | Job title |
| `companyId` | `string` | Yes | FK to Companies |
| `companyName` | `string` | Yes | Denormalized for display |
| `url` | `string` | No | Job posting URL |
| `source` | `string` | No | Where the job was found (LinkedIn, Indeed, referral, etc.) |
| `location` | `string` | No | Location or "Remote" |
| `remoteType` | `enum` | No | "remote" / "hybrid" / "onsite" / "unknown" |
| `employmentType` | `enum` | No | "fulltime" / "contract" / "parttime" / "unknown" |
| `compRangeMin` | `number` | No | Posted comp range minimum |
| `compRangeMax` | `number` | No | Posted comp range maximum |
| `jdRaw` | `string` | No | Raw pasted job description text |
| `jdParsed` | `object` | No | Structured parsed JD (see below) |
| `stage` | `enum` | Yes | Pipeline stage (see Pipeline Stages below) |
| `stageHistory` | `StageEvent[]` | Yes | Array of stage transitions with timestamps |
| `fitScore` | `number` | No | 0-100 fit score |
| `fitLabel` | `enum` | No | "pursue" / "maybe" / "pass" |
| `disqualifiers` | `string[]` | No | Active disqualifier reasons |
| `reasonsPursue` | `string[]` | No | Top reasons to pursue |
| `reasonsPass` | `string[]` | No | Top reasons to pass |
| `redFlags` | `string[]` | No | Risk signals |
| `interviewFocusAreas` | `string[]` | No | Suggested interview topics |
| `hypotheses3060_90` | `string[]` | No | 30/60/90 day hypotheses |
| `researchBrief` | `ResearchBrief` | No | Structured research data (see below) |
| `notes` | `string` | No | Free-form notes |
| `createdAt` | `number` | Yes | Unix timestamp |
| `updatedAt` | `number` | Yes | Unix timestamp |

### Pipeline Stages (enum values)

```
"discovered" | "captured" | "scored" | "researched" | "assets_ready" |
"outreach_sent" | "response_received" | "interviewing" |
"offer" | "negotiation" | "closed_won" | "closed_lost"
```

### StageEvent (embedded in Jobs)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | `enum` | Yes | The stage entered |
| `enteredAt` | `number` | Yes | Unix timestamp |
| `exitedAt` | `number` | No | Unix timestamp (null = current stage) |

### JdParsed (embedded in Jobs)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requirements` | `string[]` | No | Extracted requirements |
| `skills` | `string[]` | No | Required skills/tools |
| `yearsExperience` | `string` | No | Years of experience mentioned |
| `responsibilities` | `string[]` | No | Key responsibilities |
| `compSignals` | `string[]` | No | Compensation-related text |
| `benefitsSignals` | `string[]` | No | Benefits-related text |
| `teamSize` | `string` | No | Team size if mentioned |
| `reportsTo` | `string` | No | Reporting line if mentioned |

### ResearchBrief (embedded in Jobs)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `companyOverview` | `string` | No | Business model, size, stage |
| `icpAndBuyingMotion` | `string` | No | Who they sell to and how |
| `competitors` | `string` | No | Competitive landscape |
| `gtmChannels` | `string` | No | Go-to-market channels and funnel |
| `orgAndLeadership` | `string` | No | Org structure, key leaders |
| `risks` | `string` | No | Risks and mitigations |
| `interviewHypotheses` | `string[]` | No | Hypotheses to test in interviews |
| `compSignals` | `string` | No | Compensation data if found |
| `sources` | `string[]` | No | URLs and references used |
| `completedAt` | `number` | No | Unix timestamp |

---

## 3. Companies

**Description:** A company associated with one or more job opportunities.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `name` | `string` | Yes | Company name |
| `website` | `string` | No | Company website URL |
| `linkedinUrl` | `string` | No | Company LinkedIn URL |
| `stage` | `enum` | No | "seed" / "seriesA" / "seriesB" / "seriesC" / "public" / "profitable" / "unknown" |
| `industry` | `string` | No | Industry or vertical |
| `businessModel` | `string` | No | B2B, B2C, marketplace, etc. |
| `employeeCount` | `string` | No | Approximate employee count or range |
| `notes` | `string` | No | Free-form notes |
| `riskFlags` | `string[]` | No | Risk signals (e.g., "recent layoffs", "no marketing leadership") |
| `createdAt` | `number` | Yes | Unix timestamp |
| `updatedAt` | `number` | Yes | Unix timestamp |

---

## 4. Contacts

**Description:** A person associated with a company, relevant to one or more jobs.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `companyId` | `string` | Yes | FK to Companies |
| `name` | `string` | Yes | Full name |
| `role` | `string` | No | Their job title |
| `relationshipType` | `enum` | No | "recruiter" / "hiring_manager" / "referrer" / "peer" / "executive" / "other" |
| `email` | `string` | No | Email address |
| `linkedinUrl` | `string` | No | LinkedIn profile URL |
| `phone` | `string` | No | Phone number |
| `notes` | `string` | No | Free-form notes |
| `createdAt` | `number` | Yes | Unix timestamp |
| `updatedAt` | `number` | Yes | Unix timestamp |

---

## 5. Activities

**Description:** A logged interaction (outbound or inbound) related to a job and/or contact.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `jobId` | `string` | Yes | FK to Jobs |
| `contactId` | `string` | No | FK to Contacts |
| `type` | `enum` | Yes | "outreach" / "follow_up" / "reply_received" / "call" / "meeting" / "interview" / "note" |
| `channel` | `enum` | Yes | "email" / "linkedin" / "phone" / "in_person" / "other" |
| `direction` | `enum` | Yes | "outbound" / "inbound" |
| `subject` | `string` | No | Subject line or brief description |
| `body` | `string` | No | Message content or meeting notes |
| `templateId` | `string` | No | FK to Templates (if outbound used a template) |
| `templateVersion` | `number` | No | Version of template used |
| `experimentId` | `string` | No | FK to Experiments (if part of an experiment) |
| `experimentVariant` | `string` | No | Which variant was assigned |
| `outcomeTag` | `enum` | No | "no_response" / "reply" / "screen_scheduled" / "rejected" / "referral" / "other" |
| `followUpDate` | `number` | No | Unix timestamp for scheduled follow-up |
| `occurredAt` | `number` | Yes | Unix timestamp of when the activity happened |
| `createdAt` | `number` | Yes | Unix timestamp |

---

## 6. Assets

**Description:** A generated document or message related to a job.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `jobId` | `string` | Yes | FK to Jobs |
| `type` | `enum` | Yes | "outreach_email" / "connect_note" / "cover_letter" / "growth_memo" / "interview_pack" / "negotiation_pack" / "custom" |
| `templateId` | `string` | No | FK to Templates |
| `templateVersion` | `number` | No | Version of template used |
| `version` | `number` | Yes | Asset version (incremented on each edit/regeneration) |
| `content` | `string` | Yes | The generated/edited content |
| `model` | `string` | No | Model used ("clipboard" for manual, or model ID) |
| `provider` | `string` | No | "clipboard" / "openai" / "anthropic" / etc. |
| `inputTokens` | `number` | No | Estimated input tokens |
| `outputTokens` | `number` | No | Estimated output tokens |
| `estimatedCost` | `number` | No | Estimated cost in USD |
| `promptUsed` | `string` | No | The full prompt sent to the model or clipboard |
| `claimReferences` | `string[]` | No | Array of Claim IDs referenced in this asset |
| `approved` | `boolean` | Yes | User has reviewed and approved this version |
| `approvedAt` | `number` | No | Unix timestamp of approval |
| `notes` | `string` | No | Internal notes about this asset version |
| `createdAt` | `number` | Yes | Unix timestamp |

---

## 7. Templates

**Description:** A reusable prompt/output template for generating assets.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `name` | `string` | Yes | Human-readable template name |
| `assetType` | `enum` | Yes | Which asset type this template produces |
| `version` | `number` | Yes | Current version number |
| `promptText` | `string` | Yes | The prompt template with variable placeholders |
| `variablesRequired` | `string[]` | Yes | List of variable names the template expects |
| `outputFormat` | `string` | No | Expected output structure description |
| `defaultModel` | `string` | No | Recommended model for this template |
| `tone` | `string` | No | Tone guidance (e.g., "executive", "direct", "consultative") |
| `constraints` | `string[]` | No | Output constraints (e.g., "max 300 chars", "no unverified metrics") |
| `hypothesis` | `string` | No | What this template is designed to test or optimize for |
| `isActive` | `boolean` | Yes | Whether this template is available for use |
| `createdAt` | `number` | Yes | Unix timestamp |
| `updatedAt` | `number` | Yes | Unix timestamp |

### Template version history

Template versions are tracked by storing previous versions as separate records with the same `id` base but different `version` numbers. The active version is the highest version number where `isActive` is true.

---

## 8. Experiments

**Description:** An A/B test or comparison between template variants, model variants, or approach variants.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `name` | `string` | Yes | Experiment name |
| `type` | `enum` | Yes | "ab_test" / "multivariate" / "before_after" |
| `assetType` | `enum` | Yes | Which asset type is being tested |
| `variants` | `Variant[]` | Yes | Array of variant definitions (see below) |
| `successMetric` | `string` | Yes | Primary metric (e.g., "response_rate", "screen_rate") |
| `secondaryMetric` | `string` | No | Secondary metric |
| `hypothesis` | `string` | Yes | What we expect and why |
| `minSampleSize` | `number` | No | Minimum observations per variant before evaluation |
| `status` | `enum` | Yes | "draft" / "active" / "paused" / "completed" / "cancelled" |
| `startDate` | `number` | No | Unix timestamp |
| `endDate` | `number` | No | Unix timestamp |
| `result` | `string` | No | Summary of findings |
| `decision` | `string` | No | What was decided based on results |
| `createdAt` | `number` | Yes | Unix timestamp |
| `updatedAt` | `number` | Yes | Unix timestamp |

### Variant (embedded in Experiments)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Variant identifier (e.g., "A", "B") |
| `templateId` | `string` | Yes | FK to Templates |
| `templateVersion` | `number` | Yes | Which version of the template |
| `model` | `string` | No | Model to use (if testing models) |
| `description` | `string` | No | What makes this variant different |

---

## 9. Outcomes

**Description:** A stage transition or measurable event linked to a job, used for funnel analytics and experiment attribution.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | UUID |
| `jobId` | `string` | Yes | FK to Jobs |
| `type` | `enum` | Yes | "stage_change" / "reply_received" / "screen_completed" / "interview_completed" / "offer_received" / "offer_accepted" / "offer_declined" / "withdrawn" / "rejected" |
| `fromStage` | `string` | No | Previous stage (for stage_change type) |
| `toStage` | `string` | No | New stage (for stage_change type) |
| `activityId` | `string` | No | FK to Activities (the activity that triggered this outcome) |
| `experimentId` | `string` | No | FK to Experiments (if this outcome is attributable to an experiment) |
| `experimentVariant` | `string` | No | Which variant was used |
| `templateId` | `string` | No | FK to Templates (for attribution) |
| `compOffered` | `number` | No | Compensation offered (for offer events) |
| `compNegotiated` | `number` | No | Final negotiated compensation |
| `notes` | `string` | No | Context or details |
| `occurredAt` | `number` | Yes | Unix timestamp of when the outcome happened |
| `createdAt` | `number` | Yes | Unix timestamp |

---

## Dexie.js Index Plan

```typescript
// Database version 1
db.version(1).stores({
  profile:      'id',
  jobs:         'id, companyId, stage, fitLabel, fitScore, createdAt, updatedAt',
  companies:    'id, name, stage, createdAt',
  contacts:     'id, companyId, name, createdAt',
  activities:   'id, jobId, contactId, type, channel, occurredAt, followUpDate, createdAt',
  assets:       'id, jobId, type, templateId, version, approved, createdAt',
  templates:    'id, assetType, version, isActive, createdAt',
  experiments:  'id, assetType, status, createdAt',
  outcomes:     'id, jobId, type, experimentId, templateId, occurredAt, createdAt'
});
```

---

## Airtable Mapping (TBD)

When Airtable sync is implemented, each entity above will map to an Airtable table. Key considerations:

- Airtable field names may differ from IndexedDB field names (Airtable convention is Title Case).
- Embedded objects (Claims, Variants, StageEvents) will need to be flattened or stored as JSON text fields in Airtable.
- Sync will be bidirectional with conflict resolution (last-write-wins or manual merge).
- A `syncedAt` timestamp field will be added to each entity to track sync state.
- The mapping will be defined in a dedicated sync configuration module.

---

## Notes

- All `id` fields use UUID v4, generated client-side.
- All timestamps are Unix milliseconds (compatible with `Date.now()` and Dexie's indexing).
- Enum values are stored as strings for readability and debugging in IndexedDB.
- Embedded types (Claim, StageEvent, Variant, JdParsed, ResearchBrief) are stored as JSON within their parent record. They are not separate Dexie tables.
- Field names use camelCase in TypeScript and IndexedDB. Airtable mapping (when added) will handle case conversion.

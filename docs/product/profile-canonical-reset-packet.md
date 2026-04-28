# Profile Canonical Reset Packet (868huafcx)

Last updated: 2026-03-10
Branch intent: `codex/868huafcx-profile-canonical-reset`
Status: reference-only reset packet. Superseded by `docs/product/job-filter-brand-experience-lock-v4.md`.

## Objective

Ship `/profile` as the canonical, high-trust setup flow that becomes the source of truth for downstream job assets, without freehand UI iteration.

## Prototype Handling

- Treat prior `868huafcx` coding work as a functional prototype only.
- Prototype checkpoint is stored as stash:
  - `prototype: 868huafcx-profile-completion-v1`
- Do not PR prototype state as final product implementation.

## Chosen Frameworks

- Primary: JTBD
- Supporting:
  - MECE decomposition (IA, UI, schema, completion, preview, tests)
  - Inversion and premortem (prevent “complete but wrong shape” regressions)
- Alen lens applied:
  - simplification hook
  - change work
  - one-thing focus

## User Job And Belief Shift

- User job: turn career history into reusable, approved profile truth that powers better assets with minimal rewriting.
- Belief shift:
  - From: “This is setup work.”
  - To: “This is my source of truth that powers everything else.”

## Canonical Information Architecture

Keep 6 visible steps, keep internal IDs for migration safety.

| Internal ID | Visible Label |
| --- | --- |
| `start_here` | Start Here |
| `details` | Details |
| `experience` | Experience |
| `skills` | Skills & Tools |
| `extras` | Profile |
| `preferences` | Targeting |

## Canonical Activation Sequence

1. User lands on `/`.
2. If not asset-ready, route to `/profile?mode=setup`.
3. User completes `/profile`.
4. If no job exists, route to first job capture.
5. If job exists, route to `/job/:jobId`, defaulting to `Assets`.
6. User generates first proof-grounded asset.

Sequencing dependency:
- Onboarding replacement task `868ht29m0` stays blocked until this packet ships.

## Screen Contract

Shared shell:
- Top progress stays visible.
- Main editor and preview use same visual rhythm.
- Step overline aligns with preview overline.
- Success cue appears near top step system, not only as low-salience footer feedback.

### Step 1: Start Here

- Purpose: choose import vs manual path with confidence.
- Keep:
  - import/manual split
  - “What this unlocks”
  - editorial framing
- Standardize:
  - heading hierarchy
  - numbered guidance block
  - card and border tokens

### Step 2: Details

- Purpose: confirm identity and contact.
- Fields:
  - first name, last name, email, mobile phone
  - target title, location, LinkedIn, website, portfolio
- Rules:
  - summary does not live here
  - keep current high-quality email and phone validation

### Step 3: Experience

- Purpose: confirm timeline, responsibilities, results.
- Rules:
  - keep unresolved evidence explicit
  - keep responsibilities and results separate
  - parser architecture stays out of scope except narrow seeding support

### Step 4: Skills & Tools

- Purpose: confirm reusable capabilities.
- UX:
  - grouped editors for Skills and Tools
  - imported suggestions are suggestions only
  - explicit accept and save
  - manual add, edit, remove supported
- Casing rule:
  - preserve known acronyms (SEO, AEO, GEO, JIRA, AWS)
  - otherwise canonical proper casing
- Seeding rule:
  - seed from import draft skill and tool items
  - optionally mine confirmed experience lines using curated taxonomy
  - never auto-save suggestions

### Step 5: Profile

- Purpose: capture supporting profile depth.
- Copy:
  - overline: `PROFILE`
  - title: `Add the profile details that strengthen your story`
  - subtitle: `Add what helps your resume and applications feel complete. Leave anything irrelevant off.`
- Sections:
  - summary and positioning textarea
  - education builder
  - certifications builder
  - languages builder with proficiency
- Rules:
  - references hidden and out of scope
  - skipped sections do not block flow

### Step 6: Targeting

- Purpose: capture search and personalization signals.
- Copy:
  - overline: `TARGETING`
  - title: `Set the roles and job conditions you want Job Filter to optimize for`
  - subtitle: `These choices shape your job feeds, scoring, and default asset direction.`
- Includes:
  - target roles
  - compensation floor and target
  - location preference builder plus relocation
  - employment types
  - maximum in-office days per week
  - max travel percentage
  - visa sponsorship need
  - required benefits
- Excludes from activation flow:
  - preferred benefits expansion
  - seed stage policy

## Visual And Brand Contract

Direction:
- white canvas plus forest-tinted floating cards plus crisp borders

Rules:
- app background calm near-white
- nav quieter than primary cards
- primary cards share same border treatment
- avoid over-boxed interior panels
- copper reserved for warnings, not shell chrome
- one sans typography system for profile flow

Token defaults:
- app background: `#FCFDFB`
- border: cool forest-gray 1px crisp edge
- accent: deep forest
- warning: warm amber
- shadows: one soft depth system

Motion:
- opacity plus translate only
- 150ms to 220ms
- respect `prefers-reduced-motion`
- no animation library for this packet
- no meaningful LCP or CLS regression from motion

## Completion Contract

Step completion:
- Start Here: path selected
- Details: required identity and contact confirmed and saved
- Experience: explicit timeline confirmation
- Skills & Tools: explicit save and at least one confirmed skill or tool
- Profile: explicit save, including intentional skip
- Targeting: explicit save of core targeting set

Core targeting set:
- at least 1 target role
- at least 1 location preference
- at least 1 employment type
- valid numeric inputs when provided

Asset-ready threshold:
- Start Here
- Details
- Experience
- Skills & Tools
- Targeting

Profile step is optional for asset-ready but recommended.

## Preview Contract

- Summary appears below identity and above experience.
- Skills and tools render as grouped chip clusters, not sentence dumps.
- Profile sections render only when present:
  - summary
  - education
  - certifications
  - languages
- No placeholder junk in optional sections.

## Data Model Contract

Extend canonical `Profile` with structured entries.

```ts
export interface ProfileEducationEntry {
  id: string;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  location?: string;
  startYear?: string;
  endYear?: string;
  current?: boolean;
  honors?: string;
}

export interface ProfileCertificationEntry {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export type LanguageProficiency =
  | 'Not specified'
  | 'Conversational'
  | 'Professional'
  | 'Native / bilingual';

export interface ProfileLanguageEntry {
  id: string;
  name: string;
  proficiency: LanguageProficiency;
}
```

`Profile` additions:
- `professionalSummary?: string`
- `education?: ProfileEducationEntry[]`
- `certifications?: ProfileCertificationEntry[]`
- `languages?: ProfileLanguageEntry[]`

Migration policy:
- `education: string[]` to structured using `school`
- `certifications: string[]` to structured using `name`
- `languages: string[]` to structured using `name` and `proficiency: 'Not specified'`
- backward-compatibility for existing local drafts is required

## Proof-Grounding Contract

- Suggested data is never treated as approved profile truth until explicit save.
- Unresolved proof remains excluded from auto-use.
- No fabricated certifications, languages, education, company names, roles, dates, or results.
- Low-confidence seeds remain suggestions only.
- Preserve lineage for downstream reuse surfaces.

## Implementation Sequence

Phase 0:
- checkpoint prototype and park it
- create canonical packet and lock design and schema decisions

Phase 1:
- produce Figma canonical journey, IA, tokens, components, desktop and mobile frames

Phase 2:
- implement structured profile schema and migrations

Phase 3:
- rebuild Skills & Tools, Profile, and Targeting surfaces against Figma nodes

Phase 4:
- update deterministic completion and asset-ready threshold

Phase 5:
- rebuild preview formatting to canonical contract

Phase 6:
- run full QA walkthrough and accessibility and motion checks

## Test Matrix

Data and migration:
- legacy profiles load safely after schema extension
- flat prototype extras migrate to structured entries
- blank optional sections do not create false completion

Flow:
- `/profile?mode=setup&fresh=1` end-to-end completion
- refresh persistence on `/profile?mode=setup`
- no regression in Start Here, Details, Experience

Skills and tools:
- suggestions visible but not auto-saved
- explicit save required
- acronym casing preserved

Profile:
- summary optional
- education and certification builders support multi-entry
- language proficiency selection persists

Targeting:
- target roles, location, employment requirements enforced
- visa copy stays semantically explicit
- no accidental duplicate defaults in location rows

Preview:
- summary placement and chip formatting validated
- optional sections only show when data exists

Performance and accessibility:
- no animation library added
- reduced-motion behavior respected
- no major LCP or CLS regressions from visual updates

## Required Inputs To Start UI Rebuild

Figma dependencies are currently blocked in this coding session:
- no Figma MCP server is currently available from MCP resource discovery
- no Figma file or node URLs supplied for this packet

Required to proceed with Phase 1 to Phase 5:
1. Figma file URL for canonical `/profile` flow
2. Node URLs for:
   - shared shell
   - each of the 6 step frames
   - mobile variants
   - component frames
3. Explicit approval of this packet as source of truth for implementation

# Packet 868hukucf FS5S8R6, User System Definition

Task: [DESIGN: Canonical Job Filter brand system and activation design lock](https://app.clickup.com/t/868hukucf)  
Pass label: `FS5S8R6R4`  
Status: refreshed D2 product-model authority for the next shared-shell D1 + D2 artifact repair  
Primary output: `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/packets/868hukucf-fs5s6-user-system-definition.md`

## 1. Objective

Create one decision-complete user-system definition for Chapter 05 so the next desktop rebuild does not invent source logic, proof behavior, lane behavior, score explanations, disqualifier rules, or workspace ownership.

## 2. Authority stack and correction scope

### Files explicitly used in this refresh

- `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/artifacts/reports/868hukucf-foundation-report.html`
- `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-and-core-app.md`
- `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-architecture-spec.md`
- `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/DESIGN_INSPIRATION.md`
- Dribbble pattern inputs carried forward from prior packet authority:
  - [AI Resume Builder Dashboard](https://dribbble.com/shots/26848534-AI-Resume-Builder-Dashboard)
  - [Ai CV Builder | AI SaaS Dashboard Design | Resume Builder UI UX](https://dribbble.com/shots/27023228-Ai-CV-Builder-AI-SaaS-Dashboard-Design-Resume-Builder-UI-UX)
  - [Job/hiring page](https://dribbble.com/shots/18976526-Job-hiring-page)
  - [Applicant Tracking System (ATS) Dashboard](https://dribbble.com/shots/26176980-Applicant-Tracking-System-ATS-Dashboard)
- `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/artifacts/figma/redesign-lock/10-activation-desktop.html` as superseded evidence only

### Conflict resolution order

| Area | Authority |
| --- | --- |
| persona, journey, IA, scoring vocabulary, D8 and D9 scope, and D2 or D3 simplification | refreshed Chapter 05 report |
| top-level route names, child-route hierarchy, and live Chapter 05 product boundaries | Foundation Series Chapter 05 docs |
| source model, editor grammar, lane model, score breakdown behavior, and disqualifier behavior | this packet |
| exact screen execution, layout hierarchy, and copy lock for the next desktop artifact | `868hukucf-fs5s7-desktop-screen-contract.md` |
| current artifact HTML | rejection evidence only, never authority |

### Locked corrections in this pass

| Topic | Locked decision now |
| --- | --- |
| proof surface | no standalone `D3` route, shell, or artifact frame in the first slice |
| proof library | no standalone `Proof Library` surface in the first slice |
| source start | `Resume`, `LinkedIn`, and `Start manually` are the only D1 source starts |
| source sequencing | one primary source starts the profile, optional second source is added later and can create explicit conflicts |
| lane model | one active role lane now, multi-lane framed as later or paid value |
| score model | keep `Role fit`, `Job fit`, `Lane opportunity`, and operational `Priority` only |
| score explanation | visible score breakdowns are mandatory wherever a visible fit signal appears |
| disqualifiers | define and render `hard`, `soft`, and `verify` states with user override and filters |
| visual direction | keep premium dark, remove brown or amber direction, move to green-metal or translucent highlight behavior |

## 3. Primary user and product promise

### Primary user

The build-now user is a skeptical, overloaded applicant who still cares about standards. They are usually pursuing manager-to-director-level knowledge-work roles, often across adjacent titles, while trying to stay organized without turning the search into a second full-time admin job.

### What they need to believe

1. setup creates reusable leverage
2. the product respects truth and lets them correct it
3. scores and recommendations are understandable
4. active work stays calm and operational instead of becoming CRM theater

### Product principles for this slice

| Principle | Build-now rule |
| --- | --- |
| leverage first | every early setup screen must show how current work compounds later |
| trust before optimization | no fit, proof reuse, or recommendation should feel automatic or hidden |
| one serious work surface at a time | each route owns one primary job and one dominant action |
| explicit user control | conflicts, disqualifiers, overrides, and proof states remain visible and reversible |
| mentor-like tone | calm, specific, and grounded, with no hype or fake certainty |

## 4. Information architecture and route ownership

### Top-level signed-in navigation

1. `Profile`
2. `Jobs`
3. `Applications`

### Child routes and local sections

| Parent | Local section or child | Purpose |
| --- | --- | --- |
| `Profile` | `Add your experience` | start the profile from one trusted source or a manual setup |
| `Profile` | `Check your history` | edit the canonical history table, resolve conflicts, and approve reusable proof inline |
| `Profile` | `Role Discovery` | compare supported roles, understand score breakdowns, and activate one role lane |
| `Jobs` | `Feed` | search or capture new opportunities and evaluate them quickly |
| `Jobs` | `Saved` | manage the pre-review queue and select the next job worth a real decision |
| child route | `Review` | make the explicit go or no-go decision before an application becomes active |
| child route under `Applications` | `Workspace` | do the actual application work with assets, notes, fit context, proof context, and next action connected |

### Route ownership model

| Surface | Owns | Must not pretend to own |
| --- | --- | --- |
| `Profile` | applicant truth, history, conflicts, proof approval, role lane creation | active application tracking, full research suite, standalone proof library |
| `Jobs` | opportunity intake, saved-job queue, quick evaluation | active-work editing or application CRM depth |
| `Review` | job-specific decision, proof-to-job mapping, first asset plan | route-level queue management or ongoing application management |
| `Applications` | active application records, stage, due dates, next actions, lightweight support context | document editing as the primary route job |
| `Workspace` | asset editing and application-specific workbench | top-level dashboarding or deep company-research product lines |

### Trust-boundary statements

- `Review` is the promotion boundary between a saved job and active work.
- `Workspace` is a child surface under `Applications`, not a sibling route family.
- proof approval is part of the `Profile` editing flow and not its own standalone surface in the first slice.

## 5. Global interaction grammar

### Consistent header grammar across setup screens

| Header element | Rule |
| --- | --- |
| route-context row | approved `Profile` screens use one compact in-panel row, `Profile • {section}`, inside the light workspace canvas |
| page headline | the main H1 states the actual job of the screen instead of repeating the section label at headline scale |
| purpose sentence | one sentence explains why the section exists, never a marketing paragraph |
| status summary | compact state line shows counts that matter now, such as unresolved conflicts, proof items left, or one active lane |
| primary action | D1 uses the source chooser itself as the primary action system; D2 uses a sticky readiness-bar action rather than a competing header CTA |
| secondary controls | search, filters, columns, or view toggles live as compact controls, not badge walls; D2 table controls belong in the table toolbar |

### Shared D1 and D2 shell rule

- `D1` and `D2` now refactor together as one `Profile` surface family
- the shell, background treatment, sidebar, and light main canvas stay identical across those states unless the lead thread explicitly reopens them
- approved `Profile` states stay preserved and linked like a prototype instead of being overwritten

### Shared action tiers

| Tier | Contract |
| --- | --- |
| primary button | one decisive action for the current surface, with the strongest contrast in the current canvas |
| secondary button | meaningful but non-dominant action such as `Add role` or an alternate source path |
| utility icon button | toolbar control such as filter, columns, or sort, always with an explicit label on hover or in the menu |
| route link | shell or local-nav link with a clear active state and left-aligned text treatment |
| inline link | provenance, help, and source links with visible hover feedback |

### Hover and interaction response

- interactive buttons, links, rows, and icon controls must show a visible hover response
- disabled actions do not mimic hover behavior
- selected rows must read as one continuous highlighted row, not a set of unrelated cell fills

### Type-aware field system

| Data type | Required control pattern | Notes |
| --- | --- | --- |
| short text | inline text input | use for company, role title, location, and link labels |
| long text | textarea inside inspector or editor | use for summary, notes, rationale, and draft content |
| single select | compact dropdown | use for work mode, employment type, disqualifier class, and source type |
| searchable multi-select | tokenized searchable field with suggestions | use for skills, tools, industries, tags, and stakeholders |
| boolean | checkbox or switch only when the state is binary | use for `present role`, `override disqualifier`, and optional inclusion flags |
| date | date picker with month and year support | use for start date, end date, reminder date, and last contact date |
| numeric | numeric stepper or masked numeric input | use for team size, direct reports, compensation, and priority inputs |
| currency | numeric input plus currency selector | required for salary-related fields |
| repeatable record | inline row list with add-row behavior | use for responsibilities, outcomes, stories, proof items, contacts, and messages |
| state field | segmented control or pill selector with explanation | use for proof state, conflict state, and disqualifier class |

### Validation and error handling

| Concern | Rule |
| --- | --- |
| inline validation | validate on blur for individual fields and show errors beside the field, not in a top-page dump |
| blocking errors | block the dominant action only for missing required data or unresolved hard conflicts |
| warnings | use low-emphasis inline guidance for incomplete but non-blocking inputs |
| conflict errors | explicit conflict rows must state the field, competing values, sources, and available resolution actions |
| save feedback | show quiet save state, last saved time, and failure retry inline near the footer or editor header |

### Tooltips and contextual guidance

| Pattern | Rule |
| --- | --- |
| tooltip | use narrowly for responsibilities, outcomes, hard skills, soft skills, tools, and other fields explicitly marked as guidance-heavy |
| inline helper | use for one-sentence why-this-matters guidance directly under the control it supports |
| empty state guidance | one short instruction plus one clear next action only |
| reject | helper rails, floating reviewer narration, or long teaching paragraphs inside the app surface |

### Add-row and add-record behavior

| Behavior | Rule |
| --- | --- |
| add record | lives inside the owning table toolbar or section header, never only in the page header |
| first add | empty states include the same add action the loaded state uses |
| selected record | creating a record selects it immediately and opens the inspector or editor on that record |
| child rows | responsibilities, outcomes, proof items, contacts, and messages add from inside the owning record section |
| destructive remove | destructive removal requires confirmation only if the record is linked downstream |

### Search, sort, and filter grammar

| Pattern | Rule |
| --- | --- |
| search | one primary search field leads each queue or table-first surface |
| sort | sort is explicit and persistent until changed |
| filter | use compact filter menus or drawers with real schema filters, not chip clutter |
| filter states | filters support `all`, `active`, and state-specific subsets where relevant |
| saved views | not required in the first slice |

### Approved-state prototype rule

- once a screen is approved, later artifact passes preserve it as a linked prototype state instead of overwriting it
- approved `D1` remains accessible while `D2` is added
- `Profile` local navigation swaps the main canvas state and keeps the shell, sidebar, and route family stable
- the next artifact pass must rebuild approved `D1` and `D2` together in the same artifact family, using one stable shell and two linked local states

### Surface selection rules

| Surface type | Use it for | Do not use it for |
| --- | --- | --- |
| table | canonical records, saved-job queues, role comparison matrices, and active-application scanning | decorative summaries or one-off detail pages |
| board | active state management only, as a secondary view when stage scan matters | D2 history editing or D4 role comparison |
| drawer | quick detail inspection, fit breakdown, secondary context, or a primary detail editor that stays attached to a table-led route | replacing the route or becoming the only path to core data |
| modal | one bounded edit task, destructive confirmation, or focused variant creation | full route logic or repeated multi-step work |

## 6. Source model and proof model

### D1 source start rules

| Source start | Build-now behavior |
| --- | --- |
| `Resume` | visually primary and treated as the default trusted-source start |
| `LinkedIn` | equal secondary source start for users whose resume is stale or incomplete |
| `Start manually` | starts an empty owned profile, replaces `Paste text`, and appears only once |

### Source sequencing rules

1. the user starts with one primary source or with `Start manually`
2. the system creates the first editable profile baseline from that choice
3. an optional second source can be added later from inside `Profile`
4. the second source never silently merges over approved user edits
5. when a second source disagrees, the system creates explicit field-level conflicts

### Issue and conflict model

The first slice handles only these standardized issue types:

1. `Chronology conflict`
2. `Title mismatch`
3. `Scope mismatch`
4. `Current-role ambiguity`
5. `Proof gap`

| Issue behavior | Rule |
| --- | --- |
| issue trigger | imported, added, or edited data creates one of the five supported issue types |
| issue display | show issue type, affected row or field, current approved value, competing value or weak claim, source labels, and severity |
| issue actions | `Use source A`, `Use source B`, `Enter a different value`, `See source`, or `Review later` for non-blocking cases only |
| conflict pattern | every field-level conflict must ask `Which is your truth?` before resolution |
| downstream effect | unresolved blocking issues keep the profile in `Conflict`; unresolved minor issues remain filterable and visible |

### Proof model inside `Profile`

- proof stays inside the `Check your history` workspace and is not its own first-slice route
- proof controls are attached to outcomes, stories, and linked claims inside the selected role detail drawer
- generic `Proof details` labeling is removed from the first-slice contract
- if a record has inspectable proof context, use `Source evidence` as the local drawer title or inline expansion and keep `See source` attached to that record
- `Verification progress` is the local readiness model inside `Verify for reuse`, and it rolls approved facts and proof into the route-level continue decision
- reusable proof states are:
  - `Approved`
  - `Softened`
  - `Excluded`
- every proof state change is reversible
- `Continue to Role Discovery` is enabled only when the profile is safe to reuse downstream

### What the first slice must not do

- do not render a standalone `D3`
- do not render a standalone `Proof Library`
- do not detach proof review from the selected role, outcome, or story context
- do not treat `Start manually` as a duplicate button beneath the main source chooser

## 7. Profile workspace model

### First-slice relational entity model

| Entity | First-slice role |
| --- | --- |
| `Company` | reusable global record that anchors one or more roles and holds the normalized employer identity |
| `Role` | parent container for work performed at one company over one date range |
| `Responsibility` | distinct child record owned by one role, never just one undifferentiated text wall |
| `Outcome` | distinct child record owned by one role, edited in guided-template mode or free-hand mode |
| `Hard skill` | reusable tag for domain, functional, or technical skill evidence |
| `Soft skill` | reusable tag for leadership, communication, or collaboration evidence that materially affects fit |
| `Tool` | reusable tag for concrete platforms, software, and systems |
| `Compensation` | role-level structured data limited to `Base salary`, `Target salary`, and `Currency` in the first slice |

### D2 layout decision

The first-slice `Check your history` workspace is a dense split-view master-detail surface. The master view is the role table. The detail view is a right-side drawer by default. The drawer is closed on first load, opens on row selection, and supports explicit close. Use modals only for focused secondary edits, such as a long outcome record, destructive conflict resolution, or full source inspection.

### D2 grouped master-view contract

- the first-slice master view is grouped by the reusable `Company` record
- `Role` remains the primary actionable row inside each company group
- company groups are collapsible but default open on first load
- collapsed groups still show `X/Y roles verified` and blocking review count
- company group headers show the company name only in the first slice. Do not invent a default subtitle or descriptor unless a real editable company field is later approved
- the frozen `Company` lane always carries a low-emphasis role label so the user can still identify the row when the `Role` column is clipped
- selecting a role reopens its company group if needed and focuses the detail drawer
- the grouped view is structural, not decorative. It exists to preserve chronology and employer context while keeping role editing dense

### D2 canonical table columns

| Column | Type | Why it is visible |
| --- | --- | --- |
| `Company` | grouped structural column | frozen company anchor, company summary line `{Role_Count} Roles • {Verified_Claims}/{Total_Claims} Claims Verified`, blocker cue when needed, and the low-emphasis role carry-label |
| `Role` | text | core scan field for chronology review |
| `Dates` | date range | chronology and recency |
| `Status` | state field | imported, conflict, or verified state at row level |
| `Blockers` | compact blocking count plus severity cue | immediate triage value without vague issue theater |

Preview signals for `Responsibilities`, `Outcomes`, and `Skills / tools` may appear at the row edge as compact counts or restrained indicators, but they are not expanded child rows by default.

`Claims` may appear only as an aggregate summary noun in company or progress rollups. It does not replace visible module labels like responsibilities, outcomes, hard skills, soft skills, or tools.

All other fields move behind the detail drawer by default and may be surfaced through `Columns` when needed.

### D2 table rules

| Rule | Contract |
| --- | --- |
| `Add role` | lives in the table toolbar and empty state, never in the page header |
| search | one icon-leading compact search input across company, role title, tools, and responsibilities, first in the table toolbar. It uses a fixed compact default width, may expand only within remaining toolbar space on focus, and may not wrap the toolbar at `1440`, `1280`, or `1024` |
| filters | icon-first filter control sits second in the table toolbar and opens schema-grounded filters |
| columns | icon-first columns control sits third in the table toolbar and shows, hides, or reorders approved schema columns only |
| add column | arbitrary custom columns are out of scope in the first slice |
| sort | icon-first sort control sits fourth in the table toolbar |
| toolbar order | search, filter icon, columns icon, sort icon, `Add role` |
| insert-in-place add | `Add role` also appears as an insert-in-place action inside the grouped table where the user is working, not only in the toolbar |
| frozen first column | `Company` stays frozen during horizontal scroll, and the frozen lane keeps the low-emphasis role carry-label visible when the `Role` column clips |
| row selection | first load starts with the drawer closed. One selected row opens the detail drawer and drives the editable workspace |
| persistence | auto-save is the default. An explicit `Saved` reassurance may appear, but persistence must not depend on a manual save click |
| status treatment | restrained professional status treatment only; avoid oversized rounded-pill theater |
| group headers | structural and opaque enough to preserve company context, not decorative banners |
| hover behavior | rows, group headers, toolbar icons, and issue jumps show explicit hover response |
| reorder | companies and roles reorder in the master view with drag-and-drop plus arrow-button fallback; responsibilities and outcomes reorder in the drawer with the same fallback; reorder state stays canonical across the master table and drawer |

### Master view versus drawer split

| Surface | Owns |
| --- | --- |
| master view | chronology, company grouping, role selection, blocking-review triage, verified-completion scan, and compact preview signals |
| detail drawer | actual editing, proof review, source resolution, validation, examples, inline verification work, and route-critical readiness work |
| nested child rows | out of scope by default for responsibilities, outcomes, hard skills, soft skills, and tools |

Rows and repeatable records expose visible hover add, edit, and remove controls inside their owning surface. The first slice does not require a separate control rail.

### Inspector field groups

1. role identity  
   `Company`, `Role title`, `Employment type`, `City`, `State`, `Work mode`
2. timeline  
   `Start date`, `End date`, `Present role`
3. responsibilities  
   repeatable records with one primary `Responsibility` statement field, optional example starter guidance, inline source and status actions, and edit-one-record-at-a-time behavior
4. outcomes and proof  
   repeatable records with one primary `Outcome` statement field, `Proof state`, `Safe wording`, `Source`, local `Source evidence`, and optional collapsed secondary structure only when explicitly needed later
5. hard skills, soft skills, and tools  
   searchable multi-select fields for `Hard skills`, `Soft skills`, and `Tools`
6. compensation  
   `Base salary`, `Target salary`, `Currency`
Conflicts, proof state, and verification status stay inline at the owning field or module. The first slice does not use standalone drawer sections named `Issues to resolve` or `Verified for reuse`.

### Education and certificates decision

- `Education` and `Certificates/Courses` are deferred from the first-slice `D2` master view
- they do not appear as default company groups, default role rows, or required drawer modules in the next artifact pass
- they do not block the first `Continue to Role Discovery` threshold
- if surfaced later, they belong as non-primary profile modules outside the default role-history master view

### D2 editable control contract

| Control area | Required behavior |
| --- | --- |
| short text fields | editable inline input or inspector input, normal weight by default |
| date fields | month-and-year picker with inline required-state feedback and explicit month-year guidance when needed |
| tokenized fields | searchable token input with suggestions and controlled create-new behavior |
| boolean fields | checkbox or switch only, never pseudo-badges |
| numeric fields | stepper or masked numeric input for salary, metric, and count fields |
| repeatable rows | add inline, open immediately, edit one row at a time, reorder only within the owning section |
| validation | show field-level errors or warnings beside the control on blur |
| guidance | use tooltip or one-line example only for high-impact fields, such as responsibilities, outcomes, hard skills, soft skills, and tools |
| value density | one value per field by default; secondary values appear only when the schema explicitly owns them |
| select controls | use right-aligned chevrons consistently |
| tooltip rendering | tooltips appear above all layers, stay readable on hover or focus, use title case, and keep normal-weight text |
| token wrapping | long skill or tool text may wrap to a second line or use restrained end truncation with a tooltip, but it must not clip invisibly |
| currency display | read contexts format currency values like `$180,000` |

### Present-role checkbox behavior

| Behavior | Rule |
| --- | --- |
| checked | disables `End date`, marks the row as current, and keeps the row pinned correctly in chronological sort |
| unchecked | requires an `End date` or an explicit unknown-state warning |
| downstream effect | informs recency, current-scope context, and role recommendation logic |
| helper copy | `Enable if its your present role` |

### Repeatable record model

| Record type | Required behavior |
| --- | --- |
| responsibility | add row inline, reorder within the role, attach source and status actions around one primary statement field, and allow optional example prompts without forcing a rigid template |
| outcome | add row inline, use one primary statement field by default, keep safe wording and proof state beside the claim, and treat any structured metadata as secondary and collapsed rather than always visible |
| story | attach to the role or profile, with linked outcomes and target usage contexts |

### Searchable tag-field model

| Field | Contract |
| --- | --- |
| `Hard skills` | searchable multi-select with existing-tag suggestions and controlled create-new behavior |
| `Soft skills` | searchable multi-select for people, leadership, and communication signals that materially affect role fit |
| `Tools` | searchable multi-select with grouped suggestions by product or platform family |
| `Industries` | searchable multi-select at the profile-preference level |
| `Role tags` | searchable multi-select used in D4 and downstream filtering, not as decorative chips |

### Readiness model

| Level | States | Meaning |
| --- | --- | --- |
| role row | `Imported`, `Conflict`, `Verified` | whether that role is still raw, blocked, or reusable |
| profile | `Imported`, `Conflict`, `Verified` | whether the overall profile can move to role comparison |

### Sticky readiness bar

- the readiness bar stays pinned above the master-detail workspace while the user scrolls
- it is labeled `Verification progress`
- it uses this exact progress body copy: `Once you verify crucial info like roles, responsibilities, outcomes, and skills, Job Filter can confidently help you find and apply to roles best suited for you.`
- it shows required category progress first, using `X/Y` completion for `Role identity and timeline`, `Responsibilities`, `Outcomes`, and `Skills and tools`
- it removes standalone imported, conflict, and verified tiles and keeps those counts inline inside the progress breakdown and CTA-support state
- it includes clickable conflict hotspots that jump to the affected company group or role row
- it includes role-level verified checkmarks and company-level `X/Y roles verified` indicators, with a complete-state checkmark when every included role is verified
- company summary language follows `{Role_Count} Roles • {Verified_Claims}/{Total_Claims} Claims Verified`
- it may borrow compact graph language, but only as restrained verification support rather than a CRM pipeline clone
- it owns the route-level action `Continue to Role Discovery`
- the action is disabled until at least one role exists, every included role clears the required categories, no blocking conflicts remain, and every reusable claim is either approved, softened, or kept out
- optional non-blocking fields, including compensation, may remain incomplete without blocking progress

## 8. Role lane, score, and recommendation model

### One-active-lane rule

`Role Lane` remains the live build-now noun, but the first slice supports one active lane only. The UI may preview additional role directions, but it must not require a multi-lane operating model to understand the product.

### Role lane definition

| Part | Contract |
| --- | --- |
| titles | 2 to 5 adjacent titles that share materially similar positioning |
| owner | one active lane belongs to the user and drives job grouping |
| downstream effect | lane ownership appears in `Saved`, `Review`, `Applications`, and `Workspace` |
| paid or later preview | additional lanes may appear as compare-only previews or subtle upgrade context, not as a primary first-slice workflow |

### Required role comparison matrix

`Role Discovery` must use a real table or matrix, not comparison cards. Every row represents one role direction. Required visible fields:

1. role title or title family
2. recommendation state
3. `Role fit`
4. `Lane opportunity`
5. proof coverage
6. scope and seniority match
7. skills and tools match
8. compensation and remote alignment
9. disqualifiers
10. lane action

### Recommendation logic

The recommended role is the highest `Role fit` row that:

1. has no unresolved `hard` disqualifier
2. has sufficient approved or softened proof coverage
3. aligns with the user’s current compensation and remote constraints

Tie-break order:

1. stronger proof coverage
2. stronger scope and seniority continuity
3. stronger explicit user preference support

### Score vocabulary

Only these labels are allowed:

1. `Role fit`
2. `Job fit`
3. `Lane opportunity`
4. operational `Priority`

### Score breakdown model

| Measure | Required factors | Weight |
| --- | --- | --- |
| `Role fit` | title and mandate alignment `25`, proof coverage `25`, scope and seniority alignment `20`, skills and tools alignment `15`, preference alignment `15` | `100` |
| `Job fit` | requirement alignment `30`, proof coverage `25`, role-lane carry-forward `20`, disqualifier pressure `15`, compensation and location alignment `10` | `100` |
| `Lane opportunity` | title breadth `30`, current market volume `25`, transferability `20`, user interest `15`, friction `10` | `100` |
| `Priority` | operational sort helper only, derived from `Job fit`, urgency, freshness, and next action pressure | `100` |

### Score display rules

| Surface | Rule |
| --- | --- |
| `Role Discovery` | show `Role fit` and `Lane opportunity` with visible factor breakdowns, not hidden-only tooltips |
| `Feed` | use fit cues lightly and never as the only evaluation signal |
| `Saved` | show `Job fit`, `Priority`, lane owner, and disqualifier state together |
| `Review` | show `Job fit` plus strengths, gaps, proof usage, and disqualifiers |
| `Applications` | use `Priority` and next-action pressure first; inherited `Job fit` stays compact |
| `Workspace` | inherited `Job fit` snapshot only, no live rescoring theater |

### Removed legacy patterns

- no unsaved-lane hero card as the primary role-discovery pattern
- no lane-opportunity side sheet as the primary explanation pattern
- no opaque composite score badge without factor-level explanation

## 9. Disqualifier model

### Required classes

| Class | Meaning | Default effect | User control |
| --- | --- | --- | --- |
| `hard` | likely dealbreaker right now | caps recommendation, blocks promotion by default, and can be filtered out | user can override with rationale |
| `soft` | meaningful concern but not a blocker | reduces ranking and stays visible | user can accept and continue |
| `verify` | incomplete or uncertain information | holds back confidence and prompts review | user can resolve or override temporarily |

### Required example triggers

1. remote mismatch
2. compensation mismatch
3. missing required skill
4. missing required tool
5. missing required industry experience
6. missing required tenure or level

### Override model

| Behavior | Rule |
| --- | --- |
| override action | available from `Review` and downstream surfaces, and visible in `Saved` |
| override record | stores the user rationale and timestamp |
| visual treatment | overridden disqualifiers stay visible but muted and marked as overridden |
| downstream effect | an override may downgrade `hard` to `soft` for recommendation logic, but it does not disappear silently |

### Filter model

| Surface | Required disqualifier behavior |
| --- | --- |
| `Feed` | search results show compact disqualifier indicators and support `Hide hard disqualifiers` as a real filter |
| `Saved` | queue rows show disqualifier state and allow filtering by `hard`, `soft`, `verify`, or `overridden` |
| `Review` | disqualifiers appear as a first-class decision block with override control |
| `Applications` | summary rows show unresolved disqualifiers only if they still affect the active application |
| `Workspace` | right-rail support summary shows unresolved or overridden disqualifiers beside fit context |

## 10. Route-level operating model

### D1, `Profile`, `Add your experience`

| Topic | Authority |
| --- | --- |
| belief shift | setup creates reusable leverage, not parser theater |
| source actions | underlying source starts remain `Resume`, `LinkedIn`, `Start manually`, even when the UI uses longer action labels |
| trust model | one trusted source is enough to begin; review, cleanup, and conflict resolution happen in `Check your history` |
| layout model | one full-width message area plus one row of three source cards inside the shared `Profile` shell |
| reject | hype, fake proof, duplicate manual-start control, or side-note clutter |

### D2, `Profile`, `Check your history`

| Topic | Authority |
| --- | --- |
| prototype rule | approved `D1` stays accessible and literal; the next artifact pass rebuilds `D1` and `D2` together as linked `Profile` states rather than replacing prior approved screens |
| workspace model | dense split-view master-detail pattern, with the role table as master view and a right-side detail drawer as the default detail view |
| readiness model | sticky `Verification progress` leads with category-based `X/Y` progress, while Imported, Conflict, and Verified counts are encoded as stacked status-bar segments with hover/focus count labels that control `Continue to Role Discovery` |
| proof control | inline inside the same workspace, with `Source evidence` only as a local drawer title when a record has inspectable proof context, and no standalone `Issues to resolve` or `Verified for reuse` drawer sections |
| trust model | standardized issues, source visibility, `Which is your truth?` conflict resolution, and reversible proof decisions stay visible and are resolved here |
| reject | vague columns, page-header `Add role`, decorative summary cards, row-expansion clutter, or separate proof-route logic |

### D4, `Profile`, `Role Discovery`

| Topic | Authority |
| --- | --- |
| comparison model | real table or matrix, not stacked comparison cards |
| lane model | one active lane now, later multi-lane value only as a hint |
| recommendation | recommended role must be obvious and explainable |
| reject | unsaved-lane hero cards, personality-test framing, or opaque ranking |

### D5, `Jobs`, `Feed`

| Topic | Authority |
| --- | --- |
| primary behavior | search-first jobs surface with quick evaluation |
| quick review | job detail must open in a drawer or equivalent quick-view surface |
| add-job flow | shared route-level flow still supports `Search jobs` and `Paste or link` |
| reject | card-heavy fake dashboarding or search as decorative chrome |

### D6, `Jobs`, `Saved`

| Topic | Authority |
| --- | --- |
| queue model | real schema-grounded queue, sheet-first |
| required fields | role lane, company, title, source, saved date, `Job fit`, `Priority`, disqualifier state |
| secondary view | board view is optional, not the primary truth surface |
| reject | arbitrary fields, badge walls, or mood-board styling |

### D7, `Review`

| Topic | Authority |
| --- | --- |
| route job | stepwise job-specific workbench between `Saved` and `Applications` |
| required stack | `Job fit`, strengths, gaps, proof usage, disqualifiers, and asset plan |
| asset-generation loop | map proof, choose asset direction, apply optimization guidance, then decide whether to start the application |
| reject | pure score theater or a single giant CTA without reasoning |

### D8, `Applications`

| Topic | Authority |
| --- | --- |
| route job | calm active-work management |
| default view | operational sheet first, board optional |
| required fields | stage, next action, due date, last touch, lane owner, risk, `Priority`, latest contact summary |
| reject | dashboard hero analytics, CRM cosplay, or company panels competing with active work |

### D9, `Workspace`

| Topic | Authority |
| --- | --- |
| route job | serious workbench under `Applications` |
| required editor system | standardized content editors for resume, cover letter, answers, outreach, and notes |
| support context | proof snapshot, fit snapshot, lightweight company context, lightweight message log, and next action |
| reject | standalone proof library, detached research route, or company context as the dominant canvas |

## 11. Standardized content-editor system

### Shared editor tabs

1. `Resume`
2. `Cover letter`
3. `Answers`
4. `Outreach`
5. `Notes`

### Common editor contract

| Editor element | Rule |
| --- | --- |
| header | asset name, target role lane, target company or job, save state, and variant controls |
| main canvas | the active draft or note, always with enough width for serious editing |
| right support rail | next action, proof snapshot, fit snapshot, company context, and message log summary |
| footer | one dominant save or status action, one secondary action, quiet trust cue |
| variants | duplicate from the active asset, keep lineage, and compare only where the user is intentionally testing alternatives |

### What support context may include

| Support surface | Allowed in this slice |
| --- | --- |
| company context | role summary, company notes, interview context, and one lightweight research snapshot |
| message log | dated outbound and inbound notes, owner, channel, and next follow-up cue |
| minimum CRM | status, due date, contact, reminder, and last activity only |

## 12. Inspiration binding and translation

### Required inspiration sources

| Source | Use it for | Do not inherit |
| --- | --- | --- |
| `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/DESIGN_INSPIRATION.md` | density, split-view layout, board-vs-table logic, structured detail rails, and sequential workbench behavior | stale light-theme tokens, blue-on-white assumptions, or template-marketplace framing |
| Dribbble references in this packet | dense operational tables, unified work areas, and live-edit behavior | card-heavy fake dashboards, decorative AI chrome, or recruiter-CRM metaphors |
| Dribbble reference matrix in `868hukucf-fs5s7-desktop-screen-contract.md` | screen-specific panel rhythm, queue density, and support-panel behavior | hero analytics, oversized score widgets, or ornamental chip clutter |

### Borrow rules

1. borrow density, layout rhythm, editor grammar, and real-app behavior
2. keep the current premium dark direction
3. replace prior brown or amber highlight behavior with green-metal or translucent emphasis
4. reject fake dashboard cards and stale light-theme token guidance

## 13. Exact build-now rejection rules

The next artifact fails this packet if any of the following appear:

- standalone `D3`
- standalone `Proof Library`
- `Paste text` as a D1 source option
- duplicate `Start manually` controls
- brown, amber, or copper as the primary action accent
- role comparison cards instead of a real matrix
- `Lane opportunity` as a primary side-sheet pattern
- disqualifiers without override and filter behavior
- `Applications` rendered as analytics theater
- `Workspace` rendered as a detached document editor

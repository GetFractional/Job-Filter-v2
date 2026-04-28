# Packet 868hukucf FS5S5, Operating Model Reset

Task: [DESIGN: Canonical Job Filter brand system and activation design lock](https://app.clickup.com/t/868hukucf)  
Pass label: `FS5S5`  
Status: operating-model reset authority for the next desktop rebuild  
Applies to: the next fresh desktop rebuild after `FS6A5`

## Objective

Define one decision-complete signed-in operating model for Job Filter so the next desktop rebuild does not invent product logic, entity behavior, submenu rules, evidence handling, or application-management behavior.

This packet exists because the live Chapter 05 stack is now source-clean, but the `FS6A5` artifact still exposed product-model gaps:

- the shell direction improved, but the product still behaved too much like a polished state gallery
- `Profile`, `Jobs`, `Review`, `Applications`, and `Workspace` were visually connected, but not yet operationally convincing
- evidence, fit, saved jobs, applications, and workspace ownership still needed a firmer SaaS operating model

This packet does not mutate Foundation docs directly. It creates the reset authority that the next desktop rebuild and the later source-sync pass should inherit.

## Preserved truths

The following remain locked and are not reopened here:

- top-level signed-in nav remains `Profile`, `Jobs`, `Applications`
- `Review` remains a child route between `Jobs` and `Applications`
- `Workspace` remains a child surface under `Applications`
- `Proof Library` remains the locked `Profile`-owned support surface in the live stack
- no auto-apply
- review-before-send remains explicit
- one job belongs to one primary role lane
- `Search jobs` and `Paste or link` remain equal entry modes inside one `Add a job` flow
- deterministic fit logic remains inspectable
- multiple role groups remain a paid feature
- the stronger full-canvas, dark signed-in shell direction remains the right shell direction

## Reopened decisions

| Decision area | Prior state | New decision in this packet | Why |
| --- | --- | --- | --- |
| user-facing evidence model | `Proof` was still doing too much naming work | keep the locked user-facing labels for now, but use `evidence` descriptively to explain approved stories, proof items, metrics, and gaps | preserves the clearer operating model without reopening live surface names too early |
| `Review` surface | dedicated child route, but still stage-like in some artifact thinking | keep `Review` as a full route, but define it as a focused decision gate, not a broad stage screen | the trust boundary matters too much to absorb, but it should feel lighter and more decisive |
| local submenu strategy | partially defined, still inconsistent in practice | explicit submenu rules now apply only to `Profile` and `Jobs` | removes route ambiguity and prevents header clutter |
| multi-source intake | single-source-first behavior still dominated | allow one primary source plus additive sources, with explicit provenance and conflict rules | serious users often have partial truth spread across resume, LinkedIn, and pasted material |
| jobs to applications handoff | route model existed, but operating behavior still felt thin | define clear responsibilities for `Jobs`, `Review`, `Applications`, and `Workspace` | the artifact needs credible day-to-day product behavior, not only coherent route names |
| deep research | implied in places, not owned anywhere clearly | deep research belongs inside `Workspace`, with preview hooks in `Review` only when necessary | research is valuable only when tied to a real opportunity and next action |

## Persona + JTBD

### Primary persona

The primary user is an experienced operator, builder, or functional leader who:

- has enough real experience to support several adjacent roles
- does not want a maximum-volume application machine
- will do focused setup work if it creates reusable leverage
- has a high trust threshold and wants inspectable reasoning
- values better decisions and stronger positioning over speed theater

### Secondary persona

The secondary user is a senior specialist moving into broader leadership or adjacent functional roles who:

- needs help translating existing work into new-but-credible role directions
- benefits from structured evidence review and fit comparison
- needs stronger gap visibility before committing to an application

### User state of mind

| Dimension | Primary persona | Secondary persona |
| --- | --- | --- |
| emotional starting point | skeptical, busy, mildly annoyed by setup | hopeful but unsure where the strongest path is |
| top anxieties | wasted setup, inflated claims, hidden automation, messy job queues | mis-positioning, overstating seniority, choosing the wrong role direction |
| desired wins | reusable foundation, clearer opportunity triage, trustworthy drafts, real workflow continuity | defensible positioning, clearer strengths and gaps, confidence about where to compete |
| trust requirements | provenance, explicit approvals, visible gaps, reversible exclusions | same, plus clearer wording guardrails and comparison context |

### Core JTBD

1. When I start a serious search, help me turn messy experience into reusable, defensible truth.
2. When I compare directions, help me see which clusters, roles, and jobs are actually supported.
3. When I work a real opportunity, keep the evidence, assets, notes, research, and next action connected.
4. When something is weak or missing, tell me directly instead of smoothing it over.

## Journey map

| Journey stage | Route / surface | User state of mind | JTBD | Key objects created or updated | Trust requirement | Exit condition |
| --- | --- | --- | --- | --- | --- | --- |
| choose foundation path | `Profile`, `Add your experience` | willing to start if the payoff is obvious | pick the cleanest way to start without losing control | source session, source list, intake provenance | no hidden merge, no fake speed claims | one primary source attached or manual start confirmed |
| enrich the baseline | `Profile`, `Add your experience` follow-up | wants the app to use the best available truth | add LinkedIn or pasted details when they improve the record | additive source candidates, conflict queue | no silent overwrite of factual fields | enough source material exists to normalize history |
| confirm history | `Profile`, `Check your history` | wants fast factual cleanup | turn imported content into structured work history | experience records, field provenance, unresolved gaps | one-value-per-field rules, visible conflicts | history is accurate enough to derive evidence |
| approve reusable proof | `Profile`, `Approve your proof` | wants the app to use only credible claims | approve stories, proof items, metrics, softened wording, exclusions | evidence items, story links, metric states, gaps | approved vs excluded must be explicit and reversible | approved foundation clears threshold for role comparison |
| compare clusters and roles | `Profile`, `Role Discovery` | wants grounded direction, not flattery | compare broad clusters, specific roles, and save one active role lane | clusters, role comparisons, role lane | score must be inspectable and gap-aware | one active role lane exists |
| find or add jobs | `Jobs`, `Feed` | wants real opportunities quickly | search or paste opportunities inside one operating surface | job leads, captured jobs, lane assignment | equal intake modes, visible source, no route split | at least one job is saved |
| manage the saved queue | `Jobs`, `Saved` | wants to work a real search without chaos | filter, sort, compare, and pick the next job worth review | saved jobs, shortlist state, lane grouping | density, provenance, and inspector context | one saved job is opened into review |
| decide whether to work this job | `Review` | wants a defensible go / no-go boundary | compare fit, evidence, gaps, and first draft direction | review snapshot, promotion decision, reroute action | visible strengths, gaps, disqualifiers, and excluded evidence | user either promotes the job or returns it to saved |
| manage live applications | `Applications` | wants clean active-work management | track what is live and open the right workspace | applications, status, next action summary | no CRM bloat, review lineage retained | one application is selected |
| do the actual work | `Workspace` | wants focused momentum | edit assets, capture notes, inspect fit, inspect evidence, run research, and take the next action | assets, notes, research items, action log | send remains manual, evidence remains inspectable | next action is completed or intentionally deferred |

## Domain model

### Core entities

| Entity | Definition | Primary owner | Downstream usage |
| --- | --- | --- | --- |
| `Profile` | the user-owned foundation record for reusable search truth | `Profile` | fit systems, jobs, review, applications, workspace |
| `Source Session` | one source import or manual intake event | `Profile` | history normalization, provenance, conflict review |
| `Experience Record` | one canonical work-history record with structured factual fields | `Profile` | evidence creation, cluster fit, role fit, job fit |
| `Story` | one structured narrative unit built from approved history and linked evidence | `Profile`, `Approve your proof` | role comparison, job review, draft assistance, interview prep later |
| `Evidence Item` | one approved or excluded claim-supporting unit, including scope, ownership, tool depth, credential, or context | `Profile`, `Approve your proof` | stories, fit rationale, review, workspace snapshots |
| `Metric` | one measurable result with exact or softened wording and explicit source quality | `Profile`, `Approve your proof` | stories, fit signals, application assets |
| `Gap` | one unresolved or missing dependency that materially affects trust or fit | `Profile`, `Review`, `Workspace` | warnings, score penalties, next-step generation |
| `Cluster` | one broad role family used for top-level comparison | `Profile`, `Role Discovery` | cluster-fit comparison and role-group prioritization |
| `Role Lane` | one user-owned active search direction inside a cluster | `Profile`, `Role Discovery` | jobs grouping, fit interpretation, application grouping |
| `Job Lead` | one opportunity before it is saved | `Jobs`, `Feed` | intake and save flow |
| `Saved Job` | one saved opportunity with lane assignment and review eligibility | `Jobs`, `Saved` | review gate and later promotion |
| `Review Snapshot` | the explicit decision boundary for one saved job | `Review` | promotion into applications |
| `Application` | one active job the user has decided to work | `Applications` | status management and workspace |
| `Asset` | one application-specific output such as resume, cover letter, answer, or note deck | `Workspace` | send preparation and next actions |
| `Workspace Note` | one user-authored decision or working note tied to an application | `Workspace` | continuity, decisions, follow-ups |
| `Research Item` | one job- or application-specific research object with source, summary, implication, and next-step link | `Workspace` | company context, interview prep later, decision support |

### What a `Story` is

A `Story` is not freeform marketing prose. It is a reusable narrative unit with:

- context or mandate
- actions taken
- result or outcome
- linked evidence and metrics
- safe wording if the strongest possible claim is not fully supported
- usage contexts such as `role comparison`, `job review`, `resume`, or `cover letter`

The product uses stories downstream in three ways:

1. as evidence-weighted inputs to `Role fit` and `Job fit`
2. as reusable building blocks for application assets
3. as explanation objects when the user asks why a role or job matches

### Relationship rules

1. One `Profile` owns many `Source Sessions` and many `Experience Records`.
2. One `Experience Record` can generate many `Stories`, `Evidence Items`, `Metrics`, and `Gaps`.
3. One `Story` can reference many `Evidence Items` and many `Metrics`.
4. One `Role Lane` belongs to one `Cluster`.
5. One `Saved Job` belongs to one primary `Role Lane`.
6. One `Review Snapshot` belongs to one `Saved Job`.
7. One accepted `Review Snapshot` promotes one `Saved Job` into one `Application`.
8. One `Application` owns many `Assets`, many `Workspace Notes`, and many `Research Items`.
9. `Excluded` remains reversible at the `Evidence Item`, `Metric`, or `Story` level, not as a route-level status.

## Information architecture and submenu strategy

### Top-level nav

The top-level nav remains:

1. `Profile`
2. `Jobs`
3. `Applications`

### Local submenu rules

| Route | Local submenu exists? | Exact submenu or local nav model | Why |
| --- | --- | --- | --- |
| `Profile` | yes | `Add your experience`, `Check your history`, `Approve your proof`, `Role Discovery` | the user is progressing through one foundation workspace with four distinct jobs |
| `Jobs` | yes | `Feed`, `Saved` | discovery and queue management need one shared route with two durable modes |
| `Review` | no | none, this is a focused decision gate | submenus would dilute the boundary and turn it into another mini-app |
| `Applications` | no route-level submenu | status filters and `Board` / `Sheet` view toggle only | applications management should stay light and operational |
| `Workspace` | no route-level submenu | content tabs for assets only, plus inline notes and research entry | the route is already specific to one application; extra route submenus would add noise |

### Decision on `Review`

`Review` stays a full route.

It does not become a primary nav item, and it does not get absorbed into either `Jobs` or `Applications`.

Reason:

- it is the only trustworthy place to compare one saved job against evidence, fit, and draft direction before the job becomes active work
- the transition from saved job to active application is too consequential to bury in a drawer
- the route should feel lighter and more decisive than prior artifacts, but it must remain a real surface

### Decision on `Deep research`

`Deep research` belongs inside `Workspace`.

Rules:

- it is launched from `Workspace` as a side sheet or right-side expandable panel
- `Review` may show a compact research preview only if a research question blocks promotion
- `Jobs` may show light company context in inspectors or lead rows, but not deep research
- `Deep research` is never a top-level nav item in v1

## Multi-source intake model

### Intake model decision

The product should support one primary source plus additive sources.

This is the recommended v1 model:

1. the user chooses one baseline source to start
2. the product builds the first pass from that baseline
3. the user may add resume, LinkedIn, or pasted text later to fill gaps, improve wording, or resolve missing data
4. the product never silently treats additive material as authoritative when it conflicts with user-confirmed facts

### Source roles

| Source type | Best use | Not safe to do automatically |
| --- | --- | --- |
| resume | chronology, role scope, achievements already curated by the user | overwrite cleaner LinkedIn chronology without review |
| LinkedIn | title completeness, company naming consistency, date cross-checking | silently override user-approved title, scope, or outcomes |
| pasted text | custom responsibilities, project detail, nuance from notes or job-specific material | overwrite canonical history or create unsupported metrics as facts |
| manual entry | direct user correction or missing-field completion | bypass provenance or conflict tracking |

### Conflict-resolution rules

| Case | System behavior | User action required? |
| --- | --- | --- |
| same value from multiple sources | merge provenance and show multiple source chips | no |
| additive source fills a blank field | stage it as a suggested fill with provenance | yes, if the field is trust-critical |
| additive source conflicts with a confirmed field | create a conflict row in `Check your history` review and keep both source traces | yes |
| pasted text introduces a new claim, but not a clean factual field | store it as an `Evidence Candidate`, not as a history overwrite | yes |
| user edits a field | lock user value as the canonical value until changed again | no automatic overwrite later |

### Provenance rules

- provenance is stored at the field level
- every canonical field shows whether it came from user input, resume, LinkedIn, pasted text, or a merged state
- every conflict stores all conflicting source values
- evidence items always retain their original source references, even after wording changes
- no value moves from suggestion to approved truth without an explicit user-confirmed state

## Profile / history / evidence model

### Decision on `Proof`

Locked user-facing labels remain in place for the next rebuild.

Decision:

- keep `Approve your proof` as the local `Profile` phase label
- keep `Proof Library` as the reusable support-surface title
- use `evidence` descriptively inside supporting prose to explain the approved proof system, including stories, proof items, metrics, and gaps
- do not reopen a user-facing rename in this packet

### Profile local sections

| Local section | Job | Core outputs |
| --- | --- | --- |
| `Add your experience` | attach baseline and additive sources, explain the payoff, start the owned profile | primary source, additive sources, source health |
| `Check your history` | convert source material into structured work history | approved experience records, unresolved conflicts, skills and tools coverage |
| `Approve your proof` | approve, soften, exclude, and recover reusable claims | approved stories, evidence items, metrics, gaps |
| `Role Discovery` | compare clusters and roles, then save the active role lane | cluster-fit table, role-fit table, active lane |

### What must be approved, excluded, edited, or softened

| Object | Approve | Exclude | Edit | Soften | Why it matters downstream |
| --- | --- | --- | --- | --- | --- |
| experience fields | yes, as confirmed history | no | yes | no | drives all later evidence and fit logic |
| stories | yes | yes | yes | yes | reused in role comparison, review, and assets |
| evidence items | yes | yes | yes | yes when wording overstates ownership or scope | supports trust and fit logic |
| metrics | yes | yes | yes | yes when exact numbers are thinly supported | affects story strength and asset credibility |
| gaps | resolve instead of approve | no | yes | no | keeps weak points visible and actionable |

### Downstream connection rules

- only approved history can create approved evidence
- only approved evidence can support `Cluster fit`, `Role fit`, or `Job fit`
- excluded evidence stays visible in detail, never in hero summaries
- softened evidence may support drafts, but its softened wording must remain inspectable
- gaps directly affect review, workspace next actions, and research priorities

### `Excluded` decision

`Excluded` stays user-visible and reversible.

Rules:

- visible in `Evidence`, `Review`, `Workspace`, and the evidence detail surface when relevant
- hidden from top-level score chips and route hero areas
- recoverable through an explicit `Use again` or equivalent recovery action
- preserved because trust depends on seeing what was deliberately kept out

## Jobs, Applications, and Workspace operating model

### Surface responsibilities

| Surface | What it does | What it does not do |
| --- | --- | --- |
| `Jobs`, `Feed` | search, browse, capture, and save new opportunities | active application management |
| `Jobs`, `Saved` | manage the queue of saved opportunities with sheet or board views | asset editing or deep research |
| `Review` | decide whether one saved job is worth active work | long-term application tracking |
| `Applications` | manage active applications, statuses, and next-action visibility | discovery or deep content editing |
| `Workspace` | own application-specific assets, notes, research, evidence snapshots, and next actions | broad queue management |

### `D5` `Jobs`, `Feed`

`Feed` should actually do this:

- show search-led or source-led job discovery results
- expose one route-level `Add a job` action
- open one shared intake sheet with `Search jobs` and `Paste or link` tabs
- allow save, shortlist, or dismissal directly from results where appropriate
- show light lane relevance and job-fit preview, but not full review logic

### `D6` `Jobs`, `Saved`

`Saved` should actually do this:

- become the default subview once at least one job is saved
- support `Sheet` as the default view for density
- support `Board` as an alternate view for stage scanning
- group by primary role lane in `Sheet`
- allow filters for lane, fit band, location, company, source, and status
- open a selected-job inspector without leaving the page
- allow lane reassignment, shortlist state, and direct entry into `Review`

### `D7` `Review`

`Review` should actually do this:

- present `Cluster fit`, `Role fit`, and `Job fit` in one coherent comparison stack
- show disqualifiers, strengths, missing evidence, and next actions
- show what evidence is being used and what is excluded
- show the first draft direction or asset focus without pretending the draft is done
- let the user:
  - start an application
  - return the job to `Saved`
  - change lane and re-review
  - flag research needed before promotion

### `D8` `Applications`

`Applications` should actually do this:

- manage active applications only
- default to `Board` when multiple active applications exist because active work is status-driven
- support `Sheet` as the secondary dense view
- show per-card or per-row next action, latest activity, and risk or blocker
- keep the selected application summary lightweight
- hand off quickly into `Workspace`

### `D9` `Workspace`

`Workspace` should actually do this:

- open the currently active asset first
- keep notes and decisions inline with the work
- surface fit and evidence snapshots without forcing a route change
- own `Deep research`
- store application-specific reasoning that should not mutate shared profile truth
- keep one clear next action above the fold

### When a job becomes an application

A job becomes an application only when:

1. it has been saved
2. it has passed through `Review`
3. the user explicitly chooses `Start application`

That promotion creates:

- one `Application`
- one initial `Workspace`
- one status in `Applications`
- one active next action

### What the manager owns versus what the workspace owns

| Object or behavior | `Applications` owns it | `Workspace` owns it |
| --- | --- | --- |
| status changes | yes | no |
| queue order and filters | yes | no |
| active application summary | yes | no |
| open workspace action | yes | no |
| asset editing | no | yes |
| application notes | lightweight preview only | yes, full editing |
| deep research | no | yes |
| fit and evidence snapshots | summary only | yes, full working context |
| next action completion | summary only | yes |

## Fit-model system

### Definitions

| Model | Definition | Scope | Primary decision |
| --- | --- | --- | --- |
| `Cluster fit` | how well the user's approved experience and evidence support a broad role family | profile foundation vs cluster | which clusters are worth exploring |
| `Role fit` | how well the user's foundation supports a specific role or role lane inside a cluster | profile foundation vs role lane | which role lane to activate |
| `Job fit` | how well one saved job aligns to one chosen role lane and the approved evidence set | saved job vs role lane | whether the job is worth active work |

### Display rules

| Model | Default display | Expanded display | Where it must appear |
| --- | --- | --- | --- |
| `Cluster fit` | comparison table with fit band, top strengths, top gaps | score breakdown drawer or inspector | `Profile`, `Role Discovery` |
| `Role fit` | role comparison table inside selected cluster | role breakdown drawer | `Profile`, `Role Discovery`, and selected saved-job inspector |
| `Job fit` | summary card with band, strengths, disqualifiers, and next action | review drawer or right-side inspector | `Review`, selected job inspector, `Workspace` snapshot |

### Score-band rules

| Band | Range | Meaning |
| --- | --- | --- |
| `Strong` | `80-100` | supported enough to pursue with confidence |
| `Viable` | `65-79` | worth considering, with visible gaps |
| `Stretch` | `50-64` | possible, but evidence or scope needs care |
| `Weak` | `<50` | not worth prioritizing now |

### Disqualifiers, strengths, gaps, and next actions

Every fit surface must show four explicit categories:

| Category | Meaning | Behavior |
| --- | --- | --- |
| strengths | evidence-backed reasons this match is real | always shown as concrete drivers |
| gaps | missing or thin support that may still be addressable | shown with repair path when possible |
| disqualifiers | hard blockers or capped-fit issues | visually stronger and score-capping |
| next actions | what the user should do if they still want to pursue | linked to profile edits, evidence cleanup, research, or draft changes |

### Table models

#### Cluster comparison table

Required columns:

- cluster
- fit band
- strongest supporting evidence
- top gap
- active or paid state
- next step

#### Role comparison table

Required columns:

- role or lane name
- cluster
- fit band
- top strengths
- top gaps
- evidence coverage
- active-jobs count

### Weighting model

#### `Cluster fit`

| Factor | Weight |
| --- | --- |
| role-family relevance | 30 |
| evidence density | 25 |
| scope and seniority alignment | 20 |
| tool and hard-skill alignment | 15 |
| user interest and constraints | 10 |

#### `Role fit`

Preserve the existing Chapter 05 weights:

| Factor | Weight |
| --- | --- |
| mandate and title-family alignment | 25 |
| capability evidence depth | 20 |
| story coverage | 20 |
| proof readiness | 15 |
| scope and seniority alignment | 10 |
| domain and environment adjacency | 5 |
| user pursue preference | 5 |

#### `Job fit`

Preserve the existing Chapter 05 weights:

| Factor | Weight |
| --- | --- |
| responsibility match | 25 |
| required skills and tools coverage | 20 |
| approved story coverage | 20 |
| proof readiness | 15 |
| scope and seniority alignment | 10 |
| constraints alignment | 5 |
| domain and context alignment | 5 |

## Entity schema and editing system

### Minimum schema

| Entity | Minimum fields |
| --- | --- |
| `Experience Record` | `id`, `company`, `role`, `start_date`, `end_date`, `current`, `location`, `work_mode`, `employment_type`, `responsibilities[]`, `results[]`, `tools[]`, `hard_skills[]`, `soft_skills[]`, `summary`, `provenance[]`, `conflict_state` |
| `Story` | `id`, `title`, `situation`, `actions`, `outcome`, `safe_wording`, `linked_experience_ids[]`, `linked_evidence_ids[]`, `linked_metric_ids[]`, `approval_state`, `usage_contexts[]` |
| `Evidence Item` | `id`, `type`, `label`, `summary`, `safe_wording`, `approval_state`, `exclusion_reason`, `linked_experience_ids[]`, `linked_story_ids[]`, `provenance[]`, `usage_state` |
| `Metric` | `id`, `label`, `exact_value`, `safe_wording`, `timeframe`, `source_quality`, `approval_state`, `linked_story_ids[]`, `provenance[]` |
| `Gap` | `id`, `label`, `owner_type`, `owner_id`, `priority`, `resolution_note`, `status`, `next_step` |
| `Cluster` | `id`, `name`, `description`, `fit_band`, `top_strengths[]`, `top_gaps[]`, `next_action` |
| `Role Lane` | `id`, `cluster_id`, `name`, `included_titles[]`, `recommended_category`, `fit_band`, `top_strengths[]`, `top_gaps[]`, `active`, `paid_gate_state` |
| `Saved Job` | `id`, `company`, `title`, `location`, `source_type`, `source_url`, `description`, `primary_lane_id`, `secondary_tags[]`, `status`, `fit_band`, `disqualifiers[]`, `saved_at`, `provenance[]` |
| `Review Snapshot` | `id`, `saved_job_id`, `cluster_fit`, `role_fit`, `job_fit`, `strengths[]`, `gaps[]`, `disqualifiers[]`, `used_evidence_ids[]`, `excluded_evidence_ids[]`, `draft_direction`, `decision` |
| `Application` | `id`, `saved_job_id`, `company`, `title`, `status`, `next_action`, `due_date`, `last_activity_at`, `risk_state`, `workspace_id` |
| `Asset` | `id`, `application_id`, `type`, `title`, `status`, `version`, `content`, `linked_story_ids[]`, `linked_evidence_ids[]`, `last_edited_at` |
| `Workspace Note` | `id`, `application_id`, `type`, `title`, `content`, `pinned`, `last_edited_at` |
| `Research Item` | `id`, `application_id`, `question`, `source`, `summary`, `implication`, `next_step`, `status`, `provenance[]` |

### Standardized editor grammar

Use one editing grammar across the product.

#### Grammar

1. object header
   - name
   - state
   - provenance or confidence cue
2. summary fields
   - high-value structured fields first
3. detail fields
   - arrays, long text, linked evidence, or linked records
4. trust block
   - provenance, gaps, exclusions, soft wording, or disqualifiers
5. action footer
   - one dominant action
   - one secondary action
   - destructive or high-risk actions separated

#### Surface patterns

| Pattern | Used for | Why |
| --- | --- | --- |
| table + inspector | history, evidence, saved jobs | best for density plus one-object editing |
| list or board + inspector | applications | best for queue management with lightweight detail |
| canvas + right rail | review, workspace | best for one active work object plus supporting rationale |

### Editable field rules

- responsibilities, results, tools, hard skills, and soft skills are always editable where their owning object is editable
- start date, end date, role, company, location, and work mode remain structured fields, not embedded inside long text
- provenance is always visible near edited factual fields
- safe wording belongs to stories, evidence items, and metrics, not to raw history fields
- no screen invents a one-off editor pattern if the same object already exists elsewhere

## Monetization and plan gates

### `Free tier`

`Free tier` gets:

- full foundation workflow in `Profile`
- one active role lane
- jobs feed and saved queue
- full review gate
- active applications manager
- one live workspace at a time
- light company context inside workspace

### Paid gates

| Paid gate | Why it is paid | MVP treatment |
| --- | --- | --- |
| multiple active role lanes or role groups | this multiplies fit comparison, saved-queue complexity, and application strategy value | first paid gate, explicit and visible |
| deep research | it is high-value strategic leverage tied to real opportunities, not a trust-critical baseline need | free gets light company context; paid gets deep research |
| advanced asset variants | extra role- or company-specific asset branches create compounding value, not baseline utility | keep out of the first rebuild, but plan as a paid extension |

### Why multiple role groups are paid

Multiple role groups should be paid because they multiply the highest-value behavior in the product:

- more fit comparisons
- more saved-job segmentation
- more application strategy
- more evidence reuse across directions

This is a legitimate leverage gate, not a nuisance restriction.

### What not to gate

- provenance visibility
- exclusions and recovery
- review-before-send
- basic saved-job management
- one real working path from setup to application

## Per-screen criteria matrix

| Screen | User JTBD | Primary CTA | Secondary CTAs | Required entities | Required views | Editable fields | Filter / sort needs | Trust / evidence needs | Monetization notes | Loading / empty / error / success states | Definition of done |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `S1` `Profile`, `Add your experience` | start from the strongest mix of sources without feeling trapped in setup | `Add your experience` | `Resume`, `LinkedIn`, `Paste text`, `Manual entry`, `Add another source` after first source | source sessions, baseline source, additive source slots | source chooser, payoff rail, source status | source labels, primary-source selection, additive-source notes | none | visible provenance rules, no hidden merge, clear payoff | no paid gate here | loading = import in progress; empty = no source; error = parse or auth issue; success = baseline source attached and additive options visible | one baseline source exists and the user understands they can add more later |
| `S2` `Profile`, `Check your history` | turn messy import into trusted structured work history | `Confirm history` | `Add role`, `Archive role`, `Resolve conflict`, `Review later` | experience records, conflicts, skills, tools, gaps | dense table, selected inspector | role, company, start date, end date, location, responsibilities, results, tools, hard skills, soft skills, provenance notes | chronology sort, conflict filter, unresolved-only filter | field provenance, conflict queue, explicit unresolved state | none | loading = history parse pending; empty = no roles yet; error = unrecoverable field conflict; success = history approved | structured history is accurate enough to derive evidence |
| `S3` `Profile`, `Approve your proof` | decide what reusable claims the product may use | `Approve foundation` | `Use this`, `Keep out`, `Use safer wording`, `See source`, `Use again` | stories, evidence items, metrics, gaps | stories list, proof table, safe-wording editor, detail drawer | story summary, evidence wording, metric wording, safe wording, exclusion reason | filter by type, usage, state, source quality | approved vs excluded vs softened must be explicit | none | loading = evidence extraction; empty = no evidence yet; error = broken provenance; success = threshold reached | reusable evidence foundation is approved enough for role comparison |
| `S4` `Profile`, `Role Discovery` | compare clusters and roles, then save one active lane | `Create role lane` | `Why this fits`, `Lane opportunity`, `See plans`, `Keep this lane` | clusters, role lanes, evidence coverage, paid-lane gate | cluster table, role table, fit drawer, lane editor | lane name, included titles, pursue preference | sort by fit, opportunity, evidence coverage | visible strengths, gaps, disqualifiers, and explanation trigger | multiple active lanes are paid | loading = fit calc; empty = no eligible roles; error = insufficient evidence; success = one active lane saved | one active lane exists and the user can move into jobs |
| `S5` `Jobs`, `Feed` | search or paste opportunities without leaving the system | `Add a job` | `Search jobs`, `Paste or link`, `Save job`, `Shortlist` | job leads, lane suggestions, parsed summary | feed list, capture sheet, parsed summary, lane selector | pasted URL/text, lane selection, lightweight note | search, lane filter, location filter, source filter | route-level `Add a job` must stay distinct from `Save job` | no paid gate on core intake | loading = feed query or parse; empty = no results or no jobs yet; error = parse failure; success = saved job created | at least one job is saved with a primary lane |
| `S6` `Jobs`, `Saved` | manage a real queue of saved jobs by lane | `Open job` | `Add a job`, `Shortlist`, `Board`, `Sheet`, `Sort`, `Filter`, `Columns` | saved jobs, lanes, fit bands, shortlist status | sheet default, board alternate, selected inspector | lane assignment, shortlist state, job note | sort by updated, fit, company; filter by lane, status, location, source | lane reassignment warning, fit and evidence preview | additional active lanes already governed upstream | loading = saved queue fetch; empty = no saved jobs; error = lane reassignment issue; success = selected job ready for review | the user can identify and open the next job worth review |
| `S7` `Review` | decide if this saved job deserves active work | `Start application` | `Keep in Saved`, `Change lane`, `Research first`, `See fit`, `See proof` | saved job, review snapshot, cluster fit, role fit, job fit, used / missing / excluded evidence | full review canvas, fit comparison rail, evidence block, draft direction preview | lane override, review notes, defer reason | none beyond optional requirement filter | visible strengths, disqualifiers, gaps, safe wording, and evidence lineage | deep research preview can upsell here, but core review cannot be gated | loading = fit or evidence load; empty = not valid; error = insufficient lane context; success = decision recorded | the user explicitly promotes or defers the job |
| `S8` `Applications` | manage active jobs without CRM bloat | `Open Workspace` | `Board`, `Sheet`, `Change status`, `Back to Jobs` | applications, statuses, next-action summary | board default, sheet alternate, selected summary | status, next action, due date, lightweight summary note | sort by updated, due date; filter by status, lane | review lineage and evidence risk must remain inspectable in summary | no paid gate on base manager | loading = application list fetch; empty = no active applications; error = status-sync issue; success = selected application ready to open | active work is clearly organized and actionable |
| `S9` `Workspace` | do the next meaningful thing for one application | `Review next action` | `Back to Applications`, asset tabs, `See fit`, `Review proof`, `Open research` | application, assets, notes, research items, next action, evidence snapshot, fit snapshot | asset canvas, notes, next-action panel, research sheet, evidence and fit drawers | asset content, notes, research items, task state | asset tab sort only if needed; research filter by status or source | manual send boundary, evidence snapshot, disqualifier visibility, recoverable exclusions | deep research is paid beyond light context | loading = asset open; empty = no asset yet; error = broken evidence link; success = next action completed or deferred with note | the workspace supports credible ongoing application work without losing trust context |

## Mandatory support surfaces and edit surfaces

### Mandatory support surfaces

| Surface | Where it opens | What it must prove |
| --- | --- | --- |
| source conflict drawer | `Profile`, `Check your history` | additive-source conflicts are reviewable, not silently merged |
| proof detail drawer | `Profile`, `Approve your proof`, `Review`, `Workspace` | provenance, safe wording, and exclusion recovery remain inspectable |
| fit breakdown drawer | `Profile`, `Role Discovery`, `Review`, `Workspace` | cluster, role, and job fit are explainable, not opaque |
| add-job sheet | `Jobs`, `Feed` and `Jobs`, `Saved` | one route-level `Add a job` action owns both intake modes |
| selected-job inspector | `Jobs`, `Saved` | sheet and board views stay operational without route thrash |
| deep research sheet or panel | `Workspace`, with preview hook from `Review` only when needed | research is contextual, not a detached route |
| lane-change modal | `Jobs`, `Saved` and `Review` | lane reassignment consequences stay explicit |

### Mandatory edit surfaces

| Edit surface | Owner | Required grammar |
| --- | --- | --- |
| history inspector | `Profile`, `Check your history` | structured fields first, long-form detail second, provenance always visible |
| evidence editor | `Profile`, `Approve your proof` | approval state, wording, safe wording, provenance, linked records |
| role-lane editor | `Profile`, `Role Discovery` | lane name, included titles, cluster, pursue preference, paid-state clarity |
| job intake sheet | `Jobs` | source mode, parsed summary, lane choice, confirmation footer |
| saved-job inspector | `Jobs`, `Saved` | summary, fit band, lane, notes, route into `Review` |
| application summary inspector | `Applications` | status, next action, due date, risk, workspace entry |
| workspace asset editor | `Workspace` | active asset, notes, evidence links, next action, send boundary |

## Artifact salvage and rejection

### What `FS6A5` got right and should be preserved

| Area | Preserve | Why |
| --- | --- | --- |
| shell direction | full-canvas dark signed-in product inside a visible Foundation Series shell | this is closer to company-grade product presentation |
| route continuity | `Profile -> Jobs -> Review -> Applications -> Workspace` reads as one system | the route model is not the problem now |
| `D5` action separation | `Add a job` at route level and `Save job` inside the sheet | this is the correct intake model |
| `D8` sidebar behavior | the applications manager can show the collapsed state as a post-value surface | it makes sense only after the user is in active management |
| `D9` support context | fit and evidence snapshots inside workspace | this is the right kind of supporting context |

### What must be discarded from `FS6A5`

| Area | Discard | Why |
| --- | --- | --- |
| D1 narrative | leverage story still underperformed and source mechanics still dominated too early | the first moment still did not sell the journey strongly enough |
| evidence framing | proof still felt like a retained packet concept more than a compelling product capability | the value of evidence was not yet obvious enough |
| jobs operating model | feed, saved, review, and applications still felt presentational rather than deeply usable | the underlying product behavior needed more operating clarity |
| top artifact shell content | too much meta framing still competed with the product | the product should own more of the center of gravity |
| screen map clarity | the shell TOC and screen map need tighter grouping and less scanning friction | it is useful, but still too literal and clipped in places |
| low-value badges and helper text | anything that repeats obvious state without helping the user decide | these create noise, not clarity |
| sidebar control styling | current control direction exists, but the affordance is still too wordy and visually heavy | next build needs icon-first, minimal, border-centered treatment |

## Acceptance criteria

This packet is complete only if all of the following are true:

1. personas, anxieties, trust requirements, and the activation-to-application journey are explicit
2. local submenu strategy is explicit for every primary route
3. multi-source intake is explicitly resolved, including provenance and conflict rules
4. the evidence model is explicit enough to replace vague proof handling
5. `Jobs`, `Review`, `Applications`, and `Workspace` each own a distinct and credible operating job
6. `Cluster fit`, `Role fit`, and `Job fit` are all defined with display rules and decision use
7. minimum schema and standardized editors are explicit
8. monetization gates are clear and lean
9. every primary desktop screen has a complete criteria row
10. the next rebuild brief does not need to invent product logic

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| the clearer evidence model may still create pressure for later terminology changes | the live stack still locks `Proof Library`, `Approve your proof`, and `Role Discovery` today | keep the operating-model gains here, but defer any rename decision to an explicit future pass |
| adding additive source intake can create too much cleanup if handled loosely | more sources can create more conflicts | baseline-plus-additive rules and field-level provenance are mandatory |
| making `Review` more rigorous could slow first-job momentum if overloaded | the user still needs to reach active work quickly | keep the route focused on one decision, not on a second setup phase |
| applications can drift into CRM bloat if every management feature is added too early | this would dilute the product's wedge | keep manager light, list or board first, workspace for real work |

## Exact next step for the following artifact rebuild

Run one fresh desktop rebuild against:

- the synced Chapter 05 stack for route ownership, trust boundaries, and preserved truths
- this packet for the operating model

The next rebuild must do all of the following without reopening product logic:

1. keep the stronger dark full-canvas shell, but tighten screen-map grouping and eliminate clipping
2. make the first product moments feel motivating and high-leverage without badge clutter, fake urgency, or gimmicky copy
3. make approved proof feel operational and useful inside `Profile` without renaming locked surfaces
4. render `Profile` as one workspace with local sections `Add your experience`, `Check your history`, `Approve your proof`, and `Role Discovery`
5. support one primary source plus additive sources in `Profile`
6. render `Jobs` with real `Feed` and `Saved` subviews, plus one shared `Add a job` sheet
7. render `Review` as a focused full-route gate that compares `Cluster fit`, `Role fit`, and `Job fit`
8. render `Applications` as active-management, not discovery and not CRM theater
9. render `Workspace` as the real work surface for assets, notes, evidence, fit, research, and next actions
10. keep multiple active role groups paid
11. remove low-value badges and helper text, and use a minimal icon-first sidebar control

The next rebuild is successful only if it looks like one credible premium product and behaves like one coherent operating model.

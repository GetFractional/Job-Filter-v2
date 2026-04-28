# Foundation Series 05, Activation UX Architecture Spec

Last updated: 2026-03-22  
Status: UX architecture authority  
Primary owner: `868hukucf`  
Parent chapter: [`05-activation-and-core-app.md`](./05-activation-and-core-app.md)

## 1. Purpose of this spec

This document is the highest-fidelity Chapter 05 authority for signed-in UX architecture, interaction behavior, and page-level decision logic.

It exists to prevent later packet, artifact, and implementation-handoff work from inventing product behavior or turning activation into a gallery of disconnected states.

Use it when later work needs to know:

- what each signed-in route is for
- what each activation page must help the user do
- what the user is reviewing, editing, approving, rejecting, or deferring
- what belongs inline versus in a drawer, side sheet, or modal
- what the dominant action is on each page and why
- how plan state, lane state, fit logic, and proof logic interact

When a desktop artifact, mobile artifact, prototype, or implementation shortcut conflicts with this spec, this spec wins.

## 2. Scope of authority

This spec owns:

- signed-in route purpose and route boundaries
- activation sequence and transition rules
- user mental model and page-level JTBD
- interaction contracts by state
- imported experience review model
- stories, proof, and safe-wording rules
- `Role Discovery`, `Role Lane`, `Role fit`, `Job fit`, and `Lane opportunity` behavior
- `Jobs` operating model at launch
- first-job review, `Applications`, and `Workspace` behavior
- embedded proof-approval behavior inside `Profile` for the first slice, with `Proof Library` reserved only as a later support-surface title if density requires it
- sidebar, account, plan-state, and guided-onboarding rules
- artifact framing contract and Foundation Series shell continuity for Chapter 05

This spec does not own:

- signed-out website behavior
- mobile-specific adaptation decisions beyond shared UX rules
- implementation code or API design
- final copy taste for copy-dependent stage labels
- `FS8` implementation-handoff structure

### Locked truths carried forward

The following remain locked unless a direct conflict is explicitly found and resolved through governance:

- top-level signed-in IA remains `Profile`, `Jobs`, `Applications`, with `Settings` in the account area
- activation remains foundation-first
- `Stories + Proof` must happen before `Role Discovery`
- the first real job exists only after at least one lane exists
- user-facing term remains `Role Discovery`
- user-owned reusable object remains `Role Lane`
- `Jobs` must support both in-app search and manual paste/link capture at launch
- one job belongs to one primary role lane
- proof states remain unified and visible inside `Profile` in the first slice, with `Proof Library` reserved as the later support-surface title if embedded density requires it
- user-facing scoring uses `Role fit`, `Job fit`, and `Lane opportunity`, with `Priority` available only as an operational sorting helper
- `Applications` and `Workspace` ship now with lightweight company context, lightweight message log behavior, and minimum CRM fields, while deeper research, interview prep, and richer analytics stay later
- no auto-apply
- first-job SLA target remains `30-45 minutes` when source material exists

## 3. Stage naming model

System logic and user-facing copy are different concerns. System names are stable. Working user-facing stage labels may still require copy-pass review.

| State ID | Internal system name | Route owner | Working user-facing stage label | Label status | Notes |
| --- | --- | --- | --- | --- | --- |
| `P0` | `profile_source_capture` | `Profile` | `Add your experience` | `final` | source-neutral dominant action now aligns with the copy authority |
| `P1` | `profile_experience_review` | `Profile` | `Check your history` | `final` | user-facing label now reflects factual confirmation instead of system processing |
| `P2` | `profile_foundation_review` | `Profile` | `Verify for reuse` | `final` | this is the local proof-and-readiness phase inside `Profile`, not a separate top-level route |
| `P3` | `profile_role_discovery` | `Profile` | `Role Discovery` | `final` | locked user-facing term |
| `J0` | `jobs_first_capture` | `Jobs` | `Add a job` | `final` | route-level intake action is now synchronized to the copy authority |
| `JL0` | `jobs_manager` | `Jobs` | `Jobs` | `final` | locked top-level route label |
| `J1` | `jobs_first_review` | `Review` | `Review before work` | `final` | dedicated child-surface label now matches the synced route model |
| `A0` | `applications_manager` | `Applications` | `Applications` | `final` | top-level active-management route after review |
| `W0` | `application_workspace` | `Workspace` | `Workspace` | `final` | authoritative child-surface label under `Applications` |

### Naming rules

- System names are never shown to users.
- Stage labels may change in the later copy pass, but page purpose and state logic may not.
- `Source Capture`, `Experience Normalization`, `Stories + Proof`, `Role Discovery`, `First Job Capture`, `Review`, `Applications`, and `Workspace` remain valid system-stage labels for architecture and delivery coordination.
- `Role Discovery`, `Role Lane`, `Role fit`, `Job fit`, and `Lane opportunity` remain locked product terms.
- `Proof Library` remains a reserved later support-surface title only. It does not define a first-slice route or standalone page contract.

## 4. Signed-in route ownership

| Route | User-facing label | Exact ownership | What it must not own |
| --- | --- | --- | --- |
| `/profile` | `Profile` | source import, experience review, proof review, role discovery, lane creation, reusable user preferences | public-funnel work, broad jobs management, outreach workflows |
| `/jobs` | `Jobs` | first-job intake, feed, saved queue, shortlist/save state, board and sheet views | core proof editing, global profile editing, website CTA behavior |
| `/jobs/review/:jobId` | `Review` | one saved job's review boundary, fit inspection, proof usage, and draft review | global role discovery, active application management |
| `/applications` | `Applications` | active applications list, statuses, and entry into `Workspace` | discovery, profile foundation editing, proof governance |
| `/applications/:applicationId` | `Workspace` | one application's active work, asset review, next actions, notes, and job-specific support context | global role discovery, global proof governance |
| `/settings` | `Settings` | account, plan, privacy, preferences, reversible controls, sign out | primary activation, jobs management, role discovery |

### Route boundary rules

- `Profile` remains the default signed-in destination while activation is incomplete.
- `Jobs` becomes operationally central only after at least one role lane exists.
- `Review` is a dedicated child surface between a saved job and an active application.
- `Applications` is the top-level route for active application management after review.
- `Workspace` is a child surface under `Applications`, not a peer primary route.
- proof states stay inside `Profile` for the first slice, with filtered tables, drawers, and inspectors providing reusable-truth access.
- `Settings` is never a primary-nav item.
- `Free tier` is plan-state information, not a route.

## 5. Activation state map

| State ID | System state | Route | Entry criteria | Primary output | Exit criteria | Allowed next state |
| --- | --- | --- | --- | --- | --- | --- |
| `P0` | source capture | `Profile` | signed in, no approved source foundation | source material attached or manual path started | usable source exists or manual start confirmed | `P1` |
| `P1` | experience review | `Profile` | source exists or manual path is active | approved normalized experience rows | factual history is accurate enough for extraction | `P2` |
| `P2` | proof review | `Profile` | approved experience rows exist | approved stories, metrics, proof items, exclusions, safe wording | foundation threshold is met for role discovery | `P3` |
| `P3` | role discovery | `Profile` | verified profile exists | at least one user-owned role lane | one primary lane exists and is saved | `J0` |
| `J0` | first job capture | `Jobs` | at least one lane exists, no analyzable saved job yet | one saved job with primary lane | first job is saved and parse-ready | `J1` |
| `JL0` | jobs manager | `Jobs` | at least one saved job exists | searchable, filterable, lane-aware jobs surface | user selects a job or adds another | `J1` or `J0` |
| `J1` | review boundary | `Review` | first saved job exists, no accepted review yet | reviewed lane match, job fit, proof usage, first drafts | user explicitly accepts review and promotes to active work | `A0` |
| `A0` | applications manager | `Applications` | first review accepted | active application list with status and workspace entry | user opens the promoted application | `W0` |
| `W0` | workspace | `Workspace` | application exists and has been promoted from review | active per-application workspace | first-job value achieved | ongoing use |

### Transition rules

- `P0 -> P1` only after a source path is selected.
- `P1 -> P2` only after experience rows are accurate enough to extract stories and proof.
- `P2 -> P3` only after the verified-profile threshold defined in Section 10 is met.
- `P3 -> J0` only after at least one role lane is saved.
- `J0 -> J1` only after one job is saved with a primary lane and enough parsed detail to analyze.
- `J1 -> A0` only after explicit review acceptance. The first job review is not skippable.
- `A0 -> W0` only after the user explicitly opens the promoted application.

### Reload and resume rules

- incomplete activation resumes at the first incomplete state
- one or more role lanes but no saved job resumes at `J0`
- saved first job without accepted review resumes at `J1`
- accepted first job review resumes at `A0`, with the promoted application selected
- opened active application resumes at the relevant `W0`
- forced-fresh behavior remains a separate routing concern and is not reopened here

## 6. Page-purpose matrix

| State | Exact page purpose | Exact user JTBD | Primary objects in play | Lead information hierarchy | What must be obvious in 5 seconds | Exact success condition |
| --- | --- | --- | --- | --- | --- | --- |
| `P0` | start the signed-in journey by collecting usable source material with minimal friction | get the fastest trustworthy starting point into the system | profile source, import status, setup payoff | source choice first, payoff second, account chrome last | import or start manually, and why this setup is worth doing | user has attached a source or deliberately started manual entry |
| `P1` | turn imported or manual history into accurate structured truth | make sure the system is only reasoning from facts the user approves | role rows, unresolved issues, right-side detail drawer | role table first, detail drawer second, issue handling third | rows are editable, chronology stays visible, and conflicting facts are resolvable | kept experience rows are accurate enough to extract stories and proof |
| `P2` | verify which reusable evidence and wording may move forward to role comparison | decide what is safe to use, what must be softened, and what must stay excluded | stories, metrics, proof items, approval states, provenance, readiness bar | readiness bar first, review queue second, detail inspection third | proof and truth are visible as reusable or blocked, not hidden behind summary language | profile reaches `Verified` and can continue to role comparison |
| `P3` | discover supported role directions and convert them into user-owned lanes | understand which roles are actually supported, then save a lane to search against | role candidates, role-fit rationale, lane opportunity, saved lanes | candidate comparison first, lane creation second, opportunity third | recommendations are evidence-based and lanes are user-owned | at least one role lane is saved |
| `J0` | bring in the first real job through one operational intake flow | get one real job into the product without leaving the system or choosing between top-level paths | job capture sheet, parsed job facts, primary lane assignment | one `Add a job` entry point first, capture mode second, parsed facts third | one `Add a job` flow contains both search and paste/link capture | one analyzable job is saved with a primary lane |
| `JL0` | manage jobs as an ongoing lane-aware operating surface | scan, filter, sort, shortlist, and select jobs by lane | jobs rows or cards, lane grouping, filters, display settings | jobs list first, filter and view controls second, secondary chrome last | jobs are organized, configurable, and not trapped in a toy list | user has selected a job or created another |
| `J1` | force a first explicit review before the job becomes active work | inspect job fit, proof usage, and first drafts before anything carries forward | job requirements, job-fit breakdown, proof usage, draft assets | review boundary first, matched and missing proof second, drafts third | this is a mandatory review boundary, not a cosmetic checkpoint | first-job review is accepted or intentionally deferred |
| `A0` | turn a reviewed job into active application management | see what is active now and open the correct application workspace | promoted applications, statuses, selected application summary | active applications first, selected application second, supporting metadata third | this is where active jobs are managed after review | one application is selected for work |
| `W0` | continue work for one real application with context, assets, and next actions connected | perform the next meaningful action for one active application | application header, active assets, next actions, rationale access | active work first, next action second, deeper rationale third | this is now a real working surface, not setup | user can perform the next meaningful application-specific action |

## 7. User questions and anxieties matrix

| State | Top 3 user questions on entry | Top 3 user anxieties on entry | What the page must not distract the user with |
| --- | --- | --- | --- |
| `P0` | 1. What do I import first?<br>2. What happens after import?<br>3. Can I start without perfect materials? | 1. I do not want to retype everything.<br>2. I do not want hidden automation deciding for me.<br>3. I do not want to get trapped in setup. | role recommendations, full asset previews, plan upsell, dashboard-style route noise |
| `P1` | 1. What exactly do I need to fix?<br>2. What came from my source vs from the system?<br>3. Can I add what my resume missed? | 1. The system may reason from bad facts.<br>2. I may lose source context.<br>3. This may turn into endless cleanup. | role discovery, job capture, decorative progress chrome, marketing copy |
| `P2` | 1. What is verified already?<br>2. What still blocks reuse?<br>3. What happens to excluded or softened items? | 1. Unsupported claims may slip through.<br>2. I may be forced to accept inflated language.<br>3. Missing evidence may make the system unusable. | role-lane upsell, job-search distraction, polished asset focus, generic trust slogans |
| `P3` | 1. Why am I seeing these role directions?<br>2. What is a lane versus a role suggestion?<br>3. Can I rename and control this? | 1. The product may recommend flattering but wrong roles.<br>2. I may get locked into the wrong lane.<br>3. Fit may be a black box. | job-list complexity, full workspace noise, dashboard metrics, ambient upgrade pressure |
| `J0` | 1. Do I search here or paste a job here?<br>2. What is the fastest way to add the first job?<br>3. How does lane assignment work? | 1. I may have to choose the wrong intake path too early.<br>2. The parsed job may be messy or thin.<br>3. I may have to enter the same info twice. | multiple competing homepage CTAs, full review surface, plan upsell, unrelated proof editing |
| `JL0` | 1. Which jobs belong to which lane?<br>2. How do I switch views and filters?<br>3. Which jobs actually need attention next? | 1. The list may become cluttered fast.<br>2. Lane changes may break prior work.<br>3. Board view may hide important detail. | activation coaching, large empty-state storytelling, unrelated account controls |
| `J1` | 1. What am I reviewing before this job becomes active?<br>2. What is matched, missing, or excluded?<br>3. Can I trust the first drafts? | 1. The product may overstate my fit.<br>2. Unsupported claims may slip into assets.<br>3. Review may be optional in practice even if it claims not to be. | generic onboarding language, unrelated research modules, nav clutter, upsell noise |
| `A0` | 1. Which applications are active now?<br>2. What needs my attention next?<br>3. Which application should I open? | 1. Active work may feel detached from the search queue.<br>2. Statuses may be noisy or CRM-heavy.<br>3. Promotion from review may feel ambiguous. | activation framing, proof-governance clutter, abstract dashboard metrics |
| `W0` | 1. What should I do next for this application?<br>2. Where are the active assets and job context?<br>3. Where do I inspect rationale without losing flow? | 1. The workspace may become a document dump.<br>2. The app may lose the link back to approved truth.<br>3. Research or follow-on tasks may feel disconnected. | activation framing, big hero copy, duplicate reviews, decorative status chrome |

## 8. Interaction model by state

### Global page-composition and overlay rules

- Each page uses one primary workspace and at most one open inspector surface at a time.
- Desktop pages default to row-first or table-first composition whenever the user is reviewing factual data or reusable truth.
- `P0` and the combined `P1/P2` history workspace live inside one stable `Profile` shell and one main-canvas swap model.
- Drawers are for inspectable secondary detail that must preserve page context, such as fit rationale, proof provenance, and import issues.
- Side sheets are for secondary but structured tasks that need more vertical depth than a drawer, such as lane opportunity review or the shared job-capture flow.
- Modals are reserved for destructive confirmation, high-risk lane reassignment, or discard/replace decisions. They are never used for routine education.
- Guidance appears only next to the decision it supports. It never competes with the dominant action.

### `P0` `profile_source_capture`

- Lead hierarchy: source-method selection, dominant import action, compact setup payoff, account chrome
- Primary action: `Add your experience`
- Secondary action: `Start manually`
- Tertiary or supporting actions: review accepted source types, reopen onboarding guidance, cancel and sign out through the account menu
- Clickable or selectable: source-method tiles, source-format help, file-picker trigger, manual-path trigger
- Inline editable: none by default, except optional manual-start prefill fields such as name or headline if the user chooses manual entry
- Drawer: none by default
- Side sheet: source-file status or import-processing sheet only if import is in progress
- Modal: discard imported file, replace imported file, or leave setup mid-import
- Auto-save: chosen source path, uploaded file association, and import start state
- Manual confirmation: moving forward requires an explicit import or manual-start choice
- Deferrable: LinkedIn import can be skipped; manual path is always available
- Immediate aftermath:
  - `Add your experience` starts import and routes to `P1` when usable parse results exist
  - `Start manually` creates an empty-but-owned profile foundation and opens `P1`

### `P1` `profile_experience_review`

- Lead hierarchy: normalized experience table, right-side drawer, issue handling, low-emphasis route chrome
- Primary action: route-level progression is owned by the shared readiness bar, not a competing page-header action
- Secondary action: `Back`
- Tertiary or supporting actions: add row, duplicate row, archive row, add missing detail, resolve issue, mark issue deferred when allowed
- Clickable or selectable: experience rows, row status, unresolved issue indicators, provenance badges, row actions
- Inline editable: company, title, start date, end date, work mode, location, employment type, short mandate summary
- Inline editable only in detail editor, not in the table cell: responsibilities, tools, KPIs, outcomes, context notes, reason-for-leaving or transition context when relevant
- Drawer: right-side drawer by default, plus unresolved issue review and field-level provenance inspection as nested or local drawer detail
- Side sheet: none required for the first slice
- Modal: remove row, replace imported chronology, or merge duplicate records
- Auto-save: row edits, deferred issues, added missing details
- Manual confirmation: any row-level `Confirm history` action stays local and subordinate; the route-level exit belongs to the shared readiness bar
- Deferrable: non-critical provenance or low-impact context gaps can be deferred; critical chronology and identity conflicts cannot
- Immediate aftermath:
  - resolving a row updates its row-level readiness toward `Imported`, `Conflict`, or `Verified`
  - deferring a critical issue keeps the overall profile in `Conflict`

### `P2` `profile_foundation_review`

- Lead hierarchy: sticky readiness bar, reviewable stories and proof rows, approval controls, detail inspection
- Primary action: `Continue to Role Discovery`
- Secondary action: `Back to experience`
- Tertiary or supporting actions: approve item, reject suggestion, exclude item, reopen excluded item, edit summary, edit safe wording, inspect provenance
- Clickable or selectable: story rows, proof rows, metric rows, confidence states, usage states, linked experience references
- Inline editable: story summary, metric label, safe wording, context notes, exclusion reason note
- Drawer: proof detail, provenance detail, linked-usage detail
- Side sheet: none required for the first slice
- Modal: only for destructive removal of an already-approved item currently in use
- Auto-save: per-item edits, exclusion reasons, safe-wording changes
- Manual confirmation: each item approval is explicit, and `Continue to Role Discovery` confirms the current verified profile is good enough for role discovery
- Deferrable: thin evidence can be deferred if it is excluded or kept as context-only and does not block the minimum threshold
- Immediate aftermath:
  - item approval updates role-discovery eligibility
  - exclusion removes the item from fit and asset eligibility but preserves it in the library
  - `Continue to Role Discovery` advances to `P3` only if the verified-profile threshold is met
- Layout rule: this proof-and-readiness mode stays embedded inside the same `Profile` history workspace as `P1`, using the shared role table, right-side drawer, and sticky readiness bar. It is not a standalone route or required standalone screen family in the first slice.

### `P3` `profile_role_discovery`

- Lead hierarchy: role candidate comparison, lane-creation action, rationale inspection, opportunity as secondary context
- Primary action: `Create role lane`
- Secondary action: `Back to proof`
- Tertiary or supporting actions: inspect role fit, inspect lane opportunity, rename lane, edit included titles, set as active lane, compare another candidate
- Clickable or selectable: candidate rows, title bundles, lane-name field, recommended-category field, locked additional-lane affordance
- Inline editable: lane name, selected titles within the lane, optional pursue preference notes
- Drawer: `Role fit` rationale drawer
- Side sheet: `Lane opportunity` side sheet
- Modal: lane switch warning only when the user already has jobs attached to another primary lane
- Auto-save: lane naming drafts, selected titles, candidate comparison state
- Manual confirmation: a lane is not created until the user explicitly saves it
- Deferrable: additional lane creation can be deferred after the first lane is saved
- Immediate aftermath:
  - saving the first lane unlocks `Jobs`
  - changing the active lane updates the default lane for first-job capture

### `J0` `jobs_first_capture`

- Lead hierarchy: one add-job action, shared capture sheet, parsed job facts, lane assignment
- Primary action: `Add a job`
- Secondary action: `Back to Profile`
- Tertiary or supporting actions: switch capture mode, choose search result, paste description, paste URL, assign lane, save as draft
- Clickable or selectable: `Search` and `Paste/Link` tabs, result rows, lane suggestions, parse status blocks
- Inline editable: job title, company, location, short notes, selected primary lane, optional secondary role tags
- Drawer: none required
- Side sheet: job capture sheet owns the full intake flow
- Modal: discard unsaved job intake
- Auto-save: search query, pasted job text, provisional parse results
- Manual confirmation: `Save job` is explicit
- Deferrable: the user can save and return later only after minimum analyzable job details exist
- Immediate aftermath:
  - the first saved analyzable job routes directly to `J1`
  - later saved jobs return to `JL0` unless a review is required immediately

### `JL0` `jobs_manager`

- Lead hierarchy: jobs table or board, lane grouping, sort or filter or configure controls, secondary account chrome
- Primary action: `Open job`
- Secondary action: `Add a job`
- Tertiary or supporting actions: switch between sheet and board, sort, filter, configure columns, shortlist, archive, reassign lane
- Clickable or selectable: row or card, lane filters, view toggle, sort/filter controls, display controls, shortlist and archive states
- Inline editable: lane assignment, shortlist status, selected display configuration, lightweight notes
- Drawer: selected-job summary drawer when needed, if the user wants context without leaving the list
- Side sheet: not required for the default jobs manager
- Modal: lane-switch warning when changing the primary lane on a job that already has review or workspace history
- Auto-save: view preference, filters, shortlist state, column configuration
- Manual confirmation: lane reassignment after warning modal, archive action when destructive
- Deferrable: column configuration and grouping preferences are always deferrable
- Immediate aftermath:
  - selecting a pre-review job opens `J1`
  - selecting an already-reviewed job opens `A0`
  - selecting an active application entry opens `W0`

### `J1` `jobs_first_review`

- Lead hierarchy: review boundary, matched and missing requirements, draft assets, job-fit and proof detail as inspectable support
- Primary action: `Start application`
- Secondary action: `Edit job`
- Tertiary or supporting actions: inspect `Job fit`, inspect proof detail, edit lane, defer review, compare asset versions
- Clickable or selectable: requirement rows, proof-usage rows, draft asset tabs, fit summary, lane assignment
- Inline editable: minor job fields and notes only when they do not invalidate the parse; otherwise return to `J0`
- Drawer: `Job fit` breakdown, proof detail, requirement detail
- Side sheet: optional blocked-requirements summary when there are many missing items
- Modal: lane-switch warning if the user attempts to move the job to a different primary lane after review has begun
- Auto-save: notes, viewed drawer state, review progress markers
- Manual confirmation: first review acceptance is explicit and cannot be skipped
- Deferrable: the user may defer the job after review, but cannot bypass review for the first job
- Immediate aftermath:
  - accepting review opens `A0`
  - editing job returns to `J0` or the relevant edit surface
  - deferring keeps the job in `in_review` status inside `Jobs`

### `A0` `applications_manager`

- Lead hierarchy: active applications list, selected application summary, status grouping, secondary route chrome
- Primary action: `Open Workspace`
- Secondary action: `Back to Jobs`
- Tertiary or supporting actions: change status, open notes preview, sort applications, filter applications
- Clickable or selectable: application rows, status groups, selected application summary, workspace entry
- Inline editable: lightweight status notes only
- Drawer: selected-application summary drawer when needed without leaving the list
- Side sheet: none required for the first slice
- Modal: destructive close-state confirmation only
- Auto-save: status filters, sort preferences, selected application
- Manual confirmation: close-state changes or destructive archive actions
- Deferrable: status note edits and sort preferences
- Immediate aftermath:
  - opening the promoted application enters `W0`
  - returning to `Jobs` preserves the selected application state

### `W0` `application_workspace`

- Lead hierarchy: active asset or next action, job header and status, rationale access, secondary research or support context
- Primary action: `Review next action`
- Secondary action: `Back to Applications`
- Tertiary or supporting actions: switch asset tab, inspect fit, inspect proof snapshot, add job note, open lightweight company context, open message log
- Clickable or selectable: asset tabs, task list items, rationale entry points, supporting side-panel modules
- Inline editable: asset draft content, lightweight notes, task state, job-specific context fields
- Drawer: job-fit breakdown, proof detail, requirement detail
- Side sheet: lightweight company-context sheet when needed
- Modal: destructive job status changes or irreversible lane-change effects
- Auto-save: notes, task progress, asset drafts
- Manual confirmation: any send-adjacent or status-changing action remains explicit
- Deferrable: non-critical tasks, message follow-up, draft refinement
- Immediate aftermath:
  - the workspace becomes the default place for job-specific execution
  - further changes remain anchored to the same primary lane unless deliberately changed

## 9. Experience review and edit contract

### Chosen UX model

The experience-review surface uses a hybrid model:

- a full-width chronological table for scanning and comparing records
- a persistent detail editor for the selected row
- an issue drawer for unresolved source conflicts and provenance

This is the correct model because:

- the user needs chronological clarity first
- the user must compare rows against source truth quickly
- deep editing is necessary, but only for one row at a time
- stacked record cards are too slow and too wasteful for desktop
- the first job-search value depends on accurate facts, not on early role advice or early draft generation

### Profile-level structured context captured by the end of `P1`

The end of `P1` must leave the product with a usable factual foundation, not just cleaned-up chronology.

The `Profile` route therefore captures or confirms these profile-level structures alongside experience rows:

| Structure | Purpose | Where it is edited |
| --- | --- | --- |
| skills and tools inventory | normalize reusable capability evidence for later fit and proof review | selected-row editor for row-scoped tools, plus profile-level structured tags where skills span multiple roles |
| user preferences and constraints | support lane selection and later `Job fit` without reopening profile truth | profile-level controls adjacent to the experience workspace, not inside the jobs route |
| transition context | capture reason-for-leaving or transition explanation only when it materially affects lane or job confidence | selected-row editor for role-level context, with profile-level summary if multiple rows point to the same transition |
| provenance state | preserve which fields were imported, user-entered, inferred, or unresolved | provenance drawer and field-level badges |

These structures are not optional decoration. They are part of the factual foundation required before story extraction and role reasoning begin.

### Table structure

The table is the primary scanning surface. Each row represents one canonical experience record.

Visible row fields on desktop:

| Field | Rule |
| --- | --- |
| company | one canonical company value per row |
| title | one canonical title value per row |
| start date | one value |
| end date or current | one value |
| work mode / employment type | one value |
| location | one value |
| role mandate summary | one concise summary field |
| tools summary | displayed as truncated list or count, expanded in editor |
| outcomes summary | displayed as truncated list or count, expanded in editor |
| provenance status | one state |
| unresolved issues count | one state |

### One-value-per-field rules

- each visible table cell maps to one canonical value
- arrays such as tools, outcomes, KPIs, or responsibilities do not render as sprawling comma walls in the table
- multi-value collections are edited in the detail editor and summarized in the row
- ambiguous imported values never appear as if they are already approved

### Detail editor rules

The detail editor is always tied to the selected row and owns:

- responsibilities
- outcomes
- tools, stored as structured items plus optional raw-note support
- KPIs
- team scope
- seniority context
- domain or environment notes
- reason-for-leaving or transition context when relevant
- manually added missing detail not present in resume or LinkedIn

### Row-completion rules

A kept row is considered extraction-ready only when all of the following are true:

- one canonical company value exists
- one canonical title value exists
- one valid time range exists
- at least one scope or mandate statement exists
- at least one outcome, responsibility cluster, or material tool/context entry exists

Rows may remain thin. They may not remain structurally ambiguous.

### Inline edit behavior

- basic factual cells edit inline, then auto-save
- multi-value or contextual fields edit in the detail editor
- inline edits show source provenance on demand, not by default

### Add and remove behavior

- `Add role` creates a blank canonical row at the correct chronological location
- `Duplicate row` is allowed only to split one imported row into two real roles or time blocks
- `Archive row` hides a mistaken row without destroying its source trace
- permanent delete requires a confirmation modal and is discouraged once extraction has begun

### Provenance handling

- provenance is field-aware, not only row-aware
- the user can inspect original imported wording and source origin in the issue drawer
- user-added details are tagged as user-entered, not imported
- unresolved imported values remain visibly unresolved until the user confirms or replaces them

### Unresolved issue handling

Unresolved issues stay in a dedicated issue drawer and must be classified as:

- must-fix before extraction
- safe to defer
- context-only discrepancy

Examples of must-fix:

- overlapping dates with no explanation
- missing company or title on a kept row
- duplicated records not intentionally split

Examples of safe to defer:

- a thin KPI detail that is not required for extraction
- partial location detail

### Threshold to continue

Stories and proof extraction can begin only when:

- at least one kept experience row is approved
- all must-fix chronology issues are resolved
- every kept row has canonical company, title, and time range values
- enough role mandate, scope, and outcome detail exists to support story extraction

### What the page is really doing

`P1` is not a parser cleanup screen and not a mini CRM. It is the factual checkpoint where the user decides whether the product has enough clean truth to start making reusable claims.

## 10. Stories + proof contract

### Object relationship

Three objects remain distinct:

| Object | Purpose | Relationship |
| --- | --- | --- |
| story | reusable narrative unit drawn from one or more approved experience rows | may reference multiple proof items and metrics |
| proof item | factual evidence unit such as scope, credential, tool ownership, or contextual claim | may support one or more stories or lanes |
| metric | numeric or measurable evidence unit | may attach to a story or stand as a separate proof item |

### Approval model

- stories are approved individually
- proof items are approved individually
- metrics are approved individually
- exclusion is preserved at the item level, not only at the page level
- `Continue to Role Discovery` confirms that the current verified profile is sufficient for `Role Discovery`

### Review levels and operational states

| Level | What the user is deciding | Allowed states | What happens downstream |
| --- | --- | --- | --- |
| story | whether the narrative unit is reusable and truthful | draft, approved, rejected, excluded | approved stories become eligible for role-fit and job-fit support |
| metric | whether the measurable evidence is trustworthy enough for reuse | approved exact, approved safe wording, excluded, rejected | exact metrics can support strong proof, safe-worded metrics can support softer claims |
| proof item | whether the factual evidence unit is reusable | approved, excluded, rejected | approved proof items feed fit and asset review; excluded items stay recoverable |
| profile readiness | whether the overall approved set is sufficient to continue | imported, conflict, verified | `Role Discovery` remains blocked until the profile reaches `Verified` |

### Reject versus exclude

- `Reject` means the suggestion is discarded and does not enter reusable truth
- `Exclude` means the item remains visible in the proof system with a reason, but is not eligible for fit or asset use

### Safe wording, operational definition

`Safe wording` means:

- removing unsupported exact numbers
- softening ownership claims that overstate contribution
- retaining truthful directional meaning
- keeping the wording reusable across roles and jobs
- preserving the claim category so the user still benefits from the evidence without pretending to have cleaner proof than exists

The system may suggest safe wording. The user approves or edits it.

### User edits versus system suggestions

The system may suggest:

- story summaries
- metric phrasing
- safe wording
- provenance grouping

The user controls:

- approval
- exclusion
- direct edits to summaries
- direct edits to safe wording
- recovery of excluded items

### Inspectable provenance

Every proof detail view must expose:

- originating experience rows
- imported wording or source reference
- confidence state
- user edits or user-added notes
- where the item is currently used

### Missing evidence handling

Missing evidence never silently blocks trust. It must be shown as:

- missing exact value
- missing source confirmation
- context-only support
- unsupported for current use

### Used, missing, and excluded logic

- `Used` means the item is approved and is currently supporting a role, lane, job review, or asset.
- `Missing` means the current role or job would benefit from evidence the user does not yet have approved.
- `Excluded` means the evidence exists in memory but is intentionally unavailable for fit or asset use.

These are operational states, not decorative badges.

### Operational meaning of `Continue to Role Discovery`

`Continue to Role Discovery` means all of the following are true:

1. at least two approved stories exist
2. at least two approved supporting proof items or metrics exist
3. any exact numeric claim needed for fit has either approved provenance or approved safe wording
4. no critical provenance issue remains on an item currently eligible for `Role Discovery`
5. the overall profile readiness state is `Verified`, not `Imported` or `Conflict`

### What the page is really doing

`P2` is the reusable-truth checkpoint. It is where the user decides what the product may safely believe, not where the product gets to flatter the user with polished outputs.

## 11. Role discovery and role lane contract

### Role candidate structure

Each role candidate must include:

- normalized role family
- suggested title set
- recommended category
- `Role fit` score and band
- `Lane opportunity` score and band
- supporting proof count
- conflict flags
- rationale summary

### Role lane structure

Each user-owned `Role Lane` must include:

- lane name
- recommended category
- included role titles
- active or inactive state
- supporting proof snapshot
- unresolved risk snapshot
- linked jobs count

### Similar-title grouping rule

Multiple titles may belong to one lane only when they share:

- the same functional mandate
- comparable seniority
- overlapping proof coverage
- a coherent search strategy

If titles differ materially in mandate or seniority, they become separate candidates.

### Recommended category

`Recommended category` is for grouping, reporting, and future filtering. It is not the user's primary lane label and it does not override user-owned naming.

### Lane naming rules

- the system suggests a default lane name from the strongest candidate cluster
- the user can accept, edit, or fully replace the lane name
- the lane name belongs to the user, not to the scoring model

### Free-tier lane rules

- the user can see multiple role candidates during `Role Discovery`
- on free tier, the user can create one active lane during activation
- after one lane exists, additional candidate rows may remain visible but a second `Create role lane` action is upgrade-gated
- upgrade gating for additional lanes appears only inside `Role Discovery` and the lane manager, never as ambient activation chrome
- the user may rename or replace the free-tier active lane without upgrading
- if the user replaces the free-tier active lane, the product warns about affected job associations before saving the change

### Role-fit rationale inspection

`Role fit` explanation must open in a drawer, not a tooltip.

Use tooltips only for:

- single-term definitions
- label explanations shorter than one sentence

Use the role-fit drawer for:

- weighted factor breakdown
- penalties
- supporting proof
- thin areas
- recommendation summary

### Lane opportunity separation

`Lane opportunity` remains separate from `Role fit`.

Use a side sheet for opportunity because it is secondary and comparative. It must never change the fit score.

### Deterministic role-fit model

#### Inputs

`Role fit` may use only:

- approved profile header and constraints
- approved experience rows
- approved stories
- approved proof items and metrics
- explicit user title preferences

#### Weights

| Factor | Weight |
| --- | --- |
| mandate and title-family alignment | 25 |
| capability evidence depth | 20 |
| story coverage | 20 |
| proof readiness | 15 |
| scope and seniority alignment | 10 |
| domain and environment adjacency | 5 |
| user pursue preference | 5 |

#### Penalties

| Penalty | Range | Trigger |
| --- | --- | --- |
| contradictory mandate | `-10` | approved experience contradicts the role's core mandate |
| thin-story | `-8` | fewer than two credible approved stories support the role |
| thin-proof | `-7` | proof exists but is mostly missing, excluded, or context-only |
| seniority mismatch | `-5` | role materially exceeds proven scope |
| transition-risk | `-5` | role depends on unsupported transition explanation |

### Lane opportunity model

`Lane opportunity` is separate from fit and may use:

- salary band or upside when trustworthy
- role-family job volume
- market-demand signal
- title breadth
- explicit user interest

It remains secondary to truth. It does not raise or lower `Role fit`.

### What the page is really doing

`P3` is not a recommendation theater screen. It is the first decision surface where the user turns verified truth into a user-owned search lane.

## 12. Jobs operating model

### Jobs route purpose

`Jobs` is the operational route for:

- first-job capture
- ongoing job capture
- shortlist and save behavior
- lane-aware organization
- list management
- movement into first review or an active workspace

### Jobs route mental model

`Jobs` is the operating surface for real job opportunities, not a second onboarding flow.

The route must make these things clear:

- adding a job is one action with two capture modes
- shortlist is a job state, not a separate workspace
- the primary lane controls fit interpretation and downstream review
- the sheet view is the default management view because density matters on desktop

### First-job intake versus ongoing intake

`J0` is the first-job intake state and also the launch pattern for later job intake. The interaction model is reused after the first job exists.

### Search and paste/link model

- the route exposes one dominant `Add a job` action
- that action opens a shared capture surface
- inside that surface, `Search` and `Paste/Link` are equal tabs
- neither search nor manual capture becomes a competing top-level homepage CTA
- the selected capture mode persists only within the capture sheet, not as a top-level route memory that distorts the rest of the jobs page

### Save and shortlist model

`Shortlist` is a status inside `Jobs`, not a separate route or object type.

User-facing shortlist or save labels may vary in copy pass, but operationally they remain part of the same jobs list model.

### `J0` versus `JL0`

- `J0` is the focused first-job intake state that opens inside the `Jobs` route when the user does not yet have an analyzable job.
- After the first saved job exists, the same capture mechanics remain reusable, but the route defaults to `JL0`, the management surface.
- The product does not create a separate long-term `First Job` route once the pattern is established.

### Board versus sheet behavior

- desktop default is full-width `Sheet`
- `Sheet` groups rows by primary role lane, with collapsible lane headers
- `Board` is status-first within the currently selected lane or current lane filter
- `Board` is a first-class toggle, not a hidden view
- if `All lanes` is selected, `Sheet` remains the recommended default because it is denser and clearer

### Sort, filter, and configure

`Jobs` must support:

- sort by updated date, fit, company, or status
- filter by lane, status, location, and capture source
- configure visible columns in sheet view
- remembered view preference after explicit change

### Lane assignment rules

- the system suggests a primary lane for a saved job based on approved lane coverage
- the user confirms or changes that lane before saving or in later review
- one job has one primary lane
- secondary role tags are analysis-only

### Lane change behavior

- before review, lane reassignment is inline
- after review has started, lane reassignment requires a warning modal
- changing the primary lane re-runs `Job fit`
- prior notes and saved job details are preserved
- if prior review acceptance or asset work becomes stale because of the new lane, the job is marked as needing re-review before send-adjacent work continues

### Full-width table rules

Full-width desktop tables are required for:

- `P1` experience review
- `JL0` sheet view

The goal is professional density, not decorative card stacks.

### Move into review and workspace

- the first saved analyzable job routes to `J1`
- later jobs with no review accepted also route to `J1`
- reviewed jobs route to `A0`
- active applications route to `W0`

### What the route is really doing

`Jobs` is where the user turns lane strategy into concrete opportunities. It is not a dashboard, and it is not a detached list of scraped postings.

## 13. First-job review, applications, and workspace contract

### Why `J1` exists

`J1` exists because the first saved job must not jump straight from capture into an active workspace.

The separate review state forces the user to inspect:

- the primary lane assignment
- parsed requirements
- `Job fit`
- proof usage
- first drafts
- explicit send boundary
- whether the chosen primary lane is actually the right lane for this job

### What is reviewed in `J1`

- job header and parsed basics
- must-have versus nice-to-have requirements
- matched, missing, and excluded proof
- `Job fit` score and breakdown
- first reviewable asset drafts
- blockers that require returning to `J0`, `P2`, or `P3`

### What cannot be skipped

The first job review cannot be skipped.

The user must explicitly accept the review state before the job becomes an active application.

### Review-before-send, operational definition

In `J1`, `Review before send` means:

- proof usage is visible
- unsupported claims stay out of active drafts
- asset drafts are reviewable, not silently final
- there is no send or apply action that bypasses review
- the user understands what evidence is carrying the draft and what evidence is still missing

### What belongs in `A0` and `W0` instead

`A0` owns:

- active application creation from review
- list-first status management
- opening the correct active application

`W0` owns:

- active asset work
- job-specific next actions
- ongoing rationale access
- job-specific notes
- lightweight company context and message history when relevant
- continued manual send preparation

`W0` does not re-run the whole first-review contract by default.

### What the first `Workspace` must help the user do immediately

Within a few seconds, `W0` must help the user:

- understand current job status
- open the active asset
- see the next manual action
- inspect fit or proof without leaving the workspace

### Default visibility versus side panel

Visible by default:

- job header
- status context
- active asset area
- next-action area

In the side panel or drawer:

- `Job fit` detail
- proof snapshot or proof detail
- lightweight company context or message-log detail

### Default `W0` layout contract

`W0` defaults to one main workspace plus one optional inspector:

- main workspace: asset area and next-action stack
- persistent page header: job identity, lane, current status
- optional inspector: fit, proof, requirement detail, lightweight company context, or lightweight message-log detail

The desktop artifact must not split `W0` into three equal columns.

### What the state is really doing

- `J1` is the last trust checkpoint before the job becomes active work.
- `A0` is the first active-management surface after review.
- `W0` is the first real operating surface where application work happens.

### Deterministic job-fit model

#### Inputs

`Job fit` may use only:

- one saved job
- parsed requirement groups
- the job's primary role lane
- approved stories, proof items, and metrics linked to that lane
- explicit user constraints and location preferences

#### Weights

| Factor | Weight |
| --- | --- |
| responsibility match | 25 |
| required skills and tools coverage | 20 |
| approved story coverage | 20 |
| proof readiness | 15 |
| scope and seniority alignment | 10 |
| constraints alignment | 5 |
| domain and context alignment | 5 |

#### Penalties

| Penalty | Range | Trigger |
| --- | --- | --- |
| must-have gap | `-15` | unsupported must-have requirement |
| thin-proof | `-8` | job depends on proof still missing or excluded |
| constraint conflict | `-8` | explicit user constraint conflict |
| lane mismatch | `-5` | saved under a weak primary lane |

## 14. Embedded proof and readiness for the first slice

### Build-now rule

The first slice does not ship a standalone `Proof Library` route or support surface.

Instead, reusable proof stays operational inside `Profile` through:

- the embedded `P2` verify-for-reuse mode
- the shared `P1/P2` history workspace inside one stable `Profile` shell
- the role table plus right-side detail drawer model
- the sticky readiness bar that owns `Continue to Role Discovery`
- proof detail drawers
- filtered views for `used`, `missing`, and `excluded`

### Why this is the correct first-slice model

The first slice needs trustworthy reuse without paying the complexity cost of another support surface.

Keeping proof and readiness inside `Profile` now:

- keeps the foundation workflow legible
- avoids route proliferation before the editor model is proven
- still preserves provenance, exclusions, safe wording, and reuse states

### Required build-now proof behavior

The embedded proof model must still support:

- mixed stories, metrics, and proof items in one table-first surface
- shared filters for `All`, `Stories`, `Metrics`, `Proof`, `Used`, `Missing`, and `Excluded`
- a detail drawer that exposes source wording, provenance, safe wording, current usage, and exclusion recovery
- recoverable exclusions that remain stored until explicitly reapproved

### Reserved-later naming rule

If later density proves that proof management needs its own reusable-truth surface again, the reserved title remains `Proof Library`.

That reserved-later title does not create a build-now route, nav item, or standalone page contract in this spec.

## 15. Sidebar, nav, account, and plan-state rules

### Sidebar behavior

- desktop uses a minimal persistent left sidebar
- default state is expanded during activation
- collapsed state is allowed after first-job value, but not required during early activation
- when collapsed, the sidebar retains icons, active-route state, and account trigger

### Primary nav

Primary nav items are:

- `Profile`
- `Jobs`
- `Applications`

Nothing else belongs in primary nav during this phase.

### What must never appear in primary nav

- `Settings`
- `Free tier`
- `Upgrade`
- `Proof`
- `Proof Library`
- `Dashboard`
- `Outreach`
- `Interview`
- `Research`

### Account area contents

The account area owns:

- avatar or initials
- user name
- plan label
- `Settings`
- account actions
- sign out

### Plan-state rules

- `Free tier` appears in the account menu and in explicit upgrade-gating moments only
- `Free tier` does not appear as ambient header chrome on `Profile`, `Jobs`, `Review`, `Applications`, or `Workspace`
- additional role-lane upgrade gating appears only after the first lane exists

### Banned internal-facing microcopy

The following are banned in product UI:

- `Activation in progress`
- `Activation complete`
- `Signed-in desktop`
- `extracted intel`
- `profile health` as the main value framing
- `search leverage`
- `lane discovery`
- `authority`
- `packet`
- `governance`

## 16. Guided onboarding / coachmark rules

### Chosen pattern

Use one anchored contextual guidance surface per state at most.

It may appear as:

- a quiet right-rail guidance card
- a guidance block inside a capture sheet
- a small boundary or rationale note adjacent to the decision area

Do not use:

- chained tours
- pulsing hotspots
- floating helper clutter
- generic product-tour overlays

### Appearance rules

| State | Guidance pattern | When it appears | What it says | What it must not say |
| --- | --- | --- | --- | --- |
| `P0` | right-rail payoff card | default, first visit | what setup unlocks, what the app needs, what carries forward | no internal product jargon, no role recommendations |
| `P1` | issue-resolution guidance | only when issues exist | what still needs cleanup and why | no parser theater |
| `P2` | proof-review guidance | first visit and when safe wording first appears | how approval, exclusion, and safe wording work | no hype about AI quality |
| `P3` | rationale guidance | when role candidates first load | why a role is being suggested and what still looks thin | no flattery language |
| `J0` | capture-mode guidance | when the job-entry sheet first opens | when to use `Search` versus `Paste/Link` | no forced path bias |
| `J1` | review-boundary guidance | first visit | what must be reviewed before work carries forward | no vague trust slogans |
| `A0` | application-manager guidance | first visit | what becomes active after review and what to open next | no CRM theater |
| `W0` | next-step guidance | only if next action is not obvious | what to do next for this application | no reselling of activation |

### Dismissal and reopen rules

- guidance is dismissible per state
- dismissed guidance does not reappear automatically in the same state
- guidance can be reopened from a small help or `Why this matters` trigger
- dismissal state persists across reload

### Why this pattern is correct

It gives the user one decision-adjacent explanation when needed, without turning the app into a guided tour or cluttered helper system.

## 17. Premium gating and deferred-functionality table

| Capability | Classification | Rule |
| --- | --- | --- |
| one active role lane | `must now` | free tier must support one active lane from activation onward |
| multiple role lanes | `must now` | architecture must support multiple lanes from day one, but additional active lanes can be upgrade-gated after the first lane is created |
| first-job search and manual capture | `must now` | both modes ship in the same `Jobs` capture flow |
| first-job review and first workspace | `must now` | explicit review boundary remains required |
| embedded proof states inside `Profile` | `must now` | unified truth stays visible and reusable without shipping a standalone `Proof Library` surface |
| lightweight company context in job review or workspace | `must now` | enough context to support job decisions may appear now |
| deeper research workflows | `should later` | richer company, market, and competitive research belongs after the first-slice activation path |
| lightweight message log | `must now` | minimum manual communication tracking belongs in first-slice application work |
| minimum CRM fields | `must now` | build now covers company, contact, status, next action, due date, reminder, notes, and lane context only |
| interview tracking | `should later` | later job-operations scope |
| Chrome extension capture | `should later` | must reuse the same saved-job model when it arrives |
| outreach | `future / out of current activation scope` | not part of activation authority |
| interview pack | `future / out of current activation scope` | not part of activation authority |
| dashboard or funnel performance views | `future / out of current activation scope` | not part of the activation center of gravity |
| gamified daily actions | `future / out of current activation scope` | not part of the current professional SaaS activation model |

## 18. Artifact framing contract

Chapter 05 artifacts no longer use per-screen side annotations as a default delivery pattern.

### What artifact framing may contain

- chapter eyebrow, title, and summary
- Foundation Series TOC
- one short run-level note about what the artifact is proving, outside the product window only

### What artifact framing must not contain

- per-screen side annotations
- stacked annotation bands above product windows
- long strategic essays
- alternate concepts
- implementation speculation
- generic prose explaining the whole product
- artifact self-reference inside the product window

### Why this contract exists

It preserves a clean full-canvas product presentation while keeping the Foundation Series shell outside the product UI.

## 19. Shell continuity rules for future Chapter 05 artifacts

Chapter 05 artifacts remain part of the Foundation Series and must stay continuous with the established shell.

### Container and background

- outer content width stays in the `1320px` to `1380px` range on desktop
- background stays in the dark premium series treatment with subtle gradient and restrained atmosphere
- product windows may vary in width, but the shell container does not

### Header rhythm

- shell uses the same premium chapter frame as Chapters 01 through 04
- eyebrow sits directly above the title with `10px` to `12px` breathing room
- title to summary spacing stays in the `16px` to `20px` range
- shell to first section spacing stays in the `24px` range
- section-to-section spacing stays stable and restrained

### TOC continuity

- the Foundation Series TOC remains visible
- Chapter 05 is active in the TOC
- other chapters remain present but visually secondary

### What can vary

- number of rendered screens in a section
- size of product windows
- presence of an open drawer, sheet, or modal
- local section introduction copy

### What must stay consistent

- dark premium shell treatment
- chapter header rhythm
- TOC structure
- restrained surface system
- clear separation between artifact framing and in-product UI

## 20. Unresolved conflicts and explicit carry-forward items for copy pass and later packet pass

### Conflicts now resolved in this spec

The following `FS6A3` failure modes are explicitly addressed here:

1. unclear page purpose, fixed through Sections 6 and 7
2. unclear per-page interaction model, fixed through Section 8
3. weak imported-experience editing authority, fixed through Section 9
4. weak stories/proof verification authority, fixed through Section 10
5. under-defined `Role Discovery` and lane-state rules, fixed through Section 11
6. under-defined `Jobs` operating model, fixed through Section 12
7. unclear `J1` to `A0` to `W0` handoff, fixed through Section 13
8. weak proof-governance contract, fixed through Section 14
9. weak plan-state and account behavior, fixed through Sections 15 and 17
10. vague guidance pattern, fixed through Section 16
11. unhelpful annotation model, fixed through Section 18

### Copy-pass items for `FS5S3C1`

The following are copy-dependent and may be refined later without reopening UX logic:

- final user-facing stage labels for `P0`, `P1`, `P2`, `J0`, and `J1`
- exact boundary microcopy in `J1`, `A0`, and `W0`
- exact plan-gating phrasing for additional role lanes
- account-menu supporting text, as long as internal-facing language remains banned

### Carry-forward items for the later packet pass

The next packet pass must translate this spec into:

- exact screen composition priorities
- exact render states and crops
- exact overlay-open states to show
- exact visual QA checkpoints

It does not need to invent:

- page purpose
- page JTBD
- review objects
- overlay ownership
- plan-state rules
- lane-state rules
- the relationship between `J1`, `A0`, and `W0`

### Remaining non-blocking ambiguity

No blocking UX architecture gap remains for the next packet pass.

The only intentional open items are:

- copy-pass refinement of certain stage labels
- later sequencing decisions for richer research and broader premium job-ops features

### `FS6A3` failure modes now blocked by this spec

The failed desktop artifact drifted because too much UX authority was implicit. This spec now blocks that drift by making these decisions explicit:

- first-screen purpose and dominant action are defined at the page-contract level
- imported experience review is defined as a hybrid table-plus-editor workspace, not a vague card stack
- `Stories + Proof` approval is defined as a reusable-truth checkpoint with operational states
- `Role Discovery` is defined as a post-foundation decision surface, not an early recommendation screen
- `Jobs` is defined as one operational route with shared capture mechanics, dense management, and explicit review handoff
- `J1`, `A0`, and `W0` are separated by purpose, reviewed objects, and layout contract
- embedded proof and readiness verification are defined as a reusable truth system inside `Profile`, not a decorative archive or extra route
- overlays now have explicit ownership so later passes do not invent drawers, sheets, or modals ad hoc
- annotation and shell rules now prevent Chapter 05 artifacts from degrading into a strategy poster or state gallery

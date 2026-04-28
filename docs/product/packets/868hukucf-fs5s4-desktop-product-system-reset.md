# Packet 868hukucf FS5S4, Desktop Product System Reset

Task: [DESIGN: Canonical Job Filter brand system and activation design lock](https://app.clickup.com/t/868hukucf)  
Pass label: `FS5S4`  
Status: desktop product-model reset authority before the next final desktop build  
Primary output: `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/docs/product/packets/868hukucf-fs5s4-desktop-product-system-reset.md`

This packet converts the latest lead-thread QA direction and user feedback into one new desktop signed-in product authority.

It is intentionally narrower than a full chapter rewrite and intentionally stronger than another composition tweak.

It supersedes the current Chapter 05 packet stack only where it explicitly reopens:

- top-level signed-in IA
- workspace ownership
- job-feed / saved / review / applications structure
- the ownership and placement of `Proof Library`
- the ownership and placement of asset work
- desktop artifact presentation rules for the next final build

It does not reopen:

- truth-first trust architecture
- no-auto-apply boundary
- role-fit, lane-opportunity, and job-fit separation
- one-primary-lane-per-job rule
- deterministic scoring inputs
- free-tier lane gating principles

## Objective

Reset the Chapter 05 desktop signed-in product model so the next final-build artifact is designed as one coherent operating product, not as a staged activation gallery.

## Preserved truths

The following truths remain binding from the current Chapter 05 source stack.

| Preserved truth | Why it stays locked |
| --- | --- |
| primary user is an experienced operator with a high trust threshold | the product is still for serious job seekers who will do focused setup if it creates leverage |
| setup must create reusable leverage, not admin burden | this remains the core Chapter 01 and 05 product thesis |
| no auto-apply and no hidden send behavior | trust architecture remains unchanged |
| review-before-send stays explicit | every job-specific output still needs visible review |
| `Role Discovery`, `Role Lane`, `Role fit`, `Job fit`, and `Lane opportunity` remain distinct concepts | the product still needs inspectable reasoning, not a blended black-box score |
| stories, proof items, and metrics remain distinct objects | the truth system still needs structural clarity |
| one job belongs to one primary role lane | lane ownership remains singular at the workflow level |
| `Search jobs` and `Paste or link` remain equal paths inside one add-job flow | `Jobs` still owns both launch capture modes |
| `Proof Library` remains the name of the unified reusable truth surface | the object and its trust role stay intact even if route ownership changes |
| `Used`, `Missing`, and `Excluded` remain operational states, not decorative badges | the trust system still needs explicit statefulness |
| lightweight company context may support job work | contextual research can appear, but it remains subordinate to the core workflow |
| `Free tier` remains the entry model, with one active lane and explicit upgrade moments for more | monetization framing stays tied to leverage, not ambient chrome |

## Reopened decisions

The following decisions are deliberately reopened by the latest QA verdict and hard directions in this pass.

| Reopened decision | Prior direction | New authority in this packet | Why it changes now |
| --- | --- | --- | --- |
| top-level signed-in IA | `Profile`, `Jobs`, `Proof`, `Settings` | `Profile`, `Jobs`, `Applications`, with `Settings` in account | the next desktop build must match a real operating model from setup through application management |
| `Proof` ownership | top-level primary-nav route | move `Proof Library` inside `Profile Workspace`, with deep-link support and cross-entry from review/workspace | proof is reusable truth management, but it is foundational and should not compete with the daily operating routes |
| `Assets` ownership | evidence in older artifact as top-level route | move asset work inside `Workspace` under active application context | assets without job context weaken review, traceability, and next-action clarity |
| `Approve your proof` as a full-page artifact screen | separate major desktop screen | fold into the `Profile Workspace` workflow as the proof-review phase between history and role lanes | separate full-page treatment is one of the state-gallery patterns the reset is meant to remove |
| `Saved`, `Review`, and `Applications` relationship | implied or fragmented across prior packets and artifacts | `Saved` becomes a Jobs subview, `Review` becomes a required transition state, `Applications` becomes the active-management route | the product now needs a clear full journey through application management, not only first-job handoff |
| artifact framing | side annotations and browser-window specimens | Foundation Series shell stays, but the product must render as full-canvas desktop authority | latest QA direction explicitly rejects low-value annotations and tiny browser framing |
| signed-in visual direction | mixed light specimen framing | dark signed-in product direction is default for the next build | this better matches the premium, high-control operating surface the product needs |
| early first-screen copy | current D1 copy packet wording treated as stable | D1 copy direction is reopened at the headline/support level, while trust boundaries stay intact | the next build should not preserve weak D1 framing only because it was previously approved |

## Persona + JTBD

### Target persona

Job Filter v1 is for an experienced operator, builder, or functional leader who:

- runs a thoughtful, often multi-lane search
- has enough real experience to support several adjacent roles
- wants fewer, better-fit opportunities instead of maximum volume
- will do setup work if it compounds across jobs
- will not trust unsupported drafts, hidden automation, or vague fit claims

### Core JTBD

1. When I start a search, help me turn messy experience into reusable truth I can trust later.
2. When I evaluate jobs, help me separate interesting opportunities from jobs worth actually working.
3. When I begin an application, keep the draft, the supporting proof, the fit rationale, and the next manual action in one place.
4. When evidence is thin or missing, make that explicit instead of smoothing it over.

### Entry tension to design for

The user is not asking for a wizard. The user is asking for a system that makes better decisions and saves time later.

That means the product must create this belief:

`If I do the foundation work once, the app will help me run a cleaner, more defensible search across real applications.`

## Journey map

| Journey stage | Route owner | User goal | Required product output | Exit object |
| --- | --- | --- | --- | --- |
| start foundation | `Profile` | choose the fastest trustworthy path into the product | source attached or manual path started | owned profile foundation |
| normalize history | `Profile` | confirm factual work history and context | approved experience records and resolved or deferred gaps | usable profile truth |
| review stories and proof | `Profile` | decide what can be safely reused | approved stories, proof items, metrics, and explicit exclusions | reusable truth set |
| create first role lane | `Profile` | choose one search direction from approved truth | one saved active lane | active role lane |
| discover jobs | `Jobs` | search in-app or add a known posting | feed results or a captured job lead | candidate job lead |
| save a job | `Jobs` | keep one job in the system with a primary lane | saved job with parsed details and lane assignment | saved job |
| review before work | `Review` | inspect fit, supporting proof, and draft language | accepted review state or deferred saved job | application-ready job |
| promote to application | `Applications` | move a reviewed job into active management | application record with status and workspace entry | active application |
| work the application | `Workspace` | update assets, notes, and next actions | active-work session with explicit next step | ongoing application state |

## Domain model

### Core entities

| Entity | Exact definition | Owned by | Used by downstream surfaces |
| --- | --- | --- | --- |
| `Profile` | the user-owned foundation record for reusable search truth | `Profile Workspace` | roles, jobs, review, applications |
| `Experience Record` | one factual work-history row with one-value-per-field structure and provenance | `Profile Workspace` | story creation, proof creation, fit models |
| `Story` | one reusable narrative unit drawn from one or more approved experience records and backed by proof or metrics | `Profile Workspace` | role fit, job fit, draft suggestions, later interview support |
| `Proof Item` | one factual evidence unit such as scope, ownership, credential, tool depth, or contextual claim | `Profile Workspace` | story support, fit rationale, review, workspace snapshots |
| `Metric` | one measurable evidence unit that can remain exact or be approved with safe wording | `Profile Workspace` | story support, fit, draft evidence, review |
| `Gap` | one explicit missing, unresolved, or unsupported dependency the user still needs to address or accept | `Profile Workspace`, `Review` | history cleanup, proof review, job review |
| `Role Lane` | one user-owned search direction that can group multiple similar titles | `Profile Workspace` | jobs feed, saved jobs, fit interpretation, application organization |
| `Job Lead` | one external opportunity before it becomes a saved record | `Jobs` | job capture |
| `Saved Job` | one saved opportunity with parsed basics, lane assignment, and review readiness | `Jobs` | saved queue, review |
| `Review Snapshot` | the explicit trust checkpoint for one saved job, including fit, proof usage, and draft readiness | `Review` | application promotion |
| `Application` | one job the user has chosen to actively work and track | `Applications` | application manager, workspace |
| `Asset` | one job-specific output, such as resume, cover letter, or answer draft, owned by an application | `Workspace` | active work, send preparation |
| `Workspace Note` | one user-authored note or decision artifact tied to an application | `Workspace` | application memory and next-step continuity |

### Relationships

1. A `Profile` contains many `Experience Records`.
2. `Stories`, `Proof Items`, and `Metrics` are derived from approved profile truth, but remain separate objects.
3. A `Story` may reference many `Proof Items` and many `Metrics`.
4. A `Gap` may attach to an `Experience Record`, `Story`, `Proof Item`, `Metric`, `Role Lane`, or `Saved Job`.
5. A `Role Lane` uses approved stories, proof items, metrics, and explicit user preferences.
6. A `Saved Job` belongs to one primary `Role Lane`.
7. A `Review Snapshot` belongs to one `Saved Job`.
8. An accepted `Review Snapshot` promotes a `Saved Job` into one `Application`.
9. An `Application` owns many `Assets`, many `Workspace Notes`, and one active `Workspace`.

### Scoring model

#### Role scoring

Role scoring remains deterministic and inspectable.

- `Role fit` stays the primary lane-readiness score.
- `Lane opportunity` stays separate and never modifies `Role fit`.

`Role fit` inputs and weights remain preserved:

| Factor | Weight |
| --- | --- |
| mandate and title-family alignment | 25 |
| capability evidence depth | 20 |
| story coverage | 20 |
| proof readiness | 15 |
| scope and seniority alignment | 10 |
| domain and environment adjacency | 5 |
| user pursue preference | 5 |

#### Job scoring

Job scoring also remains deterministic and inspectable.

- `Job fit` stays lane-specific and job-specific.
- it may use only the saved job, its primary lane, approved profile truth, explicit constraints, and parsed requirement groups.

`Job fit` inputs and weights remain preserved:

| Factor | Weight |
| --- | --- |
| responsibility match | 25 |
| required skills and tools coverage | 20 |
| approved story coverage | 20 |
| proof readiness | 15 |
| scope and seniority alignment | 10 |
| constraints alignment | 5 |
| domain and context alignment | 5 |

## IA recommendation

### Direct answers to the reopened questions

| Question | Decision |
| --- | --- |
| Should `Proof` stay top-level, or move inside `Profile Workspace`? | Move it inside `Profile Workspace`. Keep `Proof Library` as the name of the reusable truth surface, but not as a primary-nav item in v1. |
| Should `Assets` stay top-level, or live inside `Job/Application Workspace`? | Move asset work inside `Workspace`. Asset generation and refinement should never be detached from the job or application context. |
| Should `Approve your proof` remain a separate page, or be folded into the profile workflow? | Fold it into the `Profile Workspace` workflow as the proof-review phase between history review and role-lane creation. |
| What is a `Story`, exactly, and how is it used downstream? | A `Story` is a reusable narrative unit supported by approved proof and optionally metrics. It supports `Role fit`, `Job fit`, review surfaces, and draft suggestions. |
| Is `Excluded` user-visible, system-only, or removed? | User-visible and reversible, but only where trust or recovery matters. It stays out of ambient chrome and score summaries. |

### Recommended v1 IA

#### Primary nav

1. `Profile`
2. `Jobs`
3. `Applications`

#### Account menu

- user identity
- `Free tier`
- `Settings`
- `See plans`
- `Sign out`

#### Route model

| Surface | Route role | Why it exists |
| --- | --- | --- |
| `Profile` | top-level workspace | foundation truth, proof review, and role-lane creation all belong here |
| `Jobs` | top-level workspace | job discovery, capture, save, and queue management belong here |
| `Saved` | `Jobs` subview | saved opportunities need their own dense queue, but not their own primary route |
| `Review` | dedicated child surface | review-before-work is important enough to be its own full-canvas state, but not a top-level nav item |
| `Applications` | top-level workspace | active pursued jobs need a real management route after review |
| `Workspace` | child surface of `Applications` | active application work, notes, assets, fit, and next actions belong here |

### Exact IA recommendation

| Route label | Route type | Primary objects | Must include |
| --- | --- | --- | --- |
| `Profile` | primary route | profile foundation, proof, stories, lanes | local section nav for `Foundation`, `History`, `Proof`, `Roles` |
| `Jobs` | primary route | feeds, manual capture, saved jobs | `Feed` view and `Saved` view inside one route |
| `Review` | child route from `Jobs` | one saved job, fit, proof usage, draft review | explicit accept-or-defer boundary |
| `Applications` | primary route | active applications, statuses, next actions | list-first manager plus entry into workspace |
| `Workspace` | child route from `Applications` | one application, assets, notes, next action | main work canvas plus supporting side panel |

### IA rules

- `Saved` is not a top-level nav item.
- `Review` is not a top-level nav item.
- `Proof` is not a top-level nav item in the next desktop build.
- `Assets` is not a top-level nav item in the next desktop build.
- `Workspace` is never shown as a peer to `Profile`, `Jobs`, and `Applications`.

## Workspace strategy

### `Profile Workspace`

`Profile` becomes one continuous workspace with four local phases:

1. foundation start
2. history review
3. proof review
4. role-lane creation

This removes the feeling of disconnected onboarding screens while preserving sequence.

### `Jobs Workspace`

`Jobs` becomes the opportunity operating surface with two persistent modes:

- `Feed`
- `Saved`

`Feed` is for discovery and capture.  
`Saved` is for lane-grouped queue management.

Both modes live inside one route with one shared `Add a job` entry action.

### `Review Surface`

`Review` becomes a dedicated, full-canvas child surface entered from a saved job.

Its job is to decide:

- is the lane right?
- is the job worth active work?
- what proof supports it?
- what is still missing or excluded?
- is the first draft direction acceptable enough to promote into applications?

### `Applications Workspace`

`Applications` becomes the active management route after the user commits to a job.

It owns:

- application statuses
- active application list
- next-action visibility
- entry into `Workspace`

### `Workspace`

`Workspace` is the detail surface for one active application.

It owns:

- active asset area
- notes
- next manual action
- fit snapshot
- proof snapshot
- lightweight company context

`Assets` does not exist as a separate primary route because asset work is only meaningful here.

## Screen inventory and required states

The next final desktop build must stop behaving like a nine-frame state gallery and instead render the signed-in product as a set of full-canvas authority surfaces.

### Mandatory primary screens

| Screen ID | Surface | Required render state | Why it must exist |
| --- | --- | --- | --- |
| `S1` | `Profile Workspace`, foundation start | source chooser visible, payoff-first framing, no role or draft preview | proves the new first product moment |
| `S2` | `Profile Workspace`, history review | selected-row state, editor open, one explicit gap visible | proves the factual checkpoint and edit model |
| `S3` | `Profile Workspace`, proof review | approved, missing, and excluded truth visible; safe wording active; proof detail drawer open | proves proof review inside Profile, not as a detached route |
| `S4` | `Profile Workspace`, role-lane creation | one active candidate, role-fit drawer open, lane naming visible, extra-lane gate present but secondary | proves role discovery as the end of Profile workflow |
| `S5` | `Jobs`, feed and intake | `Add a job` visible at route level, capture sheet open, `Search jobs` active, `Paste or link` visible | proves discovery plus one equal-path intake flow |
| `S6` | `Jobs`, saved queue | lane-grouped saved jobs list, selected saved job, feed-to-saved continuity visible | proves `Saved` as a Jobs subview, not a new route |
| `S7` | `Review` | job-fit detail open, proof usage visible, draft review visible, promote-to-application action present | proves the mandatory transition state |
| `S8` | `Applications` | active applications manager with status grouping and selected application summary | proves application management as a real route after review |
| `S9` | `Workspace` | active asset open, notes visible, next action visible, fit and proof snapshots visible | proves asset work inside the application workspace |

### Mandatory support renders

| Support render | Required state |
| --- | --- |
| account menu | open, with `Free tier` visible only there |
| sidebar control | visible collapse/expand affordance in the shell |
| role-fit drawer | open from `S4` |
| proof detail drawer | open from `S3` or `S9` |
| lane-change warning modal | visible from saved or application reassignment flow |
| job-fit drawer | open from `S7` |

### Mandatory edit surfaces

| Edit surface | Must support |
| --- | --- |
| history row editor | add, edit, archive, provenance visibility, gap resolution |
| proof review table | approve, exclude, safe wording, see source, use again |
| lane creation surface | lane naming, recommended category visibility, extra-lane gating |
| add-job capture sheet | `Search jobs`, `Paste or link`, parsed summary, primary lane assignment, `Save job` |
| review surface | lane change, proof inspection, fit inspection, draft acceptance or deferral |
| application workspace | active asset editing, notes, next-step progression |

## Interaction contracts

### Edit / enrich / approve model for history, proof, stories, metrics, and gaps

| Object | User can edit | User can enrich | User can approve | User can exclude | User can defer | Downstream effect |
| --- | --- | --- | --- | --- | --- | --- |
| `Experience Record` | title, company, dates, location, work mode, mandate, responsibilities, tools, KPIs, outcomes | missing context, transition notes, provenance confirmation | yes, through history confirmation | no | non-critical gaps only | unlocks story/proof extraction |
| `Story` | summary, supporting framing, safe wording | add linked proof, add linked metrics | yes | yes | yes if not needed for threshold | supports role fit, job fit, drafts |
| `Proof Item` | wording, source note, ownership clarification | add provenance, attach supporting record | yes | yes | yes if non-critical | supports stories, fit, and review |
| `Metric` | exact wording or safe wording | add source, add context | yes, exact or safe-worded | yes | yes if non-critical | supports stronger or softer claims |
| `Gap` | label, resolution note, priority | add context, add follow-up note | resolved rather than approved | no | yes if safe | remains visible where trust depends on it |

### Role and job scoring contract

- `Role fit` is shown only after proof review reaches threshold.
- `Lane opportunity` remains secondary, comparative, and non-controlling.
- `Job fit` is shown only after a job is saved with a primary lane.
- no score may appear without a visible explanation trigger.
- score summaries must show top drivers and top gaps, not only a band or number.

### Job-feed / saved-jobs / review model

#### Feed

- `Jobs` defaults to `Feed` until the user saves at least one job.
- the dominant action is always route-level `Add a job`
- feed rows show lane relevance, source, and save affordance
- paste/link is not a fallback route, it is an equal capture tab inside the add-job sheet

#### Saved

- saving a job creates a `Saved Job`
- `Saved` lives inside `Jobs`
- saved jobs are grouped by primary lane
- shortlist is a status inside saved jobs, not a separate route

#### Review

- selecting a saved job to move forward enters `Review`
- `Review` is mandatory before active application work
- review can result in:
  - promote to application
  - edit job and return
  - change lane and re-review
  - defer back to saved

#### Applications

- once promoted, the record becomes an `Application`
- `Applications` owns active statuses such as `Preparing`, `Applied`, `Interviewing`, `On hold`, `Closed`
- `Applications` is the application-management route, not the discovery route

### `Excluded` contract

`Excluded` stays user-visible because trust depends on recoverability.

Rules:

- show `Excluded` in proof review, proof detail, review, and workspace snapshots when it materially affects current work
- do not surface `Excluded` as a hero KPI or route-level chrome
- recovery remains explicit through `Use again`

## Copy-direction deltas

This packet does not rewrite the whole copy system. It changes only the wording direction needed to support the reset product model.

### Preserve

- `Role Discovery`
- `Role Lane`
- `Role fit`
- `Job fit`
- `Lane opportunity`
- `Add a job`
- `Review before work`
- `Review proof`
- `Free tier`

### Change direction for the next desktop build

| Surface | Current copy direction | New direction |
| --- | --- | --- |
| first `Profile` moment | D1 leads too heavily with source mechanics | headline and support must lead with reusable leverage first, source choice second |
| proof surface | `Approve your proof` treated like a standalone stage screen | proof review becomes a local `Profile` workspace phase with stronger “what the app can use” framing |
| primary nav | `Proof` treated as a peer to daily operating routes | `Proof` leaves primary nav in v1; proof work is entered through `Profile` and contextual drawers |
| active-work route | `Job Workspace` treated as the post-review detail page | workspace language remains work-oriented, but the product model now sits under `Applications` |
| asset ownership | artifacts can imply asset work is its own route | asset language must stay nested inside workspace context |

### New route labels to introduce

- `Applications` as a primary route label
- `Saved` as a `Jobs` subview label
- `Feed` as a `Jobs` subview label

### Explicit non-goals for copy in the next build

- do not revive `Assets` as a top-level nav label
- do not revive `Proof` as a top-level nav label
- do not use fake user names such as `Alen Sultanic`
- do not preserve weak D1 copy merely because it existed in the current packet stack

## Artifact presentation rules

The next desktop artifact must present the product as a full-canvas signed-in authority surface.

### Binding rules

1. Keep the Foundation Series shell, but let the product consume the visual center of gravity.
2. Do not use left-side explanatory annotations.
3. Do not use small browser-window specimen framing.
4. Default to dark signed-in product direction inside the app.
5. Show a visible sidebar collapse/expand control in the shell model.
6. Use one neutral placeholder identity, or no user identity, inside the product. Do not use `Alen Sultanic`.
7. Keep `Free tier` inside the account menu and explicit upgrade moments only.
8. Show the product as a connected system, not as isolated route specimens.

### Presentation model for the next build

- full-canvas desktop frames inside the lawful Foundation Series shell
- one main canvas per primary surface
- open support surfaces shown only where they prove trust or workflow ownership
- dark app shell, restrained surface hierarchy, table-first density where operational work requires it
- no low-value annotation blocks, no ambient explanatory prose inside the product

## Acceptance criteria

This reset packet is complete only if all of the following are true:

1. It explicitly answers every reopened IA and workspace question in this pass.
2. It clearly separates preserved truths from reopened decisions.
3. It defines one coherent journey from profile setup through application management.
4. It defines the domain entities and downstream object relationships without ambiguity.
5. It gives the next desktop artifact pass a clear v1 IA for `Profile`, `Jobs`, `Saved`, `Review`, `Applications`, and `Workspace`.
6. It defines mandatory primary screens, support renders, and edit surfaces for the next build.
7. It makes `Proof` and `Assets` ownership unambiguous.
8. It keeps trust logic, scoring logic, and no-auto-apply intact.
9. It prevents the next artifact from falling back into a side-annotated browser-window gallery.

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| moving `Proof` out of primary nav could hide reusable truth if done lazily | proof is still important, even if it is no longer top-level | require `Profile` local nav plus contextual entry from review and workspace |
| adding `Applications` could overcomplicate the first slice | the first desktop build still needs to stay lean | keep `Applications` list-first and status-light, not CRM-heavy |
| folding proof review into `Profile` could blur the review boundary | the proof stage still needs strong presence | keep it as a distinct local phase with its own dense review surface |
| moving assets into workspace could make draft work feel too buried | active work still needs fast access | make `Workspace` the post-review destination and keep asset tabs first-class there |

## Exact next step for the following artifact rebuild

Run one final desktop artifact pass against:

1. [`05-activation-and-core-app.md`](../foundation-series/05-activation-and-core-app.md)
2. [`05-activation-architecture-spec.md`](../foundation-series/05-activation-architecture-spec.md)
3. [`868hukucf-fs5s3c1-activation-copy-system.md`](./868hukucf-fs5s3c1-activation-copy-system.md)
4. [`868hukucf-fs6p2-desktop-rebuild-packet.md`](./868hukucf-fs6p2-desktop-rebuild-packet.md)
5. [`868hukucf-fs6p3-desktop-composition-component-contract.md`](./868hukucf-fs6p3-desktop-composition-component-contract.md)
6. this packet, [`868hukucf-fs5s4-desktop-product-system-reset.md`](./868hukucf-fs5s4-desktop-product-system-reset.md)
7. [`868hukucf-activation-delivery-sow.md`](./868hukucf-activation-delivery-sow.md)

Target artifact for that next pass:

- `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/artifacts/figma/redesign-lock/10-activation-desktop.html`

That rebuild must:

- use the new primary IA of `Profile`, `Jobs`, and `Applications`
- move `Proof Library` into `Profile Workspace`
- move asset work into `Workspace`
- treat `Saved` as a Jobs subview and `Review` as the promotion boundary into applications
- render the product as full-canvas dark desktop authority with a visible sidebar toggle
- avoid side annotations and browser-window specimen framing

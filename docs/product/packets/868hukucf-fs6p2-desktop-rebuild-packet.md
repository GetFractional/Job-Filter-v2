# Packet 868hukucf FS6P2, Desktop Activation Rebuild Packet

Task: [DESIGN: Canonical Job Filter brand system and activation design lock](https://app.clickup.com/t/868hukucf)  
Pass label: `FS6P2`  
Status: rebuild-ready bridge packet, synchronized to the FS5S4 desktop product-model reset  
Primary lane: Chapter 05 desktop activation authority  
Primary output: `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/artifacts/figma/redesign-lock/10-activation-desktop.html`

## 1. Rebuild objective

Rebuild the Chapter 05 desktop activation artifact so it functions as a professional, modern, build-ready desktop authority for the signed-in Job Filter experience after the Chapter 05 reset.

This rebuild must translate the updated Chapter 05 source chapter and architecture spec into a real desktop product surface that shows:

- `Profile` as the reusable foundation workspace
- `Approve your proof` as a `Profile` phase before `Role Discovery`
- `Jobs` as the place where search and manual capture both live
- `Applications` as the active-management route after review
- one clean path from approved truth to saved jobs, review, and active application work
- a denser, more professional app shell with less bloat

This rebuild is not allowed to drift back into:

- wizard-heavy composition
- oversized rounded card stacks
- artifact narration inside product windows
- premature role recommendation
- search-only or manual-only job entry
- decorative trust chrome

## 2. Current-state problems in the existing desktop artifact

The current [06-activation-desktop.html](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/artifacts/figma/redesign-lock/06-activation-desktop.html) should be treated as evidence of what needs to be corrected, not as layout authority.

### Known current-state problems

1. The visual system is too bloated, with oversized radii and card-heavy composition.
2. The repeated top step rail still makes the app feel like a chunky wizard instead of a progressive workspace.
3. The current artifact recommends or compares roles too early relative to the new Chapter 05 source authority.
4. The current artifact still spends too much energy on structural explanation instead of product-native surface design.
5. `Jobs` is not yet clearly framed as both a search surface and a manual capture surface.
6. The current artifact does not yet feel like a high-density, professional SaaS tool comparable to strong operational products.

### Source conflicts the rebuild must explicitly resolve

| Conflict | Why it matters | Required fix in rebuild |
| --- | --- | --- |
| old lane-first sequence | now conflicts with the approved source chapter | show `Stories + Proof` before `Role Discovery` |
| repeated step-rail model | makes the app feel bloated and wizard-heavy | use local section progress inside `Profile`, not a chunky repeated step rail |
| broad persistent-preview reading | preview appeared too early and too often | use staged preview, with meaningful review only when job context exists |
| giant rounded cards | wastes space and cheapens density | use restrained radius, subtle dividers, and row-first layouts |
| `Jobs` as a vague supporting route | under-specifies search and manual capture | make job search and paste/link capture explicit in `Jobs` |
| top-level `Proof` nav | now conflicts with the reset route model | keep `Proof Library` under `Profile` ownership and out of primary nav |
| post-review direct `Job Workspace` model | now conflicts with the active-management route model | show `Review` handing into `Applications`, then `Workspace` |

## 3. Target-state definition

The rebuilt artifact should feel like a serious, high-performance signed-in SaaS product, not a governance board or stitched-together state gallery.

It must show one connected product where:

- `Profile` is the center of gravity during incomplete activation
- `Jobs` is the first real operating route after a role lane exists
- `Proof Library` is reusable and inspectable under `Profile` ownership
- `Approve your proof` creates the foundation for `Role Discovery`
- `Role Discovery` creates user-owned `Role Lanes`
- `Jobs` supports both search and manual capture at launch
- `Review` is the explicit boundary into `Applications`
- `Workspace` feels like a credible child surface under `Applications`

### Emotional target

The user should feel:

- "I know what I should do first."
- "This is helping me structure real truth, not fill out a bloated app."
- "The product is recommending roles only after it actually understands me."
- "I can search, save, review, and work applications without leaving the system."

### Operational target

The rebuild should make these behaviors obvious:

- import or manually start profile foundation work
- confirm experience cleanly
- approve proof before role recommendations appear
- create at least one role lane
- add the first job through search or paste/link capture
- review job-specific outputs before promoting a job into active application work

## 4. Exact desktop screens and states to show

The later desktop artifact pass must show the following state set.

| Screen ID | Screen name | Why it must be shown |
| --- | --- | --- |
| `D1` | `Profile` start and source capture | proves the first signed-in moment and the one dominant first action |
| `D2` | `Profile` experience normalization | proves that history is structured before recommendation |
| `D3` | `Profile` proof review | proves review, approval, exclusion, provenance, and safe wording inside `Profile` |
| `D4` | `Profile` role discovery | proves role recommendation after approved truth and role-lane creation |
| `D5` | `Jobs` feed and first-job entry | proves one `Add a job` action with equal `Search jobs` and `Paste or link` capture paths |
| `D6` | `Jobs` saved queue | proves lane-grouped saved-job management inside `Jobs` |
| `D7` | `Review` | proves `Job fit`, used/missing/excluded, and review-before-send before active work |
| `D8` | `Applications` | proves active application management after review |
| `D9` | `Workspace` | proves asset work, notes, next actions, and contextual proof/fit inside the child work surface |

### Guided-assist pattern for `D1` through `D9`

The rebuild must use one consistent guided-assist pattern instead of helper-card clutter.

Rules:

- use at most one primary guidance surface per screen
- place guidance adjacent to the current decision or in the right rail
- keep guidance short, dismissible, and reopenable
- do not use chained tours, pulsing hotspots, or floating governance prose

| Screen | Guidance pattern | Placement | Job of the guidance |
| --- | --- | --- | --- |
| `D1` | foundation payoff rail | right rail | explain what the profile foundation unlocks |
| `D2` | normalization assist | inline or right rail | explain what still needs to be cleaned up |
| `D3` | proof-review assist | right rail | explain approval, safe wording, and exclusion logic |
| `D4` | role-discovery rationale nudge | beside the active role cluster or drawer trigger | explain why a role direction is being suggested |
| `D5` | job-entry assist | inside the capture sheet | explain `Search` vs `Paste/Link` and minimum job context |
| `D6` | jobs-view guidance | top utility bar or right rail | explain board vs sheet and lane organization |
| `D7` | review-boundary assist | beside review controls | explain proof usage and review-before-send |
| `D8` | applications-manager guidance | utility row or selected-summary area | explain what became active after review and what to open next |
| `D9` | next-step coachmark | side panel | explain the next useful application action without reselling activation |

## 5. Exact module stack for each screen

### `D1` Profile start and source capture

Required module stack, top to bottom:

1. persistent app shell with minimal sidebar
2. profile section progress
3. left focal workspace:
   - state title
   - one dominant primary CTA
   - import choices
4. right payoff rail:
   - `What this foundation unlocks`
   - `What the app needs from you`
   - `What carries into your first job`

### `D2` Profile experience normalization

Required module stack:

1. persistent app shell
2. profile section progress
3. experience table or row list
4. selected-row detail editor
5. issue drawer trigger or inline issue panel
6. right guidance rail

### `D3` Profile stories + proof

Required module stack:

1. persistent app shell
2. profile section progress
3. story list with approval controls
4. proof and metrics table or grouped rows
5. proof detail trigger
6. safe wording state
7. exclusion recovery state
8. right guidance rail

### `D4` Profile role discovery

Required module stack:

1. persistent app shell
2. profile section progress
3. role comparison table or dense cluster list
4. `Role fit` breakdown trigger
5. separate `Lane opportunity` trigger or snapshot
6. create-role-lane surface
7. right rationale rail

### `D5` Jobs first-job entry

Required module stack:

1. persistent app shell
2. jobs route header
3. one `Add a job` action
4. capture sheet or modal with equal entry tabs:
   - `Search`
   - `Paste/Link`
5. parsed job summary
6. lane assignment surface

### `D6` Jobs list

Required module stack:

1. persistent app shell
2. jobs route header
3. view toggle:
   - `Sheet`
   - `Board`
4. sort controls
5. filter controls
6. configurable visible fields
7. job list by primary role lane
8. selected-job summary or compact inspector

### `D7` First-job review

Required module stack:

1. persistent app shell
2. job header
3. requirements panel
4. first asset review surface
5. `Job fit` summary
6. `Job fit` breakdown trigger
7. `Used`, `Missing`, `Excluded` state
8. review-before-send controls

### `D8` Applications

Required module stack:

1. persistent app shell
2. applications route header
3. status-grouped applications manager
4. selected-application summary
5. clear entry into `Workspace`

### `D9` Workspace

Required module stack:

1. persistent app shell
2. application header
3. active asset area
4. notes area
5. next-action panel
6. fit snapshot
7. proof snapshot

## 6. Exact hierarchy and focal area per screen

| Screen | Primary focal area | Secondary focal area | What must visually recede |
| --- | --- | --- | --- |
| `D1` | import/start action | payoff rail | supporting nav and metadata |
| `D2` | experience rows and editor | issue handling | ambient route context |
| `D3` | proof approval and story review | provenance details | decorative status surfaces |
| `D4` | role comparison and lane creation | rationale drawer | supporting route context |
| `D5` | add-first-job capture flow | parsed job summary | anything unrelated to the first saved job |
| `D6` | jobs table or board | selected-job summary | oversized empty-state chrome |
| `D7` | reviewable output and requirement matching | fit drawer and proof usage | route chrome |
| `D8` | active applications manager | selected application summary | activation progress framing |
| `D9` | application-specific execution surface | supporting side panel | oversized card framing |

## 7. Exact inside-window vs outside-window content rules

Inside product windows:

- final-feeling product labels and microcopy only
- realistic UI states
- no artifact narration
- no governance explanation
- no oversized callout cards whose only job is to explain the screen

Outside product windows in the artifact:

- chapter framing
- section labels
- why a state matters
- comparison callouts between states

## 8. Exact copy intent per screen

| Screen | Copy job | User belief it should create |
| --- | --- | --- |
| `D1` | setup is leverage, not admin | "This foundation will make the rest of my search better." |
| `D2` | normalize truth cleanly | "The app is only going to reason from what I approve." |
| `D3` | approve only credible evidence | "I’m still in control of what can be used." |
| `D4` | discover roles analytically | "These role directions are based on real evidence, not hype." |
| `D5` | capture one real job cleanly | "I can search or paste a job without leaving the system." |
| `D6` | inspect before anything carries forward | "I can trust this because I can see what matched and what did not." |
| `D7` | move into real execution | "The work I did now becomes job-specific action." |
| `D8` | organize job momentum by lane | "My jobs stay structured around how I actually search." |
| `D9` | keep truth reusable and auditable | "I can trace what is safe to say and why." |

## 9. Exact interaction-state inventory

The rebuild must visibly cover:

- sidebar nav with active and inactive states
- local profile section progress states
- search vs paste/link capture tabs
- sheet vs board toggle
- sort and filter controls
- lane creation action
- proof approval states
- proof detail drawer
- role-fit drawer
- job-fit drawer
- review-before-send controls

## 10. Account menu contents and behavior

The account menu owns:

- plan label `Free tier`
- `Settings`
- account actions
- sign out

Rules:

- the account menu stays closed by default
- it must not compete with the dominant action on `D1`
- it must not own primary work routing

## 11. Drawer, sheet, dropdown, and modal inventory

| Surface | Trigger | Required contents |
| --- | --- | --- |
| import issue drawer | click unresolved issue in `D2` | source ambiguity, required fix, confirmation action |
| proof detail drawer | click proof row or chip in `D3`, `D7`, or `D9` | provenance, confidence, ownership, exact value if approved, safe wording, explanation |
| role-fit drawer | click `Role fit` affordance in `D4` | weighted factors, penalties, supporting proof, recommendation |
| lane-opportunity sheet | click opportunity affordance in `D4` | salary or upside signals, demand, title breadth, user-interest factors |
| job capture sheet | click `Add a job` in `D5` | equal `Search` and `Paste/Link` tabs, parsed-job readiness |
| job-fit drawer | click `Job fit` affordance in `D7` or `D8` | matched requirements, missing requirements, excluded proof, penalties |
| lane-switch warning modal | switch primary lane after jobs exist | impact summary, what remains reusable, confirm/cancel |

## 12. Jobs-route rules, including search and manual capture

The `Jobs` route must:

- make `Search` and `Paste/Link` equal launch capture modes
- keep both modes behind one `Add a job` action
- support one primary lane per job
- allow optional secondary role tags for analysis only
- support sheet and board views
- support sort, filter, and configurable visible fields
- keep the `Review` to `Applications` to `Workspace` handoff obvious

Default view rules:

- desktop default is `Sheet`
- `Board` is a first-class toggle, not a hidden alternate
- the chosen view becomes a remembered preference after the first explicit user switch

## 13. Schema refinements the rebuild must preserve

The artifact must preserve the following schema truths from the architecture spec:

- `Role Lane` is user-owned and can include multiple close role titles
- one job has one primary lane
- search and manual capture share one saved-job model
- proof, story, and metric structures remain related but distinct
- provenance, confidence, and safe wording remain explicit
- user constraints and preferences remain part of fit logic
- proof usage lineage must stay visible through review states

## 14. FE / BE / design / QA ownership boundaries

### Design owns

- screen composition
- hierarchy
- information density
- copy intent
- interaction inventory
- visual authority

### Frontend owns

- sidebar behavior
- view toggles
- drawer, sheet, and modal interaction realism
- keyboard and focus behavior
- layout containment and density feasibility

### Backend / data owns

- fit payload feasibility
- saved-job ingest contract
- role-lane relationship integrity
- proof provenance support
- requirement matching support

### QA / accessibility owns

- keyboard flow
- focus management
- reduced-motion support
- contrast
- visual QA and heuristic QA

## 15. Accessibility and performance acceptance criteria

- no reliance on color alone for proof or fit states
- drawers and modals trap focus and restore focus correctly
- table-heavy screens remain keyboard navigable
- board cards remain keyboard reachable
- the desktop artifact must avoid visual clutter that obscures hierarchy
- the chosen layouts must not depend on three equal-weight columns to function

## 16. Visual QA and heuristic QA checklist

The later artifact review must verify:

1. the app shell feels dense, professional, and modern
2. the first screen has one obvious action
3. role recommendations appear only after stories and proof are approved
4. `Search` and `Paste/Link` are equally present in first-job entry
5. jobs can be understood in both sheet and board view
6. `Role fit`, `Job fit`, and `Lane opportunity` stay visibly distinct
7. proof provenance and safe wording remain inspectable
8. no explanatory prose appears inside product windows
9. no chunky wizard rail dominates the experience
10. the app feels like one connected SaaS, not a gallery of unrelated cards

## 17. Rebuild acceptance criteria

This rebuild passes only if:

1. it follows the updated Chapter 05 source and architecture spec
2. it shows `Stories + Proof` before `Role Discovery`
3. it uses a denser app shell with a persistent sidebar or equivalent left nav
4. it removes the bloated repeated step-rail model
5. it shows first-job entry with equal `Search` and `Paste/Link` capture modes
6. it shows `Jobs` in both sheet and board continuity
7. it shows a credible `Review` boundary and `Applications` route
8. it shows a credible first `Workspace`
9. it feels like a professional and modern signed-in product

## 18. Verification steps

The later rebuild must verify against:

1. the actual rebuilt [10-activation-desktop.html](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/artifacts/figma/redesign-lock/10-activation-desktop.html) in a browser at desktop width
2. [05-activation-and-core-app.md](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-and-core-app.md)
3. [05-activation-architecture-spec.md](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-architecture-spec.md)
4. this packet

The later rebuild must include:

- rendered screenshots for key states
- criteria checklist
- signoff table
- open-risk sheet
- rollback note
- exact `git status` output for artifact files
- exact `git diff --name-only -- src` output proving no product-code edits in the artifact-only pass

## 19. Risks and rollback

### Risks

- The rebuild could still drift if it uses the existing desktop artifact as a visual template instead of the new authority stack.
- The rebuild could reintroduce heavy cards and wizard framing under the excuse of “clarity.”
- The rebuild could over-separate search and manual capture and make the `Jobs` route feel cluttered.
- The rebuild could blur recommendation, proof, and job-review logic if the drawers and tables are not disciplined.

### Rollback

- Keep [05-activation-and-core-app.md](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-and-core-app.md) as the source chapter authority.
- Keep [05-activation-architecture-spec.md](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-architecture-spec.md) as the build-ready decision layer.
- Treat this packet as the rebuild contract.
- Discard any future desktop artifact pass that reintroduces lane-first sequencing, chunky step rails, or bloated card composition.

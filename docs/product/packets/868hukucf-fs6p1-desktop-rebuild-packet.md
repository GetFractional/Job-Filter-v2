# Packet 868hukucf FS6P1, Desktop Activation Rebuild Packet

Task: [DESIGN: Canonical Job Filter brand system and activation design lock](https://app.clickup.com/t/868hukucf)  
Pass label: `FS6P1`  
Status: rebuild-ready bridge packet  
Primary lane: Chapter 05 desktop activation authority  
Primary output: `/Users/mattdimock/Documents/Jobs/Job Filter/Job-Filter-v2/artifacts/figma/redesign-lock/06-activation-desktop.html`

## 1. Rebuild objective

Rebuild the Chapter 05 desktop activation artifact so it functions as a professional, branded, build-ready desktop authority for the signed-in Job Filter experience, centered on `Profile setup` as the first valuable action after website handoff.

This rebuild must translate the approved Chapter 05 architecture spec into real desktop screens that make setup feel worth doing because it unlocks:

- role clarity
- verified story selection
- proof-safe asset generation
- job-specific review
- later search, research, and outreach leverage

This rebuild is not allowed to drift back into:

- artifact narration inside screens
- a dashboard-first shell
- unresolved nav experiments
- black-box scoring
- decorative trust chrome

## 2. Current-state problems in the existing desktop artifact

The current [06-activation-desktop.html](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/artifacts/figma/redesign-lock/06-activation-desktop.html) should be treated as evidence of what needs to be corrected, not as layout authority.

### Known current-state problems

1. The first signed-in moment does not yet act like a clean, high-confidence `Profile setup` entry.
2. The top section still carries too much artifact framing and not enough product clarity.
3. The current artifact still over-explains inside and around the product windows.
4. The signed-in nav and account behavior are not yet specific enough to guide implementation.
5. `Role fit` and `Job fit` appear visually, but their inspection model is not fully memorialized in the screens.
6. The current hierarchy still over-equalizes information and weakens the dominant next action.
7. Trust cues still risk reading like ambient chrome instead of contextual product behavior.
8. The artifact is not yet strong enough to serve as a no-guesswork design handoff for implementation.

### Source conflicts the rebuild must explicitly resolve

| Conflict | Why it matters | Required fix in rebuild |
| --- | --- | --- |
| `Proof` vs `Proof Library` naming | current artifact shortens the route without defining the page authority | use `Proof` in primary nav, `Proof Library` as route and page title |
| broad "persistent preview" reading | early activation states do not benefit from full draft preview | use staged preview: unlock rail, rationale rail, full preview only at target-job and review states |
| fit numbers without system proof | breaks Chapter 01 trust logic | every visible fit score must have a clear breakdown trigger and explanation surface |
| explanation inside browser windows | weakens final-feeling SaaS authority | move explanation outside windows, keep only realistic product copy inside |
| decorative trust pills | diffuses attention | surface trust only at fit review, proof review, generation, and review boundary |

## 3. Target-state definition

The rebuilt artifact should feel like the first credible signed-in SaaS experience after the website, not like a governance board or Figma export. It must show one connected product where:

- `Profile` is the center of gravity during incomplete activation
- `Jobs` and `Proof` are supporting routes, not equal-weight distractions
- `Profile setup` is emotionally clear, operationally clear, and visually focused
- the user can see what setup unlocks before being asked for too much work
- lane choice, story approval, and proof review feel like decision support, not AI theater
- target-job review visibly becomes a `Resume` plus `Cover Letter` review state
- first-job value hands off cleanly into `Job Workspace`

### Emotional target

The user should feel:

- "I know what to do first."
- "This is worth doing because it will make the rest of my search stronger."
- "I can trust how the product is making decisions."

### Operational target

The rebuild should make these behaviors obvious:

- finish `Profile setup`
- inspect why one lane fits better than another
- approve only safe stories and proof
- enter one target job
- review drafts before anything carries forward

## 4. Exact desktop screens and states to show

The later desktop artifact pass must show the following state set. This is the required screen inventory for the rebuild.

| Screen ID | Screen name | Why it must be shown |
| --- | --- | --- |
| `D1` | `Profile` gate / first signed-in state | proves the first post-auth moment and the dominant next action |
| `D2` | `Profile setup`, basics or history | proves the early setup rhythm and unlock rail without a premature full preview |
| `D3` | lane selection and rationale | proves multiple-lane handling, `Role fit`, and `Lane opportunity` separation |
| `D4` | stories and proof review | proves explicit approval state, `Used` / `Missing` / `Excluded`, and safer wording logic |
| `D5` | target-job intake with first full preview | proves `Job fit`, target-job form, and the first full review relationship |
| `D6` | reviewable `Resume` + `Cover Letter` | proves review-before-send, rationale, and acceptance boundary |
| `D7` | first `Job Workspace` handoff | proves the transition from activation into ongoing job-specific work |
| `D8` | supporting `Jobs` route reference | proves Jobs is coherent without becoming dashboard-first |
| `D9` | supporting `Proof Library` route reference | proves Proof is reusable, inspectable, and secondary to activation |

### Guided-assist / coachmark pattern for `D1` through `D7`

The rebuild must use one consistent guided-assist pattern instead of ad hoc helper cards or ambient explainer copy.

Rules:

- use at most one guided-assist surface per primary screen state
- keep guided assist adjacent to the current decision or in the right rail, never floating over the main content without context
- keep the assist concise, task-specific, and dismissible
- allow the user to reopen the assist from a quiet help affordance if dismissed
- do not use animated coachmark tours, pulsing hotspots, or chained overlays

| Screen | Guided-assist pattern | Placement | Job of the assist |
| --- | --- | --- | --- |
| `D1` | default visible guided-assist rail | right rail | explain what setup unlocks, what setup needs, and what carries forward |
| `D2` | contextual assist card | right rail or inline near unresolved import issues | explain why the current truth-capture step matters and what is still required |
| `D3` | first-visit breakdown nudge | anchored beside active lane or in right rail | point to `Role fit` inspection and explain how to compare lanes without black-box trust |
| `D4` | proof-review assist card | right rail | explain approval, safer wording, and exclusion logic in plain language |
| `D5` | target-job guidance card | right rail beside first full preview | explain the minimum job context needed and what `Job fit` will use |
| `D6` | review-boundary assist card | adjacent to review controls | explain review-before-send, what is being carried forward, and what still needs review |
| `D7` | lightweight next-step coachmark | right side panel or task panel | explain what to do next in `Job Workspace` without reselling activation |

## 5. Exact module stack for each screen

### `D1` Profile gate / first signed-in state

Required module stack, top to bottom:

1. signed-in app header
2. compact `Profile setup` rail
3. left focal workspace:
   - state title
   - one dominant primary CTA
   - short value-oriented setup summary
4. right `Profile payoff rail`:
   - `What setup unlocks`
   - `What setup uses`
   - `What carries into your first job`

The `Profile payoff rail` replaces the vague `profile health stub` and `extracted-intel promise` placeholders from `FS6P1`.

Why this is the right first-screen model:

- `What setup unlocks` answers the emotional question, why this is worth doing
- `What setup uses` answers the operational question, what the user actually needs to provide
- `What carries into your first job` answers the leverage question, what becomes reusable after setup

This is more decisive than a generic health widget on the first screen and stays aligned to Chapter 01, which requires setup to feel like reusable leverage rather than intake tax.

### `D2` Basics or history

Required module stack:

1. signed-in app header
2. compact `Profile setup` rail
3. main editor surface:
   - identity or work-history form
   - issue or completeness handling
4. right rail:
   - compact unlock or extracted-intel module
   - no full draft preview

### `D3` Lane selection and rationale

Required module stack:

1. signed-in app header
2. compact `Profile setup` rail
3. horizontal lane rail or lane carousel
4. active lane comparison surface
5. `Role fit` breakdown trigger
6. separate `Lane opportunity` snapshot
7. right rail:
   - why this lane fits
   - proof thin spots
   - approved-story count

### `D4` Stories and proof review

Required module stack:

1. signed-in app header
2. compact `Profile setup` rail
3. approved-story review list
4. proof-state panel with `Used`, `Missing`, and `Excluded`
5. safer wording state
6. proof detail trigger
7. right rail:
   - lane rationale carry-forward
   - story approval guidance

### `D5` Target-job intake with first full preview

Required module stack:

1. signed-in app header
2. compact `Profile setup` rail
3. target-job intake surface:
   - title
   - company
   - location when relevant
   - job URL if present
   - description excerpt or pasted job context
4. full preview pane
5. `Job fit` summary
6. `Job fit` breakdown trigger
7. rationale state:
   - matched requirements
   - missing requirements
   - proof state

### `D6` Reviewable `Resume` + `Cover Letter`

Required module stack:

1. signed-in app header
2. compact `Profile setup` rail
3. dual-output review surface or tabbed review within one output frame
4. `Used`, `Missing`, `Excluded` state
5. safer wording callout if needed
6. review-before-send boundary controls
7. open-job-workspace action

### `D7` First `Job Workspace` handoff

Required module stack:

1. signed-in app header
2. job header with selected lane and job status
3. main job workspace surface:
   - current assets
   - rationale access
   - next-step action
4. supporting side panel:
   - proof snapshot
   - fit snapshot
   - follow-on task

### `D8` Supporting `Jobs` route

Required module stack:

1. signed-in app header
2. lane-aware job list
3. selected-job summary
4. clear link into `Job Workspace`

### `D9` Supporting `Proof Library` route

Required module stack:

1. signed-in app header
2. proof inventory
3. confidence and ownership state
4. safe wording state
5. exclusion recovery

## 6. Exact hierarchy and focal area per screen

| Screen | Primary focal area | Secondary focal area | What must visually recede |
| --- | --- | --- | --- |
| `D1` | one dominant `Continue setup` action and setup payoff | `Profile payoff rail` and next-step guidance | plan state, settings, supporting routes |
| `D2` | editor truth capture | extracted-intel or profile-health rail | nav chrome, low-priority metadata |
| `D3` | active lane decision surface | role-fit breakdown and lane-opportunity snapshot | inactive lanes beyond the immediate comparison set |
| `D4` | story approval list and proof-state logic | right rail guidance | decorative status chrome |
| `D5` | target-job form and first full preview relationship | job-fit explanation | non-critical route references |
| `D6` | reviewable outputs and review boundary | rationale state | background list views |
| `D7` | job-specific action and asset continuity | proof and fit support panel | activation rail dominance |
| `D8` | selected job row or summary | lane context | generic dashboard widgets |
| `D9` | reusable proof record detail | confidence / ownership support | decorative card framing |

## 7. Exact inside-window vs outside-window content rules

### Outside browser windows

Allowed:

- section headers
- why-this-state-matters framing
- comparison notes between states
- architecture callouts

### Inside browser windows

Required:

- final-feeling UI labels
- realistic field labels
- realistic buttons
- realistic table or card microcopy
- concise trust microcopy only where the user needs it

Forbidden:

- artifact narration
- governance explanation
- long strategy copy
- "this screen shows" style language
- abstract system explanation paragraphs

## 8. Exact copy intent per screen

| Screen | Copy intent | What the copy should make the user feel |
| --- | --- | --- |
| `D1` | setup is leverage, not admin | "This is worth doing right now." |
| `D2` | confirm truth cleanly and confidently | "I’m building something reusable, not filling out a form." |
| `D3` | compare lanes analytically, not emotionally | "I can see why one direction is stronger." |
| `D4` | approve only credible story and proof | "I’m still in control of what gets used." |
| `D5` | bring one real job into focus | "This will reflect the actual role, not a generic template." |
| `D6` | review before anything carries forward | "I can trust this because I can inspect it." |
| `D7` | move from setup into real search execution | "The work I did now carries into the next job step." |
| `D8` | show job-search continuity | "Jobs are organized around my lane and current work." |
| `D9` | make proof reusable and auditable | "I can trace what is safe to say and what is not." |

### Banned copy behaviors

- internal product jargon
- hype
- "AI magic" framing
- black-box score language
- onboarding or wizard language

## 9. Exact interaction-state inventory

The rebuild must include the following interaction states where relevant:

- default
- hover
- active
- focus
- disabled
- loading
- empty
- error
- success
- selected
- completed
- in progress
- blocked
- used
- missing
- excluded

### Special state requirements

- progress rail must clearly distinguish current, completed, and upcoming states
- lane rail must clearly distinguish selected, comparable, and currently out-of-view lanes
- proof-state chips must not rely on color alone
- fit breakdown triggers must remain visible in default state, not only on hover

## 10. Account menu contents and behavior

### Required contents

The account menu must contain:

- plan label, `Free tier`
- `Settings`
- account actions
- sign out

### Behavior rules

- account menu stays present in signed-in header on every activation screen
- it does not compete with the primary activation CTA
- it should not open by default
- it should not become the primary place for work navigation

### Where `Free tier` appears

`Free tier` may appear:

- inside the account menu as the quiet default plan label
- inside `Settings` billing or plan rows in later implementation

`Free tier` must not appear:

- as a large header badge in the first-screen focal area
- as a repeated ambient status pill across all activation states
- as a banner that distracts from `Profile setup`

## 11. Drawer, sheet, dropdown, and modal inventory with contents and triggers

### Drawers and sheets

| Surface | Trigger | Required contents |
| --- | --- | --- |
| Role-fit breakdown drawer | click `Role fit` score or explanation affordance in `D3` | weighted factors, penalties, supporting roles, missing-proof summary, recommendation |
| Job-fit breakdown drawer | click `Job fit` score or explanation affordance in `D5`, `D6`, or `D7` | weighted factors, penalties, matched requirements, missing requirements, excluded proof |
| Proof detail sheet | click proof row or chip in `D4`, `D5`, `D6`, or `D9` | source role, confidence, ownership, exact value if approved, safe wording, explanation |
| Lane-opportunity sheet | click lane-opportunity affordance in `D3` | demand, compensation, title breadth, company-stage upside, user-interest factors |
| Import issue drawer | click history issue or warning in `D2` | unresolved field, source ambiguity, required confirmation action |

### Dropdowns

Allowed dropdown use:

- light list controls inside `Jobs`
- compact sort or filter controls inside `Proof Library`

Not allowed:

- primary nav
- core activation step switching
- major fit explanation

### Modals

| Modal | Trigger | Required action set |
| --- | --- | --- |
| lane-switch warning | user switches lanes after approved stories or job review exist | confirm switch, review impact, cancel |
| discard progress confirmation | user exits or resets meaningful work | confirm discard, continue editing |
| reset import confirmation | user replaces imported work history | confirm reset, preserve current data, cancel |

### Explicit interaction-state examples for critical overlays

| Surface | Required screens | Required states | Required contents in the visible state |
| --- | --- | --- | --- |
| account menu | `D1` through `D7` | closed, hover-ready, open, keyboard focus | plan label `Free tier`, `Settings`, account actions, sign out |
| role-fit breakdown drawer | `D3` | closed, open, focus-trapped, dismissed | total score, factor weights, penalties, supporting roles, missing-proof summary, recommendation |
| proof detail sheet | `D4`, `D5`, `D6`, `D9` | closed, open on selected proof row, switched between `used` / `missing` / `excluded`, dismissed | provenance, confidence, ownership, exact value if approved, safe wording, explanation |
| job-fit breakdown drawer | `D5`, `D6`, `D7` | closed, open, focus-trapped, dismissed | total score, matched requirements, missing requirements, excluded proof, next review action |
| lane-switch warning modal | `D4`, `D5`, `D6`, `D7` when active lane change would invalidate downstream work | hidden, triggered, confirm, cancel | impact summary, what gets invalidated, what stays reusable, confirm / cancel actions |

## 12. Monetization and plan-state timing

### Plan-state timing

The later rebuild should keep monetization quiet during incomplete activation.

Rules:

1. During `D1` through `D6`, monetization must not compete with the primary activation job.
2. `Free tier` appears only in the account menu and any clearly scoped plan-setting surface, not in the main activation hierarchy.
3. Do not use upgrade banners, paywalls, or cross-page promo strips inside the rebuild artifact.

### Multi-lane upsell behavior

The product may later monetize broader multi-lane usage, but the desktop rebuild should only reserve the behavior pattern, not turn it into a sales event.

Required behavior:

- before first-job value, do not surface a multi-lane upgrade CTA in the primary activation workspace
- after one lane is selected, additional lanes may show a quiet lock or plan note in supporting surfaces only
- any future multi-lane upsell should appear in:
  - lane-opportunity side sheet
  - `Jobs` route support area
  - account menu or settings plan area

It must not appear in:

- the first signed-in focal state
- the primary action area of `D3`
- the review surfaces in `D5` or `D6`

### Why

The activation JTBD is to get the user to first-job value. Monetization should not blur that.

## 13. Schema refinements still required before or during rebuild

The architecture spec is intentionally minimal at the schema level. The rebuild packet must preserve the following refinements so the later artifact and implementation reset do not abstract away required state.

This does not conflict with the Chapter 05 architecture spec. It extends the minimal schema set so the rebuild can reflect Chapter 01 and Chapter 05 requirements more faithfully.

| Schema area | Required refinement | Why it is needed |
| --- | --- | --- |
| `RoleLaneRecord` | structured `roleFit` and `laneOpportunity` breakdown storage, not only top-line totals | keeps fit and opportunity visibly distinct |
| profile capability structure | explicit `skills` and `tools` groups with source-role linkage and lane relevance | preserves the real capability structure behind lane and job fit |
| user preferences and constraints | target-title preferences, remote or location constraints, compensation preferences when available, domain preferences, no-go constraints | keeps job-search guidance grounded in real user intent and constraints |
| `TargetJobRecord` | parsed requirement groups that can power `matched`, `missing`, and `excluded` logic | required for inspectable `Job fit` |
| proof provenance | source role, source artifact, ownership, confidence, exact approved wording, safer wording, and review timestamp | required for trust, reversibility, and proof-detail screens |
| company and market context | company profile, business model, market notes, job-source notes, and relevant research grounding where available | supports Chapter 01's requirement that company and market context can ground fit decisions |
| transition context | reason-for-leaving, career-transition framing, or adjacent-lane explanation when relevant | preserves job-search context that can materially affect positioning and story choice |
| `GeneratedAssetBrief` | explicit `usedProofIds`, `missingProofIds`, and `excludedProofIds`, plus selected story IDs and selected lane ID | required for review-before-send clarity |
| activation session state | preview mode, blocker state, dismissed-assist state, and current breakdown context | required for stable rebuild of staged preview and guided assist |
| job workspace relationship | stable relationship between selected lane, selected target job, accepted drafts, and linked proof | keeps the handoff into `Job Workspace` coherent |

These refinements do not belong in this packet as implementation work. They are here so the rebuild does not accidentally narrow the schema below what the product truth requires.

## 14. FE / BE / design / QA ownership boundaries

### Design owns

- screen composition
- hierarchy
- state coverage
- copy intent
- interaction inventory
- trust placement
- inside-window vs outside-window discipline

### FE owns

- responsive layout behavior
- step rail behavior
- drawer, sheet, and modal implementation
- focus management
- preview-state rendering
- interaction-state fidelity

### BE or data-layer owns

- deterministic score computation
- persisted activation state
- proof-state persistence
- target-job parsing and storage
- job workspace handoff persistence

### QA owns

- visual continuity to Chapters 02 and 03
- first-screen clarity
- fit-system inspectability
- trust-cue placement
- accessibility and keyboard behavior
- no regressions into board-style layouts

## 15. Accessibility and performance acceptance criteria

### Accessibility

The rebuild must be designed to support:

- WCAG 2.2 AA contrast
- keyboard access for nav, progress rail, drawers, sheets, and review actions
- visible focus states on all interactive controls
- non-color-only status communication
- correct modal and drawer focus management
- reduced-motion-safe transitions

### Performance

The rebuild must assume:

- fit recalculation and preview refresh feel immediate on normal desktop usage
- drawers open without lag
- no layout dependence on slow network responses for the first usable slice
- heavy preview panes remain visually contained and do not cause overflow

## 16. Visual QA and heuristic QA checklist

### Visual QA checklist

- first screen has one dominant action
- `Profile` clearly outranks `Jobs` and `Proof` during incomplete activation
- `Role fit`, `Job fit`, and `Lane opportunity` are visually distinct
- early states do not show full draft preview
- full draft preview appears only when target-job context exists
- trust cues appear where decisions happen, not as ambient chrome
- inside-screen copy looks like product UI, not artifact narration
- `Job Workspace` feels like the next state of the same SaaS

### Heuristic QA checklist

- system status is always legible
- user control and reversibility exist at lane switching, proof exclusion, and review
- information architecture reflects real priorities
- error and missing-proof states help recovery
- score systems are inspectable, not mysterious
- users can tell what is approved versus suggested
- no part of the rebuild implies hidden send or auto-apply

## 17. Rebuild acceptance criteria

The later rebuild passes only if:

1. the first signed-in screen clearly answers what to do first, why it matters, and what setup unlocks
2. `Profile setup` reads like leverage, not onboarding tax
3. the signed-in IA is clear and implementation-guiding
4. lane handling scales beyond three lanes and remains comparison-friendly
5. `Role fit`, `Job fit`, and `Lane opportunity` stay visibly separate
6. proof review is explicit and trust-building
7. target-job intake visibly drives the first full preview state
8. review-before-send is unmistakable before the `Job Workspace` handoff
9. `Jobs` and `Proof Library` are coherent but secondary
10. the artifact reads like a real signed-in SaaS, not a board, gallery, or screen inventory

## 18. Verification steps

The next desktop rebuild pass must verify:

1. the actual rebuilt [06-activation-desktop.html](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/artifacts/figma/redesign-lock/06-activation-desktop.html) in a browser at desktop width
2. top-section continuity with the Foundation Series shell
3. first-screen clarity and dominant action
4. primary nav and account-menu clarity
5. staged preview behavior
6. inspectable `Role fit` and `Job fit`
7. contextual trust placement
8. inside-window copy discipline
9. `Job Workspace` handoff quality
10. supporting `Jobs` and `Proof Library` coherence

### Required evidence for the later rebuild pass

- browser screenshots for:
  - first signed-in state
  - lane explanation state
  - target-job plus first full preview state
  - review state or `Job Workspace` handoff
- exact `git status` output for the artifact files
- exact `git diff --name-only -- src` output proving no product-code edits in the artifact-only pass

### Formal signoff checkpoints

| Checkpoint | Required owner | What must be signed off |
| --- | --- | --- |
| design signoff | design-governance owner | screen inventory, module stacks, first-screen clarity, guided-assist behavior, hierarchy, inside-window discipline |
| FE signoff | frontend owner | nav model, progress rail behavior, overlay inventory, state coverage, layout containment, interaction feasibility |
| BE / data signoff | backend or data owner | schema refinements, fit-breakdown payloads, proof provenance, company or market context support, handoff relationships |
| QA / accessibility signoff | QA owner | visual QA, heuristic QA, keyboard and focus behavior, reduced-motion support, contrast, no-guesswork verification evidence |

The later desktop rebuild pass should not be considered final until all four signoff checkpoints are explicitly satisfied.

## 19. Risks and rollback

### Risks

- The rebuild could still drift if it uses the existing desktop artifact as a visual template instead of this packet plus the architecture spec.
- The rebuild could blur `Lane opportunity` into fit if the scoring surfaces are not carefully separated.
- The rebuild could over-surface plan state or multi-lane upsell and pollute the activation JTBD.
- The rebuild could reintroduce explanatory copy inside product windows.

### Rollback

- Keep [05-activation-architecture-spec.md](/Users/mattdimock/Documents/Jobs/Job%20Filter/Job-Filter-v2/docs/product/foundation-series/05-activation-architecture-spec.md) as the governing source.
- Treat this packet as the rebuild contract.
- If a later artifact pass drifts, revert the artifact changes and rebuild from this packet rather than editing around the drift.

## Packet verdict

This packet is decision-complete only if the next artifact pass can rebuild the desktop activation artifact without inventing:

- core route behavior
- core nav behavior
- score-system behavior
- preview timing
- trust placement
- monetization timing
- screen module stack

If any of those still need invention, this packet is not complete and must be revised before the artifact rebuild starts.

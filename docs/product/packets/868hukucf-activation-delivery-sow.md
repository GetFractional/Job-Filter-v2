# Activation Delivery SOW

Task: [DESIGN: Canonical Job Filter brand system and activation design lock](https://app.clickup.com/t/868hukucf)  
Pass label: `FS6S1`  
Status: operating-model authority for Chapter 05 delivery  
Applies to: desktop activation rebuild, mobile activation adaptation, and later `FS8` implementation handoff

## 1. Program objective and boundary

This SOW governs the remaining Chapter 05 delivery work after the approved architecture and desktop rebuild packet. Its job is to run the activation program like a lean professional SaaS team: one source stack, one sequence, one set of signoff gates, and no duplicate artifact or review work.

This SOW does not rewrite:

- [`05-activation-and-core-app.md`](../foundation-series/05-activation-and-core-app.md)
- [`05-activation-architecture-spec.md`](../foundation-series/05-activation-architecture-spec.md)
- [`868hukucf-fs6p1-desktop-rebuild-packet.md`](./868hukucf-fs6p1-desktop-rebuild-packet.md)

This SOW does govern:

- who owns which activation delivery decisions
- which pass happens next
- what evidence is required before the work moves forward
- how desktop, mobile, and implementation handoff stay aligned without reopening scope

## 2. Source-of-truth hierarchy

Use this hierarchy whenever a lower-level artifact, comment, or prototype conflicts with an approved source:

1. verified ClickUp task packet and read-after-write receipts for `868hukucf`
2. [`job-filter-foundation-series-governing-packet-v7.md`](../job-filter-foundation-series-governing-packet-v7.md)
3. Foundation Series chapters 01, 02, 03, and 05
4. [`05-activation-architecture-spec.md`](../foundation-series/05-activation-architecture-spec.md)
5. [`868hukucf-fs6p1-desktop-rebuild-packet.md`](./868hukucf-fs6p1-desktop-rebuild-packet.md)
6. current activation artifacts, prototype shells, and implementation evidence

Authority rules:

- the desktop artifact rebuild must follow the approved architecture spec and rebuild packet, not the current HTML as-is
- the mobile adaptation pass must inherit from the approved desktop rebuild output plus the approved architecture spec, not invent a parallel mobile product model
- the later `FS8` handoff may translate approved design authority into implementation guidance, but it may not reopen signed-in IA, activation sequence, fit logic, or trust boundaries

## 3. Role coverage and responsibilities

The delivery program should behave as if these roles exist, even when one person covers multiple roles.

| Role | Core responsibility | Required decisions or outputs |
| --- | --- | --- |
| Product Systems Architect | protect the Chapter 01 to 05 truth stack and route-level logic | source alignment, system conflicts, cross-route consistency, final authority questions |
| Senior UX/UI Lead | translate approved system and packet decisions into coherent activation screens | desktop artifact rebuild, mobile adaptation, focal hierarchy, layout composition |
| UX Writer / CRO Lead | keep activation copy clear, motivating, and trust-safe | first-screen clarity, assistive guidance, microcopy, boundary language, no jargon or hype |
| Frontend Architect | judge design feasibility and preserve implementation-ready structure | component feasibility, state coverage, overlay behavior, responsive behavior, technical constraints |
| Backend / Data Architect | validate the schemas, derived systems, and data dependencies behind activation | fit payloads, proof provenance, lane data, target-job context, handoff readiness for `FS8` |
| Accessibility / QA Lead | prove the work is usable, accessible, and reviewable | heuristic QA, keyboard/focus rules, contrast, reduced motion, artifact acceptance checks |
| Delivery Lead | keep sequence, WIP, signoff, and change control disciplined | phase gating, ownership clarity, ClickUp evidence, review timing, carry-forward risk management |

## 4. Lean staffing model and cost-control principle

This program should stay lean. The goal is full role coverage, not full role staffing.

### Lean staffing model

| Coverage cluster | Roles combined when needed | Cost-control logic |
| --- | --- | --- |
| Systems + delivery | Product Systems Architect + Delivery Lead | one owner protects scope, sequence, and source authority |
| Design + writing | Senior UX/UI Lead + UX Writer / CRO Lead | one craft lane keeps hierarchy, trust, and copy tightly aligned |
| Technical readiness | Frontend Architect + Backend / Data Architect | one technical readiness lane avoids disconnected feasibility reviews |
| Quality gate | Accessibility / QA Lead | remains distinct at signoff time even if execution help is shared |

### Cost-control principles

1. No duplicate packets for the same delivery purpose.
2. No parallel desktop artifact concepts once the rebuild pass begins.
3. No mobile adaptation before desktop rebuild signoff.
4. No `FS8` implementation-handoff packet until desktop and mobile activation authority are both stable enough to translate.
5. Reuse one review bundle across design, FE, BE/data, and QA where possible instead of running redundant review loops.
6. Treat prototypes and current HTML as evidence only. Do not pay twice for defending obsolete structure.

## 5. Workstreams and owned deliverables

| Workstream | Primary owner | Deliverables |
| --- | --- | --- |
| Governance and scope control | Delivery Lead | this SOW, signoff records, change log, status receipts |
| Activation system authority | Product Systems Architect | source alignment decisions, conflict calls, carry-forward constraints |
| Desktop activation rebuild | Senior UX/UI Lead | rebuilt `06-activation-desktop.html` with evidence package |
| Mobile activation adaptation | Senior UX/UI Lead | later `07-activation-mobile.html` with adaptation evidence package |
| Technical readiness | Frontend Architect + Backend / Data Architect | feasibility notes, schema validation, overlay/state feasibility, `FS8` input constraints |
| Accessibility and QA | Accessibility / QA Lead | acceptance checklist, defect list, signoff receipts |

## 6. Phase plan and sequencing

The activation program should run in four phases.

| Phase | Name | Objective | Output |
| --- | --- | --- | --- |
| `P0` | governance lock | preserve authority and stop scope drift | approved architecture spec, desktop rebuild packet, and this SOW |
| `P1` | desktop rebuild | create the canonical desktop activation artifact | rebuilt `06-activation-desktop.html` plus signoff evidence |
| `P2` | mobile adaptation | adapt the approved desktop authority to mobile without redefining product behavior | `07-activation-mobile.html` plus signoff evidence |
| `P3` | implementation handoff | convert approved design authority into implementation-ready handoff | later `FS8` reset packet with design, data, and QA constraints |

Sequencing rules:

- `P1` must finish before `P2` begins
- `P2` must finish before `P3` begins
- if desktop rebuild exposes a source conflict, resolve it through design-governance first, not through artifact improvisation

## 7. Entry criteria and exit criteria per phase

### `P0` Governance lock

Entry criteria:

- Chapter 05 source chapter approved
- Chapter 05 architecture spec approved
- Chapter 05 desktop rebuild packet approved

Exit criteria:

- this SOW exists
- role coverage, WIP, and signoff rules are explicit
- no unresolved question would force the next desktop rebuild to invent core delivery behavior

### `P1` Desktop rebuild

Entry criteria:

- `P0` exit satisfied
- approved Chapter 05 architecture spec is stable
- approved desktop rebuild packet is stable

Exit criteria:

- `06-activation-desktop.html` rebuilt from authority, not from the old shell
- first-screen logic is emotionally clear, operationally clear, and visually focused
- desktop activation states and overlays match the rebuild packet
- desktop signoff evidence complete

### `P2` Mobile adaptation

Entry criteria:

- desktop rebuild signed off
- desktop state inventory and overlay behavior stable enough to adapt

Exit criteria:

- `07-activation-mobile.html` adapts desktop authority without redefining route ownership, fit logic, or trust rules
- mobile-specific layout, preview recovery, and focus behavior are explicit
- mobile signoff evidence complete

### `P3` Implementation handoff

Entry criteria:

- desktop and mobile activation artifacts signed off
- unresolved conflicts documented explicitly
- schema and technical constraints stable enough for implementation planning

Exit criteria:

- later `FS8` handoff packet can guide implementation without reopening product architecture
- FE and BE/data dependencies are explicit
- QA acceptance criteria are implementation-ready

## 8. Signoff checkpoints and required evidence

Every phase requires explicit signoff. Silence is not signoff.

| Checkpoint | Owner | Required evidence |
| --- | --- | --- |
| Design signoff | Senior UX/UI Lead + Product Systems Architect | final screen inventory, hierarchy proof, overlay coverage, inside-window discipline, visual QA checklist |
| Writing signoff | UX Writer / CRO Lead | first-screen clarity, guidance tone, trust-language checks, banned-term compliance |
| FE signoff | Frontend Architect | feasibility notes, layout containment, overlay behavior, responsive intent, no hidden product dependencies |
| BE / data signoff | Backend / Data Architect | schema support, fit payload feasibility, provenance coverage, target-job and handoff data dependencies |
| QA / accessibility signoff | Accessibility / QA Lead | keyboard flow, focus states, reduced-motion handling, contrast, heuristic QA, state completeness |
| Delivery signoff | Delivery Lead | source stack preserved, WIP respected, ClickUp receipt posted, carry-forward risks recorded |

Required evidence package per artifact phase:

- rendered screenshots for primary states
- explicit verification against the governing packet, Chapter 05 architecture spec, and the active rebuild packet
- git status proof
- no-guesswork checklist
- open risks and rollback path

## 9. Cadence, governance, and WIP rules

### Default operating model

- one permanent lead thread
- one active coding thread
- governance first, implementation second
- one writer per packet or spec

### When a second support lane can open

Open a second support lane only when all of the following are true:

1. the active desktop or mobile artifact pass has a locked packet
2. the support task is narrowly scoped and non-overlapping
3. the second lane will reduce calendar time without creating duplicate review effort
4. the lead thread has explicitly approved the second lane

Allowed support-lane examples:

- QA screenshot capture after a screen set is already built
- accessibility-specific pass after visual composition is materially stable
- schema-readiness check that does not rewrite product behavior

Disallowed support-lane examples:

- parallel redesign concepts for the same artifact
- second packet writer for the same rebuild
- parallel rewrite of product logic already approved upstream

### Cadence rules

- daily or per-session status review through the lead thread
- one artifact-quality review after each major phase output
- one consolidated signoff round per phase, not scattered approvals

## 10. Change-control rules

Use change control when a request would alter approved authority or delivery sequence.

| Change type | Example | Required action |
| --- | --- | --- |
| cosmetic adjustment | spacing or framing polish that preserves approved structure | can proceed within active pass |
| delivery refinement | clearer overlay contents or stronger QA wording that does not reopen source logic | can proceed within active packet or SOW |
| architecture-affecting change | changing activation states, fit systems, nav ownership, or preview model | stop and route back to Chapter 05 authority before proceeding |
| scope expansion | reopening website, lifecycle, or `FS8` logic from an activation pass | reject and redirect to the correct owner or later phase |

Change-control rules:

- no source-authority changes may be smuggled into artifact polish
- no rebuild pass may silently rewrite the approved architecture spec
- any unresolved conflict discovered during rebuild must be logged explicitly before it changes the work

## 11. Risk register

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| current HTML still exerts template gravity | rebuild can drift back to the old shell instead of the approved packet | treat current artifact as evidence only, not layout authority |
| mobile starts before desktop is stable | duplicate decisions and later rework | enforce phase order, desktop first |
| implementation planning starts too early | design debt gets pushed into `src/` as ad hoc fixes | block `FS8` until activation artifacts are approved |
| fit and opportunity blur together again | damages trust and creates black-box behavior | keep `Role fit`, `Job fit`, and `Lane opportunity` distinct in every review |
| trust cues become decorative chrome again | weakens clarity and brand discipline | review trust placement at each signoff checkpoint |
| too many reviewers, too early | cost goes up and decisions slow down | use consolidated signoff bundles and lean role coverage |

## 12. Anti-patterns to avoid

Do not allow the remaining activation work to drift into:

- dashboard-first thinking
- equal-weight nav during incomplete activation
- persistent full-preview everywhere
- explanatory prose inside product windows
- ambient trust strips or badge clutter
- mobile-first improvisation before desktop authority is stable
- duplicate QA passes for the same unresolved source issue
- implementation-feasibility debates before the artifact authority is clear

## 13. Exact interaction with the desktop rebuild pass

The next desktop rebuild pass must treat this SOW as the operating contract and the following files as source authority:

- [`05-activation-architecture-spec.md`](../foundation-series/05-activation-architecture-spec.md)
- [`868hukucf-fs6p1-desktop-rebuild-packet.md`](./868hukucf-fs6p1-desktop-rebuild-packet.md)

The SOW adds these operating constraints to the rebuild:

- do not open parallel concept directions
- do not reinterpret route ownership
- do not treat current HTML as authority
- do not mark the rebuild complete without the signoff evidence bundle
- keep staffing lean by collapsing design, writing, and systems review into one coordinated review cycle where possible

Required desktop rebuild outputs:

- rebuilt `06-activation-desktop.html`
- rendered-state proof for first screen, fit explanation, story or proof review, target-job review, and first `Job Workspace`
- design, FE, BE/data, QA/accessibility, and delivery signoff evidence

## 14. Exact interaction with the mobile adaptation pass

The mobile adaptation pass begins only after desktop signoff.

The mobile pass must inherit:

- the approved route roles
- the approved activation sequence
- the approved overlay inventory
- the approved fit and trust systems

The mobile pass may adapt:

- layout stacking
- preview recovery behavior
- drawer and sheet emphasis
- thumb-reach and keyboard handling

The mobile pass may not invent:

- a different activation state model
- a different nav ownership model
- a different trust architecture

## 15. Exact interaction with the later FS8 implementation-handoff pass

The later `FS8` pass is downstream of approved design authority. It exists to translate, not renegotiate.

`FS8` should consume:

- Chapter 05 source chapter
- Chapter 05 architecture spec
- approved desktop activation artifact
- approved mobile activation artifact
- this SOW and the desktop rebuild packet for operating assumptions and handoff evidence

`FS8` must not:

- reopen website scope
- rewrite activation route logic
- collapse fit logic into opaque implementation shortcuts
- downgrade review-before-send or no-auto-apply boundaries

## 16. Conflicts, deferrals, and carry-forward improvements from prior artifacts

### Conflicts already resolved by the source stack

- `Proof` vs `Proof Library` naming, resolved as nav label vs route/page title
- staged preview model, resolved by the architecture spec
- contextual trust placement instead of ambient trust chrome

### Explicit unresolved conflicts

No blocking source-authority conflicts remain open at the SOW level.

The following items are still execution-sensitive and must be handled through later pass verification, not by reopening source authority:

- whether the later desktop rebuild fully achieves first-screen emotional clarity at the screen-composition level
- whether the later mobile adaptation preserves the staged preview relationship without degrading usability
- whether the later `FS8` handoff can preserve the approved overlay and state model without technical shortcuts

### Deferrals

These remain intentionally deferred beyond the activation delivery program:

- lifecycle messaging and email behavior
- website IA or public-page changes
- broader monetization experiments beyond quiet `Free tier` visibility and later multi-lane upsell timing
- implementation detail beyond what later `FS8` needs

### Carry-forward improvements still expected from prior artifacts

- stronger first-screen emotional clarity
- clearer overlay contents and triggers
- better mobile preview recovery rules once mobile begins
- cleaner implementation handoff once desktop and mobile are both stable

## 17. Acceptance criteria for the SOW itself

This SOW is complete only when:

1. it preserves the existing authority stack without rewriting approved architecture or rebuild-packet logic
2. it defines lean role coverage for the remaining activation program
3. it sets explicit phase order, entry or exit gates, and signoff checkpoints
4. it prevents duplicate artifact work, duplicate reviews, and early `FS8` drift
5. it gives the next desktop rebuild pass enough operating structure to run like a professional SaaS delivery effort instead of an ad hoc design pass

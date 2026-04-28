# Packet 868hunzqm

Task: [DESIGN: Marketing website IA and activation funnel map](https://app.clickup.com/t/868hunzqm)  
Status: `in design`  
Primary lane: chapter 04 packet refresh + desktop comp-build contract

## Objective

Refresh the Chapter 04 website artifact packet so the next build pass creates real desktop SaaS website page compositions, not strategy boards, screen inventories, or page-role summaries rendered in HTML.

## Current State

- Chapter 04 strategy is already live in `docs/product/foundation-series/04-website-public-funnel.md`.
- Upstream chapters 01 through 03 are now the binding inputs for market truth, brand, and shared system behavior.
- A desktop artifact already exists at `artifacts/figma/redesign-lock/04-website-desktop.html`, but that file should now be treated as an interim reference, not as the final build pattern.
- The packet has been too loose about deliverable shape, which allowed prior artifact work to drift into reference-board output instead of real SaaS page composition.

## Packet Readiness Verdict

Ready after this refresh.

Why:

- strategy, IA, CTA map, proof architecture, worksheet role, and auth-to-Profile handoff are already locked in Chapter 04
- upstream Chapter 02 and Chapter 03 continuity work is now strong enough to guide visual and interaction inheritance
- the remaining gap is not website strategy, it is comp-build specificity

## Strategy Lenses In Force

Primary:

- `Simplification Hook`

Support:

- `Desire Before Scarcity`
- `Objection Marketing`

How they apply here:

- simplify the public journey so each page has one obvious job and one obvious next step
- build desire through mechanism clarity, visible proof, and workflow confidence before any pricing tension or urgency
- surface objections inside the page composition itself instead of pushing them into abstract boards or dumping them into separate FAQ pages

## Target State

- the next Chapter 04 desktop pass produces real browser-viewable SaaS page comps
- each page is composed as a believable public website page, not as a packet board or governance canvas
- each page has explicit section, CTA, proof, form, objection, and footer/nav requirements
- the pricing page uses real tier architecture and feature-group comparison structure even if exact dollar amounts remain provisional
- desktop work proceeds in small page clusters, not one giant all-pages pass
- mobile remains a later dedicated pass

## Deliverable Shape

The next desktop artifact pass must produce:

- real desktop website comps
- page-by-page composition
- browser-viewable, realistic SaaS page designs
- final-feeling public pages with believable containment, hierarchy, and section rhythm
- realistic header, hero, section, proof, form, comparison, and footer structures

The next desktop artifact pass must not produce:

- screen inventories
- strategy boards
- page-role summary boards
- governance cards presented as the primary page content
- abstract commentary about what the page should do instead of the page itself
- pricing commentary blocks that avoid building an actual pricing page structure

## Deliverables

| Deliverable | Role |
| --- | --- |
| `docs/product/foundation-series/04-website-public-funnel.md` | binding chapter 04 strategy source |
| `docs/product/packets/868hunzqm.md` | binding build contract for chapter 04 artifact work |
| `artifacts/figma/redesign-lock/04-website-desktop.html` | desktop SaaS website comps for the approved chapter 04 page set |
| `artifacts/figma/redesign-lock/05-website-mobile.html` | later mobile adaptation of the approved desktop comp system |

## Scope In

- desktop website comp requirements for the approved chapter 04 page set
- page-by-page section composition requirements
- CTA placement rules at the page level
- proof-module placement rules at the page level
- pricing-page composition requirements, including tier architecture and comparison structure
- worksheet page composition and subscriber-capture structure
- auth create-account and sign-in page composition
- shared nav, footer, form, spacing, motion, and proof constraints for the desktop comp pass
- build sequencing for the next desktop comp passes

## Scope Out

- re-opening chapter 04 IA, page inventory, CTA map, worksheet role, proof architecture, or auth/public handoff
- re-opening chapter 02 brand strategy
- re-opening chapter 03 shared system rules
- mobile comp execution in this packet refresh
- activation or core-app layout work that belongs to chapter 05
- lifecycle or email design
- production code changes

## Locked Page Set In Scope

The next desktop comp pass may build only:

1. `Home`
2. `How It Works`
3. `Pricing`
4. `Job Profile Worksheet` landing page
5. `Auth`, create-account state
6. `Auth`, sign-in state
7. utility handling only where needed for `Privacy`, `Terms`, and `404`

The next desktop comp pass may not add:

- standalone `Product`
- standalone `Proof`
- standalone `FAQ`
- blog, about, or other net-new public pages

## Shared System Rules For The Website Comp Pass

### Series continuity

- Inherit the same premium black-glass shell direction established in Chapter 03 and used in the refreshed Chapter 02 artifact.
- Use the Foundation Series TOC shell at the artifact level only, not inside each page comp.
- Each page comp should feel like a real website page inside a browser frame, not a board of notes.

### CTA and button system

- Use the Chapter 03 CTA system directly.
- Public primary remains `Build my job profile`.
- Public exploratory remains `See how it works`.
- Worksheet CTA remains `Get the worksheet`.
- `Continue setup` is internal-only and appears only after the signed-in handoff logic is shown.
- Do not invent new primary CTA labels.

### Spacing rhythm

- Follow Chapter 03 spacing rhythm.
- Make section changes feel intentional, with visible hierarchy between hero, primary content blocks, proof modules, comparison structures, and footer.
- Avoid equal-weight card walls and board-style grids.

### Responsive intent

- Build desktop comps only, but they must imply a plausible responsive collapse.
- Desktop layouts should show clear containment and should not depend on fixed-width overflow tricks.
- Any side-by-side structure should have an obvious future stack behavior.

### Motion and interaction expectations

- Use restrained, premium interaction cues only.
- Buttons, links, tabs, disclosures, and form states should feel inspectable and serious.
- No playful motion, AI theater, or hidden-automation implication.

### Form behavior

- Forms must look like realistic compact SaaS forms, not placeholder fields dropped onto a board.
- Use believable field count and field grouping.
- Show one clear primary action per form.

### Proof constraints

- Use only mechanism proof, interface proof, boundary proof, entry proof, and worksheet proof as already allowed by Chapter 04.
- Do not invent testimonials, outcome statistics, ATS claims, or recruiter-facing guarantees.
- Do not invent scarcity, urgency, countdowns, or artificial deadlines.
- If stronger proof is not available, show clearer mechanism and clearer interface evidence instead of filling space with fake persuasion.

## Page-Level Element Inventory

### Home

Required sections:

- full public header with logo, `How It Works`, `Pricing`, `Sign in`, and persistent `Build my job profile`
- hero with category framing, primary CTA, exploratory CTA, and one secondary worksheet path
- mechanism section that makes the product loop tangible
- interface-proof section showing `Profile` as the reusable asset and visible reasoning behavior
- trust/boundary section that keeps no-auto-apply, review-before-send, and inspectable reasoning concrete
- free-to-start or entry-clarity section that makes `Free tier` legible without turning Home into a pricing page
- worksheet-secondary module or strip
- full footer with utility links and worksheet utility link

Required CTA placements:

- `Build my job profile` in header
- `Build my job profile` in hero
- `See how it works` in hero
- worksheet secondary path below the main story, not above it

Required proof modules:

- mechanism proof
- interface proof
- boundary proof
- entry proof

Required objection-handling surfaces:

- “is this another AI shortcut?” answer inside mechanism and trust modules
- “what happens before I pay?” answer inside the entry-clarity section

Required nav and footer behavior:

- header persists the three primary public navigation choices only
- footer carries `Privacy`, `Terms`, and `Job Profile Worksheet`

### How It Works

Required sections:

- full public header
- hero that explains the mechanism clearly and lowers skepticism
- sequential step section for the workflow
- interface-proof section showing step rail, preview relationship, and rationale or `used` / `missing` / `excluded`
- objection-handling section that absorbs FAQ-style hesitation directly into the page
- worksheet-secondary section
- footer

Required CTA placements:

- `Build my job profile` above the fold
- worksheet secondary CTA within the page
- no exploratory CTA required as the dominant secondary action on this page if worksheet placement is doing that job

Required proof modules:

- mechanism proof
- interface proof
- boundary proof

Required objection-handling surfaces:

- multi-lane question
- no-auto-apply question
- trust-in-the-reasoning question

Required nav and footer behavior:

- same public header behavior as Home
- same utility footer behavior as Home

### Pricing

Required sections:

- full public header
- pricing hero that frames free-to-start entry and deeper leverage
- real tier architecture section with at least three structural columns or cards
- feature-group comparison structure beneath or alongside the tiers
- embedded pricing FAQ or objection section
- entry-proof and boundary-proof modules
- footer

Required CTA placements:

- `Build my job profile` above the fold
- `See how it works` as the secondary CTA
- tier-level CTA placements that still preserve the public primary hierarchy

Required proof modules:

- entry proof
- boundary proof
- where useful, interface proof that connects pricing back to `Profile` and the visible workflow

Required comparison or pricing structures:

- `Free tier` must be shown as a real tier, not a sentence fragment
- a provisional premium structure is allowed if exact dollars are not locked
- feature groups must compare what changes by tier or level of leverage
- FAQ or objection handling must sit inside the page, not on a separate FAQ page

Required objection-handling surfaces:

- “what do I get for free?”
- “why would I pay later?”
- “does paying mean more black-box automation?”

Required nav and footer behavior:

- same public header behavior as Home
- same utility footer behavior as Home

### Job Profile Worksheet Landing Page

Required sections:

- full public header
- hero that frames the worksheet as a warm secondary path
- capture form section with realistic compact fields
- worksheet preview or mirrors-the-method section
- handoff section that routes back to the product path
- footer

Required CTA placements:

- `Get the worksheet` as the page primary
- `Build my job profile` as the page secondary

Required proof modules:

- worksheet proof
- method-preview proof

Required form patterns:

- email field
- one context or intent field
- optional source or routing context where helpful
- one clear submission action

Required objection-handling surfaces:

- make clear that the worksheet previews the method
- make clear that the worksheet does not replace `Profile`
- make clear that capture is for worksheet delivery and warm follow-up, not for blocking direct product entry

Required nav and footer behavior:

- same public header behavior as Home
- same utility footer behavior as Home

### Auth, Create-Account

Required sections:

- reduced public shell or auth shell that still feels continuous with the website
- create-account form
- free-to-start clarity near the form
- explicit destination cue that the next state is `Profile`
- compact continuity module explaining post-auth handoff

Required CTA placements:

- `Build my job profile` remains the create-account primary
- `Sign in instead` remains secondary

Required proof and trust surfaces:

- free-tier entry cue
- destination cue to `Profile`
- explicit no-generic-dashboard continuation

Required form patterns:

- realistic compact create-account form
- minimal required fields only

Required nav and footer behavior:

- reduced shell is acceptable
- utility links may be compact, but auth must not feel visually disconnected from the public funnel

### Auth, Sign-In

Required sections:

- reduced public shell or auth shell
- sign-in form
- continuity explanation for returning users
- routing explanation for incomplete `Profile` versus readiness-based continuation

Required CTA placements:

- `Continue` as the sign-in primary
- `Back` as the secondary
- internal `Continue setup` appears only in the routing-explanation surface, not as the signed-out page primary

Required proof and trust surfaces:

- continuity cue
- `Profile` resume cue for incomplete setup

Required form patterns:

- realistic compact sign-in form
- minimal required fields only

Required nav and footer behavior:

- same reduced-shell rule as create-account

### Utility Handling

Required handling only:

- compact `Privacy`
- compact `Terms`
- compact `404`

Rules:

- do not build full marketing pages for utilities
- keep them visually continuous with the public shell
- 404 must provide a route back to `Home` and `Build my job profile`

## Pricing-Page Rules

- Require real tier architecture and real feature-group comparison structure.
- Provisional tier naming and provisional dollar placeholders are allowed if exact prices are not locked.
- Lack of final dollars is not a reason to collapse the page into abstract pricing commentary.
- Pricing should build desire through clarity of leverage, not through fake scarcity.
- Pricing should show what changes across levels of value, while preserving human control, review visibility, and no-auto-apply boundaries.
- Do not use countdowns, “today only,” fake seats, fake demand, or implied guarantee language.

## Build Sequence For The Next Desktop Comp Passes

Recommended smallest useful sequence:

1. Shared public shell + `Home`
2. `How It Works` + `Job Profile Worksheet` landing page
3. `Pricing`
4. `Auth`, create-account + `Auth`, sign-in + utility handling

Rules for sequencing:

- build one desktop page cluster at a time
- do not rebuild all pages in one giant pass
- each cluster should be visually reviewable on its own
- each cluster should inherit the same shell, CTA system, footer behavior, and proof grammar
- do not start mobile until the desktop page set is accepted

## Acceptance Criteria

- the packet explicitly defines the next deliverable as real desktop SaaS page comps
- the packet explicitly forbids screen inventories, strategy boards, and page-role summary boards as the main output shape
- the page set is locked to the approved Chapter 04 scope
- each page has explicit section, CTA, proof, form, objection, and footer/nav requirements
- pricing-page requirements force tier architecture and comparison structure even without final dollar amounts
- shared website-system rules are explicit enough that the next builder pass cannot drift back into abstract board output
- the recommended build sequence favors small desktop clusters instead of a one-shot all-pages pass

## Verification

- review against `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- review against `docs/product/foundation-series/04-website-public-funnel.md`
- confirm the packet does not reopen IA, proof architecture, worksheet role, or auth/public handoff
- confirm the packet now defines page-composition requirements, not just artifact names
- confirm the packet language requires real page comps and forbids reference-board output
- confirm the packet preserves `Free tier`, free-to-start clarity, no auto-apply, review-before-send, inspectable reasoning, and Profile-first handoff

## Dependencies

- upstream design-governance task: [868hukucf](https://app.clickup.com/t/868hukucf)
- blocked implementation task downstream: [868huafcx](https://app.clickup.com/t/868huafcx)
- Chapter 04 comp passes must inherit the approved strategy source and may not reopen IA, proof architecture, worksheet role, or auth/public handoff

## File Shortlist

- `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- `docs/product/packets/868hunzqm.md`
- `docs/product/foundation-series/01-market-intelligence.md`
- `docs/product/foundation-series/02-brand-strategy.md`
- `docs/product/foundation-series/03-product-system.md`
- `docs/product/foundation-series/04-website-public-funnel.md`
- `artifacts/figma/redesign-lock/04-website-desktop.html`

## Risks and Rollback

- Risk: the next builder pass still tries to explain pages instead of composing them.
- Risk: pricing uncertainty gets misused as an excuse to avoid building a real pricing-page structure.
- Risk: worksheet or auth pages drift into activation-layout territory that belongs to Chapter 05.
- Rollback: keep this packet as the binding Chapter 04 comp-build contract and reject any next pass that reverts to reference-board output or reopens locked funnel strategy.

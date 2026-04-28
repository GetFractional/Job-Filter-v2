# Job Filter Professional Brand Style Guide v1

Last updated: 2026-03-10  
Scope: `/`, `/profile?mode=setup`, first-job capture, `/job/:jobId` assets  
Status: exploratory reference only. Superseded by `docs/product/job-filter-brand-experience-lock-v4.md`.

## 1) How Professional Brand Style Guides Are Created

Professional style guides are built in seven deterministic phases. Skipping phases causes brand drift and inconsistent UX.

### Phase A, Strategic foundation
- Objective: lock audience, category, competitive edge, and value mechanism.
- Inputs: ICP, JTBD, product constraints, proof inventory, conversion goals.
- Outputs:
  - brand positioning statement
  - value proposition hierarchy
  - USP map
  - proof requirements and claim boundaries

### Phase B, Verbal identity
- Objective: define how the product speaks so copy is consistent across screens.
- Inputs: positioning, objections, trust constraints.
- Outputs:
  - voice attributes (what we are and are not)
  - message hierarchy (hero, support, proof, CTA)
  - microcopy playbook (labels, warnings, confirmation language)
  - banned phrases and claim guardrails

### Phase C, Visual identity
- Objective: define reusable visual primitives.
- Inputs: category intent, readability/accessibility constraints, platform context.
- Outputs:
  - color system
  - typography system
  - spacing/radius/shadow system
  - imagery and icon direction
  - component visual grammar

### Phase D, Product expression
- Objective: translate brand into in-product behavior, not just marketing surfaces.
- Inputs: target flows and task sequence.
- Outputs:
  - layout model
  - interaction model
  - progress and feedback model
  - trust and proof display model

### Phase E, Device grounding
- Objective: avoid abstract mockups detached from real usage.
- Inputs: platform analytics and common viewport clusters.
- Outputs:
  - canonical desktop and mobile resolutions
  - browser/device frame standards
  - responsive rules

### Phase F, Prototype and QA
- Objective: prove coherence under realistic flow traversal.
- Outputs:
  - linked prototype path
  - state coverage for empty/loading/error/success
  - copy and visual QA checklist

### Phase G, Governance
- Objective: keep brand quality stable during implementation.
- Outputs:
  - token naming and component contracts
  - review gates for copy and UI
  - “on-brand / off-brand” checklist

## 2) Orchestrated Expert Coalition

Mode: expanded (task is cross-functional: brand, UX, copy, positioning, prototype, governance)

### Active now roles
- Product lead: lock user job, sequence, and activation economics.
- Brand/design systems lead: define brand identity, tokens, visual governance.
- UX lead: convert brand into low-cognitive-load activation flow.
- Copy lead: message hierarchy and in-product microcopy consistency.
- Proof-grounding lead: enforce factual/approval constraints for trust.
- Engineer-QA lead: make design system implementable and testable.

### Reference if needed
- Growth lead: evaluate conversion leverage and behavioral friction.
- Research lead: validate assumptions with user evidence.
- Risk lead: trust, compliance, and claim safety.

## 3) Framework Stack

### Core stack
- JTBD (primary): ensures every screen serves the user’s real outcome.
- MECE: separates strategy, copy, visuals, interaction, and governance cleanly.
- Inversion/premortem: prevents polished-but-wrong direction.

### Alen-guided copy stack
- Primary: Simplification Hook
- Supporting:
  - Change Work
  - Conversion Velocity

These are applied with explicit guardrails:
- no inflated proof
- no fake urgency
- no claim without mechanism and evidence

### Related framework catalog (for full-system brand and activation work)

#### Strategy and positioning
- Positioning (category design and differentiation)
- Segmentation (ICP fit and expansion sequencing)
- Value proposition canvas (pain/relief mapping)
- Second-order thinking (behavior and economic side effects)

#### UX and information architecture
- Information Architecture framework (step and content decomposition)
- Journey mapping (cross-screen continuity)
- Nielsen heuristics (usability quality gates)
- Progressive disclosure (cognitive load control)

#### Copy and psychology
- Simplification Hook (primary)
- Change Work
- Conversion Velocity
- Objection marketing (ethical objection handling)
- Timeline language structure (ordered guidance)
- Proof-payoff stack (mechanism + credibility + action)

#### Delivery and risk
- Critical path lite (execution order and dependencies)
- Risk matrix (trust, usability, implementation failure modes)
- Proof-grounding contract (no unapproved evidence promotion)

## 4) Job Filter Brand Identity

### Category
- Truth-first job conversion operating system for serious operators.

### ICP
- Senior operator/job changer, 8 to 15+ years experience, multi-lane search, high trust sensitivity.

### Positioning statement
- Job Filter turns your career history into a high-trust profile and job-specific assets so you can pursue fewer, better roles with higher conversion confidence.

### Brand promise
- One profile, grounded proof, faster high-quality applications.

### USPs
1. Canonical profile source of truth, not fragmented setup forms.
2. Proof-grounded asset generation with explicit exclusions for unresolved evidence.
3. Explainable fit and targeting logic tied to real job conditions.
4. Guided modular workflow, not freeform “AI magic.”
5. Strategic artifact quality (research + assets) with traceable inputs.

## 5) Verbal Identity and Copy System

### Voice traits
- Clear
- Grounded
- Premium without theatrics
- Helpful, not pushy

### We are / we are not
- We are: direct, evidence-aware, confidence-building.
- We are not: hypey, vague, or black-box.

### Core belief shift language
- From: “I’m doing setup.”
- To: “I’m building the source of truth that powers every application.”

### Messaging hierarchy
- Hero line: simplify complexity in one sentence.
- Support line: explain mechanism.
- Proof line: show what is confirmed vs excluded.
- CTA line: one clear next step.

### On-brand microcopy patterns
- “Build your profile once. Use it everywhere.”
- “Confirm what is true.”
- “Excluded from use until resolved.”
- “What this unlocks.”
- “How to confirm this step.”
- “Saved. Next step unlocked.”

### Off-brand language to avoid
- “AI magic”
- “Smarter, faster, better” without mechanism
- “Rejected” (prefer “Excluded from use”)
- parser internals in primary UX path

## 6) Visual Identity System

### Color direction
- Canvas: near-white and calm.
- Primary accent: deep forest.
- Secondary accent: warm amber for warnings only.
- Borders: crisp cool green-gray.

### Typography
- Display/editorial moments: Newsreader.
- All operational UI copy: Plus Jakarta Sans.
- No mixed novelty fonts in product workflow.

### Visual grammar
- Floating tinted cards over white canvas.
- Crisp 1px borders shared across shell/editor/preview.
- Minimal decoration, high information hierarchy through spacing and typography.
- Chips for skills/tools and selection states.

### Imagery direction
- Product-first imagery: real UI states, documents, and grounded workflow context.
- Avoid generic stock-illustration metaphors.
- Optional human imagery should support trust, not dominate the interface.

## 7) Product UX Expression Rules

### Shared shell contract
- Step rail + progress always visible.
- Main editor and live preview are persistent.
- Success cues appear near top workflow context, not only footer.

### Step labels
1. Start Here
2. Details
3. Experience
4. Skills & Tools
5. Profile
6. Targeting

### Completion and activation
- Asset-ready requires: Start Here, Details, Experience, Skills & Tools, Targeting.
- Profile is optional but recommended.

## 8) Device and Resolution Standards

Design for the most common real-world usage clusters:

### Desktop primary
- 1440x900 viewport (common MacBook flow)
- 1366x768 viewport (common Windows laptop baseline)

### Desktop secondary
- 1920x1080 monitor context, with app canvas centered to primary viewport tokens

### Mobile primary
- 390x844 (iPhone 12/13/14 class)
- 360x800 (common Android baseline)

### Prototype framing rule
- Desktop screens displayed in browser chrome frames.
- Mobile screens displayed in device shell with status/header context.

## 9) Activation Journey Screen Inventory

1. Route gate (`/`)
2. Start Here
3. Details
4. Experience
5. Skills & Tools
6. Profile
7. Targeting
8. First job capture
9. Assets tab first draft + Why this draft

## 10) Proof and Claim Governance

- Suggestions are never canonical truth until explicit save/approval.
- Unresolved evidence is never silently promoted.
- Missing context is surfaced as warning, not hidden.
- Claims in copy must map to shipped mechanisms.
- Any unverified claim must be labeled `[ASSUMPTION]` in internal drafts.

## 11) Implementation Handoff Checklist

- Tokens defined and named consistently.
- Component variants mapped (buttons, inputs, chips, rails, banners).
- Copy strings aligned to system language.
- Desktop and mobile prototypes cover full activation sequence.
- Accessibility pass:
  - contrast
  - focus states
  - touch targets
  - reduced-motion behavior

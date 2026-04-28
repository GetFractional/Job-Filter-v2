# Job Filter Professional Brand and Design System v2

Last updated: 2026-03-10  
Primary tasks: `868hukucf` (design lock), `868hunzqm` (website IA + funnel)  
Status: reference-only. Superseded by `docs/product/job-filter-brand-experience-lock-v4.md`.

## 1) Brand Overview

Category:
- Truth-first job conversion workspace for serious operators.

Brand promise:
- Get to better-fit roles with less rewriting and stronger positioning.

Product stance:
- Guided operator workflow over black-box automation.
- Reusable profile and targeting context over repeated one-off forms.
- Explicitly explain what each draft used and what it still needs.

Emotional territory:
- Calm confidence
- Control without complexity
- Premium, pragmatic, non-theatrical

## 2) Personas and JTBD

### Persona matrix

1. Senior operator switching roles  
Behavior: selective applications, multi-lane search, high stakes.  
Anxiety: wasting effort on poor-fit roles.  
Expected outcome: fewer applications, stronger fit and narrative alignment.

2. High-agency career optimizer  
Behavior: maintains own systems, wants leverage not hand-holding.  
Anxiety: fragmented tools and repeated setup.  
Expected outcome: one reusable profile system that compounds.

3. Selective applicant with proof-heavy background  
Behavior: only applies when role is strategic fit.  
Anxiety: generic copy erodes credibility.  
Expected outcome: assets that feel tailored and evidence-aware.

### Primary JTBD

- When I am trying to convert my career history into stronger applications, I need one trustworthy workflow that helps me confirm what matters, fill the right gaps, and reuse that context quickly.

### Belief shift

- From: “I’m doing setup work.”
- To: “I’m building the system that makes every next application easier and stronger.”

## 3) Positioning, Value Proposition, and USPs

Positioning statement:
- Job Filter helps experienced operators pursue fewer, better-fit roles by combining reusable profile setup, role targeting, and transparent draft context.

Value hierarchy:
1. Better role targeting
2. Faster tailoring with less rewriting
3. Stronger narrative consistency
4. Higher confidence through explainable draft context

USPs:
1. Canonical profile capture flow, not fragmented setup.
2. Explainable personalization, not mystery draft generation.
3. Guided activation model that prioritizes first useful output.
4. Reusable context across resumes, outreach, and interview prep.
5. Proof-safety behavior with explicit excluded/missing context surfaces.

## 4) Verbal Identity and Copy System

Voice:
- Clear
- Grounded
- Premium
- Direct
- Non-hype

### Copy hierarchy by surface

Website hero and page headers:
- Lead with user value outcomes.
- Avoid internal system terms by default.

In-product guidance:
- Explain what to do next and what unlocks.
- Keep action language deterministic.

Warnings and audit surfaces:
- Internal contract language is allowed here.
- Example: “Excluded until resolved”, “Missing context warning”.

### Do and don’t examples

Headlines:
- Do: “Apply to fewer roles, with stronger positioning.”
- Don’t: “Build your canonical source of truth.”

Field labels:
- Do: “Target roles”
- Don’t: “Role lane normalization”

Confirmation:
- Do: “Saved. Next step unlocked.”
- Don’t: “Configuration updated successfully.”

Warnings:
- Do: “Excluded until resolved.”
- Don’t: “Rejected by parser.”

CTAs:
- Do: “Start setup”, “Save and continue”, “Use draft”
- Don’t: “Proceed”, “Run AI”, “Auto optimize”

Banned phrases:
- “AI magic”
- “Smarter faster better” without mechanism
- “Guaranteed” outcome language

## 5) Visual Identity and Token System

Direction:
- Quiet Executive Workspace

Core principles:
- White canvas
- Softly tinted floating cards
- Crisp cool borders
- Deep forest accent
- Graphite typography
- One in-product sans family

Typography:
- In-product family: Plus Jakarta Sans only.
- No mixed display serif in product flow surfaces.

Color tokens:
- Canvas: `#FCFDFB`
- App shell: `#F5F8F6`
- Primary card tint: `#EEF5F1`
- Secondary soft surface: `#F7FAF8`
- Paper: `#FFFFFF`
- Primary ink: `#18211D`
- Secondary ink: `#44544B`
- Muted ink: `#6B7C73`
- Accent forest: `#1F5A43`
- Accent hover: `#2A6A51`
- Accent soft: `#DDEEE6`
- Warning amber: `#A56522`
- Warning soft: `#FAEEDC`
- Danger: `#A33A33`
- Danger soft: `#F8E8E8`
- Border crisp: `#D7E1DB`
- Border strong: `#BFCDC4`

Shape and depth:
- Card radius: `16px`
- Control radius: `12px`
- Chip radius: `999px`
- Border: `1px` crisp
- Shadow family: one soft-depth stack, no glow effects

Imagery and icon direction:
- Product-first visuals with real UI context.
- Minimal decorative illustration.
- Icons are neutral line-style, no playful mixed icon sets.

## 6) Component Grammar and Interaction Rules

Primary component families:
- Top progress system
- Step header
- Numbered guidance block
- Inputs and builders
- Chips and targeting selectors
- Status banners
- Preview modules

### Component state grammar

Inputs:
- default, focus, filled, error, disabled

Chips:
- saved, suggested, selected, warning

Buttons:
- primary, primary-hover, secondary, disabled

Status:
- success, warning, error, informational

Preview sections:
- hidden-when-empty, rendered-when-present

Interaction rules:
- One primary action per section.
- Suggestions never look equivalent to saved values.
- Status copy always includes an explicit next action when blocking.

## 7) Product IA and Activation Journey

Canonical journey:
1. `/`
2. `/profile?mode=setup`
3. first job capture
4. `/job/:jobId`
5. `Assets` handoff

Visible step labels:
1. Start Here
2. Details
3. Experience
4. Skills & Tools
5. Profile
6. Targeting

Internal IDs (locked):
- `start_here`, `details`, `experience`, `skills`, `extras`, `preferences`

Stable shell rules:
- Keep one stable top in-product navigation across activation.
- Keep horizontal step system at top of setup flow.
- Do not reintroduce left-rail-only step control for this phase.

Asset-ready threshold:
- Required: Start Here, Details, Experience, Skills & Tools, Targeting
- Optional: Profile

## 8) Website IA and Funnel Map

Public-site page map:
1. Home
2. How It Works
3. Product / Platform
4. Proof / Examples
5. Pricing
6. FAQ
7. Sign in / Get started

CTA map:
- Home primary CTA -> `/profile?mode=setup`
- How It Works CTA -> `/profile?mode=setup`
- Pricing CTA -> `/profile?mode=setup`
- FAQ CTA -> `/profile?mode=setup`
- Sign in -> authenticated flow with setup gate when not asset-ready

Cross-surface handoff:
1. Website click
2. Setup completion
3. First job capture
4. First asset draft
5. Why-this-draft explanation and refinement loop

## 9) Device and Responsive Standards

Desktop primary:
- 1440x900
- 1366x768

Desktop secondary check:
- 1920x1080

Mobile primary:
- 390x844
- 360x800

Shell framing:
- Desktop screens in browser chrome.
- Mobile screens in realistic device shells.
- Keep stable in-app shell across pages.

## 10) Motion and Accessibility Rules

Motion:
- Opacity + slight translate only.
- Duration 150ms to 220ms.
- No animation libraries in this phase.
- No layout-shifting animations.

Trigger-based motion rules:
- Save confirmation: opacity + small lift.
- Step transition: subtle fade and translate.
- Hover: color-only, no size shift.

Accessibility:
- WCAG AA contrast minimum.
- Visible focus ring on all interactive controls.
- Touch targets >= 44px on mobile.
- Respect `prefers-reduced-motion`.

## 11) Screen Inventory and State Coverage

### Website screens

- Home
- How It Works
- Platform
- Proof / Examples
- Pricing
- FAQ
- Sign in / Get started

### In-product screens

- `/` activation gate
- `/profile` step 1 through 6
- first job capture
- first assets handoff
- `Why this draft` context panel

### Required states

- Empty
- Loading
- Success
- Error
- Warning / missing context

## 12) Figma Node Map and Implementation Handoff

Canonical page set target:
1. `00_Brand_System`
2. `10_Website_Journey`
3. `20_Activation_Desktop`
4. `30_Activation_Mobile`
5. `40_Component_System`

Node map (populate after canonical frame approval):

| Surface | Node URL | Status |
| --- | --- | --- |
| 00_Brand_System | https://www.figma.com/design/2yV2LG8g3YnWhfBK5p5rhl?node-id=26-2 | approved root |
| 10_Website_Journey | https://www.figma.com/design/2yV2LG8g3YnWhfBK5p5rhl?node-id=27-2 | approved root |
| 20_Activation_Desktop | https://www.figma.com/design/2yV2LG8g3YnWhfBK5p5rhl?node-id=28-2 | approved root |
| 30_Activation_Mobile | https://www.figma.com/design/2yV2LG8g3YnWhfBK5p5rhl?node-id=29-2 | approved root |
| 40_Component_System | https://www.figma.com/design/2yV2LG8g3YnWhfBK5p5rhl?node-id=30-2 | approved root |
| `/profile` step 1 | TODO | child node map pending |
| `/profile` step 2 | TODO | child node map pending |
| `/profile` step 3 | TODO | child node map pending |
| `/profile` step 4 | TODO | child node map pending |
| `/profile` step 5 | TODO | child node map pending |
| `/profile` step 6 | TODO | child node map pending |
| First job capture | TODO | child node map pending |
| Assets + Why this draft | TODO | child node map pending |

Handoff gate before coding resumes:
- All node URLs approved.
- Exploratory frames clearly labeled as non-canonical.
- Copy and component checklists passed.
- Proof-grounding checklist signed off.

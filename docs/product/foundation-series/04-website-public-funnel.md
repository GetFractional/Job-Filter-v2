# Foundation Series 04, Website and Public Funnel

Last updated: 2026-03-12  
Status: active living chapter  
Primary owner: `868hunzqm`  
Upstream sources: [`01-market-intelligence.md`](./01-market-intelligence.md), [`02-brand-strategy.md`](./02-brand-strategy.md), [`03-product-system.md`](./03-product-system.md)

## Purpose

Turn the Chapter 01 market read, Chapter 02 brand system, and Chapter 03 product system into one coherent public-site and signed-out funnel source for Job Filter. This chapter governs the MVP website IA, page inventory, CTA map, proof architecture, subscriber path, pricing-entry framing, and handoff into Profile.

## Usage Rules

- Build from Chapters 01 through 03. Do not re-derive market tensions, category framing, CTA logic, trust architecture, or product-system constraints from older artifacts.
- Use this chapter for public-site structure, page roles, public CTA behavior, proof placement, subscriber capture, and auth-to-Profile handoff.
- Keep this chapter structural and funnel-oriented. Final desktop and mobile page comps come later.
- Do not use this chapter to redesign activation layouts or lifecycle sequence design.
- Keep all public-funnel decisions grounded in current product truth. Do not convert inferred opportunity into performance claims.

## Chosen Strategy Lens

Frameworks used:

- primary: `Simplification Hook`
- support: `Change Work`
- support: `Objection Marketing`
- support: `Desire Before Scarcity`

Website implication:

- simplify the public journey to a small number of pages with one obvious next step
- change the visitor belief from “another AI job tool” to “a clearer, more trustworthy way to run a serious search”
- use objections to clarify the hidden cost of fragmented tools, vague AI, and low-trust volume tactics
- build desire through mechanism, trust, and workflow clarity before pricing comparison

## Translation of Chapters 01 Through 03 Into the Public Funnel

| Upstream chapter | Locked input | Website response |
| --- | --- | --- |
| Chapter 01 | Free-to-start clarity lowers trust friction | Show `Free tier` and free-to-start logic early, then route high-intent users straight into auth |
| Chapter 01 | Multiple role lanes are normal | Use lane-aware examples and copy that signals broad backgrounds are expected |
| Chapter 01 | Review-before-send and inspectable reasoning are trust architecture | Show review logic and `used`, `missing`, and `excluded` as product proof, not as hidden product trivia |
| Chapter 01 | No auto-apply in the current-state promise | Public copy and proof modules must reject black-box automation cues |
| Chapter 01 | Guided story extraction is the wedge | Explain Profile as the place where the right story is shaped before assets are formatted |
| Chapter 02 | Category framing: truth-first job-search workspace | Make the site feel like a serious operating system, not a generic AI assistant landing page |
| Chapter 02 | Approved CTA ladder | Keep `Build my job profile` as the public primary and `See how it works` as the public exploratory control |
| Chapter 02 | Mechanism before outcome | Lead with how the system works before asking visitors to believe stronger outcomes |
| Chapter 02 | Trust and proof rules | Put boundary language, review logic, and free-to-start clarity inside the main pages |
| Chapter 03 | Calm premium trust architecture | Use contained layouts, branded links, and warm editorial structure in later artifact work |
| Chapter 03 | Step grammar and preview relationship are anchors | Use product glimpses that preview real system behavior without redesigning the activation flow here |
| Chapter 03 | No board-style spill or black-box AI cues | Keep the site visually contained and operational, not flashy or novelty-driven |

## Final MVP Public-Site IA

### Core Funnel Pages

1. `Home`
2. `How It Works`
3. `Pricing`
4. `Job Profile Worksheet` landing page
5. `Auth`, including create-account and sign-in entry states

### Utility Pages

- `Privacy`, required utility page
- `Terms`, required utility page
- `404`, required utility page

### Not in the MVP Primary Funnel

- `Product` as a standalone page, absorbed into `Home` and `How It Works`
- `Proof` as a standalone page, absorbed into `Home`, `How It Works`, and `Pricing`
- `FAQ` as a standalone page, absorbed into `How It Works` and `Pricing`
- `Blog`, not required for MVP
- `About`, not required for MVP

### Why This IA Wins

- It reduces page choice while keeping the mechanism, trust story, and entry model clear.
- It keeps the main product story stronger than the lead magnet.
- It gives skeptical visitors one deeper explanation page and one pricing-entry page, not five overlapping pages.
- It keeps public-to-auth handoff explicit.

## Page Inventory

| Page | Primary audience | Primary job | Primary CTA | Secondary CTA | Proof role |
| --- | --- | --- | --- | --- | --- |
| Home | Cold and mixed-intent visitors | Establish the category, the main problem shift, and the direct next step | `Build my job profile` | `See how it works` | Show the product loop, review logic, and Profile as a reusable asset |
| How It Works | Sophisticated Skeptic and repetition buyers | Explain the mechanism, sequence, and trust boundaries in concrete terms | `Build my job profile` | `Job Profile Worksheet` | Show sequence proof, trust surfaces, and no-auto-apply boundaries |
| Pricing | Price-cautious visitors and high-intent evaluators | Explain free-to-start entry, what deeper value looks like, and why pricing is tied to leverage | `Build my job profile` | `See how it works` | Show entry clarity, plan logic, and what remains reviewable and human-controlled |
| Job Profile Worksheet landing page | Not-yet-ready visitors who want a lower-commitment step | Capture subscriber intent without replacing the product story | `Get the worksheet` | `Build my job profile` | Show that the worksheet previews the Profile logic, not a separate product |
| Auth | Ready visitors and returning users | Turn public intent into the right signed-in starting point | `Build my job profile` on create-account, `Continue` on sign-in | `Sign in` or `Back` depending on state | Confirm readiness rules and deterministic routing into Profile or the right next signed-in state |

## Primary Navigation Model

### Header Navigation

- logo to `Home`
- `How It Works`
- `Pricing`
- `Sign in`
- persistent public primary CTA: `Build my job profile`

### What Is Not in Primary Navigation

- `Product`
- `Proof`
- `FAQ`
- `Job Profile Worksheet`
- `Blog`
- `About`

### Footer and Utility Navigation

Use the footer for:

- `Privacy`
- `Terms`
- `Job Profile Worksheet`
- optional future utility links if they are added later

Do not let footer complexity become a substitute for weak top-level IA.

## Decision on Product, Proof, and FAQ

### Product

Decision: absorb into `Home` and `How It Works`.

Why:

- the market needs mechanism clarity more than a module catalog
- a standalone Product page adds overlap before the site has enough distinct proof or breadth to justify it
- Product content works better as part of the explanation sequence and trust story

### Proof

Decision: absorb into `Home`, `How It Works`, and `Pricing`.

Why:

- current proof is mostly product-truth proof, workflow proof, and boundary proof, not broad outcome-case-study proof
- core pages should carry the trust load instead of forcing the user into a separate evidence section
- this keeps proof close to the claim it supports

### FAQ

Decision: absorb into `How It Works` and `Pricing`.

Why:

- the main objections are structural and trust-related, so they belong near mechanism and entry decisions
- a standalone FAQ page is too often a dumping ground for unresolved messaging

## Page-to-Page CTA Map

| Source page | Visitor state | Primary action | Destination | Why this route exists |
| --- | --- | --- | --- | --- |
| Home | High intent | `Build my job profile` | `Auth`, create-account state | Convert ready visitors directly into the product path |
| Home | Curious but skeptical | `See how it works` | `How It Works` | Give mechanism and trust before asking for auth |
| Home | Not ready yet | `Job Profile Worksheet` text link or module CTA | Worksheet landing page | Capture lower-intent visitors without derailing the main story |
| How It Works | Mechanism understood | `Build my job profile` | `Auth`, create-account state | Convert once sequence and trust are clear |
| How It Works | Interested but still cautious | `Job Profile Worksheet` | Worksheet landing page | Offer a lower-friction next step for repetition buyers |
| Pricing | Ready to start | `Build my job profile` | `Auth`, create-account state | Keep pricing page conversion direct once entry logic is clear |
| Pricing | Needs more confidence | `See how it works` | `How It Works` | Move back to mechanism instead of trapping the user in price anxiety |
| Worksheet landing page | Subscribed and warm | `Build my job profile` | `Auth`, create-account state | Convert directly after the lead magnet value is understood |
| Auth, create-account | New user | complete account creation | `Profile` start state or first incomplete step | Keep the public promise connected to the first signed-in action |
| Auth, sign-in | Returning user | sign in | readiness-based signed-in route | Preserve continuity for existing users |

## Lead Magnet Strategy

### Primary Lead Magnet

`Job Profile Worksheet`

### Role in the Funnel

- It is a secondary conversion path for visitors who are interested in the mechanism but not ready to create an account.
- It previews the product’s core thinking, defining role focus, story inputs, and credibility checkpoints.
- It should make Profile easier to understand, not replace Profile as the real product entry.

### Placement

- dedicated landing page for campaign and email capture use
- secondary text-link or module placements on `Home` and `How It Works`
- optional footer utility link

### What It Must Not Become

- the primary story of the website
- a substitute for the product experience
- a vague newsletter lure

### Later Lead Magnet Candidates

These stay secondary and are not part of the MVP funnel:

- `Role Fit Checklist`
- `Application Readiness Checklist`

## Subscriber Capture Strategy and Handoff

### What Subscriber Capture Is For

- deliver the `Job Profile Worksheet`
- preserve warm interest from visitors who are not ready to authenticate yet
- carry source and intent context into later lifecycle work

### What Subscriber Capture Is Not For

- collecting emails without a concrete value exchange
- interrupting the primary product conversion path
- replacing the main CTA with newsletter logic

### Capture Rules

- Capture should happen around the worksheet path, not as a mandatory gate before product entry.
- Capture modules on core pages should stay secondary to `Build my job profile`.
- Capture forms should tag source page and offer so later lifecycle work can route follow-up intelligently.
- Subscriber handoff should always include a clear next-step CTA back into the product path.

## Free-Tier Framing and Pricing-Entry Logic

### Entry Model

`Free tier` remains the entry model.

### Public Framing Rules

- explain that visitors can start free and understand the workflow before deciding whether deeper leverage is worth paying for
- keep the first explanation concrete, tied to Profile and the visible workflow, not vague access language
- do not let pricing become the hero story on `Home`
- keep numeric pricing, limits, and credit detail out of the chapter until later proof-backed decisions exist

### Pricing Page Job

The pricing page should answer:

- what the free entry is for
- what deeper value tiers or premium paths are trying to unlock
- why higher-value access is about leverage, strategy, or premium outputs, not generic AI volume

### Desire-Before-Scarcity Rule

Use mechanism and trust to build desire before asking the visitor to compare paid value. Do not use urgency or scarcity to compensate for unclear value.

## Proof Architecture

### Proof Types Allowed on the Public Site

| Proof type | Where it belongs | Notes |
| --- | --- | --- |
| Mechanism proof | `Home`, `How It Works` | Show how Profile, guided story extraction, review-before-send, and rationale work together |
| Interface proof | `Home`, `How It Works`, `Pricing` | Use product glimpses that show real system states such as steps, preview, and `used` / `missing` / `excluded` |
| Boundary proof | `How It Works`, `Pricing` | Make no-auto-apply, review visibility, and human control explicit |
| Entry proof | `Home`, `Pricing` | Show what `Free tier` means at a high level and why it is safe to start |
| Lead magnet proof | Worksheet landing page | Show the worksheet as a preview of the product logic, not as a standalone outcome engine |

### Proof Types Not Allowed as Default MVP Claims

- invented outcome statistics
- fabricated testimonials
- unsupported ATS-beating claims
- generic “get hired faster” claims
- vague “AI does it for you” language

### Why There Is No Dedicated Proof Page

The current proof set is strongest when it stays attached to the exact claim it supports. A dedicated Proof page should only return later if the product accumulates enough verified evidence to justify a separate destination.

## Auth and Public Funnel Ownership

Chapter 04 owns:

- the signed-out public path
- entry and sign-in routing logic
- public CTA destinations
- worksheet subscriber capture path
- how visitors move from public surfaces into auth
- the readiness logic that decides whether the next state is Profile setup or a different signed-in state

Chapter 05 owns:

- the in-app activation surfaces after the handoff
- the actual `Profile` step experience
- signed-in screen behavior after the user lands in the app

## Signed-Out to Signed-In Handoff

### New Visitor Path

1. Visitor lands on `Home`, `How It Works`, `Pricing`, or worksheet path.
2. Visitor clicks `Build my job profile`.
3. Visitor enters `Auth` create-account state.
4. After account creation, route directly into `Profile`, not to a generic dashboard.

### Returning User Path

1. Visitor clicks `Sign in`.
2. User enters `Auth` sign-in state.
3. After sign-in:
   - if Profile is incomplete, route to the first incomplete Profile step
   - if Profile is complete, route to the most relevant signed-in state based on readiness and recent work

### Worksheet Subscriber Path

1. Visitor requests the worksheet.
2. Visitor receives the worksheet and a clear next-step CTA.
3. When the visitor later clicks back into the main product path, send them through `Auth` and then the same readiness-based routing.

## Handoff Into Profile

Public-to-product handoff must create one clear belief:

“Now I am entering the real workspace that will help me define the right story and drive better-fit applications.”

Handoff rules:

- Use `Profile` as the user-facing destination name.
- Do not send new users into a generic feed or dashboard first.
- Preserve source context where useful, but do not overload the first signed-in step with marketing residue.
- `Continue setup` remains the internal primary control only after the user is signed in and inside Profile.

## Downstream Implications

| Downstream work | What it must inherit from this chapter |
| --- | --- |
| Later website artifact packets | The page set, navigation model, CTA map, lead magnet placement, proof architecture, pricing-entry logic, and auth/public handoff decisions |
| Chapter 05, Activation and Core App | The signed-out to signed-in routing rules, Profile-first handoff, worksheet-to-auth relationship, and no-auto-apply public boundary |
| Chapter 06, Lifecycle Messaging and Email System | The subscriber-capture purpose, worksheet handoff logic, free-to-start framing, and objection-aware follow-up themes |

## What This Chapter Does Not Own

This chapter does not decide:

- final website desktop or mobile page compositions
- activation page layouts
- lifecycle message sequence
- numeric pricing detail
- paid plan packaging details beyond the entry-model and framing logic

Those decisions belong to later packets and must inherit this chapter when they are made.

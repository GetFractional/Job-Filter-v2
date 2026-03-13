# Foundation Series 03, Shared Visual and Product System

Last updated: 2026-03-12  
Status: active living chapter  
Primary owner: `868hukucf`  
Upstream sources: [`01-market-intelligence.md`](./01-market-intelligence.md), [`02-brand-strategy.md`](./02-brand-strategy.md)

## Purpose

Turn the Chapter 01 market read and Chapter 02 brand system into one shared visual and product grammar for Job Filter. This chapter governs how trust, progress, review, and reusable work should look and behave across later website, activation, and lifecycle surfaces.

## Usage Rules

- Build from Chapter 01 and Chapter 02. Do not re-derive market tensions, trust architecture, category framing, or CTA logic from older artifacts.
- Use this chapter when making visual-system, component, layout, state, and interaction decisions.
- Keep this chapter implementation-guiding. It should tell downstream chapters what to preserve, what to show, and what to avoid.
- Do not use this chapter to decide website IA, lead magnet structure, activation page layouts, or lifecycle sequencing.
- Treat trust states as product behavior, not decorative UI polish.

## What This Chapter Inherits

### Chapter 01 Inputs

- `Free tier` and free-to-start clarity are trust requirements.
- No current-state promise may imply auto-apply.
- Guided story extraction is a differentiator, not a side utility.
- Multiple role lanes are a first-class need.
- Review-before-send and inspectable reasoning are trust architecture.
- Application tracking and later A/B asset testing are downstream needs, not optional extras.

### Chapter 02 Inputs

- Job Filter is a truth-first job-search workspace for serious operators.
- The brand promise is grounded in one reusable Profile, better-fit applications, and visible review before sending.
- The approved CTA ladder is:
  - public primary: `Build my job profile`
  - exploratory: `See how it works`
  - internal primary: `Continue setup`
- The product should lead with mechanism and review logic, not generic AI convenience.
- `used`, `missing`, and `excluded` are part of trust language and must remain visible where rationale is shown.

## System Principles

| Principle | What it means in the interface | Why it is binding |
| --- | --- | --- |
| Calm over noisy | Surfaces should feel composed, editorial, and deliberate. Avoid dashboard clutter and novelty styling. | The Burnt-Out Applicant needs lower cognitive drag and higher trust. |
| Profile is the anchor | The workspace should keep Profile, the current editing task, and the downstream document relationship legible. | The product promise depends on reusable leverage, not one-off drafting. |
| Review is part of the workflow | Rationale, exclusions, and unresolved states must appear before final acceptance moments. | Review-before-send is part of the product value. |
| Suggestions stay separate from truth | Suggested content must look provisional until approved. Approved content must look stable and reusable. | Sophisticated Skeptic users need visible grounding boundaries. |
| Multiple role lanes stay visible | Lane choice, lane comparison, and lane-specific consequences should not disappear after setup. | Lane Discovery users need help choosing and translating fit. |
| Momentum is earned | Progress states should reward completed grounding work, not hide unresolved questions. | Setup must feel like compounding leverage, not intake tax. |
| System quality beats AI theater | Show workflow quality, document quality, and inspectability. Do not signal black-box magic. | The category strategy rejects generic AI convenience positioning. |

## Visual Foundations

### Typography

Use typography to separate trust-critical reading from operational chrome.

| Role | Guidance | Usage notes |
| --- | --- | --- |
| Display headline | Reserved for high-value public framing and a few anchor moments inside the product | Use sparingly. Never let display styling overpower review surfaces. |
| Section headline | Primary structural heading for modules, workspace areas, and major page sections | Must read clearly at desktop and tablet without looking like a landing page hero. |
| Card title | Strong, compact label for grouped actions and builders | Prefer clarity over flourish. |
| Body | Default reading text for instructions, rationale, and system guidance | Optimize for comfortable scanning over long forms and review states. |
| Meta | Secondary labels such as step labels, timestamps, helper labels, status context | Use muted contrast, but keep legible. |
| Data or token label | Short labels for chips, field states, proof IDs, lane names, and status rows | Keep compact and crisp. |

Typography rules:

- Reading text should feel comfortable in long-form workspace contexts, not compressed into dashboard density by default.
- Heading rhythm should guide attention without making every module feel equally loud.
- Rationale and proof surfaces need readable body text first, not decorative typography.
- Links must remain visibly branded and distinguishable from neutral copy.

### Color Roles and Token Logic

Color should create hierarchy, state clarity, and warmth without drifting into glossy marketing gradients.

| Token role | Job | Guidance |
| --- | --- | --- |
| `canvas` | App or page background | Soft warm neutral or lightly tinted foundation, never stark white everywhere |
| `shell` | Outer workspace or section shell | Slightly stronger tint than canvas to create containment |
| `surface-default` | Standard cards and form modules | Clean, quiet, readable base surface |
| `surface-emphasis` | Important grouped modules such as key builders, CTA zones, or lane summaries | Use restrained tinting, not saturated fills |
| `surface-review` | Rationale, review, and trust zones | Distinct from default surfaces, calm but clearly purposeful |
| `surface-success` | Positive completion or ready states | Muted positive tone, never celebratory neon |
| `surface-caution` | Missing, blocked, or unresolved states | Warm caution tint with enough contrast for dense copy |
| `surface-excluded` | Excluded or out-of-scope content | Neutral-cool or desaturated state that reads intentionally withheld |
| `border-subtle` | Default containment | Soft edge that prevents white-on-white collapse |
| `border-strong` | Focus, active state, or selected state | Use for orientation and user-controlled emphasis |
| `accent-forest` | Brand-forward emphasis | Primary accent for interactive emphasis, selected states, and branded links |
| `text-default` | Primary reading text | High-contrast, editorial, stable |
| `text-muted` | Secondary explanation | Lower contrast, still readable |
| `text-inverse` | Text on dark emphasis surfaces | Reserved for contained contrast moments only |

Color rules:

- Prefer richer tinted surfaces over stacking plain white cards on a plain white page.
- Keep green or forest accents controlled and purposeful. Do not fill large blocks with flat brand color just to create emphasis.
- Review states need clearer color distinction than standard layout grouping.
- Free-to-start and trust messaging may use emphasis, but pricing should not dominate the visual system.
- Do not use purple-forward SaaS styling or cheap gradients.

### Surface Hierarchy

Use a four-level surface hierarchy:

1. `canvas`, page or app backdrop
2. `shell`, major workspace or section wrapper
3. `surface-default` and `surface-emphasis`, primary working modules
4. `surface-review`, `surface-success`, `surface-caution`, and `surface-excluded`, trust or status layers

Surface rules:

- Each level should feel intentionally nested.
- Review and proof surfaces should feel integrated into the workflow, not bolted on as alerts.
- Sections that carry final acceptance or rationale weight should never disappear into the same treatment as low-stakes helper content.

### Spacing and Layout Rhythm

Spacing should communicate sequence and importance.

| Rhythm layer | Guidance |
| --- | --- |
| Macro spacing | Separate major zones such as rail, editor, preview, and footer actions with generous breathing room |
| Section spacing | Keep headline, support text, and module groupings clearly distinct |
| Module spacing | Use consistent internal padding so forms, builders, and rationale rows feel calm |
| Dense operational spacing | Reserve tighter rhythm for chips, compact state rows, and timeline summaries only |

Layout rules:

- The dominant desktop workspace pattern is top step grammar plus main editor plus persistent preview relationship.
- Tablet should preserve orientation first, then stack or relocate the preview without severing the cause-and-effect relationship.
- Mobile should keep the current task dominant while making preview, status, and rationale reachable without overwhelming the step flow.
- Avoid giant flat canvases with floating cards and weak containment.

### Radius, Borders, and Shadows

| Element | Rule |
| --- | --- |
| Major workspace shells | Medium radius, restrained elevation, visible containment |
| Standard modules | Slightly tighter radius, subtle border, minimal shadow |
| Inputs and inline controls | Crisp radius with clear focus ring and readable edge |
| Alerts and review modules | Use border plus tint first, shadow second |

Guidance:

- Border structure matters more than shadow theatrics.
- Shadows should help depth, not create glossy cards.
- Heavier borders are acceptable on trust surfaces, active states, and selected lane or role modules.

### Motion Principles

Motion should explain change and reward progress, not perform personality.

| Motion type | Allowed behavior | Disallowed behavior |
| --- | --- | --- |
| Button hover and press | Subtle elevation, color shift, or border change that confirms actionability | Bouncy scaling, dramatic glow, or playful spring motion |
| Disclosure expand and collapse | Soft reveal that clarifies more reasoning is available | Accordion snaps that feel abrupt or theatrical |
| Step progression | Progress fill, active-step emphasis, preview refresh, or subtle state confirmation | Full-screen step transitions that break workspace continuity |
| Draft refresh or preview update | Calm inline transition that preserves orientation | Flashy loading sequences that imply black-box generation magic |

Motion rules:

- Keep durations short and calm.
- Use motion to reinforce state clarity and connection between edit and preview.
- Never use motion to hide a lack of reasoning visibility.

## Responsive Foundations

### Desktop

- Keep the top horizontal step grammar visible when the user is still in a guided sequence.
- Preserve the persistent preview relationship as a parallel surface, not an afterthought.
- Use three-zone logic when the surface needs step orientation, active editing, and live output context.
- Keep wide tables or status matrices inside contained wrappers with horizontal overflow inside the wrapper only.

### Tablet

- Collapse from three zones to two strong priorities: active editor first, preview second.
- Reduce the step grammar to a smaller step summary or fewer columns. Do not shrink six steps into illegible pills.
- Keep major CTA actions close to the active editor, not stranded below long preview content.
- Move rationale and review modules below the active content only if they remain easy to revisit.

### Mobile

- Make the current task and next approved action unmistakable.
- Replace wide matrices with stacked modules or contained scrollers.
- Use sticky or near-bottom primary actions only when they do not obscure trust content.
- Keep preview and rationale accessible as modules, drawers, or follow-on surfaces, but do not force them to compete with form completion.

### Containment Rules

- No page-level horizontal spill.
- Wide data structures must scroll within a contained wrapper, not across the page.
- Card rows should wrap or stack before they overflow.
- Responsive behavior must be designed for desktop, tablet, and mobile explicitly. Do not rely on generic collapse.

## Component and State Grammar

### CTA Treatments and Button Hierarchy

The approved ladder from Chapter 02 remains binding.

| Role | Control | Visual guidance | Notes |
| --- | --- | --- | --- |
| Public primary | `Build my job profile` | Strongest contained emphasis, clear contrast, concrete destination | Use only where the mechanism is already clear |
| Exploratory | `See how it works` | Secondary or tertiary treatment, visibly interactive, never louder than public primary | Must lead to concrete explanation |
| Internal primary | `Continue setup` | Quiet premium emphasis, light surface, darker neutral text, restrained border and shadow | This is progress language, not persuasion |
| Secondary internal | Back, edit, skip, compare, review | Lower emphasis but still clearly interactive | Keep hierarchy obvious |

Button rules:

- Public-primary styling should feel confident and contained, not loud.
- Internal-primary styling should feel premium and calm, not like a muted disabled button.
- Disabled buttons must show why the action is blocked when the reason is not obvious.
- Focus states must be visible and accessible.
- No button label may imply auto-apply, auto-send, or hidden automation.

### Links

Link rules:

- Keep links visibly branded, not generic browser blue and not neutral body text.
- Use inline links for explanation, provenance, and policy boundaries.
- Use text links instead of buttons when the action is informational, low-risk, or secondary.
- Hover and focus states should strengthen brand recognition without becoming decorative.

### Inputs and Form Fields

Use fields to distinguish fact capture, suggestion review, and optional enrichment.

| State | Meaning | Required cues |
| --- | --- | --- |
| Default | Ready for user input | Clear label, clear boundary, helper text if needed |
| Focus | User is actively working | Visible focus ring and stronger border |
| Filled | Value saved or present | Stable label and enough contrast to scan quickly |
| Suggested | Candidate content proposed by the system | Separate visual treatment from approved value |
| Approved | User-reviewed truth | Stronger stability cues than suggested |
| Missing | Required but unresolved | Clear caution state with direct next-step guidance |
| Error | Invalid or contradictory input | Precise error message, not generic warning |
| Excluded | Present but intentionally held out | Explicit exclusion state and recovery path |

Field rules:

- Suggested values must never visually collapse into approved values.
- Approval should be a visible state change when the distinction matters.
- Responsibilities and results should stay structurally separate in experience flows.
- Optional detail builders should not visually compete with required truth-capture fields.

### Cards and Sections

Card rules:

- Cards should be containers with a clear job, not default decoration.
- Use section shells to group related steps, builders, or review modules that belong together.
- Give high-trust modules a more intentional surface treatment than generic explanatory cards.
- Avoid stacking too many same-weight cards with weak hierarchy.

### Banners and Status Surfaces

Use status surfaces for operational clarity, not marketing celebration.

| State | Use for | Rules |
| --- | --- | --- |
| Informational | Explaining what unlocks next or what changed | Keep copy short and operational |
| Success | Completed steps, saved state, or unlocked path | Use muted positive treatment |
| Caution | Missing data, unresolved proof, incomplete setup | Explain what is missing and what to do next |
| Blocked | Hard dependency not met | Be explicit about the blocker and the exact next action |
| Review | A final check before acceptance | Must keep rationale visible, not buried |

Status rules:

- Padding and internal rhythm should feel symmetrical and deliberate.
- Do not use large colored slabs that overpower the workspace.
- Status modules should be easy to scan, especially inside multi-step flows.

### Tabs, Disclosures, and Navigation States

Navigation rules:

- Active tabs should read as clearly selected without looking like a new page hero.
- Hover states should cue interactability, not create layout shift.
- Focus states should be explicit.
- Tabs should remain useful when the product grows to include Profile, Jobs, Assets, Proof Library, and Settings.

Disclosure rules:

- Use disclosures for deeper rationale, lineage, and explanation.
- Do not hide required review states behind collapsed UI if the user must see them before acting.
- Disclosure headers should explain what extra certainty or reasoning the user will get.

### Step-Rail Guidance

The top horizontal step grammar is a system anchor.

Step guidance:

- Use it for guided setup and other clearly sequenced work.
- Keep the active step obvious, completed steps quiet, and future steps visible but not distracting.
- Preserve the relationship between step progress, current editor surface, and persistent preview.
- Do not replace the step grammar with a left-side wizard rail unless a later packet explicitly reopens that structure.

### Builder Patterns

Builders should help the user define truth before the system formats it into downstream assets.

| Builder | Required behavior |
| --- | --- |
| Experience | Keep company, role, dates, responsibilities, and results structurally distinct. Show unresolved proof explicitly. |
| Education | Support fact capture first, then optional enrichment such as honors or coursework. |
| Certifications | Keep issuer and date visible. Hold incomplete certifications out of final assets until grounded. |
| Languages | Treat as optional but structured. Allow proficiency to stay explicit where relevant. |
| Story extraction modules | Keep candidate stories suggestive until approved. Show what can carry forward into Profile. |

Builder rules:

- Group builders by the kind of truth they help define.
- Keep optional enrichment secondary to core grounding work.
- Show how builders feed Profile, not just how they fill fields.

### Preview Panels

Preview is part of the product promise.

Preview rules:

- Keep the preview stable, document-like, and close to the editing context.
- Reflect approved changes quickly enough to preserve the edit-to-output loop.
- Distinguish between structure preview and final-send confidence.
- On smaller screens, move the preview below the editor or into an adjacent module, but keep it legible and connected.

### Rationale and `Why this draft`-Style Trust Surfaces

These surfaces are not optional reassurance layers. They are trust architecture.

Required elements:

- visible `used`, `missing`, and `excluded` rows
- indication of suggestion versus approved truth
- explicit unresolved items before final acceptance
- path back to edit or approve the right source
- enough provenance to explain why a draft changed

Rationale rules:

- Use plain language, not model-speak.
- Do not reduce rationale to a single confidence score.
- Keep excluded items recoverable and explicit.
- Show the cost of missing context when it affects draft quality or fit.

## Trust and Grounding States

### Suggestion Versus Approved Truth

System behavior must distinguish:

| State | Meaning | Presentation rule |
| --- | --- | --- |
| Suggested | Extracted or generated candidate content that has not been approved | Use provisional styling and clear approval action |
| Approved truth | User-reviewed content safe to reuse downstream | Use stable styling and allow reuse across surfaces |
| Excluded | Content intentionally withheld from downstream use | Keep visible where rationale matters and provide recovery path |

### `Used`, `Missing`, and `Excluded`

- `Used` should show what actively informed the current output.
- `Missing` should show what would strengthen the output but is not yet grounded.
- `Excluded` should show what stayed out and why, especially when the item looks important at first glance.

Do not collapse these into one generic confidence state.

### Review-Before-Send Visibility

- Final-draft acceptance surfaces must expose review before commitment.
- When a draft is incomplete, generic, or missing important proof, the user should see that before they act.
- Approval flows should make it obvious when the user is accepting a grounded draft versus saving work in progress.

### Inspectable Reasoning Visibility

- Show why a draft or recommendation changed in direct language.
- Keep rationale close to the relevant output, not buried in a distant audit screen.
- Use expandable detail for depth, not for hiding required truth.

### No Hidden Auto-Apply Cues

- Avoid labels, icons, or status treatments that imply jobs will be applied to automatically.
- Do not describe queueing, sending, or recruiter submission as automatic unless a later governance reset changes the program decision.
- Keep preparation, review, and final user control visible in both wording and state design.

## Product-Specific System Implications

### Profile Workspace

- `Profile` remains the user-facing name.
- The shared workspace should preserve the relationship between step orientation, active editing, and preview output.
- Setup should read as building reusable search infrastructure, not filling a one-time intake form.

### Guided Story Extraction

- Treat story extraction as a system layer between raw experience and finished assets.
- Make it clear when the product is helping define the story versus formatting approved content.
- Keep provisional story fragments clearly separated from approved Profile content.

### Multiple Role Lanes

- Use lane modules, lane chips, summaries, or compare states to keep multiple credible targets visible.
- Do not assume the user has one lane only after initial setup.
- Lane-related system states should clarify what changes by lane and what remains reusable.

### Application Tracking

- Tracking surfaces should connect role decisions, selected assets, and outcome learning.
- Status design should support progress through the search lifecycle without becoming a generic CRM clone.
- Tracking should feel like an extension of the Profile-led system, not a disconnected afterthought.

### Later A/B Asset Testing

- The system should leave room for comparing asset variants, lane variants, or outcome patterns later.
- Future testing views should preserve lineage to approved truth and selected job context.
- Do not hard-code the product into one immutable draft path that cannot support later comparison.

## Anti-Patterns and Disallowed System Moves

- generic purple SaaS styling
- flat white-on-white card stacks with weak containment
- cheap gradients or glossy status panels
- board-style spill that requires horizontal panning at the page level
- black-box AI cues that hide review or reasoning
- wizard flows that sever the preview relationship without a deliberate replacement model
- buttons or status treatments that imply auto-apply or recruiter-ready output without review
- rationale surfaces that hide `used`, `missing`, and `excluded`
- suggestion states that visually pass as approved truth
- overloading the system with celebratory success treatment when caution or review is more honest

## Downstream Implications

| Chapter | What it must inherit |
| --- | --- |
| 04, Website and Public Funnel | The visual system should express the same calm trust architecture, branded links, CTA hierarchy, free-to-start clarity, and no-auto-apply boundaries without deciding the IA here. |
| 05, Activation and Core App | The activation surfaces must preserve the top horizontal step grammar, persistent preview relationship, grounded builder states, rationale visibility, and multiple-role-lane support. |
| 06, Lifecycle Messaging and Email System | Lifecycle work should use the same trust-state grammar, status clarity, and language boundaries when summarizing progress, drafts, review needs, and next actions. |

## What This Chapter Does Not Own

This chapter does not decide:

- website IA
- lead magnet structure
- activation page-layout compositions
- lifecycle sequencing
- pricing page structure
- Figma artifact design work

Those decisions belong to later packets and must inherit this system when they are made.

# Foundation Series 03, Shared Visual and Product System

Last updated: 2026-03-13  
Status: active living chapter  
Primary owner: `868hukucf`  
Upstream sources: [`01-market-intelligence.md`](./01-market-intelligence.md), [`02-brand-strategy.md`](./02-brand-strategy.md)

## Foundation Series map

| Chapter | Role |
| --- | --- |
| 01 Market Intelligence | canonical market, trust, and category inputs |
| 02 Brand Strategy | canonical message, CTA, and language system |
| 03 Shared Visual and Product System | shared visual hierarchy, component grammar, trust states, and reusable assemblies |
| 04 Website and Public Funnel | public-site IA, page roles, section flow, and auth handoff |
| 05 Activation and Core App | app IA, route inventory, layout composition, and flow behavior |
| 06 Lifecycle Messaging and Email System | campaign logic, lifecycle structure, and final email artifacts |

Use the same chapter shell pattern across the Foundation Series:

1. chapter family map
2. purpose and scope
3. governing system body
4. anatomy, handoff, and later-chapter requirements

## Purpose

Define the reusable visual system, interaction grammar, trust-state grammar, and product assemblies that later Job Filter surfaces must inherit.

## Scope of this chapter

- Use this chapter when specifying foundations, reusable components, shared assemblies, and state behavior.
- Use Chapter 04 for public-site IA, page roles, section flow, worksheet placement, subscriber capture, and auth handoff.
- Use Chapter 05 for app IA, route inventory, route-level layouts, and modal or drawer ownership by flow.
- Use Chapter 06 for lifecycle sequence design, campaign logic, and final email artifacts.
- Treat Chapter 01 as the source for market tensions, pricing-opacity concerns, trust triggers, and lane-level workflow needs.
- Treat Chapter 02 as the source for category framing, message hierarchy, CTA ladder, and language boundaries.
- Keep all locked copy calm, precise, and human. Do not use AI theater, proof inflation, or hidden-automation cues.

## Design direction

Job Filter should look and feel like a premium black-glass workspace built for careful job-search decisions. The system should read as high-trust, modern, and controlled. It should never feel like a generic purple SaaS kit, a paper-editorial scrapbook, or a glossy AI demo.

The system must preserve the product anchors already proven and already locked:

- `Build my job profile`
- `See how it works`
- `Continue setup`
- `Profile`
- no auto-apply in the current-state promise
- review-before-send
- inspectable reasoning
- guided storytelling
- multiple role lanes

## System principles from Chapters 01 and 02

| Principle | System implication |
| --- | --- |
| Trust must be earned through clarity | Review states, rationale, provenance, and unresolved gaps must stay visible. |
| Better-fit execution matters more than raw volume | Lane comparison, story shaping, and asset review must feel central, not secondary. |
| Guided storytelling is a differentiator | Builders must separate raw fact capture, suggested story framing, and approved reusable truth. |
| Multiple lanes are normal | Lane modules and lane comparison patterns must be reusable throughout the system. |
| Free-to-start clarity reduces friction | Entry and pricing cues should feel transparent, but pricing should not dominate the visual system. |
| Black-box AI cues damage trust | Motion, labels, banners, and automation language must stay inspectable and user-controlled. |
| Calm containment helps fatigued job seekers | Use strong shells, clear rhythm, and disciplined hierarchy instead of noisy dashboards or equal-weight card stacks. |

## Visual foundations

### Typography

| Token | Family | Weight | Size / line height | Use |
| --- | --- | --- | --- | --- |
| `type-display` | Newsreader | 600 | 52 / 54 | rare editorial or chapter anchor moments |
| `type-section` | Newsreader | 600 | 36 / 40 | primary section headlines |
| `type-surface-title` | Plus Jakarta Sans | 700 | 24 / 30 | major surface titles, modal titles, panel anchors |
| `type-card-title` | Plus Jakarta Sans | 700 | 18 / 24 | card titles, builder titles, state group titles |
| `type-body-lg` | Plus Jakarta Sans | 500 | 17 / 28 | primary reading size on desktop and dense trust surfaces |
| `type-body` | Plus Jakarta Sans | 500 | 15 / 24 | standard product and artifact body copy |
| `type-body-sm` | Plus Jakarta Sans | 500 | 13 / 21 | helper text, support copy, policy notes |
| `type-meta` | Plus Jakarta Sans | 700 | 11 / 16 | labels, eyebrows, anatomy tags, compact statuses |
| `type-data` | Plus Jakarta Sans | 700 | 12 / 18 | compact rows, metadata, timestamps, chips |

Typography rules:

- Use serif selectively for meaning, not as the default reading texture of the whole system.
- Keep primary reading sizes comfortable. Desktop trust surfaces should not default below `15px`.
- Dense builders and state-heavy modules stay in sans-serif.
- Links remain visibly branded and distinguishable from body text.
- Reduce type size before reducing contrast only when space is genuinely constrained.

### Color roles and token logic

| Token | Value | Role |
| --- | --- | --- |
| `canvas-obsidian` | `#05070a` | page background |
| `canvas-depth` | `#0a0f14` | deeper background plane |
| `glass-panel` | `rgba(16, 22, 30, 0.78)` | main shell surface |
| `glass-elevated` | `rgba(22, 30, 40, 0.84)` | emphasized card or modal surface |
| `glass-muted` | `rgba(11, 16, 22, 0.72)` | secondary grouping surface |
| `glass-overlay` | `rgba(6, 10, 14, 0.76)` | drawer, modal, and overlay field |
| `ink-primary` | `#f3f6fa` | primary text |
| `ink-secondary` | `#c6d0db` | secondary text |
| `ink-muted` | `#90a0b2` | tertiary text and metadata |
| `line-subtle` | `rgba(218, 230, 243, 0.12)` | default border |
| `line-strong` | `rgba(218, 230, 243, 0.22)` | selected or active border |
| `accent-mint` | `#79d6b4` | branded emphasis, primary action |
| `accent-mint-strong` | `#4bbb91` | active branded emphasis |
| `accent-mineral` | `#8fb1d9` | link, provenance, and informational accent |
| `state-used` | `rgba(72, 149, 118, 0.18)` | grounded positive state |
| `state-missing` | `rgba(196, 149, 86, 0.2)` | unresolved required state |
| `state-excluded` | `rgba(157, 98, 109, 0.18)` | explicit exclusion state |
| `state-error` | `rgba(191, 90, 105, 0.22)` | recoverable error state |
| `state-offline` | `rgba(101, 117, 138, 0.2)` | degraded or offline state |

Color rules:

- Use tinted glass layers and border contrast to create hierarchy. Do not rely on large flat black panels alone.
- Keep branded green emphasis disciplined. It should guide action, not flood the interface.
- Use mineral blue for provenance, research links, and quieter secondary emphasis.
- Avoid purple-forward palettes, mesh gradients, rainbow highlights, and default dark-mode glow effects.
- Public microcopy may use `free to start` for clarity. That does not change the governance lock of `Free tier`.

### Surface hierarchy

The shared surface stack should be:

1. background canvas
2. main glass shell
3. elevated working card
4. review or rationale card
5. inline state row

Surface rules:

- The page canvas should feel deep and quiet.
- Main shells should read as contained and premium, not theatrical.
- Review and rationale surfaces should feel slightly more luminous or bordered than neutral cards.
- Avoid flat white-on-white card stacks and equal-weight grids with no emphasis ladder.

### Spacing and layout rhythm

| Token | Value | Use |
| --- | --- | --- |
| `space-4` | `4px` | compact icon gaps only |
| `space-8` | `8px` | chip spacing, compact state rows |
| `space-12` | `12px` | input stacks, compact cards |
| `space-16` | `16px` | default module padding and gap rhythm |
| `space-24` | `24px` | section rhythm inside shells |
| `space-32` | `32px` | major grouping change |
| `space-48` | `48px` | macro separation between work zones |
| `space-64` | `64px` | major page or artifact section change |

Layout rules:

- Use narrower readable columns before shrinking type too aggressively.
- Desktop can support three-zone logic when the system needs step context, editing, and preview.
- Tablet should keep two strong priorities, usually editor first and preview second.
- Mobile should favor one active task with quick access to review context.
- Wide tables, inventory matrices, and analytics blocks must scroll inside contained wrappers only.

### Radius, borders, and shadows

| Token | Value | Use |
| --- | --- | --- |
| `radius-xl` | `28px` | chapter shells and major containers |
| `radius-lg` | `22px` | primary cards, drawers, modals |
| `radius-md` | `16px` | fields, tabs, chips, compact modules |
| `radius-sm` | `12px` | dense controls and metadata rows |
| `shadow-lg` | `0 28px 70px rgba(0, 0, 0, 0.34)` | hero shells and large overlays |
| `shadow-md` | `0 18px 42px rgba(0, 0, 0, 0.28)` | cards, drawers, modals |
| `shadow-sm` | `0 10px 24px rgba(0, 0, 0, 0.22)` | compact modules and floating controls |

Rules:

- Borders establish structure. Shadows support depth.
- Focus, active selection, and review-critical surfaces should strengthen border clarity.
- Avoid soft, blurry glow as the primary separation tool.

### Motion principles

Allowed behaviors:

- button hover with subtle lift, darker border, and tighter shadow
- pressed state with a slight settle
- disclosure expansion with stable height growth and no clipped copy
- step progression with clear active-state movement and small progress confirmation
- drawer or modal entry with calm fade and short travel
- toast entry with short fade and low-distance slide

Disallowed behaviors:

- bounce
- elastic scale
- hero wipes
- attention-hunting glow pulses
- motion that implies invisible AI work the user cannot inspect

### Illustration and visual-language rules

- Favor document-adjacent mock content, precise UI anatomy, and grounded representative copy.
- Use iconography sparingly and structurally, not as decoration.
- Keep visual metaphors tied to workflow quality, review, and clarity.
- Avoid generic AI sparkles, orbit graphics, futuristic holograms, or glossy startup hero treatment.

### Responsive and containment rules

#### Desktop

- Use the least-intrusive progress or section context that keeps the user oriented during guided setup.
- Chapter 05 is not required to use a top horizontal step rail when inline section context or embedded modes are clearer.
- Keep preview large enough to preserve cause and effect.

#### Tablet

- Reduce to two clear priorities without losing access to preview or rationale.
- Collapse side utilities before collapsing the main review relationship.
- Keep tabs and step context readable.

#### Mobile

- Keep the current task obvious.
- Use drawers, stacked modules, and scoped tabs instead of crushed multi-column logic.
- Keep rationale and preview reachable within a few actions.

#### Containment

- No page-level horizontal spill.
- No squeezed multi-device rows that force unreadable review at normal zoom.
- Tables, analytics blocks, and inventories must live inside scrollable contained wrappers.
- Shells should wrap or stack before the page overflows.

## Reusable interaction families

### CTA families

| Family | Control | Role | Rules |
| --- | --- | --- | --- |
| Public primary | `Build my job profile` | strongest branded action | use when the mechanism is already clear |
| Exploratory | `See how it works` | lower-friction explanation path | leads to concrete explanation, not aimless browsing |
| Internal primary | `Continue setup` | premium progress action | quieter shell, darker text, restrained border and shadow |
| Internal secondary | Back, Compare, Review, Save | subordinate action | must remain active-looking when available |

CTA rules:

- Public primary should feel confident and high-trust, not loud.
- Exploratory CTA should feel informative, not timid.
- Internal primary should feel premium and calm, not washed out or disabled.
- Disabled controls should explain the blocker if it is not obvious.
- No CTA may imply auto-apply, auto-send, or hidden automation.

### Navigation states

Required states:

- default
- hover
- active
- pressed
- focus
- disabled when relevant

Rules:

- Use the same active-state grammar across top nav, tabs, local workflow context, settings nav, and email preference nav.
- Hover may strengthen fill, border, or underline, but it should not shift layout.
- Focus must remain visible without feeling decorative.

### Link states

Required families:

- branded inline link
- quieter policy or meta link
- provenance link
- disabled or unavailable link where relevant

Rules:

- Links must look intentional and branded.
- Provenance and explanation links should feel quieter than CTAs, but not anonymous.
- Do not bury proof sources in unstyled gray text.

### Inputs and form-field states

Required field anatomy:

- label
- helper text or state explanation when needed
- input shell
- inline state cue
- error or review note
- optional approval action where needed

Required field states:

- default
- focus
- filled
- suggested
- approved
- missing
- error
- excluded
- disabled

Rules:

- Suggested values must never look identical to approved truth.
- Approved truth should feel stable and reusable.
- Responsibilities and results stay structurally separate in work-history capture.
- Optional enrichment stays visually secondary to grounded fact capture.

### Cards and section shells

Required shell families:

- page shell
- section shell
- working card
- review card
- compact summary card
- list row shell

Rules:

- Every shell should have a clear job and a distinct emphasis level.
- High-trust modules should not look like generic explainer cards.
- Avoid equal-weight grids with no orientation hierarchy.

### Banners and status surfaces

Required families:

- informational
- success
- caution
- blocked
- review

Rules:

- Keep status language operational and precise.
- Match banner padding and alignment across variants.
- Missing or blocked states should point to the next grounded action.

### Tabs, disclosures, accordions

Rules:

- Tabs should stay compact and orientation-first.
- Disclosures should reveal secondary detail, not hide mandatory truth.
- Accordions should expand smoothly without clipped copy, unstable bounce, or abrupt layout breakage.

### Drawers, overlays, and modals

Required families:

- side drawer
- mobile drawer
- centered modal
- confirmation modal

Rules:

- Preserve context and recovery path.
- Do not push long-form grounding work into modals.
- Use drawers for supporting context, comparison, provenance, or compact rationale.

### Toasts and inline system feedback

Required families:

- transient success toast
- caution toast
- inline save state
- inline warning row

Rules:

- Toasts should confirm outcome quickly.
- High-stakes issues also need inline visibility near the affected surface.
- Do not celebrate incomplete or still-unreviewed work.

### Empty, loading, error, and offline states

Required families:

- empty
- loading
- error
- offline or degraded

Rules:

- Empty states should point to the next meaningful action.
- Loading states should not imply hidden intelligence or finality.
- Error states must preserve approved truth already entered.
- Offline states must make sync risk explicit where it matters.

## Trust-state grammar

### Suggestion versus approved truth

| State | Meaning | Presentation |
| --- | --- | --- |
| Suggested | extracted or generated candidate content not yet approved | provisional shell, explicit approve action, visibly separate from approved content |
| Approved truth | user-reviewed content safe to reuse | stable shell, reusable marker, lower visual volatility |
| Excluded | intentionally withheld from reuse | explicit explanation, recoverable path, distinct exclusion styling |

### `Used`, `Missing`, and `Excluded`

- `Used` shows what informed the output.
- `Missing` shows what would strengthen the output but is not yet grounded.
- `Excluded` shows what stayed out and why.

Do not collapse these into generic confidence language.

### Review-before-send

- Preview and rationale must remain close enough to review together.
- Acceptance moments must expose unresolved items before commitment.
- Incomplete, generic, or weakly grounded work must look incomplete, generic, or weakly grounded.

### Inspectable reasoning

- Explain changes in plain language.
- Use expandable detail for provenance, not for hiding mandatory review context.
- Keep excluded items recoverable.

### No hidden automation

- No labels, icons, banners, or motion should imply jobs are being sent automatically.
- Queueing, sending, or irreversible actions must read as user-controlled if they appear later.
- The current-state product must read as preparation, review, and better-fit execution.

## Product-specific surfaces and assemblies

### Profile workspace anchor

The shared desktop anchor remains:

1. local workflow context or section progress
2. main editor
3. persistent preview or inspector relationship when it clarifies the work

Rules:

- `Profile` remains the user-facing name.
- Preview should read like a real output artifact, not an abstract dashboard.
- Workflow context should remain visible without dominating the workspace.
- Proof approval may appear as an embedded mode inside the `Profile` workspace when that keeps truth review closer to the source record.

### Section progress and local workflow context

Required anatomy:

- section or mode label
- completion state
- active state
- future state where relevant
- progress cue where helpful

Rules:

- Orientation is flexible. Use the pattern that keeps the active workspace clearest.
- Do not force a top horizontal rail when embedded workflow context is more legible.
- Keep completion quiet and active state obvious.
- Smaller screens may compress spacing, but not into unreadable pill soup.

### Editor and preview relationship

Rules:

- Editing and preview response should feel connected.
- Preview remains persistent on desktop and quickly recoverable on smaller devices.
- Approval and review cues should relate to both editor and preview.

### `Why this draft` and rationale surfaces

Required anatomy:

- title
- direct explanation
- `used`, `missing`, and `excluded`
- next-step action
- provenance cue when needed

Rules:

- Use plain language, not model-speak.
- Do not reduce rationale to one confidence score.
- Keep exclusions visible and recoverable.

### Guided storytelling

Rules:

- Raw fact capture should come before polished narrative output.
- Suggested story framing should stay reviewable before approval.
- Per-role storytelling should remain separate when multiple lanes exist.
- Company and market research may inform story shaping, but they should read as grounding inputs, not magic insight.

### Builder family inventory

| Builder family | Required grammar | What must stay explicit |
| --- | --- | --- |
| Work history | company, role, dates, responsibilities, results, review status | responsibilities and results stay separate |
| Education | institution, credential, dates, optional enrichment, repeatable entries | multiple education records should remain separate and scannable |
| Skills and tools | category, tool or skill, lane relevance, optional evidence note | grouped by lane relevance, not keyword dumping |
| Certifications | issuer, certification, status, date, proof state, repeatable entries | incomplete proof stays unresolved and visible |
| Languages | language, proficiency, optional context, repeatable entries | optional but structured and list-friendly |
| Links | label, destination type, trust signal | branded destination and intent clarity |
| References | availability, note, privacy expectation | do not imply confirmed references if none exist |
| Reason for leaving | optional context, tone boundary, privacy cue | factual and optional, not forced narrative |

Builder rules:

- Repeated fields should use final-looking grouped rows or stacked modules, not compressed placeholder text.
- Responsibilities and results should remain distinct lists even when both appear in the same work-history module.
- Education, certifications, and languages should support multiple entries without collapsing into one generic summary row.

### Lane modules and lane comparison

Required shared-system views:

| View | Required structure | What must stay visible |
| --- | --- | --- |
| Kanban lane view | rank, lane name, fit signal, approved story count, missing proof count, selected asset context, action | status, proof state, add-lane or add-feed affordance |
| Sheet lane view | dense row with rank, lane name, fit signal, approved stories, missing proof, selected asset, next action | scannability, selected asset context, proof state |

Rules:

- Lane views must feel quantitative before they feel promotional.
- Comparison must preserve reusable and non-reusable story signals.
- Lane switching should not erase approved truth without warning.
- Add-lane and add-feed patterns should stay visible in both card-based and dense-row references.

### Application tracking

Rules:

- Tracking rows should connect company, role, lane, selected asset, current state, and next step.
- Tracking should support both card-based and dense-sheet references without losing lane rank or proof state.
- Tracking must support later lifecycle and reporting without turning into CRM clutter.
- Tracking surfaces should feel operational, not decorative.

### Company and market research inputs

Rules:

- Company profile modules should support grounding, not visual wallpaper.
- Market context, caution notes, provenance, and selected-asset relevance should stay visible where they affect judgment.
- Research inputs should help lane fit and story shaping, not replace user review.

### A/B asset testing implications

Rules:

- Variants need labels, lane ownership, lineage back to approved truth, and outcome tracking hooks.
- The system should support later testing without implying unsupported optimization claims.

### Command palette

Rules:

- Command palettes should prioritize direct navigation, compare actions, review actions, and lane or asset lookup.
- Use the same quiet hierarchy and keyboard state grammar as the rest of the system.

### Notifications

Rules:

- Notifications should support reminders, blockers, review requests, grounded progress signals, and lane-aware follow-up.
- Avoid celebratory tone when the work still requires user judgment.

### Settings families

Rules:

- Account, profile preferences, notifications, privacy, integrations, and experimentation settings should share a calm navigation grammar and consistent grouped-row structure.
- Sensitive settings should emphasize clarity and reversibility.

### Analytics families

Rules:

- Analytics should focus on momentum, comparison, asset use, and tracking quality.
- Analytics should keep lane rank, proof state, and asset lineage legible in both compact cards and denser rows.
- Avoid vanity-dashboard styling and equal-weight metric walls.
- A/B testing and lane comparison should feel traceable to approved truth and tracked outcomes.

### Email global component families

Required reusable email components:

- header
- summary block
- status strip
- CTA block
- footer

Rules:

- Email components inherit the same CTA ladder and trust-safe status language.
- Use branded links and direct explanations.
- Email summary and CTA blocks should carry selected-lane or selected-asset context when it affects the message.
- Do not let email surfaces imply hidden automation or unsupported results.

## UI anatomy index

| Family | Required anatomy | Required states | What cannot be simplified away |
| --- | --- | --- | --- |
| Public CTA | label, optional icon, nearby proof context | default, hover, active, pressed, disabled, focus | mechanism context |
| Field | label, shell, helper or review note, optional approval action | default, focus, filled, suggested, approved, missing, error, excluded, disabled | difference between suggestion and approved truth |
| Section progress / local workflow context | label, state, optional progress cue | future, active, complete, blocked | clear active location and completion state |
| Rationale row | reason, state marker, edit path | used, missing, excluded | explicit trust-state labels |
| Tracking row | company, role, lane, selected asset, next step | planned through archived | link to lane and asset context |
| Email block | header, summary, CTA, footer | context-specific status variants | trust-safe status and branded links |

## Anti-patterns

Do not use:

- warm editorial paper as the default system mood
- purple-first SaaS styling
- mesh or rainbow gradients
- flat white-on-white card stacks
- board-style spill
- black-box AI cues
- equal-weight dashboard grids with no review hierarchy
- rationale reduced to generic confidence bars
- motion that looks playful when the task is serious

## Handoff map

| Chapter | Owns | Does not own |
| --- | --- | --- |
| Chapter 03 | foundations, tokens, components, state grammar, reusable assemblies, UI anatomy | website IA, route-level app layouts, lifecycle campaign architecture |
| Chapter 04 | website IA, page roles, section flows, public funnel comps | shared component grammar that already belongs in Chapter 03 |
| Chapter 05 | app IA, route inventory, activation and core-app layout composition, route-level overlays | core token system or reusable component families |
| Chapter 06 | email sequence architecture and final email artifacts | shared UI grammar already defined here |

## Later chapter requirements

- Chapter 04 must inherit the calm black-glass containment, branded links, CTA ladder, free-to-start clarity, and public proof grammar defined here.
- Chapter 05 must support multiple role feeds or lanes, guided per-role storytelling, company and market research as grounding inputs, application tracking, later A/B asset testing, and reason-for-leaving tracking using the reusable assemblies defined here.
- Chapter 05 must preserve clear workflow context and a persistent editor-to-inspector or preview relationship where it helps, but it is not required to use a top horizontal step rail.
- Chapter 06 must inherit the same trust-state language, status surfaces, and CTA families instead of inventing a separate lifecycle visual language.

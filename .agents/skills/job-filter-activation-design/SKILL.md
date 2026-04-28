---
name: job-filter-activation-design
description: Create decision-complete design, UX, and copy packets for Job Filter brand docs, public funnel, activation, Profile, jobs, application tracking, and asset flows while preserving the approved brand-system direction. Use when tasks involve screen design, system-doc design, CTA ladders, component or state design, conversion-aware copy, design critique, or translating lead-thread feedback into implementation-ready UI decisions. Do not use for generic bug fixing, backend-only work, or to redefine approved CTA, IA, or visual direction without an explicit packet.
---

# Job Filter Activation Design

Use this skill to turn approved Job Filter direction into concrete UI decisions without reopening settled strategy.

## Workflow

1. Read the active packet first. If it is missing, stale, or contradictory, stop and route back to packet refresh.
2. Read the current governing sources before any older design docs:
   - `docs/product/job-filter-foundation-series-governing-packet-v7.md`
   - the active chapter-owner packet under `docs/product/packets/`
   - the relevant approved Foundation Series chapter artifact when it exists
3. If the task is for chapter 02, 03, 04, 05, or 06, read `docs/product/foundation-series/01-market-intelligence.md` before older strategy or design docs.
4. If the task is for chapter 03, 04, 05, or 06, read `docs/product/foundation-series/02-brand-strategy.md` before older strategy or design docs.
5. If the task is for chapter 04, 05, or 06, read `docs/product/foundation-series/03-product-system.md` before older product-system or activation artifacts.
6. If the task is for later website artifact packets or for chapter 05 or 06 work that depends on public entry, auth handoff, pricing-entry framing, lead magnet placement, or subscriber capture, read `docs/product/foundation-series/04-website-public-funnel.md` before older website artifacts.
7. Read only the references needed from this skill:
   - `references/brand-direction.md`
   - `references/copy-system.md`
   - `references/screen-patterns.md`
   - `references/inspiration-map.md`
8. Inspect the current implementation or current artifact before proposing change.
9. Produce a decision-complete packet or review:
   - user job and belief shift
   - exact UX model
   - exact copy
   - visual hierarchy and tokens
   - component and state structure
   - acceptance criteria
   - carry-forward risks
10. Keep the output packet-bound and implementation-oriented. Avoid vague inspiration language or broad redesign briefs.

## Guardrails

- Prefer guided modular flows over freeform design software.
- Prefer visible progress and certainty over black-box “AI magic”.
- Keep the user focused on confirming truth, not debugging parsing internals.
- Prefer one document or one surface family per pass over broad polish across every surface.
- Preserve the calmer premium document-workspace feel already proven in `Profile`.
- Preserve the top horizontal step grammar, minimized step-bar focus, and persistent preview relationship unless a packet explicitly reopens them.
- Reuse the canonical terminology from `references/copy-system.md` and the governing packet.
- Do not contradict the chapter-01 market read on trust, free-to-start clarity, no auto-apply, guided story extraction, multiple role lanes, or inspectable reasoning.
- Do not contradict the chapter-02 brand system on category framing, brand promise, message hierarchy, CTA ladder, trust and proof rules, or language classification.
- Do not contradict the chapter-03 product system on visual hierarchy, containment, state grammar, trust surfaces, step grammar, preview relationship, or anti-patterns.
- Do not contradict the chapter-04 website/public-funnel source on MVP page set, CTA map, lead magnet placement, subscriber capture purpose, pricing-entry framing, proof architecture, or signed-out to signed-in handoff.
- Keep the approved CTA ladder unless a packet explicitly reopens it:
  - `Build my job profile`
  - `See how it works`
  - `Continue setup`
- Use `Profile` as the user-facing surface name in docs and packets.
- Respect the Foundation Series ownership split:
  - chapter 04 website/public funnel decisions belong to `868hunzqm`
  - chapter 05 activation/core-app decisions belong to `868hukucf`
  - blocked implementation work in `868huafcx` must not be treated as current design authority
- Prefer warm/editorial direction, forest-led accents, richer tinted surfaces, and contained layouts.
- Do not recommend purple-forward generic SaaS styling, cheap gradients, flat white-on-white card stacks, or board-style spill.
- Keep brand and system docs client-facing. Keep governance and unresolved-delivery framing in the markdown packet.
- Do not let website and public-funnel scope drift into product-system or activation packets, and do not let activation decisions quietly rewrite website ownership.
- Keep application tracking and guided story extraction visible in system decisions when relevant.
- Do not invent new product scope without explicitly labeling it as future work.

## Output Pattern

Return the result in this order:

1. Objective
2. User job and belief shift
3. Recommended UX model
4. Exact copy
5. Visual/tokens implications
6. Implementation notes
7. Acceptance criteria
8. Risks and follow-ups

## When To Load Additional Context

- Read `docs/product/PRD_V2.md` for product constraints.
- Read the current governing packet and approved Foundation Series chapter docs before older specs if the task is design-direction sensitive.
- Read active UI files only for the specific flow being changed.
- Read screenshot or inspiration attachments only if the task is visual.

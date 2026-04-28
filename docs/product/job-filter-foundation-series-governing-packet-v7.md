# Job Filter Foundation Series Governing Packet v7

Last updated: 2026-03-29  
Status: canonical Foundation Series governance source  
Primary task: `868hukucf`  
Website/public funnel task: `868hunzqm`  
Blocked implementation reset: `868huafcx`

## Objective

Implement `FS0`, the Foundation Series governance reset, so repo docs, task packets, prompt docs, and tracker ownership all point to one coherent program structure before further design or implementation continues.

## FS0 Outcome

After `FS0`:

- this file is the only canonical governance packet for the Foundation Series
- `868hukucf` is the real design-governance packet for chapters 01, 02, 03, and 05
- `868hunzqm` owns chapter 04 and all public-funnel decisions
- `868huafcx` remains blocked as an implementation reset until the Chapter 04 strategy-source sufficiency rule is satisfied, the D2 design lane is approved, its FS8 task packet is refreshed, and WIP is available
- GPT-5.4 prompt guidance replaces stale GPT-5.3 prompt guidance

## Locked Program Decisions

- Entry model = `Free tier`
- Broader MVP app IA = design-locked now
- Auto-apply = future-state only

These decisions are program-level locks. Later packets may refine presentation, sequencing, and implementation, but they must not reopen these decisions without an explicit governance reset.

## Foundation Series Chapter Order

| Chapter | Name | Primary owner |
| --- | --- | --- |
| 01 | Market Intelligence | `868hukucf` |
| 02 | Brand Strategy | `868hukucf` |
| 03 | Shared Visual and Product System | `868hukucf` |
| 04 | Website and Public Funnel | `868hunzqm` |
| 05 | Activation and Core App | `868hukucf` |
| 06 | Lifecycle Messaging and Email System | `868hvvda6` |

## ClickUp Ownership and Gating

| Task | Ownership | Notes |
| --- | --- | --- |
| `868hukucf` | chapters 01, 02, 03, and 05, plus design governance | canonical design-governance task |
| `868hunzqm` | chapter 04 | owns website IA, public funnel, and pricing-entry framing |
| `868hvvda6` | chapter 06 | `DESIGN: Lifecycle messaging and email system` |
| `868huafcx` | blocked | no implementation reset until Chapter 04 strategy-source sufficiency is satisfied, the D2 design lane is approved, the FS8 task packet is refreshed, and WIP is available |

### Blocking Rule

`868huafcx` is not the active design authority and is not the active implementation packet right now.

Locked Chapter 04 sufficiency rule:

- Chapter 04 strategy-source approval plus the signed-out-to-`Profile` handoff is sufficient for the signed-in D2 implementation reset
- final Chapter 04 website page comps do **not** block `868huafcx`

It remains blocked until:

1. the Chapter 04 sufficiency rule above is satisfied by the existing strategy source and signed-out-to-`Profile` handoff under `868hunzqm`
2. the D2 design lane under `868hukucf` is approved as the current implementation-facing authority
3. the `FS8` implementation reset packet exists and the ClickUp task packet for `868huafcx` is refreshed to match that reset
4. WIP is available under policy before a new coding lane starts

## Artifact Naming Plan

The Foundation Series artifact family should use this numbered naming convention:

1. `01-market-intelligence.html`
2. `02-brand-strategy.html`
3. `03-product-system.html`
4. `04-website-desktop.html`
5. `05-website-mobile.html`
6. `06-activation-desktop.html`
7. `07-activation-mobile.html`
8. `08-email-system.html`

This naming plan is now the program default for artifact references, handoffs, and packet language.

## Packet Sequence

| Packet | Purpose | Primary output |
| --- | --- | --- |
| `FS0` | governance reset | `v7`, packet reset, prompt-doc reset, tracker alignment |
| `FS1` | chapter 01 | market intelligence chapter |
| `FS2` | chapter 02 | brand strategy chapter |
| `FS3` | chapter 03 | shared visual and product system chapter |
| `FS4` | chapter 04 | website and public funnel strategy source |
| `FS5` | chapter 04 artifacts | website desktop and mobile artifact packets |
| `FS6` | chapter 05 | activation and core app |
| `FS7` | chapter 06 | lifecycle messaging and email system |
| `FS8` | implementation reset | refreshed `868huafcx` packet after Chapter 05 approval and Chapter 04 strategy-source sufficiency are clarified |

## Authority Order

Use this order whenever repo docs, packets, or tracker state disagree:

1. verified ClickUp task packets and read-after-write sync receipts
2. current repo reality
3. this governing packet, `job-filter-foundation-series-governing-packet-v7.md`
4. active task packets under `docs/product/packets/`
5. Foundation Series chapter docs and `GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md`
6. `project-profile.md`, `PRD_V2.md`, `EPIC_SPECS_V2.md`, and `AI_OPERATING_MODEL.md`
7. thin wrappers and deprecated docs

If a lower source conflicts with a higher source, the higher source wins.

## What Belongs Where

### This governing packet

This file owns:

- chapter order
- program locks
- task ownership
- packet sequence
- artifact naming
- blocking logic
- authority order
- governance-level dependencies

### Task packets

Task packets own:

- objective
- scope in and scope out
- acceptance criteria
- delivery gates
- verification
- file shortlist
- sequencing for the task itself

### Foundation Series chapter docs

The chapter docs own:

- strategy articulation
- chapter-level design decisions
- polished examples and specimens
- implementation-guiding systems and patterns

They do not own packet sequencing, task gating, or tracker governance.

### Website chapter ownership

Chapter 04, under `868hunzqm`, owns:

- final MVP public-site IA
- whether `Product` and `Proof` remain standalone pages
- lead magnet landing page strategy
- subscriber capture function and handoff
- pricing-entry framing and free-tier framing
- auth/public funnel ownership
- website proof architecture

For `868huafcx`, Chapter 04 supplies the signed-out-to-`Profile` handoff as a sufficiency input only. Final website page comps remain owned here and do not gate the signed-in D2 implementation reset.

### Activation and implementation reset

Chapter 05 defines the canonical activation and core-app surfaces. `868huafcx` does not resume implementation until the D2 design lane under `868hukucf` is approved, the `FS8` packet reset and matching ClickUp task packet are in place, and WIP is available. Chapter 04 remains a sufficiency input through its strategy source and signed-out-to-`Profile` handoff, not through final website comp approval.

## Foundation Series Operating Rules

- One permanent lead thread.
- One active coding thread.
- No build without a packet.
- One writer per packet.
- Governance first, implementation second.
- Do not let website, activation, or implementation work redefine Foundation Series structure downstream.

## FS0 Scope

### Scope in

- create this `v7` governing packet
- create the real `868hukucf` packet
- create the GPT-5.4 prompt doc
- convert competing docs into thin wrappers
- update repo docs so the new authority order is explicit
- align ClickUp and GitHub if mutation is available

### Scope out

- chapter redesign work
- product-system rebuild work
- website or activation redesign
- lifecycle messaging design work
- `src/` or production-code changes

## Approval Gate for Moving Past FS0

`FS0` is complete only when:

- `v7` exists and is the canonical packet
- `868hukucf.md` exists and is a real governance packet
- `GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md` exists
- `job-filter-brand-experience-lock-v4.md` and `GPT_5_3_CODEX_PROMPT.md` are thin wrappers
- repo docs reflect the new Foundation Series structure
- tracker ownership and blocking logic are explicit

## Canonical Repo Entry Points During Foundation Series

- `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- `docs/product/packets/868hukucf.md`
- `docs/product/packets/868hunzqm.md`
- `docs/product/packets/868huafcx.md`
- `docs/product/foundation-series/01-market-intelligence.md`
- `docs/product/foundation-series/02-brand-strategy.md`
- `docs/product/foundation-series/03-product-system.md`
- `docs/product/foundation-series/04-website-public-funnel.md`
- `docs/product/GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md`
- `docs/product/orchestration/project-profile.md`

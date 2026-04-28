# Job Filter Product and Governance Package

Last updated: 2026-04-28

## Purpose

This folder is the canonical governance and product-doc package for Job Filter.

Use it to answer:

- what the Foundation Series currently governs
- which packet is active
- which task owns which chapter
- which prompt doc to use for new lead-thread and coding-thread sessions

## Authority Order

1. verified ClickUp task packets and read-after-write sync receipts
2. current repo reality
3. [`job-filter-foundation-series-governing-packet-v7.md`](./job-filter-foundation-series-governing-packet-v7.md)
4. active task packets under [`packets/`](./packets/README.md)
5. [`GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md`](./GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md) and [`orchestration/project-profile.md`](./orchestration/project-profile.md)
6. [`PRD_V2.md`](./PRD_V2.md), [`EPIC_SPECS_V2.md`](./EPIC_SPECS_V2.md), and [`AI_OPERATING_MODEL.md`](./AI_OPERATING_MODEL.md)
7. deprecated wrappers and legacy docs

## Foundation Series Reading Order

1. [`job-filter-foundation-series-governing-packet-v7.md`](./job-filter-foundation-series-governing-packet-v7.md)
2. [`packets/868hukucf.md`](./packets/868hukucf.md)
3. [`foundation-series/01-market-intelligence.md`](./foundation-series/01-market-intelligence.md)
4. [`foundation-series/02-brand-strategy.md`](./foundation-series/02-brand-strategy.md)
5. [`foundation-series/03-product-system.md`](./foundation-series/03-product-system.md)
6. [`foundation-series/04-website-public-funnel.md`](./foundation-series/04-website-public-funnel.md)
7. [`packets/868hunzqm.md`](./packets/868hunzqm.md)
8. [`packets/868huafcx.md`](./packets/868huafcx.md)
9. [`GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md`](./GPT_5_4_JOB_FILTER_OPERATING_PROMPTS.md)
10. [`orchestration/project-profile.md`](./orchestration/project-profile.md)
11. [`PRD_V2.md`](./PRD_V2.md), [`EPIC_SPECS_V2.md`](./EPIC_SPECS_V2.md), [`AI_OPERATING_MODEL.md`](./AI_OPERATING_MODEL.md)

## Live Foundation Series Chapters

- Chapter 01, [`foundation-series/01-market-intelligence.md`](./foundation-series/01-market-intelligence.md)
- Chapter 02, [`foundation-series/02-brand-strategy.md`](./foundation-series/02-brand-strategy.md)
- Chapter 03, [`foundation-series/03-product-system.md`](./foundation-series/03-product-system.md)
- Chapter 04, [`foundation-series/04-website-public-funnel.md`](./foundation-series/04-website-public-funnel.md)
- Chapter 05, [`foundation-series/05-activation-and-core-app.md`](./foundation-series/05-activation-and-core-app.md) and [`foundation-series/05-activation-architecture-spec.md`](./foundation-series/05-activation-architecture-spec.md)

## Supporting Research Corpus

- Research corpus root: [`foundation-series/research/README.md`](./foundation-series/research/README.md)
- These research docs support chapter refreshes and later packets. They are not canonical strategy, pricing, or product decisions.
- If a research doc and a canonical chapter disagree, the canonical chapter wins until a later packet refreshes it.

## Locked Program Decisions

- Entry model = `Free tier`
- Broader MVP app IA = design-locked now
- Auto-apply = future-state only

## Foundation Series Ownership

| Task | Ownership |
| --- | --- |
| `868hukucf` | chapters 01, 02, 03, and 05, plus design governance |
| `868hunzqm` | chapter 04, website IA, public funnel, and pricing-entry framing |
| `868hvvda6` | chapter 06, lifecycle messaging and email system |
| `868huafcx` | blocked implementation reset until Chapter 04 sufficiency is verified, the D2 design lane is approved, the FS8 packet and ClickUp packet match, and WIP is available |

## Current Build Readiness

As of 2026-04-28, `868huafcx` is the implementation reset packet for `Profile / Check your history`, but it is not yet executable build authority.

Current blockers:

- D2 design artifact QA still needs an explicit lead-thread pass after the latest repaired artifact.
- Job Filter already has two tasks in `in development`: `868hy1280` and `868huzwnf`.
- A coding prompt must include a current source-of-truth map, screen contract, file scope, test plan, QA/audit plan, and rollback plan.

Current efficiency rule:

- Keep WIP at 2 coding lanes.
- Use non-coding audit or governance support only when it has a bounded output and does not share a writer or write set with an active packet.
- Reduce token load by starting from this README, the governing packet, the active packet, the screen contract, touched files, and verified tracker state.

## Packet Flow

- `FS0`: governance reset
- `FS1`: chapter 01
- `FS2`: chapter 02
- `FS3`: chapter 03
- `FS4`: chapter 04 strategy source
- `FS5`: chapter 04 artifact packets
- `FS6`: chapter 05
- `FS7`: chapter 06
- `FS8`: implementation reset for `868huafcx`
- `FS8R2`: readiness reset and coding-gate contract before any `868huafcx` builder lane starts

## Deprecated Wrappers

- [`job-filter-brand-experience-lock-v4.md`](./job-filter-brand-experience-lock-v4.md)
- [`GPT_5_3_CODEX_PROMPT.md`](./GPT_5_3_CODEX_PROMPT.md)

Do not treat the deprecated wrappers as active packet sources.

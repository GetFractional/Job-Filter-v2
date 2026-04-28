# Foundation Series Research Corpus

Last updated: 2026-03-13

## Purpose

This folder holds normalized research inputs that support the Foundation Series.

These docs exist so chapter 01 and later chapters can cite stable, cleaned internal research sources instead of raw exports from ad hoc research runs.

## Usage Rules

- These docs are supporting research, not canonical product, pricing, brand, website, activation, or lifecycle decisions.
- These docs feed chapter 01 first, then later chapter refreshes where relevant.
- If a research doc conflicts with a canonical Foundation Series chapter or the governing packet, the canonical source wins until a later packet explicitly refreshes that chapter.
- Research recommendations stay recommendations. They do not silently reopen governance.
- The current governance lock remains `Free tier`.

## Confidence Model

| Label | Meaning | Usage rule |
| --- | --- | --- |
| Verified fact | Supported directly by official sources, stable primary sources, or repeated source convergence with low ambiguity | Safe to cite in later chapter refreshes if scoped correctly |
| Inferred opportunity | Reasonable strategic implication drawn from verified facts and category patterns | Safe to use for hypothesis generation, not as product truth |
| Not yet proven | Open question, secondary-source claim, or recommendation that still needs validation | Keep as a question, test candidate, or caution note |

## Corpus Index

| Doc | Focus | Feeds |
| --- | --- | --- |
| [`01-competitor-pricing.md`](./01-competitor-pricing.md) | Category pricing models, free-entry patterns, paywalls, refund clarity, and pricing opacity | Chapter 01 market intelligence refresh, chapter 04 pricing-entry framing, chapter 06 lifecycle upsell framing |
| [`02-demand-capture-before-signup.md`](./02-demand-capture-before-signup.md) | Lead magnets, extension-led signup, subscriber capture patterns, and worksheet positioning | Chapter 01 trust and market behavior refresh, chapter 04 lead magnet and subscriber capture decisions, chapter 06 list-building logic |
| [`03-competitor-brand-strategy.md`](./03-competitor-brand-strategy.md) | Category messaging, CTA patterns, trust language, and overused tropes | Chapter 01 category tension refresh, chapter 02 brand strategy refresh, chapter 04 public proof and CTA framing |
| [`04-job-search-funnel-benchmarks.md`](./04-job-search-funnel-benchmarks.md) | Funnel benchmarks, response timing, ghosting, source performance, and benchmark schema | Chapter 01 market reality refresh, chapter 04 proof architecture, chapter 05 tracking and analytics framing, chapter 06 lifecycle timing inputs |

## Normalization Rules Applied

- Raw export wrappers such as `BEGIN REPORT` and `END REPORT` were removed.
- Noisy trailing reference dumps were removed when the source ledger already captured the usable evidence set.
- Analysis sections and structured tables were retained in cleaned form.
- Hypotheses remain labeled as hypotheses.
- Pricing observations do not change the current governance lock that entry model = `Free tier`.

# Packet 868hunzqm

Task: [DESIGN: Marketing website IA and activation funnel map](https://app.clickup.com/t/868hunzqm)  
Status: `in design`  
Primary lane: packetizer + website/public-funnel governance

## Objective

Own chapter 04, Website and Public Funnel, so the public Job Filter journey, free-tier entry framing, and auth/public handoff are designed as one coherent system.

## Current State

- Foundation Series governance is now split cleanly between `868hukucf` and `868hunzqm`.
- This task is the only owner of website IA and public-funnel decisions.
- Upstream chapters 01 through 03 are now live and binding.
- Chapter 04 now starts by creating the strategy source before any desktop or mobile website artifact work.

## Target State

- chapter 04 has a final MVP public-site IA and a live markdown strategy source
- public pages, pricing-entry framing, lead magnet strategy, subscriber capture, and auth/public funnel logic are all defined in one chapter
- later desktop and mobile artifact packets can execute without reopening public-funnel strategy
- website proof architecture and handoff into Profile are explicit enough for later design and implementation work

## Deliverables

| Deliverable | Role |
| --- | --- |
| `docs/product/foundation-series/04-website-public-funnel.md` | canonical chapter 04 strategy source |
| `04-website-desktop.html` later if an artifact pass is opened | desktop website artifact |
| `05-website-mobile.html` later if an artifact pass is opened | mobile website artifact |

## Scope In

- final MVP public-site IA
- chapter 04 strategy source
- whether `Product` and `Proof` remain standalone pages
- lead magnet landing page strategy
- subscriber capture function and handoff
- pricing-entry framing and free-tier framing
- auth/public funnel ownership
- website proof architecture
- later desktop and mobile website artifact outputs

## Scope Out

- coded website implementation
- activation/core-app redesign that belongs to chapter 05
- lifecycle messaging and email design
- production code changes

## Required Chapter-04 Decisions

- page inventory and navigation logic
- page set decision on what is core funnel versus utility
- primary CTA sequencing across the public site
- role of `Job Profile Worksheet` as the primary lead magnet concept
- whether later lead magnets such as `Role Fit Checklist` and `Application Readiness Checklist` are needed
- relationship between proof, examples, FAQ, pricing entry, and sign-in/get-started routes
- exact signed-out to signed-in handoff into `Profile`

## Acceptance Criteria

- website/public funnel ownership is explicit and non-overlapping
- final MVP public-site IA is defined here, not in the Foundation Series governing packet
- chapter 04 strategy source exists before final website artifact work starts
- lead magnet, subscriber capture, pricing-entry framing, and auth/public funnel logic are all covered
- chapter 04 can proceed without reopening chapter 02 or chapter 03 governance

## Verification

- review against `job-filter-foundation-series-governing-packet-v7.md`
- confirm website/public-funnel decisions are removed from `868hukucf`
- confirm packet language reflects `Free tier` entry framing, current proof constraints, and handoff into `Profile`

## Dependencies

- upstream design-governance task: [868hukucf](https://app.clickup.com/t/868hukucf)
- blocked implementation task downstream: [868huafcx](https://app.clickup.com/t/868huafcx)
- chapter 04 desktop and mobile artifact work should not start until the strategy source is approved

## File Shortlist

- `docs/product/job-filter-foundation-series-governing-packet-v7.md`
- `docs/product/packets/868hunzqm.md`
- `docs/product/foundation-series/01-market-intelligence.md`
- `docs/product/foundation-series/02-brand-strategy.md`
- `docs/product/foundation-series/03-product-system.md`
- `docs/product/foundation-series/04-website-public-funnel.md`
- `docs/product/orchestration/project-profile.md`

## Risks and Rollback

- Risk: website IA gets partially decided upstream again and reintroduces overlap.
- Risk: public-funnel claims outrun current product proof.
- Rollback: keep this packet as the only chapter 04 owner and revert any overlapping governance edits outside it.

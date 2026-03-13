# Packet 868hunzqm

Task: [DESIGN: Marketing website IA and activation funnel map](https://app.clickup.com/t/868hunzqm)  
Status: `backlog`  
Primary lane: packetizer + website/public-funnel governance

## Objective

Own chapter 04, Website and Public Funnel, so the public Job Filter journey, free-tier entry framing, and auth/public handoff are designed as one coherent system.

## Current State

- Foundation Series governance is now split cleanly between `868hukucf` and `868hunzqm`.
- This task is the only owner of website IA and public-funnel decisions.
- It does not start design execution until upstream chapters 01 through 03 are approved.

## Target State

- chapter 04 has a final MVP public-site IA
- public pages, pricing-entry framing, lead magnet strategy, subscriber capture, and auth/public funnel logic are all defined in one packet
- website proof architecture and handoff into activation are explicit enough for later design and implementation work

## Scope In

- final MVP public-site IA
- whether `Product` and `Proof` remain standalone pages
- lead magnet landing page strategy
- subscriber capture function and handoff
- pricing-entry framing and free-tier framing
- auth/public funnel ownership
- website proof architecture
- desktop and mobile website chapter outputs

## Scope Out

- coded website implementation
- activation/core-app redesign that belongs to chapter 05
- lifecycle messaging and email design
- production code changes

## Required Chapter-04 Decisions

- page inventory and navigation logic
- primary CTA sequencing across the public site
- role of `Job Profile Worksheet` as the primary lead magnet concept
- whether later lead magnets such as `Role Fit Checklist` and `Application Readiness Checklist` are needed
- relationship between proof, examples, FAQ, pricing entry, and sign-in/get-started routes

## Acceptance Criteria

- website/public funnel ownership is explicit and non-overlapping
- final MVP public-site IA is defined here, not in the Foundation Series governing packet
- lead magnet, subscriber capture, pricing-entry framing, and auth/public funnel logic are all covered
- chapter 04 can proceed without reopening chapter 02 or chapter 03 governance

## Verification

- review against `job-filter-foundation-series-governing-packet-v7.md`
- confirm website/public-funnel decisions are removed from `868hukucf`
- confirm packet language reflects `Free tier` entry framing and current proof constraints

## Dependencies

- upstream design-governance task: [868hukucf](https://app.clickup.com/t/868hukucf)
- blocked implementation task downstream: [868huafcx](https://app.clickup.com/t/868huafcx)
- chapter 04 should not start until chapters 01 through 03 are approved

## Risks and Rollback

- Risk: website IA gets partially decided upstream again and reintroduces overlap.
- Risk: public-funnel claims outrun current product proof.
- Rollback: keep this packet as the only chapter 04 owner and revert any overlapping governance edits outside it.


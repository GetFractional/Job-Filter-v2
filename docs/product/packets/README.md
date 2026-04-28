# Job Filter Task Packets

Last updated: 2026-04-28

## Purpose

Task packets are the default execution context for Job Filter work. Load the governing packet first, then the active task packet, then touched repo files.

## Packet Load Order

1. `docs/product/job-filter-foundation-series-governing-packet-v7.md`
2. `docs/product/orchestration/project-profile.md`
3. the active packet in this folder
4. touched repo files

For implementation handoffs, also load the lead-approved screen contract and current verified ClickUp task state before editing.

## Packet Rules

- one packet file per ClickUp task
- packet path format: `<task-id>.md`
- no build starts without a packet
- one writer per packet
- if the packet becomes stale, refresh the packet before continuing

## Foundation Series Packet Flow

- `FS0`: governance reset
- `FS1`: chapter 01
- `FS2`: chapter 02
- `FS3`: chapter 03
- `FS4`: chapter 04A
- `FS5`: chapter 04B
- `FS6`: chapter 05
- `FS7`: chapter 06
- `FS8`: refreshed implementation reset for `868huafcx`
- `FS8R2`: readiness reset and coding-gate contract for `868huafcx`

## Current Governance Packets

- [`868hukucf.md`](./868hukucf.md), Foundation Series design governance for chapters 01, 02, 03, and 05
- [`868hunzqm.md`](./868hunzqm.md), chapter 04 website and public funnel ownership
- [`868huafcx.md`](./868huafcx.md), blocked implementation reset packet pending D2 artifact QA, ClickUp sync, WIP availability, and clean-state gate

## Current Execution Packets

- [`868hy1280.md`](./868hy1280.md), operator core slice from profile truth to reviewable `resume + cover letter`

## Historical Reference Packets

- [`868hrqhgf.md`](./868hrqhgf.md), shipped proof-core reference packet
- [`868huzwnf.md`](./868huzwnf.md), orchestration system implementation
- [`868hv0wzy.md`](./868hv0wzy.md), local memory skill and MCP setup

# Job Filter Task Packets

Last updated: 2026-03-12

## Purpose

Task packets are the default execution context for Job Filter work. Load the governing packet first, then the active task packet, then touched repo files.

## Packet Load Order

1. `docs/product/job-filter-foundation-series-governing-packet-v7.md`
2. `docs/product/orchestration/project-profile.md`
3. the active packet in this folder
4. touched repo files

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

## Current Governance Packets

- [`868hukucf.md`](./868hukucf.md), Foundation Series design governance for chapters 01, 02, 03, and 05
- [`868hunzqm.md`](./868hunzqm.md), chapter 04 website and public funnel ownership
- [`868huafcx.md`](./868huafcx.md), blocked implementation packet pending `FS8`

## Historical Reference Packets

- [`868hrqhgf.md`](./868hrqhgf.md), shipped proof-core reference packet
- [`868huzwnf.md`](./868huzwnf.md), orchestration system implementation
- [`868hv0wzy.md`](./868hv0wzy.md), local memory skill and MCP setup


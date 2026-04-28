# Source Of Truth Map

Last updated: 2026-04-22  
ClickUp owner: [`868jc3gbn`](https://app.clickup.com/t/868jc3gbn)

## Authority Ladder

1. Verified ClickUp task packets and read-after-write sync receipts
2. Current repo reality
3. `docs/product/job-filter-foundation-series-governing-packet-v7.md`
4. Active task packets under `docs/product/packets/`
5. Live Foundation Series chapters
6. Product OS package and `PRD_V3.md`
7. `PRD_V2.md`, `EPIC_SPECS_V2.md`, `AI_OPERATING_MODEL.md`
8. Deprecated wrappers and legacy docs

## Current ClickUp Owners

| Task | Status | Ownership |
| --- | --- | --- |
| [`868jc3gbn`](https://app.clickup.com/t/868jc3gbn) | in design | Product OS and PRD V3 package. |
| [`868hukucf`](https://app.clickup.com/t/868hukucf) | in design | Chapters 01, 02, 03, 05, design governance, activation design. |
| [`868hunzqm`](https://app.clickup.com/t/868hunzqm) | in design | Chapter 04, website IA, public funnel, pricing-entry framing. |
| [`868hvvda6`](https://app.clickup.com/t/868hvvda6) | backlog | Chapter 06 lifecycle messaging and email system. |
| [`868huafcx`](https://app.clickup.com/t/868huafcx) | backlog | Blocked D2 implementation reset until design, packet, and WIP gates clear. |
| [`868hgd4n1`](https://app.clickup.com/t/868hgd4n1) | in review | Delivery OS sync log. |

## Current Repo Reality

The current application stack is:

- Vite
- React 19
- React Router
- Dexie / IndexedDB support cache
- current route-level app shell and local store patterns

The current application is not:

- Next.js App Router
- already Cloudflare-native
- already D1-backed
- already wired to a real Worker API

Any implementation plan must start from that stack unless a separate migration packet explicitly changes it.

## Binding Program Decisions

- Entry model = `Free tier`
- Broader MVP app IA = design-locked now
- Auto-apply = future-state only
- Review-before-send is trust architecture, not polish
- `Profile`, `Jobs`, and `Applications` are the top-level signed-in IA
- `Workspace` is a child surface under `Applications`
- `Proof Library` is deferred and does not ship as a first-slice standalone route

## Live Foundation Series Sources

| Chapter | File | Binding decisions |
| --- | --- | --- |
| 01 Market Intelligence | `foundation-series/01-market-intelligence.md` | Personas, trust issues, broad histories, free-to-start clarity, review-before-send, multiple role lanes. |
| 02 Brand Strategy | `foundation-series/02-brand-strategy.md` | Positioning, CTA ladder, disallowed claims, no auto-apply, proof-safe language. |
| 03 Product System | `foundation-series/03-product-system.md` | Visual grammar, trust states, used/missing/excluded, calm premium workspace. |
| 04 Website Public Funnel | `foundation-series/04-website-public-funnel.md` | Public IA, Worksheet role, pricing-entry framing, auth handoff. |
| 05 Activation And Core App | `foundation-series/05-activation-and-core-app.md` | Signed-in IA, route inventory, activation path, Role Lanes, Jobs, Review, Applications, Workspace. |

## Known Conflicts To Resolve By Reading Order

| Conflict | Resolution |
| --- | --- |
| `PRD_V2.md` says “truthful job conversion operating system.” | PRD V3 uses `Apply with confidence to roles you can prove you fit` as the product anchor. |
| Older docs treat `Proof Library` as a top-level route. | Proof stays embedded inside `Profile` for the first slice. |
| Older activation work starts from broad wizard completion. | Current implementation reset starts with `Profile / Check your history` D2 vertical slice. |
| Older docs imply job-first asset generation. | Current product spine is Profile truth -> Role Discovery -> Jobs -> Review -> Applications -> Workspace. |
| Website artifacts exist but some are provisional. | Chapter 04 strategy source governs public IA; final website page comps do not block signed-in D2 implementation. |
| Screenshot capture requested but Playwright MCP is blocked. | Teardown must include dated public sources now and screenshot blocker until runtime path is repaired or alternate capture is used. |

## Worktree Risk

The current worktree had many pre-existing modified and untracked files before this Product OS package was created. Product OS implementation should avoid touching those unrelated files.

Rollback should remove only:

- `docs/product/PRD_V3.md`
- `docs/product/product-os/`
- `docs/product/packets/868jc3gbn.md`


# Competitive Intel Screenshot Index

Date: 2026-04-23

## Purpose

Track the screenshot evidence captured for the public competitor teardown and document which surfaces remain blocked by anti-bot or security interstitials.

## Capture Method

- Primary plan, Playwright MCP, remains blocked because it attempts to create `/.playwright-mcp` on a read-only root filesystem.
- Working fallback uses local headless Google Chrome and deterministic filenames.
- Naming pattern:
  - `competitor_surface_flow_state_YYYY-MM-DD.png`

## Captured Files

| File | Surface | Outcome | Notes |
| --- | --- | --- | --- |
| `earnbetter_public_custom-docs_2026-04-23.png` | EarnBetter custom docs public page | usable capture | Shows free-first hero, inline signup, preview, FAQ, testimonial band. |
| `huntr_public_home_2026-04-23.png` | Huntr public home | usable capture | Shows broad search-manager framing, demo card, tracker screenshot below fold. |
| `huntr_public_pricing_2026-04-23.png` | Huntr pricing | usable capture | Shows Free vs Pro fence, checklist packaging, testimonial block. |
| `jobscan_public_resume-builder_2026-04-23.png` | Jobscan resume builder | security verification only | Headless session lands on verification interstitial, not product surface. |
| `rezi_public_home_2026-04-23.png` | Rezi public home | usable capture | Shows ATS-led hero, resume preview, high-density feature marketing. |
| `simplify_help_autofill-settings_2026-04-23.png` | Simplify help article | usable capture | Shows settings screenshots, field controls, and autofill explanations. |
| `teal_help_job-tracker_2026-04-23.png` | Teal help center | blocked page only | Headless session returns Teal block page. |
| `teal_public_job-tracker_hero_2026-04-23.png` | Teal job tracker public page | blocked page only | Headless session returns Teal block page. |
| `teal_public_pricing_2026-04-23.png` | Teal pricing public page | blocked page only | Headless session returns Teal block page. |

## Remaining Gaps

- Teal public and help-center product surfaces need a non-headless or manually approved capture path.
- Jobscan public product surfaces need a non-headless or manually approved capture path.

## Related Docs

- [`docs/product/product-os/competitive-teardown-category.md`](../../../docs/product/product-os/competitive-teardown-category.md)
- [`docs/product/PRD_V3.md`](../../../docs/product/PRD_V3.md)

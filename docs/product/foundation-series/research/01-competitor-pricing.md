# Research 01, Competitor Pricing and Free-to-Start Patterns

- Purpose: Normalize competitor pricing, free-entry, paywall, and refund-pattern research into a stable internal source for later Foundation Series refreshes.
- Origin file: `/Users/mattdimock/Downloads/Competitor Pricing Breakdown for Job Filter Category.md`
- Date normalized: 2026-03-13
- Status: `raw research normalized`
- Confidence note: Strongest where pricing is published on official pricing or help pages. Weaker where plans, trials, or refund terms are inferred from third-party reviews.
- Canonical usage rule: Use this doc to inform chapter refreshes and pricing-entry framing. It does not reopen the governance lock that entry model = `Free tier`.

## Research Scope

This doc covers the primary job-search tooling panel used in the original export:

- Teal HQ
- Huntr
- Simplify
- Jobright AI
- JobCopilot
- Sonara
- LazyApply
- LoopCV
- AIApply
- Careerflow
- Jobscan
- Rezi

## Normalized Pricing Matrix

| Product | Free entry | Paid entry or range | Main paywall logic | Confidence |
| --- | --- | --- | --- | --- |
| Teal HQ | Yes, clear forever-free tier | Weekly `9 USD`, monthly `29 USD`, quarterly `79 USD` | Free keeps tracker and resume utility visible, advanced AI and analytics unlock in paid | Verified fact |
| Huntr | Yes, clear free plan | Monthly `40 USD`, quarterly `90 USD`, biannual `160 USD` | Free supports tracker and basic resume help, heavier AI and unlimited usage move to paid | Verified fact |
| Simplify | Yes, free base product | Roughly `39.99 USD` monthly based on secondary sources | Core autofill and tracking stay free, more advanced AI generation appears paid | Not yet proven |
| Jobright AI | Yes, free entry present | Roughly `19.99 USD` to `39.99 USD` monthly in secondary sources | Match and resume utility appear free, deeper AI agent value appears paid | Not yet proven |
| JobCopilot | No durable free tier found | Weekly model around `8.90 USD` to `12.90 USD` | Pricing is built around ongoing automation volume | Inferred opportunity |
| Sonara | No durable free tier found | `2.95 USD` paid trial, then recurring paid plan around `23.95 USD` every 4 weeks | Paid trial plus recurring automation subscription | Verified fact |
| LazyApply | No durable free tier found | Annual plans from `99 USD` to `999 USD` in best-supported source | Paywall is driven by daily application volume and resume-profile counts | Verified fact |
| LoopCV | Yes, limited free tier | Paid plans start around `9.99 EUR` monthly in one source, higher in others | Automation volume and search sophistication increase with paid tiers | Inferred opportunity |
| AIApply | Partial free or free trial | Roughly `16 USD` to `29 USD` monthly plus auto-apply credits | Core AI toolkit plus paid automation credits | Inferred opportunity |
| Careerflow | Yes, clear free tier | Weekly `8.99 USD`, monthly `23.99 USD`, quarterly `54.99 USD`, annual `172.99 USD` | Free unlocks real value, paid expands AI and premium utility depth | Verified fact |
| Jobscan | Yes, clear but narrow free tier | Monthly `49.95 USD`, quarterly `89.95 USD` | Paywall centers on unlimited scans and advanced optimization | Verified fact |
| Rezi | Yes, clear free tier | Monthly `29 USD`, lifetime `149 USD` | Free is generous enough to build trust, paid expands AI and output limits | Verified fact |

## Free Tier and Trial Comparison

| Product type | Typical pattern observed | Evidence quality |
| --- | --- | --- |
| Tracker and resume-system tools | Durable free tier is common, usually with meaningful starter value | Verified fact |
| ATS optimization tools | Free tier exists, but hard usage caps are common | Verified fact |
| Auto-apply products | Durable free tier is uncommon. Paid trial, weekly billing, or usage credits are more common | Verified fact |
| Risk-reversal | Refund policies vary widely and are often hard to find from front-door product pages | Verified fact |
| Pricing transparency | Opaque pricing is common among automation-heavy products and weaker among trust-led utility products | Inferred opportunity |

## Feature Gate Comparison

| Gate type | Common pattern | What it suggests |
| --- | --- | --- |
| Unlimited AI generation | One of the most common paid unlocks | AI usage is treated as a margin-controlled premium lever |
| Unlimited tracking or higher tracking caps | Common for tracker-led tools | Volume of tracked jobs is a frequent monetization boundary |
| Resume scans and optimization depth | Common for ATS-oriented tools | Diagnostic depth is easier to paywall than basic utility |
| Daily application volume | Common for automation-heavy tools | Volume remains the core pricing lever when the product promise is automation |
| Priority support or premium templates | Common secondary differentiator | Support and polish help justify paid plans but rarely anchor the plan by themselves |

## Verified Pricing Patterns

### Verified fact

- Freemium entry is common in tracker-led and resume-led tools.
- Weekly pricing, paid trials, or credit packs appear more often in automation-heavy products.
- The market often prices paid plans in the `20 USD` to `40 USD` monthly equivalent range.
- Unlimited AI, unlimited automation, or removal of hard usage caps are the most common upgrade triggers.
- Refund and cancellation clarity varies a lot. Some tools surface it clearly, many do not.

### Inferred opportunity

- Free-to-start clarity is not just a pricing detail. It is part of trust architecture for skeptical job seekers.
- Job Filter can differentiate more on pricing clarity and boundary clarity than on being the cheapest tool.
- A paid plan story anchored in leverage, reuse, and decision quality will fit the current product direction better than a story anchored in raw output volume.
- If the free tier makes the first compounding asset visible, conversion friction should fall relative to tools that hide value behind vague setup or opaque gates.

### Not yet proven

- The exact free-tier boundary that creates the best conversion path for Job Filter is not established.
- The best paid boundary may differ by lane, but the current evidence is not strong enough to lock lane-specific pricing.
- It is not yet proven whether a weekly plan, monthly plan, or usage-based add-on best matches Job Filter’s future monetization model.

## Implications for Job Filter Pricing and Entry Framing

### Verified fact

- The current governance lock remains `Free tier`.
- Public copy can use `free to start` as clarity language, but this does not change the governance decision to `Free tier`.
- The category punishes ambiguity when users cannot tell what they get before paying.

### Inferred opportunity

- Job Filter should present the free tier as a real working entry point, not as a teaser.
- The paid story should likely center on deeper leverage and system value, not on generic AI convenience.
- Cancellation clarity and visible boundaries can act as trust signals even before pricing detail is finalized.

### Not yet proven

- Numeric pricing recommendations from the raw export should not be treated as strategic decisions.
- The right upsell path for Job Filter is still downstream work for later packets and should stay separate from this corpus doc.

## Retained Source Ledger

| Source | URL | Why it matters | Confidence |
| --- | --- | --- | --- |
| Teal pricing and help content | `tealhq.com` | Strong example of clear freemium utility plus documented refund windows | Verified fact |
| Huntr pricing pages and help docs | `huntr.co` | Strong example of tracker-led freemium with escalating AI unlocks | Verified fact |
| Simplify public product pages plus recent reviews | `simplify.jobs` and selected reviews | Useful for direction, but exact pricing remains less transparent | Not yet proven |
| Jobright public site plus reviews | `jobright.ai` and selected reviews | Useful for category comparison, weaker for exact public pricing certainty | Not yet proven |
| JobCopilot product and review pages | `jobcopilot.com`, `jobboardsearch.com` | Useful for weekly automation pricing pattern | Inferred opportunity |
| Sonara public site and review references | `sonara.ai`, `jobsonaraai.com` | Strong example of paid-trial plus auto-renew automation model | Verified fact |
| LazyApply public pricing coverage | `lazyapply-jobs.com` and review sources | Strong example of volume-based automation gating | Verified fact |
| LoopCV public site and comparison coverage | `loopcv.pro` and review sources | Useful for hybrid free-plus-automation pattern, but some price detail varies | Inferred opportunity |
| AIApply site and SaaSworthy-style coverage | `aiapply.co` and third-party pricing pages | Useful for credits-plus-subscription pattern, but exact public pricing is less stable | Inferred opportunity |
| Careerflow pricing pages | `careerflow.ai` | Strong example of free toolkit plus multi-duration premium tiers | Verified fact |
| Jobscan pricing and help pages | `jobscan.co` | Strong example of free diagnostic plus premium optimization | Verified fact |
| Rezi pricing and docs | `rezi.ai` and supportive review coverage | Strong example of generous free tier plus monthly or lifetime upgrade | Verified fact |

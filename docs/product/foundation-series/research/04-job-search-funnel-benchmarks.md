# Research 04, Job-Search Funnel Benchmarks

- Purpose: Normalize external funnel benchmarks, response timing, ghosting, source performance, and benchmark-schema guidance into a stable internal source for future chapter refreshes.
- Origin file: `/Users/mattdimock/Downloads/Job-Search Funnel Benchmarks for Job Filter.md`
- Date normalized: 2026-03-13
- Status: `raw research normalized`
- Confidence note: Strongest where ranges come from ATS datasets, employer benchmark studies, or named benchmark providers. Weaker where advisory or synthesis content interprets mixed datasets.
- Canonical usage rule: Use this doc to support chapter 01 and later analytics, proof, and lifecycle framing. Do not turn benchmark ranges into product claims without careful source and scope checks.

## Scope and Usage

This doc normalizes public benchmark ranges for candidate-side job-search funnels:

`application submitted -> first contact -> interview -> offer -> accepted`

It is useful for:

- chapter 01 refreshes
- external benchmark references
- future chapter 05 tracking design
- future chapter 06 timing and response logic

It is not a substitute for Job Filter’s future internal benchmark system.

## Benchmark Source Table

| Source cluster | Best use | Confidence |
| --- | --- | --- |
| ATS and recruiting benchmark datasets such as CareerPlug, Jobvite, Ashby, NACE | Best for stage ranges and offer acceptance context | Verified fact |
| Candidate-experience and ghosting surveys such as iHire, Indeed, Tribepad | Best for response and ghosting expectations | Verified fact |
| Practitioner or synthesis benchmarks such as Jobboardly, LoopCV, CareerAgents, Careery | Best for directional ranges, not single-number truth | Inferred opportunity |
| Advisory content and secondary summaries | Best as supplemental context only | Not yet proven |

## Normalized Funnel Benchmark Table

| Stage transition | Observed range | What to do with it | Confidence |
| --- | --- | --- | --- |
| Application to any interview | `2%` to `10%` typical online range | Safe to use as an external benchmark band, not a precise target | Verified fact |
| First interview to final round | `20%` to `30%` | Useful as directional context only | Inferred opportunity |
| Final round to offer | `30%` to `50%` | Useful as directional context, especially when tied to lane | Inferred opportunity |
| Interview to offer | `20%` to `47.5%` depending on lane | Safe as a range reference with source context | Verified fact |
| Offer to accepted | `69%` to `90%`, with `78%` to `81%` commonly cited in knowledge-worker datasets | Safe to use as a band, not a universal promise | Verified fact |
| Application to hire | Roughly `0.1%` to `10%` depending on targeting, lane, and source | Too wide for simple user-facing claims without lane context | Verified fact |

## Cohort and Lane Dimensions That Matter

### Verified fact

- Industry matters.
- Role function matters.
- Channel matters.
- Geography sometimes matters.
- Early-career funnels differ from experienced professional funnels.
- Hourly or frontline hiring behaves very differently from corporate knowledge-work hiring.

### Inferred opportunity

- Job Filter should benchmark by lane instead of using a single universal funnel expectation.
- Channel-aware and lane-aware reporting will be more useful than one global benchmark.

## Time-to-Response and Ghosting Benchmarks

| Metric | Observed range or signal | Confidence |
| --- | --- | --- |
| Median time to first meaningful response | About `6` to `7` days in one 2025 U.S. job-seeker dataset | Verified fact |
| Faster response tail | Around `4` to `5` days | Verified fact |
| Slower response tail | Around `8` to `9` days before response likelihood drops | Verified fact |
| Employer ghosting | Roughly half of job seekers report being ghosted at least once in recent surveys | Verified fact |
| Common employer ghosting point | Post-application is the most common stage | Verified fact |
| Candidate ghosting | Material enough to matter, but estimates vary widely by survey and market | Verified fact |

## Response Rate by Source

| Source | Directional response performance | Confidence |
| --- | --- | --- |
| Referrals | Strongest response rates, often far above boards | Verified fact |
| Direct company-site applications | Better than most generic job-board applications | Verified fact |
| LinkedIn non-Easy Apply | Often similar to direct applications | Inferred opportunity |
| LinkedIn Easy Apply | Usually weaker than direct or referral channels | Inferred opportunity |
| Large job boards | Often in the lower response band unless targeting is strong | Inferred opportunity |
| Mass non-customized applications | Weakest response rates | Verified fact |

## What Job Filter Can Safely Use Later

### Verified fact

- External ranges can support user education if they stay tied to lane and source context.
- Ghosting and time-to-response norms are useful for expectation-setting and follow-up logic.
- Referrals and direct applications consistently outperform lower-signal board applications.

### Inferred opportunity

- Job Filter can later compare a user’s application-to-interview rate against external bands by lane.
- Job Filter can later flag likely-cold applications based on response timing norms.
- Job Filter can later benchmark channel mix quality, not just raw application count.

### Not yet proven

- Exact health bands for Job Filter product UI should wait for later packet work and clearer lane definitions.
- Public benchmark statements should remain conservative until later proof architecture work decides how to cite them.

## What Job Filter Should Benchmark Internally Later

| Internal benchmark need | Why it matters |
| --- | --- |
| Lane-level application to interview conversion | Needed to compare users against relevant cohorts |
| Channel-level response and interview rates | Needed to show quality differences by source |
| Qualified interview rate | Needed to distinguish interview count from fit quality |
| Time to response by company and lane | Needed for follow-up logic and realistic expectations |
| Application tracking outcome states | Needed to support later lifecycle and analytics surfaces |
| A/B asset testing by lane and asset version | Needed once Job Filter supports downstream testing and learning loops |

## Suggested Lane-Level Benchmark Schema

| Dimension family | Fields to preserve later |
| --- | --- |
| Job-seeker lane | Role function, seniority, geography, industry target, work model |
| Application lane | Channel, company size, job type, remote or hybrid status |
| Funnel stages | Submitted, responded, screened, interviewed, final, offer, accepted, rejected, ghosted |
| Learning overlays | Asset version, lane, company profile, reason-for-leaving context where relevant |

## Retained Source Ledger

| Source | URL or source family | Why it matters | Confidence |
| --- | --- | --- | --- |
| CareerPlug benchmark reports | official benchmark reports | Strong frontline and SMB funnel ranges | Verified fact |
| Jobvite benchmark data | official benchmark reports and related summaries | Strong corporate application-to-interview and interview-to-offer reference | Verified fact |
| NACE recruiting benchmarks | official early-career benchmark source | Strong early-career interview and offer reference | Verified fact |
| Ashby Talent Trends | official benchmark source | Strong offer-acceptance and source-of-hire reference for tech and SaaS | Verified fact |
| iHire and Indeed ghosting or recruiting surveys | official or high-signal survey sources | Strong employer and candidate ghosting context | Verified fact |
| Tribepad ghosting research | official survey source | Strong age and geography ghosting context | Verified fact |
| Careery response-time work | named benchmark provider | Useful timing band for first response | Inferred opportunity |
| Jobboardly, LoopCV, CareerAgents, similar syntheses | mixed benchmark and practitioner sources | Useful directional ranges, weaker than ATS datasets | Inferred opportunity |
| Pinpoint and Boon referral-performance coverage | ATS-based or benchmark-backed channel comparisons | Strong referral-vs-board contrast | Verified fact |

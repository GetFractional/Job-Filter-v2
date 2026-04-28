# Competitive Teardown: Teal And Category

Last updated: 2026-04-24  
Research depth: public/category-wide teardown  
Screenshot status: partial, with dated capture evidence for publicly capturable surfaces and documented anti-bot blockers for the remainder

## Sources Reviewed

Official sources reviewed on 2026-04-22 and rechecked on 2026-04-23:

- [Teal Job Tracker](https://www.tealhq.com/tools/job-tracker)
- [Teal Resume Builder](https://www.tealhq.com/tools/resume-builder)
- [Teal Pricing](https://www.tealhq.com/pricing)
- [Teal Job Tracker help](https://help.tealhq.com/en/articles/9508859-getting-started-job-tracker)
- [Teal Job Matcher help](https://help.tealhq.com/en/articles/12060992-using-the-job-matcher)
- [Teal Resume Analyzer help](https://help.tealhq.com/en/articles/9524748-using-the-resume-analyzer)
- [Teal Auto-Select help](https://help.tealhq.com/en/articles/12062117-using-auto-select)
- [Teal Contacts Tracker help](https://help.tealhq.com/en/articles/9509581-getting-started-contacts-tracker)
- [Huntr](https://huntr.co/)
- [Huntr Pricing](https://huntr.co/pricing)
- [Huntr Chrome Extension help](https://help.huntr.co/en/articles/9859408-the-huntr-chrome-extension)
- [Simplify Autofill Settings](https://help.simplify.jobs/en/articles/8686025-manage-autofill-settings-in-the-simplify-extension)
- [Simplify Unsupported Autofill](https://help.simplify.jobs/en/articles/8717287-autofill-not-supported)
- [Rezi](https://www.rezi.ai/)
- [Rezi Pricing](https://www.rezi.ai/pricing)
- [EarnBetter Custom Docs](https://earnbetter.com/custom-docs/)
- [Jobscan Resume Builder](https://www.jobscan.co/resume-builder)

Authenticated Teal journey pass completed on 2026-04-24:

- saved Hinge job in Teal Job Tracker
- Teal Chrome extension side panel and external job-board save flow
- Teal Resume Builder Auto-Select, Analyzer, and Job Matcher
- dedicated teardown note: [`teal-authenticated-journey-teardown-2026-04-24.md`](./teal-authenticated-journey-teardown-2026-04-24.md)

## Screenshot Method And Evidence

Playwright MCP still fails in this environment because it tries to create `/.playwright-mcp`, and that root path is read-only.

Screenshot work is now repaired through an alternate local pipeline using headless Google Chrome with deterministic filenames written under [`artifacts/competitive-intel/2026-04-23/README.md`](../../../artifacts/competitive-intel/2026-04-23/README.md).

Required naming pattern remains:

`competitor_surface_flow_state_YYYY-MM-DD.png`

## Capture Inventory

| File | Surface | Result | What it gives us |
| --- | --- | --- | --- |
| [`huntr_public_home_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/huntr_public_home_2026-04-23.png) | Huntr home hero | Captured | Public story, hero, product proof, below-the-fold structure. |
| [`huntr_public_pricing_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/huntr_public_pricing_2026-04-23.png) | Huntr pricing | Captured | Free vs Pro fence, feature packaging, testimonial placement. |
| [`rezi_public_home_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/rezi_public_home_2026-04-23.png) | Rezi home | Captured | Resume-first hero, ATS framing, CTA and density patterns. |
| [`earnbetter_public_custom-docs_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/earnbetter_public_custom-docs_2026-04-23.png) | EarnBetter custom docs page | Captured | Free-forward friction strategy, signup treatment, FAQ structure. |
| [`simplify_help_autofill-settings_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/simplify_help_autofill-settings_2026-04-23.png) | Simplify help article | Captured | Autofill controls, settings clarity, screenshot pedagogy. |
| [`teal_public_job-tracker_hero_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/teal_public_job-tracker_hero_2026-04-23.png) | Teal public hero | Blocked page captured | Confirms anti-bot interstitial under headless capture. |
| [`teal_public_pricing_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/teal_public_pricing_2026-04-23.png) | Teal pricing | Blocked page captured | Confirms headless public capture remains blocked. |
| [`teal_help_job-tracker_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/teal_help_job-tracker_2026-04-23.png) | Teal help | Blocked page captured | Confirms help center is also protected in this flow. |
| [`jobscan_public_resume-builder_2026-04-23.png`](../../../artifacts/competitive-intel/2026-04-23/jobscan_public_resume-builder_2026-04-23.png) | Jobscan public page | Security verification captured | Confirms security gate under headless capture. |

## Remaining Blockers

| Competitor | Blocker | Impact |
| --- | --- | --- |
| Teal | Headless public and help requests return `Sorry, you have been blocked` pages. | Public screenshot evidence is limited to the block pages, so product conclusions rely on official source review plus prior textual intelligence. |
| Jobscan | Public resume builder route returns a security verification interstitial under headless capture. | Public screenshot evidence is limited to the verification state, so product conclusions rely on official source review. |

## Visual Intel From Captures

### Huntr

Huntr's home page leads with a simple benefit headline, an embedded product or demo card, and then a strong board-style application tracker screenshot directly below the fold. The board UI is not decorative. It is a first-order proof object. Tabs and supporting surfaces such as `Board`, `Activity`, `Contacts`, and `Documents` make the product feel broad immediately.

Pricing is visually plain and commercially sharp: a simple Free versus Pro comparison, a bright CTA, long checklists, and a testimonial. The package says breadth, convenience, and volume.

Implications for Job Filter:

- show the real app in the hero, not an abstract brand composition
- make the first proof surface a fit-review or requirements view, not only a tracker
- keep pricing visually simple and commercially legible

### Rezi

Rezi is aggressively resume-first. The hero centers on ATS language, a resume preview, prominent calls to action, and a feature-dense page structure. The visual hierarchy reinforces that resume optimization is the product center.

Implications for Job Filter:

- do not compete on resume polish as the main visual story
- keep ATS compatibility as reassurance, not the lead promise
- use proof coverage and decision support as the main UI proof

### Simplify

The Simplify help surface is a strong benchmark for control design. The screenshots are instructional, specific, and settings-heavy. Users can see what is toggled, what happens on multipage flows, and what to do when support is missing.

Implications for Job Filter:

- extension and autofill controls need explicit field-level language
- unsupported-site fallback must be visible and clean
- settings screenshots or product tours should teach by showing real controls
- extension UI should default to a browser side panel, with content scripts used for capture and extraction rather than a persistent in-page overlay

### EarnBetter

EarnBetter uses low-friction capture aggressively. The page is simple, light, and free-forward, with inline signup, a straightforward product preview, and FAQ reinforcement below.

Implications for Job Filter:

- free entry must be obvious
- secondary capture should feel useful, not like a generic lead magnet
- FAQ and objections should be handled inside the main page flow

### Teal And Jobscan Blocked States

The blocked and verification screens are useful even though they are not the desired product captures. They confirm that automated screenshot gathering cannot be assumed across the category. They also reinforce that Teal and Jobscan remain source-reviewed benchmarks rather than complete visual-reference sets in this environment.

## Category Map

| Competitor | Center of gravity | What works | Strategic gap for Job Filter |
| --- | --- | --- | --- |
| Teal | Resume builder + tracker + extension | Broad suite, free entry, job tracker, match/analyzer, job save, contacts. | Fit and proof are still mostly resume/job matching, not a full decision system. |
| Huntr | All-in-one job-search manager | Tracker, tailored resumes, autofill, contacts, metrics, generous free plan. | Speed and breadth can outrun proof and decision quality. |
| Simplify | Autofill and application acceleration | Strong extension controls, field toggles, unsupported-site fallback. | Optimizes form completion more than role selection and proof confidence. |
| Rezi | AI resume builder and ATS optimization | Resume score, keyword targeting, templates, free start, lifetime plan. | Resume quality is central, not role decision and application execution. |
| EarnBetter | Free AI job-search assistant | Simple promise, free custom docs, matches, resume/cover letter generation. | Low friction, but proof lineage and review depth are unclear publicly. |
| Jobscan | ATS diagnostics and resume builder | Strong ATS education, free resume builder, optimization reports. | Analytical but can over-index on ATS and keywords. |

## Teal Findings

Teal is the strongest table-stakes reference.

### Authenticated Journey Pass, 2026-04-24

Detailed note: [`teal-authenticated-journey-teardown-2026-04-24.md`](./teal-authenticated-journey-teardown-2026-04-24.md)

Observed flow:

- Teal Chrome extension uses a browser side panel, not a persistent in-page overlay.
- Extension `Super Search` takes title/location and opens selected job boards in new tabs.
- On external job boards, the side panel switches into a save flow with detected URL, stage, excitement, notes, and `Save Link to Teal`.
- The reported LinkedIn spinner loop still resulted in the job being saved, which makes async state feedback a critical reliability requirement.
- Saved jobs connect directly into Resume Builder through job-specific resume creation.
- Auto-Select created a first draft, but the starting match was weak and required manual judgment.
- The Hinge resume was tailored for `Senior Director, Marketing Operations at Hinge`; last verified saved state was 92% Job Matcher after a legitimate one-bucket skills keyword pass. Analyzer was not re-run in detail after that pass, though the visible badge showed 8 items.
- The resume pass added Breakthrough Academy as a Marketing Operations Manager role, tested segmented skills, reverted to one skills bucket for space efficiency, added supportable exact-match keywords, rejected unsupported/noisy terms, and created a custom cover letter in Teal for user review.

Extension decision:

- Job Filter should rebuild the extension around the Chrome side panel as the primary UI.
- Content scripts should extract and observe, but the user-facing review, save, proof, and next-action UI should live in the side panel.
- The current overlay model is too fragile for LinkedIn/Indeed-style environments and creates unnecessary compliance and UX risk.

Resume/product decision:

- Teal's Analyzer and Matcher are useful but keyword/mechanics-heavy.
- Job Filter should not optimize toward a single match score.
- Job Filter should expose a requirements matrix with `proven`, `plausible`, `missing`, `risky`, `disqualifying`, and `excluded` states.
- Every generated bullet or asset claim should show why it was used and what approved Profile evidence supports it.
- Review-before-apply remains mandatory; no application was submitted during this pass.

### Authenticated Resume And Cover-Letter Builder Follow-Up, 2026-04-24

Observed Teal patterns worth matching:

- split resume editor with live preview
- checkbox-based inclusion and exclusion for summaries, bullets, dates, locations, and skills
- contextual guidance panel that changes when a bullet or section is selected
- Designer controls for typography, accent color, section visibility, date/location alignment, and skills layout
- Cover Letter tab with manual editor, live preview, AI settings, history, and copy-text control

Observed Teal gaps Job Filter should exploit:

- Job Matcher treats weak phrases and fragments as skills, including `Seasoning`, `Social impact`, `Global`, and `Aligned`. Some terms it flags, such as `Insights`, `Mentor`, `Consumer Insights`, and `Tooling`, are legitimate only when they can be grounded in real experience.
- Analyzer can reward mechanical score chasing over better role narrative.
- Teal does not expose claim lineage, proof state, or requirement rationale for each bullet or cover-letter paragraph.
- The user has to know when to reject suggestions instead of being protected by the product.

Job Filter positioning response:

- The wedge is not "a better resume builder." It is a proof-governed application builder.
- Resume and cover-letter editing should happen after Review decides the role is worth pursuing.
- Every bullet, skill, and paragraph should carry a requirement link, source claim, source evidence, risk state, and include/exclude rationale.
- Match scoring should be decomposed into proof coverage, missing requirements, unsupported suggestions, effort, and opportunity cost.

Persona and journey implications:

| Persona | Teal serves them by | Job Filter should win by |
| --- | --- | --- |
| Broad operator with messy history | Giving fast tailoring tools and keyword feedback. | Turning messy history into role lanes and proof-backed target narratives. |
| Senior leader applying selectively | Providing a strong resume workspace. | Preventing weak claims and showing why a role is or is not worth the application effort. |
| Volume job seeker | Tracker, extension, and goals dashboard. | Quality-weighted pipeline, fewer bad applications, clearer next actions. |
| Career changer or adjacent-lane candidate | Keyword matching and resume rewriting. | Requirement-by-requirement proof mapping with visible gaps and safe language for plausible but not proven fit. |

Customer-journey implication:

- Discovery should lead with proof confidence, not resume polish.
- Activation should create one verified role-lane insight before asking for heavy asset work.
- Application workspace should make the next action obvious while preserving proof boundaries.
- Retention should come from a reusable truth library, not just more generated documents.

### Logged-In Surface Pass, 2026-04-23

Observed from the signed-in Teal app after the Plus upgrade was already completed by the user. No payment flow, tour completion, job edits, resume edits, chat prompts, interview scenarios, Work Styles answers, or account changes were intentionally performed during this pass.

Analysis frame:

- Orchestration mode: tight.
- Lead lens: Product, because the useful question is what Teal's logged-in IA says Job Filter must match, avoid, or outperform.
- Support lenses: Research for source discipline, UX for surface mapping, Proof/Risk for account-state and claim-boundary protection.
- Frameworks: Information Architecture, JTBD, and Risk Matrix.

Primary app navigation:

- Home
- Resume Builder
- Trackers
- Job Search
- AI Job Search
- Extension
- All Tools
- Referrals
- Support Center
- Account Settings

Home / onboarding observations:

- Home shows a visible next-career-goal module with target role, target date, and salary target.
- Home exposes a `Getting Started` checklist and progress percentage.
- The checklist teaches activation through resume creation, extension install, and adding the first tracked job.
- The visible target role was `Director of Growth`; exact personal profile details were not copied into this doc.
- Salary formatting showed an odd range state (`$150,000 to $0`), which is a useful reminder to validate compensation empty/default states carefully.

All Tools inventory:

- Resume Builder
- Job Search
- AI Job Search
- Job Tracker
- Company Tracker
- Contacts Tracker
- Compensation Tracker
- Offer Analysis
- Interview Practice
- Work Styles
- Chrome Extension

All Tools pattern:

- Teal presents itself as a broad suite first, not a single workflow.
- The tool grid mirrors the side nav, making breadth discoverable even when the left rail is collapsed to icons.
- The resource block links Support Center, Career Hub, Career Paths, and Resume Examples below the tools.

Resume Builder observed controls:

- `New Resume`
- `Start from job description`
- `Start from template`
- `New Cover Letter`
- recent resume card with `Match a job`
- search, table/card view switch, and sort controls

Resume Builder pattern:

- Entry points are creation-mode driven: blank resume, job-description start, template start, cover letter.
- The recent-resume card makes `Match a job` the visible bridge from static resume storage to job-specific optimization.
- This is mature category table stakes, but it also shows where Job Filter should avoid becoming a general design/resume file manager too early.

Job Search observed controls and model:

- split-pane layout: results list on the left, selected job detail on the right
- search fields: title and city/ZIP
- filters: sort, date posted, remote, salary, all filters
- result inventory count: `10,000+ Jobs`
- result cards show freshness, title, company, location, and onsite/remote/hybrid mode
- selected job panel includes job title, company/location, posted age, work mode, match score, `Apply`, `Save Job`, `Create Resume`, copy URL, and job settings
- extracted sections include About The Position, Requirements, Responsibilities, Benefits, What This Job Offers, and Top Keywords
- match display is visible but shallow from the first panel: a percent score plus keyword chips, not an explainable proof/coverage matrix

AI Job Search observed controls and model:

- chat-style landing prompt: `Let's Discuss Your Next Career Move`
- input placeholder asks the user to describe an ideal job
- suggested prompt chips: `Remote jobs`, `Explore options`, `Jobs near me`, `Jobs in tech`
- chat history is hidden behind a button
- Terms and Privacy copy is attached directly to messaging
- no prompt was sent because that would create account/chat history

Job Tracker observed controls and model:

- onboarding/tour modal: `Start Quick Tour`, `Skip the Tour`
- tracker sub-tabs: Jobs, People, Companies
- job pipeline stages: Bookmarked, Applying, Interviewing, Negotiating, Accepted
- table controls: search, selected bulk state, table/card view, filter/settings, `Add Job`
- sample table columns include Job Position, Company, Max. Salary, Location, Status, Date Saved, Deadline, Date Applied, Follow up, and Excitement
- seeded sample jobs use `Acme Corp` and show that Teal teaches tracker mechanics with realistic placeholder rows

Company Tracker observed controls and model:

- tracker sub-tabs remain Jobs, People, Companies, with Companies selected
- empty state says no companies are tracked yet
- top controls include selected count, extension banner, company filter, group-by control, columns, menu, and `Add a Company`
- empty state teaches two add paths: manual add and browser extension capture from LinkedIn

Contacts Tracker observed controls and model:

- tracker sub-tabs remain Jobs, People, Companies, with People selected
- empty state says no contacts are tracked yet
- top controls include selected count, extension banner, contact filter, group-by control, columns, menu, and `Add a New Contact`
- empty state teaches professional network building and LinkedIn extension capture

Compensation Tracker observed controls and model:

- route redirects to a job-tracker analysis surface.
- visible state: `Job Search Summary` with a `BETA` ribbon.
- blocked gate: `Not enough data to show analysis. Add at least 5 jobs to your tracker to use this feature.`
- page hints at aggregate cash compensation analysis, typical/min/max cash comp, and years-of-experience summaries.

Offer Analysis observed controls and model:

- blocked gate: `Select Job From Job Tracker`.
- visible requirement: no jobs in tracker, add a job before creating an offer.
- primary action: `Add a Job Now`.
- this positions offer analysis as downstream of tracker data, not a standalone calculator.

Interview Practice observed controls and model:

- hub welcome panel explains practice scenarios and confidence building.
- recent sessions area shows an empty state.
- upcoming interviews panel links to jobs whose status has changed to `Interviewing`.
- scenario library cards include `Tell Me About Yourself`, `Why Do You Want to Work Here?`, `Career Gaps with Confidence`, `Discussing Salary Expectations`, `What Are Your Weaknesses?`, and `Job-Specific Interview`.
- this is a guided scenario library, not a generic chat box.

Work Styles observed controls and model:

- visiting Work Styles redirected into a 17-step assessment screen.
- first prompt asks which two words describe the user best.
- observed scale anchors: `Competitive` to `Cooperative`.
- no answer was selected and the test was not advanced.
- this creates a personality/work-preference data asset that could feed search and interview guidance, but it adds a separate assessment burden.

Implications for Job Filter:

- Teal teaches breadth through a tool directory and side-nav taxonomy; Job Filter should teach sequence through a smaller operating loop: Profile -> Role Lanes -> Job Review -> Application Workspace.
- Teal's tracker is mature table stakes. Job Filter should not treat a tracker table as differentiation by itself.
- Teal's resume entry points are creation-mode driven. Job Filter should stay proof-mode driven, then generate assets after fit and claim support are clear.
- Teal's job tracker tour creates visible onboarding guidance. Job Filter needs equivalent guidance, but should focus on proof approval, fit decisioning, and why a role should or should not advance.
- Teal's table exposes salary/location/status/follow-up fields clearly. Job Filter should match that operational clarity while adding requirements coverage, proof status, and decision rationale.
- Teal connects downstream tools to tracker state: compensation needs enough tracked jobs, offer analysis needs a tracked job, and interview prep pulls from `Interviewing` status. Job Filter should use the same stateful leverage, but make the causal link explicit: each downstream tool should show what evidence/status unlocked it and what is still missing.
- Teal's Chrome extension side panel is the extension benchmark. Job Filter should move away from an in-page overlay model and use side-panel review with explicit save, duplicate, retry, and manual-repair states.
- Teal's split-pane Job Search is a strong pattern to borrow, but Job Filter's right panel should center decision quality: requirements coverage, proof status, disqualifiers, likely effort, and next action, not only keyword match.
- Teal's AI Job Search is intentionally low-friction, but it is still a black-box chat entry. Job Filter should not make chat the primary IA; use guided decisions first and chat as a secondary Q&A layer.
- Teal's Work Styles assessment is a useful reminder that preference data matters, but Job Filter should avoid adding a disconnected quiz unless the answers directly change role-lane recommendations, fit scoring, or asset guidance.
- Teal's CRM surfaces are lightweight but clear. Job Filter can initially model people/company context as attached context inside the job workspace before building a full standalone CRM.

Adopt / improve / reject:

| Pattern | Teal implementation | Job Filter decision |
| --- | --- | --- |
| Tool directory | Broad All Tools grid and icon side rail. | Adopt the discoverability, but keep the product IA sequence-first. |
| Split-pane job search | Results list plus job detail, match, keywords, actions. | Adopt layout, improve right panel with proof/fit reasoning. |
| Tracker pipeline | Stage counts, table columns, deadlines, follow-up, excitement. | Adopt operational clarity, add proof state and decision rationale. |
| Extension capture | Repeated banner across tracker/CRM empty states. | Adopt extension/manual dual path, keep review-before-save explicit. |
| Extension UI model | Chrome side panel for Super Search, dashboard, and save flow. | Rebuild around side-panel UI; use content scripts for extraction, not product chrome. |
| Job-linked downstream tools | Compensation, offer, and interview features unlock from tracker data/status. | Adopt stateful unlocking, make prerequisites transparent and reversible. |
| AI job search | Chat prompt with starter chips. | Keep as secondary support, not core IA. |
| Work Styles quiz | Separate 17-step assessment flow. | Defer unless answers directly power role-lane and fit decisions. |
| Keyword match | Percent score plus keyword chips. | Treat as table stakes, not differentiation. |
| Resume creation modes | Blank, job description, template, cover letter. | Defer design breadth, prioritize proof-grounded asset generation. |

Public pattern:

- job tracker promise is organization, stage tracking, keyword/skill insights, checklists, templates, contacts, and follow-up
- resume builder promise is ATS-friendly resumes, AI suggestions, job matching, analyzer, templates, and unlimited free export
- pricing draws a clear Free Forever vs paid boundary, with paid value around advanced analysis, unlimited keyword matching, design, AI credits, and templates
- help docs show sample jobs in first-run tracker, manual and extension job bookmarking, Job Matcher keyword included/missing states, Analyzer issue cards, Auto-Select with user review caveat, and Contacts Tracker

What to adopt:

- manual add plus extension capture
- side-panel extension review instead of persistent in-page overlay
- dense job tracker table
- job detail workspace
- resume versions from a master source
- issue cards for improvement tasks
- contacts tied to jobs
- free entry and no-credit-card clarity

What to improve:

- replace single match score or keyword status with requirements matrix
- show proven, plausible, missing, risky, and disqualifying requirements
- make auto-selection reversible with used/missing/excluded rationale
- make generated bullets trace to approved claims
- treat contacts as referral paths, not a standalone CRM
- optimize qualified applications, not job volume

What to reject:

- vague speed claims as the center of value
- making resume templates the product center
- keyword stuffing as the default path to confidence
- paywalling trust-critical review moments

## Huntr Findings

Huntr positions around less hassle, more interviews, tailored resumes, cover letters, one-click autofill, and job search organization. Its public product taxonomy is broad: resume tools, tailored resumes, tracker, contact tracker, interview tracker, metrics, autofill, and extension.

Pricing shows a generous free plan with resume builder, free PDF export, limited tailored resumes/application packets, tracker up to 100 jobs, job clipper, map view, unlimited contact management, and application autofills. Paid value centers on unlimited AI generations, tailored resumes, cover letters, advanced matching, advanced scoring, and advanced insights.

Implication:

Job Filter cannot win by simply being broader. It must win by being more trustworthy and more decisive.

## Simplify Findings

Simplify is a strong benchmark for extension ergonomics.

Observed help patterns:

- settings include AI autofill for unique questions
- continuous multipage autofill can proceed until submission
- users can turn off specific fields
- unsupported sites get copy/paste fallback from saved profile data
- users can submit autofill support requests

Job Filter response:

- field-level controls are table stakes if autofill ships
- no current-state auto-submit
- unsupported sites need a clean copy fallback
- sensitive fields need explicit user control
- autofill belongs after proof, review, and user consent

## Rezi Findings

Rezi centers resume optimization, score, keyword targeting, AI writing, templates, exports, and pricing clarity. It has Free, Pro monthly, and Lifetime plans, with no-card-required free entry and money-back language on paid plans.

Job Filter response:

- resume scoring must not become generic linting
- keyword coverage should be one signal inside fit
- paid packaging should avoid punishing users during urgent job search moments
- one-time/lifetime pricing is worth evaluating later, but not before product wedge is validated

## EarnBetter Findings

EarnBetter uses a simple free promise: upload a resume, customize a resume and cover letter for any job, get personalized matches, and identify targeted skills and keywords. It emphasizes `100% free`.

Job Filter response:

- free first value must be real
- the product needs a clear public utility before asking for heavy setup
- free custom docs are table stakes pressure, but Job Filter should counter with proof, control, and decision quality

## Jobscan Findings

Jobscan's public resume builder emphasizes ATS-compatible templates, unlimited resumes, tailored skill suggestions, upload/import flexibility, and paid summary/bullet generation. The broader Jobscan category position is analytical and ATS-heavy.

Job Filter response:

- ATS compatibility matters, but should not dominate the product promise
- role-fit and proof-fit need equal or greater weight than keyword presence
- Job Filter can use ATS framing as reassurance, not as the main story

## Table Stakes

Job Filter should assume users expect:

- free start
- resume import or upload
- manual fallback
- job save/capture
- job tracker
- job detail workspace
- resume/asset export
- job-description parsing
- keyword visibility
- basic recommendations
- stateful follow-up and notes
- data portability

## Differentiation Bets

| Bet | Why it matters | Product expression |
| --- | --- | --- |
| Proof-first Profile | Trust starts from reusable truth. | Verified roles, claims, evidence, provenance. |
| Fit before assets | Saves effort before drafting. | Apply, hold, reject decision before asset work. |
| Requirements matrix | Replaces false precision. | Proven, plausible, missing, risky, disqualifying. |
| Review-before-send | Keeps user in control. | Required approval before export, copy, or autofill. |
| Used/missing/excluded | Makes reasoning inspectable. | Rationale panels and asset diffs. |
| Opportunity cost | Helps decide what not to apply to. | Time/effort/fit tradeoff in Review. |
| Role Lanes | Broad histories need structured paths. | User-owned lane comparison and lane-specific assets. |
| Source lineage | Prevents unsupported claims. | Every claim links to evidence or is blocked. |

## UX Components To Benchmark

| Component | Competitor reference | Job Filter requirement |
| --- | --- | --- |
| Tracker table | Teal, Huntr | Dense table with filters, sort, columns, lane, fit, deadlines, next action. |
| Job detail | Teal | Decision hub with requirements, evidence, notes, assets, company context. |
| Matcher | Teal, Rezi, Jobscan | Requirements matrix, not only keyword score. |
| Analyzer | Teal, Rezi | Issue cards tied to evidence, risk, and role fit. |
| Auto-select | Teal | Reversible diff with include/exclude reasons. |
| Extension save | Teal, Huntr | Accurate capture, manual fallback, source URL, review before save. |
| Extension side panel | Teal | Primary extension UI with detected job, proof summary, save status, duplicate state, manual repair, and apply checklist. |
| Autofill | Simplify, Huntr | Field controls, copy fallback, no auto-submit. |
| Contacts | Teal, Huntr | Lightweight referral path tied to job/company. |

## Final Teardown Decisions

- Teal is the main capability benchmark.
- Huntr is the clearest public visual benchmark for a broad search manager.
- Simplify sets the controls and fallback benchmark for extension/autofill behavior.
- Rezi and Jobscan set resume/ATS expectations.
- EarnBetter sets free utility pressure.
- Job Filter should not out-broaden the category. It should out-trust and out-decide it.

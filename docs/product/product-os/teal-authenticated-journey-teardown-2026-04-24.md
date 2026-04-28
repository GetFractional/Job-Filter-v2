# Teal Authenticated Journey Teardown

Date: 2026-04-24  
Status: active teardown note  
Scope: authenticated Teal journey, Chrome extension side panel, saved Hinge role, resume tailoring pass  
Application status: no external job application submitted

## Objective

Understand Teal's end-to-end job-search journey well enough to inform Job Filter's product system, extension architecture, resume workflow, and review-before-apply gates.

## Method

Observed surfaces:

- Teal Chrome extension installation and side panel
- Teal public job search launched from the extension
- Teal external job-board save flow on Indeed
- Teal Job Tracker saved-job workspace
- Teal Resume Builder, Auto-Select, Analyzer, and Job Matcher
- Teal logged-in tool directory, tracker, company, contact, compensation, offer, interview, and work-style surfaces from the prior pass

Framework lenses used:

- First principles: what must happen for a user to find, decide, tailor, and apply without losing trust
- JTBD: "help me pursue the best-fit role without turning my career into spreadsheet theater"
- MECE: capture, decide, tailor, apply, track, learn
- MoSCoW: table stakes versus differentiators
- Inversion: what would make the product create bad applications, false confidence, or privacy risk
- Second-order thinking: how matcher/analyzer incentives shape user behavior over time
- Design thinking: observed friction to product requirement

## Teal Journey Summary

### 1. Extension Launch And Super Search

Teal's Chrome extension uses the browser side panel rather than an in-page overlay. The side panel includes:

- Super Search with job title and location inputs
- selectable job-board buttons for Teal, Indeed, LinkedIn, ZipRecruiter, Glassdoor, Monster, CareerBuilder, Dice, SimplyHired, BuiltIn, We Work Remotely, Snagajob, Government, and Idealist
- a `Search Selected Sites` action that opens separate job-board tabs
- a navigation menu for Job Search Dashboard, Super Search, Edit Goals, Add Job, Add Contact, Add Company, Teal Home, Job Tracker, Contact Tracker, Company Tracker, Resume Builder, Support Center, Account Settings, and Log Out

Product read:

- The side panel is the right default for Job Filter's extension. It is less invasive than a website overlay, easier to keep consistent across job boards, and likely safer around LinkedIn/Indeed UI policy pressure.
- Job Filter should use in-page scripts for extraction and signals, but keep the review UI, save state, and next actions in the side panel.
- The Super Search pattern is useful, but Job Filter should bias toward quality and role-lane fit instead of opening many tabs by default.

### 2. External Job-Board Save Flow

On Indeed, the Teal side panel switched into a `Save Job` flow with:

- detected source URL
- stage dropdown
- excitement rating
- notes field
- `Save Link to Teal`

Observed stage options:

- Bookmarked
- Applying
- Applied
- Interviewing
- Negotiating
- Accepted
- Declined
- Rejected
- Archived
- No Response

Product read:

- Source URL, stage, notes, and user sentiment are table stakes for capture.
- Teal's save experience is compact and operationally clear.
- The reported LinkedIn extension spinner loop, while still saving the job, is a critical reliability smell. Job Filter needs explicit async states: detecting, saving, saved, duplicate found, retry needed, and manual fallback.

### 3. Saved Job To Resume Tailoring

The saved Hinge job existed in Teal:

- Saved job URL: `https://app.tealhq.com/job-tracker/e09b2c6e-9954-4beb-bc91-24eaacc73c11`
- Target role: Senior Director, Marketing Operations
- Company: Hinge
- Source apply URL: LinkedIn job `4402156250`

Resume journey used:

1. Open saved job in Job Tracker.
2. Go to the job's resume area.
3. Use `Auto-Select Content to Matched Job`.
4. Create a new resume.
5. Add target title.
6. Add a role-specific professional summary.
7. Add skills aligned to the job's operating-model, GTM, planning, tooling, vendor, and team-leadership requirements.
8. Add and select proof-heavy bullets tied to prior roles.
9. Review Analyzer and Job Matcher.

Resume created:

- Resume title: `Senior Director, Marketing Operations at Hinge`
- Teal resume URL: `https://app.tealhq.com/resume-builder/resumes/560c284b-c949-4571-80fc-8a6e06c2077c/matching`

Last verified saved state:

- Job Matcher: 92%
- Analyzer: not re-run after the final one-bucket skills keyword pass
- Analyzer issue badge visible after reload: 8
- Keyword Usage: 0 issues
- Resume Structure and Measurable Results: not re-audited after the final keyword pass

Key resume decisions:

- Added a target title for Senior Director, Marketing Operations.
- Added a professional summary grounded in marketing operations, GTM systems, lifecycle programs, dashboards, team leadership, revenue scale, and operating cadence.
- Added skill coverage for marketing operations, GTM planning, OKRs, program management, prioritization, roadmap alignment, capacity forecasting, budget visibility, vendor and agency management, workflow design, acquisition strategy, lifecycle, CRM, dashboards, automation, AI workflows, cross-functional leadership, and campaign operations.
- Tested category-based skill sections, then reverted to one skills bucket because categories consumed too much resume space for the value provided in this target resume.
- Re-enabled legitimate matcher terms that were supportable by the user's history, including `Contractors`, `High-performing Teams`, `Manage Vendors`, `Prioritizing`, `Recommendations`, `Sourcing`, `Team Structure`, and `Tracking`.
- Added exact-match skills that were relevant and supportable: `Tooling`, `Consumer Insights`, `Creative Operations`, `Process Refinement`, `Mentor`, `High-impact Programs`, `Insights`, `Marketing Tooling`, and `Creativity`.
- Added proof bullets for operating systems, revenue scale, lifecycle infrastructure, BI dashboards, agency/vendor management, and recruiting/time-to-fill systems where supported by existing resume history.
- Added Breakthrough Academy as a relevant Marketing Operations Manager role because it provides direct marketing-operations proof for webinar funnel operations, paid acquisition coordination, CRM migration, lifecycle follow-up, and membership growth.
- Avoided unsupported or low-signal matcher terms such as `Global Marketing`, `Seasoning`, `Social impact`, `Global`, and `Aligned`.

Important caveat:

- Job Matcher moved from the earlier 66% state to 92% primarily by adding exact-match skills and re-enabling supportable keyword chips. That proves Teal's matcher is highly sensitive to skill-token presence. It does not prove the resume is 26 points better. Job Filter should let users improve coverage, but separate legitimate keyword coverage from noisy score-chasing.

## Authenticated Resume Builder Follow-Up

Date: 2026-04-24  
Status: implemented in Teal for user review  
Application status: no external job application submitted

### Resume Editor And Preview Behavior

Teal's resume editor uses a strong split workflow:

- left side: editable resume content with selectable checkboxes for summaries, roles, bullets, skills, dates, and locations
- right side: context-specific guidance, Analyzer, Job Matcher, or rendered preview depending on selected tab and selected content
- bullet-level controls: edit, duplicate, delete, improve with AI, and checkbox include/exclude
- live preview that updates as content changes

The strongest observed pattern is contextual preview adaptation. When a user selects a bullet, Teal changes the right rail to bullet guidance instead of leaving the user in a static PDF preview.

Job Filter implication:

- Use a split editor and preview, but make the right rail proof-aware instead of only suggestion-aware.
- When a bullet or cover-letter paragraph is selected, show the linked requirement, source claim, evidence, risk state, and why it was included.
- Keep `excluded` items visible with rationale so users know what was intentionally not used.

### Analyzer Findings

The most recently inspected Analyzer state before the final keyword pass was:

- Overall score: 76%
- Issues: 7
- Keyword Usage: 0 issues
- Remaining issues: bullet length, missing improvement metrics, and missing time statements

After the final keyword pass, the Job Matcher was verified at 92%, but the Analyzer was not re-run in detail. The visible Analyzer badge showed 8 items.

Product read:

- Analyzer is useful as mechanical lint.
- Analyzer is risky as a goal state. It pushes toward adding time statements and metrics even when a stronger strategic bullet should stay as-is.
- Job Filter should separate resume mechanics from proof strength, claim legitimacy, and role-fit value.

### Job Matcher Findings

The current Job Matcher state is:

- Match score: 92%
- Good signals: marketing operations, marketing planning, systems, branding, budgeting, forecasting, workflows, go-to-market, operating budget, operational excellence, partnerships, product marketing, roadmaps, strategy and execution, planning, operations, alignment, communications, OKRs, reporting
- Legitimate terms added or re-enabled to lift coverage: `Contractors`, `High-performing Teams`, `Manage Vendors`, `Prioritizing`, `Recommendations`, `Sourcing`, `Team Structure`, `Tracking`, `Tooling`, `Consumer Insights`, `Creative Operations`, `Process Refinement`, `Mentor`, `High-impact Programs`, `Insights`, `Marketing Tooling`, and `Creativity`
- Remaining unsupported or low-value extracted terms: `Global Marketing`, `Seasoning`, `Social impact`, `Global`, and `Aligned`

Product read:

- Teal can identify relevant terms but cannot reliably separate resume-worthy skills from ordinary words, vague concepts, or culture-language fragments.
- Job Filter should classify extracted terms as `required`, `preferred`, `contextual`, `noise`, or `unsupported`, and should not pressure users to add noise terms just to lift a score.
- Job Filter should show a keyword can be `supported but low-value`, `supported and valuable`, `unsupported but plausible`, or `unsupported and risky`. This is more useful than a flat missing-keyword list.

### Designer Findings

The Designer tab includes Presentation, Sections, Settings, and Advanced controls. Useful controls observed:

- font selection
- accent color
- line height and list line height
- header alignment
- date and location alignment
- skills layout: comma separated, comma separated list, or columns

Resume styling decision:

- Switched the resume toward a more distinctive but still professional template direction using Poppins, teal accents, and tighter line settings.
- Tested skill categories, then reverted to a one-bucket skills layout because the categories were not evenly balanced and consumed too much vertical space.

Job Filter implication:

- Template design is table stakes, but it should not become the product center.
- The asset builder should expose a small number of professional templates with strong defaults and a live preview.
- The bigger differentiator is traceable content quality, not template variety.

### Cover Letter Findings

Teal's Cover Letter tab includes:

- a manual editor
- live preview using resume contact information and design settings
- `Write with AI`
- AI settings for length, tone, job, custom prompt, and model
- history and copy-text controls

Cover letter created in Teal for review:

- Uses Bob's Watches proof for revenue scale, team leadership, vendor coordination, CRM, lifecycle, SEO, paid social, content, and reporting.
- Uses Breakthrough Academy proof for webinar funnel operations, paid search, paid social, CRM workflows, lifecycle follow-up, membership growth, and Keap-to-Zoho One migration.
- Positions the throughline as marketing operating cadence, budget visibility, dashboards, workflow design, and cross-functional follow-through.

Job Filter implication:

- Cover letters should be generated or edited at the paragraph level with visible proof links.
- Each paragraph should show: source claim, supporting evidence, requirement served, risk state, and why it belongs.
- The user should be able to approve, edit, or exclude each paragraph before copy/export.

### Work History Completeness Guidance

Recommendation for resumes:

- Include all companies and titles needed for chronological continuity.
- Expand only recent or target-relevant roles with responsibilities and outcomes.
- Keep older or less relevant roles as company/title/date entries, or at most one highly relevant proof bullet.
- For this Senior Director, Marketing Operations target, the strongest expanded roles are Bob's Watches, Breakthrough Academy, Affordable Insurance Quotes, Prosper Wireless, and selected Get Fractional work.

Product implication:

- Job Filter should distinguish `history continuity` from `application evidence`.
- A role can appear on the resume timeline without being used as proof for the target job.
- The asset builder needs controls for `show role`, `use as proof`, and `exclude from target narrative`.

## Hinge Role Requirements Observed

The job centers on marketing operations leadership, not pure demand generation.

Core requirements and responsibilities:

- 12+ years in marketing operations, production, or program management
- 5+ years building and leading teams
- GTM execution across brand, product, growth, and creative
- annual and quarterly planning
- OKRs and progress tracking
- operating model ownership
- scoping, prioritization, and roadmap alignment
- risk, dependency, capacity, and volume forecasting
- decision and work-approval systems
- tools and workflows for demand forecasting, progress tracking, impact measurement, and budget visibility
- Marketing/Product/Ops connective tissue
- team leadership, mentorship, producers, PMs, ops leads, contractors, and freelancers
- vendor and agency scoping, onboarding, oversight, sourcing, and contracting

Best target-lane read:

- Primary lane: Senior Director, Marketing Operations
- Adjacent lanes: Director/Senior Director of Marketing Operations, GTM Operations, Growth Operations, Marketing Program Management, Lifecycle/Growth Operations
- Lower fit lane: pure Director of Growth roles that over-index on paid acquisition without operating-model ownership

## Teal Strengths

- Broad suite with clear app taxonomy.
- Side panel extension keeps job-board workflows compact.
- Job Tracker has mature stages, notes, company/contact surfaces, and downstream status leverage.
- Resume Builder is integrated with saved jobs.
- Auto-Select quickly produces a starting point.
- Job Matcher gives immediate keyword feedback.
- Analyzer creates a checklist of mechanical resume issues.
- Downstream tools, such as interview practice and compensation analysis, connect to tracker state.

## Teal Weaknesses

- Auto-Select started from a weak fit baseline, then required substantial manual judgment.
- Matcher incentives push toward keyword presence even when terms are unsupported, ambiguous, or low-value.
- Analyzer issues are useful but mechanical. They do not understand whether a bullet is the right proof for the role.
- Keyword Usage can hit zero issues while proof quality and claim lineage remain unresolved.
- The product does not clearly show why a bullet was selected, which proof supports it, or which missing requirements should remain missing.
- The extension save spinner issue suggests async state is not trustworthy enough.
- The tracker and resume tooling are strong, but the decision layer still feels resume-first rather than proof-first.

## Job Filter Product Implications

### Must

- Use a Chrome side panel as the primary extension UI.
- Keep review-before-save and review-before-apply visible.
- Save source URL, stage, notes, company, role, location, and extraction status.
- Support manual add and repair when extraction fails.
- Show async save state with read-after-write confirmation.
- Build a requirements matrix that separates proven, plausible, missing, risky, disqualifying, and excluded requirements.
- Preserve used, missing, and excluded rationale for every resume or cover-letter claim.
- Keep job status, next action, deadline, and follow-up operationally visible.
- Let users approve Profile truth before it flows into an application asset.

### Should

- Support role lanes so broad operators can compare Marketing Operations, Growth Operations, GTM Operations, and Growth Marketing paths.
- Provide a quality-first search launcher that opens fewer, better searches rather than many generic job-board tabs.
- Offer side-panel job capture on LinkedIn, Indeed, Teal, and other boards through adapters.
- Show what changed in tailored resumes before export or application.
- Use tracker status to unlock downstream interview prep, follow-up, and offer prep with explicit prerequisites.

### Could

- Add a goals dashboard similar to Teal's weekly jobs/applications targets, but convert it into quality-weighted progress.
- Add lightweight contact/company tracking inside the job workspace before building full standalone trackers.
- Add a work-style/preference module only if answers directly alter role-lane recommendations or fit scoring.
- Add AI job search chat as a secondary helper, not the primary IA.

### Won't For MVP

- No auto-submit.
- No hidden auto-apply promise.
- No resume-template marketplace as the product center.
- No broad standalone CRM before job-context contact workflows are proven.
- No keyword score as the primary confidence mechanism.

## Extension Architecture Recommendation

Recommended architecture:

- Side panel app as the user-facing control center.
- Content scripts as board-specific extractors and page-state observers.
- Background service worker as the coordinator for active tab state, auth, persistence, and retry.
- Job Filter app API as the source of truth for saved jobs, proof status, Profile claims, and asset versions.

Minimum viable side-panel states:

- Unsupported page
- Detecting job
- Review extracted job
- Save in progress
- Saved with read-after-write receipt
- Duplicate found
- Extraction failed with manual add
- Match and proof summary
- Resume or asset readiness
- Apply checklist, not submit

Compliance and UX rationale:

- The page should not carry a persistent product overlay.
- The extension can inject minimal affordances only when necessary.
- The side panel should be the stable UI for extraction review, rationale, and next action.

## Product Wedge

Teal helps users organize, tailor, and optimize. Job Filter should help users decide, prove, and then apply.

The winning wedge is not another tracker or resume score. It is a proof-grounded application workspace:

- Is this role worth applying to?
- Which requirements can I prove?
- Which claims are missing, weak, or risky?
- Which resume/cover-letter changes are grounded?
- What should I do next, and what should I not do?

## Review Gate

The Hinge resume is ready for human review in Teal, not for external submission.

Before any application:

- user reviews the Teal resume draft
- user approves or requests edits
- final application target is confirmed
- final submission action gets explicit approval at action time

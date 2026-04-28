# Product IA And Screen Contract

Last updated: 2026-04-22

## Product Promise

`Apply with confidence to roles you can prove you fit.`

Every screen should help the user reduce one or more uncertainties: target, fit, proof, story, execution.

## Public IA

| Route | Page | User job | Primary CTA | Secondary CTA |
| --- | --- | --- | --- | --- |
| `/` | Home | Understand who this is for and why it is different. | `Build my job profile` | `See how it works` |
| `/how-it-works` | How It Works | Understand the path from Profile to reviewed application. | `Build my job profile` | `Open worksheet` |
| `/pricing` | Pricing | Understand Free tier and paid upgrade logic. | `Start free` | `See what is included` |
| `/worksheet` | Job Profile Worksheet | Capture demand before full signup. | `Start my profile` | `Send me the worksheet` |
| `/auth` | Auth | Create account or sign in. | `Continue setup` | `Sign in` |
| `/privacy` | Privacy | Understand data handling. | None | None |
| `/terms` | Terms | Understand legal terms. | None | None |
| `*` | 404 | Recover from dead route. | `Go home` | `Sign in` |

## Signed-In IA

| Route | Surface | User job | Primary action |
| --- | --- | --- | --- |
| `/profile` | Profile | Build and verify reusable job-search truth. | `Continue to Role Discovery` when gate passes |
| `/jobs` | Jobs | Capture and manage opportunities by lane. | `Add a job` |
| `/jobs/review/:jobId` | Review | Decide whether a saved job is worth active application work. | `Move to Applications` |
| `/applications` | Applications | Manage committed applications and next actions. | `Open Workspace` |
| `/applications/:applicationId` | Workspace | Execute one application with grounded materials. | `Review next action` |
| `/settings` | Settings | Manage account, privacy, exports, integrations, and preferences. | Contextual |

## Shared Component Standards

All screens with AI or generated output need:

- source evidence link or reason when evidence is missing
- confidence state
- visible user approval affordance
- edit and exclude affordance
- rollback or undo where feasible
- no hidden submission

All data-heavy surfaces need:

- search
- filter
- sort
- columns when table-based
- empty state
- loading state
- error state
- offline or degraded state where local cache exists

## Screen: Home

### User job

Decide whether Job Filter solves their actual job-search problem.

### Experience

The first viewport should make the product and customer clear without sounding like a generic AI suite. It should show a real product surface or product-like proof, not a vague illustration.

### Required components

- public header: `How It Works`, `Pricing`, `Sign in`, `Build my job profile`
- hero headline: `Apply with confidence to roles you can prove you fit.`
- support copy: `Build a reusable career profile from your real experience, see which opportunities are worth pursuing, and review every claim before it moves into an application.`
- proof boundary strip: `No auto-apply`, `Review before send`, `Source evidence`
- product mechanism preview: Profile -> Role Discovery -> Review -> Workspace
- table-stakes reassurance: free start, export, no hidden submission
- footer with Privacy, Terms, Worksheet

### States

- normal
- CTA loading
- auth handoff error
- worksheet capture submitted

### Acceptance criteria

- Headline names a concrete user outcome.
- Hero does not use `winning lane`, `10x`, `dream job`, or `job-search OS`.
- Free tier and review-before-send are visible before Pricing.

## Screen: How It Works

### User job

Understand the product workflow and why setup is worth it.

### Required sections

1. Build your Profile from real work history.
2. Verify what can be reused.
3. Discover role directions and lanes your proof can support.
4. Add or capture a job.
5. Review fit, proof, and risks.
6. Move qualified applications into Workspace.

### Acceptance criteria

- Each step includes a product object and user decision.
- The flow never implies auto-apply.
- Profile setup is framed as reusable leverage, not intake admin.

## Screen: Pricing

### User job

Understand what is free, what is paid, and whether the product will create value before payment.

### Required components

- `Free tier` plan
- future paid plan beta framing
- trust boundary: no payment required to start
- free first win description
- export/data portability note
- FAQ absorbed into page

### Acceptance criteria

- Pricing does not hide export behind a last-minute paywall.
- Upgrade moments happen after visible value.
- No fake urgency or unsupported outcome claim.

## Screen: Job Profile Worksheet

### User job

Capture enough context to understand the Profile concept before or instead of full signup.

### Required fields

- current target roles
- recent roles
- confusing, thin, or hard-to-package parts of background
- strongest proof points
- roles they are unsure about
- email capture

### Acceptance criteria

- Worksheet is secondary to the main product story.
- Submitted worksheet routes toward `Build my job profile`.

## Screen: Auth

### User job

Create account or sign in and land in the right signed-in state.

### Required behavior

- new user lands in `Profile`
- returning incomplete user lands in the next activation state
- returning active user lands in `Applications` or most relevant unfinished work

### Acceptance criteria

- New users are not dropped on a generic dashboard.
- `Continue setup` is used only for signed-in continuation.

## Screen: Profile

### User job

Turn messy source material into verified reusable truth.

### States

| State | Name | User job | Exit |
| --- | --- | --- | --- |
| P0 | Add your experience | Attach resume, LinkedIn, or manual start. | Source exists. |
| P1 | Check your history | Verify roles, dates, responsibilities, outcomes, skills, tools. | Required history categories clear. |
| P2 | Verify for reuse | Confirm stories, proof, metrics, exclusions. | `Continue to Role Discovery` gate passes. |
| P3 | Role Discovery | Create Role Lanes based on verified truth. | At least one lane exists. |

### D2 `Check your history` components

- company-grouped master table
- Role as primary row
- frozen Company column with quiet role carry-label
- one-row toolbar: search, filter, columns, sort, add role
- closed-by-default right drawer
- role drawer modules: role identity/timeline, responsibilities, outcomes, skills/tools, compensation fields approved for first slice, source evidence
- Verification progress bar with category X/Y counts
- inline Imported/Conflict/Verified counts
- Blockers taxonomy
- insert-in-place Add role
- record add/edit/remove/reorder controls
- autosave status

### Acceptance criteria

- Education and certificates are deferred from first D2 master view.
- Generic `Proof details` is replaced by local `Source evidence` and `See source`.
- `Continue to Role Discovery` is disabled until required categories pass.
- Any field shown in drawer can be surfaced by an approved table column.

## Screen: Jobs

### User job

Turn role strategy into concrete opportunities.

### Required components

- saved jobs table
- lane filter
- status filter
- source URL and capture source
- fit status
- effort/priority
- deadline and next action
- manual add
- future extension capture entry

### States

- empty: no lane
- empty: lane exists, no jobs
- loading
- parser error
- saved job ready for Review
- unsupported source fallback

### Acceptance criteria

- Jobs is not a generic feed.
- Jobs can accept manual entry at launch.
- Every saved job can move to Review or stay held.

## Screen: Review

### User job

Decide whether this job is worth applying to and what proof supports the application.

### Required components

- job summary
- Role Lane context
- requirements matrix: proven, plausible, missing, risky, disqualifying, excluded
- proof coverage
- opportunity-cost panel
- source evidence links
- recommended next action
- decision controls: apply, hold, reject
- asset readiness preview

### Acceptance criteria

- Review is mandatory before `Applications`.
- A job can be rejected or held without creating an application.
- The product explains why, not only what score.

## Screen: Applications

### User job

Manage committed application work.

### Required components

- active applications table
- status
- role lane
- company
- latest next action
- due date
- follow-up
- latest asset state
- latest contact/referral path

### States

- no active applications
- active list
- waiting on response
- interview scheduled
- rejected
- offer/negotiation

### Acceptance criteria

- Applications only contains jobs the user intentionally promoted from Review.
- Status never hides proof or next action.

## Screen: Workspace

### User job

Execute one application with all context in one place.

### Required components

- fit snapshot
- proof snapshot
- active resume or application asset
- cover letter or message asset where relevant
- notes
- company context
- contact/referral path
- next action
- asset review status
- `Why this draft` lineage
- selected role-history continuity versus application-proof usage
- resume and cover-letter editor entry points

### Acceptance criteria

- Assets are not considered ready until reviewed.
- `Why this draft` shows source evidence and missing proof.
- Unsupported content cannot be exported as approved content.
- A role can be shown for chronology without being used as proof.
- A role, skill, bullet, or paragraph can be excluded with a saved rationale.

## Screen: Asset Builder

### User job

Turn approved Profile truth and one job's requirements into reviewable application materials.

### Required components

- split editor and live preview
- resume variant editor
- cover-letter editor
- section inclusion controls
- bullet and paragraph inclusion controls
- MECE skills taxonomy editor
- selected template and light design controls
- contextual right rail for selected item
- `Why this draft` panel with requirement, claim, evidence, and risk state
- unsupported suggestion blocker
- change summary before export/copy

### Contextual right-rail states

| Selected item | Right rail must show |
| --- | --- |
| Resume summary | target lane, requirements served, source claims, unsupported phrases |
| Work bullet | source role, evidence, metric confidence, requirement served, include/exclude rationale |
| Skill | hard/soft/tool/domain classification, evidence, matcher source, noise warning if applicable |
| Cover-letter paragraph | role requirement, source claim, source evidence, tone/voice note, risk state |
| Template/design | readability, page length, ATS-safe export caveat, brand restraint |

### Acceptance criteria

- Generated or edited content cannot be approved without lineage.
- The product distinguishes `show on resume` from `use as proof`.
- Skills are grouped by topic, not emitted as a single unstructured block.
- Weak extracted terms such as generic adjectives, culture fragments, or unsupported nouns are marked as `noise` or `unsupported`, not treated as skills.
- Export/copy is blocked for unsupported claims unless the user edits or excludes them.

## Screen: Settings

### User job

Control account, data, privacy, exports, integrations, and future extension behavior.

### Required components

- account
- plan state
- data export
- data deletion
- privacy
- integrations
- extension controls when available

### Acceptance criteria

- Free tier appears in account and upgrade moments, not ambient app chrome.
- Data export and deletion are easy to find.

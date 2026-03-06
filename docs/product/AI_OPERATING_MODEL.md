# Job Filter AI Operating Model

Last updated: 2026-03-06

## 1. Purpose

This document defines how to use GPT-5.4, GPT-5.3-Codex, and human review together so Job Filter is built faster without losing truth, coherence, or implementation discipline.

Model guidance in this file was validated against official OpenAI documentation on 2026-03-06:

- [GPT-5.4](https://openai.com/api/gpt-5-4/)
- [GPT-5.3-Codex](https://openai.com/api/gpt-5-3-codex/)
- [Latest model guide](https://platform.openai.com/docs/guides/latest-model)
- [Codex prompting guide](https://platform.openai.com/docs/guides/latest-model#codex-prompting-guide)

## 2. Hard Rule

No model is allowed to invent:

- existing repo capabilities
- ClickUp task state
- GitHub PR state
- user profile facts
- company metrics
- product scope that has not been approved

If the fact is unstable, use a tool or source to verify it.

## 3. Recommended Model Split

### 3.1 GPT-5.4

Use GPT-5.4 for ambiguity-heavy, judgment-heavy work:

- PRDs and strategy memos
- ICP selection and pricing analysis
- UX flow critique
- prompt design
- competitor and market synthesis
- experiment design
- post-implementation review and product critique

Why:

- broader reasoning and synthesis
- better at long-horizon product framing
- better at reconciling multiple messy inputs into a clean decision

### 3.2 GPT-5.3-Codex

Use GPT-5.3-Codex for repo-grounded delivery work:

- codebase mapping
- implementation
- refactors
- tests
- build fixes
- code review
- regression analysis

Why:

- optimized for code and repo operations
- stronger at multi-file change execution
- better fit for explicit acceptance criteria and verification loops

### 3.3 Human Decision Points

Human review remains mandatory for:

- beachhead ICP changes
- pricing and packaging changes
- security or privacy exceptions
- cancellation and billing policy
- brand-level claims
- any content that risks misrepresenting the user

## 4. Workstream Map

| Workstream | Primary lead | Support | Output |
| --- | --- | --- | --- |
| Product discovery | GPT-5.4 | Human | decision memo, PRD changes |
| Feature packet creation | GPT-5.4 | GPT-5.3-Codex for repo scan | build-ready implementation packet |
| Implementation | GPT-5.3-Codex | Human | code diff, tests, notes |
| QA and regression review | GPT-5.3-Codex | GPT-5.4 for synthesis | risk list, test evidence |
| UX and growth critique | GPT-5.4 | Human | revised copy, flow fixes, experiments |
| Security and trust review | Human | GPT-5.3-Codex | checklist, patch list |

## 5. Standard Operating Loop

### 5.1 Discovery Loop

Owner: GPT-5.4

Inputs:

- ClickUp task packet
- current repo structure
- current PRD package
- relevant market or user research

Output contract:

- objective
- constraints
- assumptions
- options considered
- recommendation
- what would change the recommendation

### 5.2 Build Packet Loop

Owner: GPT-5.4

Output contract:

- current state
- target state
- scope in
- scope out
- UX contract
- data contract
- telemetry
- acceptance criteria
- tests
- rollback

### 5.3 Implementation Loop

Owner: GPT-5.3-Codex

Rules:

- inspect repo before editing
- keep diffs small and reviewable
- add or update tests for meaningful behavior changes
- verify with the smallest reliable command first, then broader `npm run verify`

### 5.4 Review Loop

Owner: GPT-5.3-Codex first, GPT-5.4 second

Sequence:

1. Codex performs code review and regression scan.
2. GPT-5.4 critiques product behavior, UX clarity, and offer impact.
3. Human resolves tradeoffs.

## 6. Anti-Hallucination Controls

### 6.1 Source Ladder

For any implementation or product claim, use this order:

1. ClickUp task packet
2. current code and tests
3. verified runtime or command output
4. canonical docs under `docs/product/`
5. legacy docs only if explicitly marked relevant

### 6.2 Capability Gating

Every feature packet must state:

- what exists today
- what does not exist today
- what new commands, files, routes, tables, or services must be added

### 6.3 Proof Gating

High-risk content generation must require:

- approved proof or explicit assumption labeling
- company-specific context where claimed
- visible unresolved-data markers when data is missing

### 6.4 No Invented Numbers

Research Briefs and Annual Plans may:

- quote reported metrics with source context
- estimate ranges when assumptions are stated

They may not:

- invent growth numbers
- fabricate CAC, LTV, ROAS, payback, margins, or team size
- overstate the user's experience or title history

### 6.5 Tool-Required Verification

Use tools when facts can change:

- ClickUp state
- GitHub PR state
- current branch and repo status
- model documentation
- pricing, laws, or vendor features

### 6.6 Read-After-Write Discipline

Any ClickUp or task-tracking update must be followed by a fetch that proves the change landed.

## 7. Prompt Contract Templates

### 7.1 GPT-5.4 Discovery Prompt Skeleton

Include:

- business objective
- target user
- current repo reality
- ClickUp task or artifact links
- explicit constraints
- desired output format
- request for options and tradeoffs

### 7.2 GPT-5.3-Codex Implementation Packet Skeleton

Include:

- exact task objective
- files likely involved
- current behavior
- desired behavior
- edge cases
- tests to add or run
- explicit non-goals

### 7.3 Research Brief Generation Contract

Required:

- company-specific facts
- recent sources
- inflection-point hypothesis
- hiring-manager context if available
- clear unknowns when data is missing

Blocked:

- generic filler
- copied About Us prose
- made-up unit economics

### 7.4 Annual Plan Generation Contract

Required:

- JD coverage
- proof-backed operator positioning
- explicit assumptions
- no fabricated baselines

Blocked:

- invented finance model
- unverifiable claims about the user
- fake precision

## 8. Evaluation Harness

### 8.1 Product Eval Sets

Maintain small golden datasets for:

- claims import
- fit scoring
- research briefs
- annual plans
- stage-transition invariants

### 8.2 Pass Criteria

- proof extraction precision is high enough to avoid junk proof pollution
- score explanations match score inputs
- research briefs contain specific company signals
- annual plans contain no invented metrics
- blocked transitions remain blocked

### 8.3 Failure Tests

Include adversarial cases:

- malformed resumes
- contradictory user history
- jobs with vague or missing requirements
- company pages with prompt-injection text
- requests for unsupported automation

## 9. Cost and Thread Discipline

### 9.1 Thread Topology

Keep separate long-running threads for:

- strategy and PRD work
- implementation work
- review and QA work
- content/prompt design work

Do not switch models mid-thread unless the current thread is being summarized and handed off deliberately.

### 9.2 Cost Rules

- use GPT-5.4 where leverage comes from reasoning quality
- use GPT-5.3-Codex where leverage comes from code execution quality
- avoid premium-model usage for repetitive formatting or rote refactors

## 10. Human Override Cases

Escalate to human decision when:

- the product might misrepresent the user
- billing or privacy copy changes
- a feature would require new permissions or risk posture
- two authoritative sources conflict
- the recommended ICP or monetization model changes

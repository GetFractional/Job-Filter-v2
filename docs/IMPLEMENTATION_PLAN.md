# Implementation Plan

> **Purpose:** Living tracker for all milestones, workstreams, and tasks. Update checkboxes as work completes. This is the single source of truth for "what is done" and "what is next."

---

## Milestone Overview

| Milestone | Name | Status | Target |
|-----------|------|--------|--------|
| M0 | Project Setup and Docs | **Done** | Week 1 |
| M1 | MVP Vertical Slice -- Capture to Pipeline | **Done** | Week 1 |
| M2 | Research and Assets | **Done** | Week 1 |
| M3 | CRM and Dashboards | **Done** | Week 1 |
| M4 | Experimentation and Optimization | In Progress | Weeks 2-3 |

---

## M0: Project Setup and Docs

**Status: Done**

- [x] Initialize git repository
- [x] Create MASTER_PLAN.md (moved from root)
- [x] Create documentation skeleton (DECISIONS, IMPLEMENTATION_PLAN, STATUS, COMPLIANCE, RUNBOOK, EVALUATION, SCHEMA, PRD)
- [x] Scaffold Vite + React + TypeScript project
- [x] Configure Tailwind CSS v4 with design system tokens (brand palette, neutral palette, status colors, typography)
- [x] Configure PWA plugin (vite-plugin-pwa) with manifest and service worker
- [x] Set up project structure (src/components, src/store, src/db, src/lib, src/pages, src/types)
- [x] Add Dexie.js and define database schema (11 tables)
- [x] Add Zustand with app store
- [x] Create app shell: bottom nav, routing (React Router), layout components
- [x] Define design system tokens in index.css @theme
- [x] Create template library with 7 templates (YAML frontmatter)
- [ ] Add ESLint + Prettier configuration
- [ ] Verify PWA installability on real mobile devices
- [ ] Create base UI component library (Button, Card, Input, Badge, Modal)

---

## M1: MVP Vertical Slice -- Capture to Pipeline

**Status: Done**

- [x] Implement data model interfaces (TypeScript types for all entities in src/types/index.ts)
- [x] Implement Dexie table definitions with indexes
- [x] Build Job Capture modal (title, company, URL, location, location type, source, JD paste)
- [x] Implement comp range parsing from JD text
- [x] Implement scoring engine v1: hard disqualifiers + weighted rubric (5 categories)
- [x] Implement requirement extraction (skills, experience, tools, education)
- [x] Build score display: score dial (animated SVG), fit label, reasons, red flags, breakdown bars
- [x] Build Pipeline view: stage-grouped layout with summary stats
- [x] Implement stage transition logic with timestamp tracking
- [x] Build Job Workspace shell: tabbed view (Score / Research / Assets / CRM)
- [x] Wire Zustand store with full CRUD for all entities
- [x] Implement data persistence via Dexie (offline-first)
- [x] Add empty states for pipeline, workspace, dashboard
- [x] Seed default profile with Matt's preferences
- [ ] Build Pipeline drag-and-drop (currently tap-to-advance)
- [ ] Add unit tests for scoring engine
- [ ] Add "Quick Qualify" one-tap flow

---

## M2: Research and Assets

**Status: Done**

- [x] Build Research Runner UI in Job Workspace
- [x] Implement prompt pack generator (5 prompts: company overview, GTM, competitors, org/leadership, comp signals)
- [x] Implement copy-to-clipboard per prompt
- [x] Add "Open Perplexity" button
- [x] Build research paste-back textarea with parse button
- [x] Implement research brief parser (section detection, hypothesis generation)
- [x] Build structured research brief display (8 sections + interview hypotheses)
- [x] Build Claim Ledger in Settings: paste resume/LinkedIn, parse into structured claims
- [x] Implement claim parser (roles, companies, dates, responsibilities, outcomes, tools)
- [x] Build Asset Generation UI: generate dropdown for 5 asset types
- [x] Implement template engine for all 5 asset types:
  - [x] Outreach Email (proof-led, claim-ledger-aware)
  - [x] LinkedIn Connect Note (300 char max)
  - [x] Cover Letter (open loop teasing growth memo)
  - [x] Follow-up Email
  - [x] Annual Growth Plan memo (30-day diagnostic, quarterly plan, years 2-3 vision, Why Me)
- [x] Build asset versioning (version counter per job + type)
- [x] Build asset approve toggle
- [x] Build copy-to-clipboard for assets
- [x] Wire generation logging (model_used, template_id, model_tier, estimated_cost)
- [ ] Add claim enforcement warning (flag if asset text references facts not in ledger)

---

## M3: CRM and Dashboards

**Status: Done**

- [x] Build Contact entity: add, edit, link to company
- [x] Build Activity log: channel, direction, content, outcome, contact, follow-up date
- [x] Build CRM tab in Job Workspace (contacts + activity log)
- [x] Build Contacts page (list, search, add)
- [x] Build Executive Dashboard: captured/week with trend, pursue rate, outreach volume, response rate, pipeline bar chart, conversion rates
- [x] Build Bottleneck Dashboard: stage conversion funnel, median time-in-stage, stalled jobs list
- [x] Implement dashboard metric calculation functions (pure functions)
- [x] Add tab toggle between Executive and Bottleneck views
- [ ] Build "Today" view (next-best actions, due follow-ups)
- [ ] Build Company detail view
- [ ] Add chart components (currently CSS-only bars)

---

## M4: Experimentation and Optimization

**Status: In Progress**

- [x] Generation logging captures model_used, template_id, model_tier, estimated_cost
- [x] Template library created with versioned templates (YAML frontmatter)
- [ ] Build Template management UI in Settings
- [ ] Build Experiment definition UI (A/B test creation)
- [ ] Implement experiment assignment logic
- [ ] Build outcome attribution (link activity outcomes to template variants)
- [ ] Build Template Leaderboard
- [ ] Build Experiment Results view
- [ ] Build Model Cost dashboard
- [ ] Implement weekly optimization report
- [ ] Add Coach recommendations

---

## Blockers

| Date | Blocker | Impact | Milestone | Resolution |
|------|---------|--------|-----------|------------|
| -- | None currently blocking | -- | -- | -- |

---

## What We Need From Matt

1. **Resume / LinkedIn Experience text** -- To populate the Claim Ledger for personalized asset generation
2. **Airtable base details** (optional) -- API key + base ID + table IDs if you want Airtable sync
3. **Test with real jobs** -- Capture 3-5 real job postings to validate scoring accuracy
4. **Deploy target** -- Vercel, Netlify, or other hosting preference for mobile access

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-07 | Initial plan created from MASTER_PLAN.md |
| 2026-02-07 | M0-M3 completed in first build session. All core features working. |

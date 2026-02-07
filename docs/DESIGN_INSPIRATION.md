# Design Inspiration Board -- Job Filter v2 Redesign

> **Date:** 2026-02-07
> **Purpose:** Map 12 design references to Job Filter screens. Explain adopted patterns and rationale.

---

## Design Philosophy

**Core principle:** Dense, calm, professional. Think Linear, Notion, or Raycast -- not consumer mobile apps.

- **Desktop-first** with a persistent left sidebar (collapsible on mobile)
- **Above-the-fold information density** -- primary action + key metrics visible without scrolling
- **High-contrast type hierarchy** -- 900-weight headings on white, 500-weight secondary text, 400-weight tertiary
- **Muted background** with crisp white cards/panels
- **Monochrome with surgical color** -- status colors only where they carry meaning

---

## Screen-by-Screen References

### 1. Pipeline (Kanban + Table)

**Reference A: Linear Issue Tracker**
- Pattern adopted: Compact row-based list with inline status badges, no card bloat
- Why: Jobs in a pipeline need to be scannable. Card-heavy kanban wastes space when you have 20+ jobs. Compact rows with hover detail is faster.

**Reference B: Notion Board View**
- Pattern adopted: Toggle between kanban columns and dense table view
- Why: Kanban for spatial awareness of pipeline shape, table for sorting/filtering

### 2. Job Workspace (Score / Research / Assets / CRM)

**Reference C: Stripe Dashboard Detail View**
- Pattern adopted: Split layout -- fixed header + left sidebar summary + right content area
- Why: Job metadata (title, company, score, stage) stays visible while tabs scroll. No cognitive reset switching tabs.

**Reference D: GitHub Pull Request Detail**
- Pattern adopted: Dense metadata bar (labels, assignees, milestones) at top, tabbed content below
- Why: All critical decision data visible at a glance. Tabs for deep-dive content.

### 3. Score View

**Reference E: Raycast Extension Store Rating**
- Pattern adopted: Compact score badge (not a giant donut chart) with inline breakdown bars
- Why: The score is one signal among many. A 132px donut chart wastes the most valuable screen real estate. A compact 48px badge with adjacent breakdown is denser.

**Reference F: ProductHunt Score Cards**
- Pattern adopted: Side-by-side score + reasons layout (not stacked cards)
- Why: Pursue/Pass reasons are the decision support, not decoration. They belong next to the score.

### 4. Requirements Table

**Reference G: Greenhouse Job Requirements Matrix**
- Pattern adopted: Structured table with columns: Category | Requirement | Years | Priority | Match | Evidence
- Why: The current badge-and-text format is unreadable. A table is the correct data structure for comparing requirements against qualifications.

### 5. Research

**Reference H: Notion AI Research Template**
- Pattern adopted: Single master prompt with structured output sections, each expandable
- Why: Five separate prompts create fragmentation. One compound prompt with clear section markers produces a cohesive brief.

### 6. Asset Editor

**Reference I: Superhuman Compose / Linear Comment Editor**
- Pattern adopted: Sequential workflow -- Generate > Review > Edit > Approve. One asset at a time, full screen.
- Why: Current generate-all-at-once approach produces generic filler nobody reads. Sequential forces evaluation.

**Reference J: Hemingway Editor**
- Pattern adopted: Quality gates -- highlight placeholders, block approval if "[analysis needed]" or similar tokens remain
- Why: Template outputs must not be mistaken for finished content.

### 7. CRM

**Reference K: HubSpot Contact Card**
- Pattern adopted: First Name / Last Name fields, company entity linking, contact-to-job junction table, activity timeline
- Why: Professional CRM requires structured name fields. Single "name" field fails for mail merge and formal correspondence.

### 8. Onboarding

**Reference L: Cal.com / Vercel Onboarding Wizard**
- Pattern adopted: 4-step guided wizard -- Profile > Claim Ledger > API Keys > Done. Progress bar, back/next, skip where optional.
- Why: Current app dumps users into an empty pipeline with no profile set up. The first experience must build the foundation (profile, claims) before any job can be properly scored or assets generated.

---

## Design System Changes

### Typography
- **Heading 1:** 24px/600 weight, tracking -0.025em (page titles)
- **Heading 2:** 18px/600 weight, tracking -0.02em (section headers)
- **Heading 3:** 14px/600 weight, tracking -0.01em (card headers)
- **Body:** 14px/400 weight (content)
- **Small:** 12px/400 weight (metadata, timestamps)
- **Micro:** 11px/500 weight (badges, labels)
- **Font stack:** Inter Variable > system-ui > sans-serif

### Color Tokens
- **Background:** `#FAFAFA` (surface), `#FFFFFF` (card)
- **Border:** `#E5E7EB` (default), `#D1D5DB` (hover)
- **Text:** `#111827` (primary), `#4B5563` (secondary), `#9CA3AF` (tertiary)
- **Brand:** `#2563EB` (primary), `#1D4ED8` (hover), `#EFF6FF` (subtle)
- **Success:** `#059669` text, `#ECFDF5` bg
- **Warning:** `#D97706` text, `#FFFBEB` bg
- **Danger:** `#DC2626` text, `#FEF2F2` bg

### Spacing Scale
- 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Component Patterns
- **Cards:** `bg-white border border-gray-200 rounded-lg shadow-sm` (no xl radius on desktop)
- **Buttons primary:** `bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-lg`
- **Buttons secondary:** `border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium rounded-lg`
- **Inputs:** `bg-white border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500`
- **Badges:** `text-xs font-medium px-2 py-0.5 rounded-md` (not rounded-full -- too casual)
- **Tables:** Proper `<table>` with `<thead>`, alternating row shading, sortable headers

### Layout
- **Desktop (1024+):** 240px fixed sidebar + fluid content area
- **Tablet (768-1023):** 64px icon sidebar + fluid content
- **Mobile (<768):** Full width + top header + hamburger to slide-out nav
- **Max content width:** 1200px within content area
- **Page padding:** 24px on desktop, 16px on mobile

---

## Anti-Patterns to Avoid

1. **No giant donut/ring charts** for single metrics -- use compact inline indicators
2. **No bottom tab bars** on desktop -- sidebar navigation only
3. **No rounded-2xl or rounded-3xl** on desktop -- keep radii tight (lg/md)
4. **No slide-up modals on desktop** -- use inline panels or centered modals
5. **No text-[10px]** -- minimum readable size is 11px (0.6875rem)
6. **No stacked cards for tabular data** -- use actual tables
7. **No "Template Mode" disguised as AI** -- clearly label generation method

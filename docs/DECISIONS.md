# Decision Log

> **Purpose:** Record every significant architectural, tooling, and scope decision so future-you (or collaborators) can understand _why_ things are the way they are -- not just _what_ was chosen.
>
> **Format:** Each entry includes the decision, the reasoning, the tradeoffs accepted, what evidence would cause a reversal, and the date recorded.

---

## DEC-001: React + TypeScript + Vite + Tailwind for PWA

**Decision:** Build the PWA using React 18+ with TypeScript, Vite as the build tool, and Tailwind CSS for styling.

**Why:**
- React has the most mature PWA ecosystem (service workers via vite-plugin-pwa, Workbox integration, established patterns).
- TypeScript catches data-model bugs at compile time, which matters when the schema has 9+ entities with relationships.
- Vite provides sub-second HMR and fast builds, enabling rapid iteration during a solo-developer sprint.
- Tailwind's utility-first approach is inherently mobile-first and eliminates the need for a separate CSS architecture. Responsive breakpoints (`sm:`, `md:`, `lg:`) map directly to the mobile-first design requirement.

**Tradeoffs:**
- React is heavier than Preact or Solid; acceptable because the app is a productivity tool, not a content site where bundle size dominates Core Web Vitals.
- Tailwind can produce verbose JSX; mitigated by extracting reusable component abstractions once the design system stabilizes.
- Vite's ecosystem is newer than Webpack's; the risk is low given Vite's adoption trajectory and the project's modest build requirements.

**What would change our mind:**
- If bundle size exceeds 200 KB gzipped for the initial route and optimization fails to bring it down, evaluate Preact compat or route-level code splitting first, then consider a framework swap.
- If a compelling full-stack framework (e.g., Next.js or Remix) is needed for server-side features (auth, API routes), revisit -- but the current local-first architecture does not require a server.

**Date:** 2026-02-07

---

## DEC-002: IndexedDB via Dexie.js as primary local store, Airtable sync deferred

**Decision:** Use IndexedDB (wrapped by Dexie.js) as the primary data store for the MVP. Defer Airtable integration to a later milestone.

**Why:**
- Unblocks MVP development immediately without requiring Airtable API keys, schema setup, or network connectivity.
- Aligns with the offline-first principle in the master plan: capture and scoring must work on a phone with no signal.
- Dexie.js provides a clean Promise-based API, compound indexes, and versioned schema migrations -- all necessary for the 9-entity data model.
- IndexedDB has no practical storage limits for this use case (jobs, contacts, templates).

**Tradeoffs:**
- No cross-device sync until Airtable (or another sync layer) is wired up. Acceptable for a single-user MVP.
- Data lives only on-device; if the browser storage is cleared, data is lost. Mitigated by implementing JSON export/import early.
- Dexie adds a dependency (~40 KB); justified by the developer experience improvement over raw IndexedDB APIs.

**What would change our mind:**
- If multi-device access becomes critical before M2, introduce a lightweight sync layer (e.g., CouchDB/PouchDB or Supabase) instead of Airtable.
- If Airtable's relational model proves essential for BI dashboards that cannot be replicated client-side, pull Airtable integration forward.

**Date:** 2026-02-07

---

## DEC-003: Zustand for state management

**Decision:** Use Zustand as the global state management library.

**Why:**
- Extremely lightweight (~1 KB). No providers, no reducers, no action-type boilerplate.
- Works naturally with React 18 concurrent features and supports selective re-renders via shallow equality selectors.
- Middleware ecosystem covers the two things we need: `persist` (to bridge Zustand state with IndexedDB/localStorage for UI preferences) and `devtools` (for debugging during development).
- The team is one developer. Redux, MobX, and Jotai all solve problems that do not exist at this scale.

**Tradeoffs:**
- Zustand stores are singletons; if the app ever needs server-side rendering with per-request state isolation, Zustand requires workarounds. Not relevant for a client-only PWA.
- Less opinionated than Redux Toolkit, which means patterns must be self-enforced (e.g., keeping stores small, co-locating actions with state).

**What would change our mind:**
- If the number of stores exceeds 10 and cross-store dependencies become tangled, evaluate a more structured solution (Redux Toolkit or a pub-sub event bus).
- If React Server Components become part of the architecture, revisit state management entirely.

**Date:** 2026-02-07

---

## DEC-004: Scoring as a deterministic client-side function

**Decision:** Implement the fit-scoring engine as a pure, deterministic function that runs entirely in the browser. No LLM calls for scoring.

**Why:**
- Scoring must work offline and complete in under 1 second (the master plan targets < 20 seconds time-to-qualify, but most of that budget is for human review, not computation).
- Deterministic scoring is debuggable: given the same job data and weights, the same score is produced every time. This is essential for calibration.
- Eliminates per-job AI inference cost. At scale (50+ jobs/week), even cheap model calls add up and create latency.
- The scoring rubric (Section 9 of the master plan) is explicit enough to encode as weighted rules with hard disqualifiers.

**Tradeoffs:**
- A rule-based scorer cannot interpret nuanced JD language as well as an LLM (e.g., distinguishing "own paid media strategy" from "manage paid media accounts"). Accept this limitation for v1; compensate by surfacing the raw disqualifier signals for human review.
- Weight tuning requires manual calibration rather than learned optimization. Acceptable because the calibration loop (Section 9.4) is designed to use outcome data to adjust weights over time.

**What would change our mind:**
- If false-positive or false-negative rates exceed 20% after calibration with 50+ scored jobs, add an optional LLM re-scoring pass for "Maybe" jobs only (keeping the deterministic scorer as the first pass).
- If a local/free model (e.g., a small ONNX model running in-browser via WebLLM) can match LLM-level nuance at zero marginal cost, integrate it as a scoring enhancement.

**Date:** 2026-02-07

---

## DEC-005: Local AI generation stubs before real model APIs

**Decision:** Implement AI-powered asset generation (outreach messages, cover letters, growth memos) initially as template-based stubs with a clipboard workflow. Wire real model APIs (OpenAI, Anthropic, etc.) in a subsequent milestone.

**Why:**
- Unblocks the full capture-to-outreach flow without requiring API keys, billing accounts, or network connectivity.
- The clipboard workflow (generate prompt -> copy to ChatGPT/Claude -> paste result back) mirrors the research runner pattern and is already a proven manual workflow.
- Forces the template and variable system to be fully designed before adding model complexity. This ensures clean prompt engineering when real APIs are connected.
- Avoids premature model-provider lock-in. By the time real APIs are wired, the team will have better data on which tasks need premium models vs. cheap ones.

**Tradeoffs:**
- The MVP user experience includes manual copy/paste steps. Acceptable because the target user (you) already does this workflow manually today.
- Generated output quality depends on the external tool used (ChatGPT, Claude, etc.) rather than being controlled by the system. Acceptable for MVP; the template quality is the controllable variable.
- Cannot log model, cost, or token usage until real APIs are connected. Mitigated by logging template ID and version, which is the primary attribution dimension anyway.

**What would change our mind:**
- If the copy/paste friction causes outreach volume to drop below 5 per week, prioritize wiring at least one model API (cheapest viable: e.g., GPT-4o-mini or Claude Haiku).
- If a free-tier API with sufficient rate limits becomes available, wire it immediately to eliminate the clipboard step.

**Date:** 2026-02-07

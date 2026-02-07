# Job Filter v2

A premium, mobile-first "job revenue cockpit" that helps discover, qualify, research, and convert job opportunities into closed-won offers.

## Quick Start

```bash
npm install
npm run dev
```

## Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite + PWA (vite-plugin-pwa)
- **Styling:** Tailwind CSS v4
- **Storage:** IndexedDB via Dexie.js (offline-first)
- **State:** Zustand
- **Icons:** Lucide React

## Features (MVP)

- Job pipeline with 11 stages (Discovered through Closed Won/Lost)
- Instant fit scoring with deterministic scoring engine
- Perplexity research runner (no API cost)
- Asset generation (outreach email, LinkedIn connect, cover letter, growth memo)
- Mini-CRM (contacts, activities, correspondence)
- Executive and bottleneck dashboards
- Claim ledger (no hallucinated facts)
- Template versioning and experiment tracking

## Documentation

See `/docs` for:
- [Master Plan](docs/MASTER_PLAN.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Decisions Log](docs/DECISIONS.md)
- [Schema](docs/SCHEMA.md)
- [Compliance](docs/COMPLIANCE.md)
- [Runbook](docs/RUNBOOK.md)
- [Evaluation](docs/EVALUATION.md)

## Architecture

```
src/
  types/       - TypeScript type definitions
  db/          - IndexedDB database layer (Dexie)
  store/       - Zustand state management
  lib/         - Business logic (scoring, research, assets, metrics)
  components/  - React components
  pages/       - Route-level page components
templates/     - Asset and prompt templates with versioning
docs/          - Project documentation
```

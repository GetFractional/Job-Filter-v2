# Compliance and Guardrails

> **Purpose:** Define the safety boundaries and compliance rules that the system must enforce. These are non-negotiable constraints, not aspirational guidelines. Every feature must be reviewed against this document before shipping.

---

## 1. LinkedIn Safety

LinkedIn is the primary professional network. Losing access would materially damage job search effectiveness. The following rules are absolute.

### 1.1 No Scraping

- The system must **never** programmatically fetch LinkedIn pages, profiles, job listings, or search results.
- No HTTP requests to `linkedin.com` or `*.linkedin.com` domains from application code.
- No headless browser automation targeting LinkedIn.
- No use of unofficial LinkedIn APIs or reverse-engineered endpoints.

### 1.2 No Automation

- The system must **never** automate actions on LinkedIn: no auto-connect, no auto-message, no auto-apply, no auto-endorse, no auto-like.
- No browser extension or helper may inject click events, form submissions, or keyboard events into LinkedIn pages.
- No scheduled or batched operations that interact with LinkedIn's UI or APIs.

### 1.3 No DOM Injection

- No browser extension or content script may modify LinkedIn's DOM (add buttons, overlays, sidebars, or highlight elements on LinkedIn pages).
- The capture accelerator (if built) must operate via a **separate side panel or popup** that does not touch LinkedIn's page content.

### 1.4 Paste-Only Capture

- The **only** acceptable method for getting data from LinkedIn into the system is manual copy-and-paste by the user.
- The user copies text (job description, profile info, company details) from LinkedIn using their browser's native copy function.
- The user pastes that text into the Job Filter PWA's input fields.
- This workflow is indistinguishable from a user taking notes and is fully compliant with LinkedIn's Terms of Service.

### 1.5 Monitoring

- If a desktop capture helper is built, its manifest must request **zero** LinkedIn-related permissions.
- Code review checklist must include a LinkedIn safety audit for any feature touching external sites.

---

## 2. Claim Ledger Enforcement

The system generates professional assets (outreach messages, cover letters, growth memos) that represent the user to potential employers. Hallucinated or fabricated claims are career-ending risks.

### 2.1 Source of Truth

- The Claim Ledger is populated exclusively from user-provided input: pasted resume text, pasted LinkedIn experience sections, or manually entered claims.
- The system must **never** invent, infer, or fabricate professional claims, metrics, accomplishments, or credentials.

### 2.2 Claim Types

Each claim in the ledger has a type:

| Type | Description | Example |
|------|-------------|---------|
| `role` | Job title and company | "VP Marketing at Acme Corp" |
| `responsibility` | What the user did | "Owned lifecycle marketing strategy" |
| `tool` | Technology or platform used | "Iterable, Segment, Looker" |
| `metric` | Quantified outcome | "Increased retention 23% over 6 months" |
| `credential` | Education or certification | "MBA, University of X" |
| `capability` | Skill without specific metric | "Built and led cross-functional growth teams" |

### 2.3 Enforcement Rules

- **Metrics** (numbers, percentages, dollar amounts) may **only** appear in generated assets if they exist verbatim in the claim ledger.
- **Capabilities** may be expressed using non-numeric language even if no specific metric exists, as long as the underlying role/responsibility is in the ledger.
- Every generated asset must include a traceability annotation (visible to the user, not included in the output) mapping each claim to its ledger source.
- If a user manually edits a generated asset to add a claim not in the ledger, the system should display a warning (not a hard block, since the user is the authority).

### 2.4 Prohibited Patterns

- "Grew revenue by X%" where X is not in the ledger.
- "Managed a team of N" where N is not in the ledger.
- "Achieved Y metric" where Y is not in the ledger.
- Implied credentials ("As a certified...") without ledger backing.

---

## 3. Model Cost Logging

AI inference has real costs. Even during the stub/clipboard phase, the logging infrastructure must be in place.

### 3.1 What Gets Logged

Every generation event (whether via real API or clipboard workflow) must record:

| Field | Description |
|-------|-------------|
| `timestamp` | When the generation was initiated |
| `jobId` | Which job the generation is for |
| `assetType` | outreach, cover_letter, growth_memo, research_prompt, etc. |
| `templateId` | Which template was used |
| `templateVersion` | Which version of the template |
| `model` | Model identifier (or "clipboard" for manual workflow) |
| `inputTokens` | Estimated input token count (null for clipboard) |
| `outputTokens` | Estimated output token count (null for clipboard) |
| `estimatedCost` | Estimated cost in USD (0.00 for clipboard) |
| `provider` | openai, anthropic, clipboard, etc. |

### 3.2 Cost Controls

- The system must display cumulative cost per day, week, and month in Settings.
- A configurable daily cost ceiling must exist. When reached, the system switches to clipboard workflow and notifies the user.
- Premium models (Tier 2) require explicit user selection; they are never auto-selected.

### 3.3 Attribution

- Cost must be attributable to specific jobs, enabling "cost per outreach" and "cost per interview" calculations in dashboards.

---

## 4. Data Privacy

The system handles sensitive personal and professional data. Local-first architecture is a privacy advantage, but explicit guarantees are required.

### 4.1 Local-First Principle

- All user data (profile, jobs, contacts, activities, assets) is stored in the browser's IndexedDB by default.
- No data is transmitted to any server unless the user explicitly initiates it (e.g., connecting an Airtable sync, calling a model API).
- The PWA must function fully offline after initial load.

### 4.2 What Data Stays Local

- Profile and claim ledger (resume content, career history, metrics).
- Job descriptions and scoring results.
- Contact names, emails, phone numbers.
- Activity logs and correspondence notes.
- Generated assets (outreach messages, cover letters, memos).
- Scoring weights and calibration data.

### 4.3 What Data May Leave the Device

Only when the user explicitly triggers the action:

| Data | Destination | Trigger |
|------|------------|---------|
| Prompt text (job data + claims) | AI model API | User clicks "Generate" with a real model selected |
| Structured records | Airtable | User enables Airtable sync (future) |
| Research prompts | Clipboard (then Perplexity) | User clicks "Copy Prompt" |
| Export file | User's filesystem | User clicks "Export Data" |

### 4.4 Export Capability

- The user must be able to export **all** their data as a JSON file at any time from Settings.
- The export must include all 9 entity types and their relationships.
- The export file must be re-importable to restore state on a new device or after a browser reset.

### 4.5 Delete Capability

- The user must be able to delete **all** their data from Settings with a single action (with confirmation).
- Individual record deletion must be available for all entity types.
- Deletion must be immediate and complete (no soft-delete or retention period for local storage).

### 4.6 No Analytics or Telemetry

- The v1 system must not include any third-party analytics, tracking pixels, or telemetry.
- No data is sent to the developer or any third party for product analytics purposes.
- If analytics are added later, they must be opt-in with clear disclosure.

---

## 5. Compliance Checklist for New Features

Before shipping any feature, verify:

- [ ] Does it interact with LinkedIn? If yes, confirm paste-only capture -- no scraping, automation, or DOM injection.
- [ ] Does it generate text representing the user professionally? If yes, confirm claim ledger enforcement is active.
- [ ] Does it call an external API? If yes, confirm cost logging is in place and the user explicitly initiated the call.
- [ ] Does it transmit user data off-device? If yes, confirm the user explicitly triggered the transmission and understands what is sent.
- [ ] Does it store new data? If yes, confirm it is included in the export/import and delete functions.

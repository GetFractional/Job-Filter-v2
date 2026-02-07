# Runbook -- Setup, Build, Deploy, and Troubleshooting

> **Purpose:** Everything needed to go from a fresh clone to a running development server, a production build, or a deployed instance. Keep this updated as the stack evolves.

---

## 1. Prerequisites

| Requirement | Minimum Version | Check Command |
|-------------|----------------|---------------|
| Node.js | 18.0.0+ | `node --version` |
| npm | 9.0.0+ | `npm --version` |
| Git | 2.30+ | `git --version` |
| Modern browser | Chrome 100+, Firefox 100+, Safari 16+ | -- |

**Recommended but optional:**

- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript Importer
- Chrome DevTools Application panel (for PWA debugging, IndexedDB inspection, service worker management)

---

## 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url> Job-Filter-v2
cd Job-Filter-v2

# Install dependencies
npm install
```

If you encounter permission errors on macOS/Linux:
```bash
# Ensure Node is managed via nvm (recommended)
nvm use 18   # or nvm use 20
npm install
```

---

## 3. Development Server

```bash
# Start the Vite dev server with hot module replacement
npm run dev
```

- Default URL: `http://localhost:5173`
- HMR is enabled; changes to components, stores, and styles reflect instantly.
- The development server does **not** enable the service worker by default (to avoid caching issues during development).

### Testing PWA features in development

To test PWA installability and service worker behavior during development:

```bash
# Build and preview with service worker enabled
npm run build && npm run preview
```

- Preview URL: `http://localhost:4173`
- Service worker is active in preview mode.
- Use Chrome DevTools > Application > Service Workers to inspect.

### Mobile development testing

To test on a phone connected to the same network:

```bash
# Start dev server accessible on the network
npm run dev -- --host
```

- Access via `http://<your-local-ip>:5173` from your phone's browser.
- Note: PWA install prompts require HTTPS. For local testing, use Chrome's `chrome://flags/#unsafely-treat-insecure-origin-as-secure` flag or deploy a preview build.

---

## 4. Build for Production

```bash
# Create optimized production build
npm run build
```

- Output directory: `dist/`
- Includes minified JS/CSS, optimized assets, service worker, and web manifest.
- Expected initial bundle size: < 200 KB gzipped.

### Verify the build

```bash
# Preview the production build locally
npm run preview
```

---

## 5. Deploy

The app is a static PWA. It can be deployed to any static hosting service.

### Option A: Vercel

```bash
# Install Vercel CLI (once)
npm i -g vercel

# Deploy from the project root
vercel

# For production deployment
vercel --prod
```

Vercel auto-detects Vite projects. No configuration file needed for basic deployment.

### Option B: Netlify

```bash
# Install Netlify CLI (once)
npm i -g netlify-cli

# Deploy from the project root
netlify deploy --dir=dist

# For production deployment
netlify deploy --dir=dist --prod
```

Or connect the GitHub repository to Netlify for automatic deployments on push.

### Option C: GitHub Pages

```bash
# Add homepage to package.json (adjust for your repo)
# "homepage": "https://<username>.github.io/Job-Filter-v2"

# Build and deploy (requires gh-pages package)
npm install --save-dev gh-pages
npx gh-pages -d dist
```

### Deployment configuration notes

- Ensure the hosting provider serves `index.html` for all routes (SPA fallback). Vite's default build assumes client-side routing.
- For Vercel: this is automatic.
- For Netlify: add a `_redirects` file in `public/`: `/* /index.html 200`
- For GitHub Pages: use a 404.html redirect strategy or hash-based routing.

---

## 6. Environment Variables

Environment variables are managed via `.env` files. Vite exposes variables prefixed with `VITE_` to the client.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_APP_TITLE` | No | "Job Filter" | Application title shown in the PWA manifest and browser tab |
| `VITE_OPENAI_API_KEY` | No | -- | OpenAI API key for AI generation (not needed for MVP clipboard workflow) |
| `VITE_ANTHROPIC_API_KEY` | No | -- | Anthropic API key for AI generation (not needed for MVP clipboard workflow) |
| `VITE_AIRTABLE_API_KEY` | No | -- | Airtable API key for sync (not needed for MVP local-first mode) |
| `VITE_AIRTABLE_BASE_ID` | No | -- | Airtable base ID for sync |
| `VITE_COST_CEILING_DAILY` | No | "1.00" | Daily AI cost ceiling in USD before auto-switching to clipboard workflow |

### Creating your .env file

```bash
# Copy the example file
cp .env.example .env

# Edit with your values (all are optional for MVP)
```

### Security notes

- `.env` is gitignored. Never commit API keys.
- `VITE_`-prefixed variables are embedded in the client bundle at build time. They are **not** secret in production. For true secrets, use a backend proxy (not needed for v1).
- For deployments, set environment variables in the hosting provider's dashboard (Vercel/Netlify settings), not in committed files.

---

## 7. Project Structure

```
Job-Filter-v2/
  docs/                    # Project documentation
    MASTER_PLAN.md         # Source of truth for product vision
    DECISIONS.md           # Decision log
    IMPLEMENTATION_PLAN.md # Living task tracker
    STATUS.md              # Current status snapshot
    COMPLIANCE.md          # Safety and guardrails
    RUNBOOK.md             # This file
    EVALUATION.md          # Metrics and calibration
    SCHEMA.md              # Data model reference
    PRD.md                 # Product requirements
  public/                  # Static assets (favicon, icons, manifest overrides)
  src/
    components/            # Reusable UI components
    db/                    # Dexie.js database definition and migrations
    lib/                   # Pure utility functions (scoring, parsing, formatting)
    pages/                 # Top-level route components
    stores/                # Zustand stores
    templates/             # Prompt and asset templates
    types/                 # TypeScript type definitions
    App.tsx                # Root component
    main.tsx               # Entry point
  index.html               # Vite entry HTML
  package.json
  tsconfig.json
  tailwind.config.ts
  vite.config.ts
  .env.example
  .gitignore
```

---

## 8. Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run test` | Run unit tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run type-check` | Run TypeScript compiler check (no emit) |

---

## 9. Troubleshooting

### "Module not found" after pulling new changes

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Service worker serves stale content

```bash
# In Chrome DevTools > Application > Service Workers:
# Click "Unregister" on the active service worker
# Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

# Or clear all site data:
# Chrome DevTools > Application > Storage > "Clear site data"
```

### IndexedDB data corruption or schema migration issues

```bash
# In Chrome DevTools > Application > IndexedDB:
# Delete the "JobFilterDB" database
# Refresh the page; the database will be recreated with the current schema
```

**Warning:** This deletes all local data. Export data first if needed.

### PWA not installable on mobile

1. Verify the site is served over HTTPS (required for service workers).
2. Verify `manifest.webmanifest` is being served (check Network tab).
3. Verify the manifest includes: `name`, `short_name`, `start_url`, `display: standalone`, `icons` (192px and 512px).
4. Check Chrome DevTools > Application > Manifest for errors.
5. On iOS Safari: PWA install is via "Add to Home Screen" in the share menu, not a browser prompt.

### Tailwind classes not applying

1. Verify `tailwind.config.ts` content paths include your source files: `./src/**/*.{ts,tsx}`.
2. Verify `@tailwind base; @tailwind components; @tailwind utilities;` is in your main CSS file.
3. Restart the dev server after config changes.

### Vite dev server port conflict

```bash
# Use a different port
npm run dev -- --port 3000
```

### Build fails with TypeScript errors

```bash
# Run type-check independently to see all errors
npm run type-check

# If strict mode is too aggressive during rapid development,
# temporarily adjust tsconfig.json (but fix before merging)
```

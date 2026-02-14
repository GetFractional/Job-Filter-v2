# Deploy Job Filter (Cloudflare Pages)

## Cloudflare Pages (recommended)
1. Push your branch to GitHub.
2. In Cloudflare Dashboard, go to `Workers & Pages` -> `Create` -> `Pages` -> `Connect to Git`.
3. Select repo `GetFractional/Job-Filter-v2`.
4. Use these build settings:
   - Framework preset: `Vite`
   - Build command: `npm ci && npm run verify && npm run build`
   - Build output directory: `dist`
   - Node version: `20` (or your project default)
5. Save and deploy.

## SPA routing fallback
- This repo includes `public/_redirects` with:
  - `/* /index.html 200`
- That keeps client-side routes working on hard refresh and direct links.

## Environment variables
- Only `VITE_` prefixed vars are exposed to the browser bundle.
- Set any required `VITE_*` variables in Cloudflare Pages -> Project -> Settings -> Environment variables.
- Never store private API secrets in `VITE_*` vars.

## How to grant me Cloudflare access safely
1. Create a scoped Cloudflare API token:
   - Permissions: `Account -> Cloudflare Pages -> Edit` and `Read`
   - Scope: only the target account (and project if using granular policies)
2. If deploying through GitHub Actions, add secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. If you want MCP-based Cloudflare operations:
   - Add a Cloudflare MCP server entry in `.codex/config.toml` (same pattern as ClickUp MCP).
   - Provide token/account via Codex environment variables, not checked into git.
   - Keep MCP server in read mode first, then switch to write after validation.

## Alternative deploy target
- Netlify:
  - Build command: `npm ci && npm run verify && npm run build`
  - Publish directory: `dist`
  - SPA fallback can use the same `_redirects` file.

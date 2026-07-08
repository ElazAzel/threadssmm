# Threads SMM Agent — AGENTS.md

## Dev commands

| Command | Purpose |
|---|---|
| `npm run dev` | Frontend only (Vite 8) |
| `npm run dev:server` | Local Supabase-compatible API (Express 5, port 54321) |
| `npm run dev:demo` | Demo mode — no real backend needed |
| `npm run build` | `tsc -b && vite build` |
| `npm run verify` | Lint → typecheck → demo build → e2e tests |
| `npm run test:e2e` | Playwright (Chromium) against `localhost:4173` |
| `npm run lint` | ESLint (TS + React hooks) |
| `supabase db push` | Apply DB migrations to a Supabase project |

## Local full stack

Two processes needed:

```bash
# Terminal 1: PostgreSQL (port 5432) + API proxy (port 54321)
npm run dev:server

# Terminal 2: Vite frontend (port 5173)
npm run dev
```

Requires PostgreSQL 17 running locally with database `supabase_local_dev` and migrations applied (see `supabase/migrations/`).

## Architecture

- **`src/`** — React 19 SPA. Entry: `src/main.tsx` → `App.tsx` (lazy routes via `react-router-dom` v7)
- **`api/`** — Vercel serverless functions (health, threads OAuth, AI generation, RSS monitor, cron publish). Shared helpers in `api/_lib/`
- **`supabase/migrations/`** — Ordered SQL migrations. Apply both files in sequence
- **`server/`** — Local dev-only Express proxy that mimics Supabase REST/Auth/Storage APIs. Not deployed
- **`*_mobile/`** and feature dirs (`account_management/`, `ai_studio/`, etc.) — already-extracted feature modules, not actively used from `src/`

## Key contexts

- `AuthContext` (`src/contexts/AuthContext.tsx`) — wraps Supabase auth; falls back to demo user when `VITE_DEMO_MODE=true`
- `WorkspaceContext` (`src/contexts/WorkspaceContext.tsx`) — manages workspace, brands, accounts, drafts, approvals, media, monitor data via Supabase client

## Database

- 15 tables with RLS, custom enums (`workspace_role`, `content_status`, etc.), RPC functions
- `auth.users` table required for local dev (created by `supabase/bootstrap.sql`)
- `private.threads_tokens` stores encrypted Threads access tokens (accessible only via `service_role` RPC)
- `updated_at` triggers on most tables
- Rate limiting via `private.api_rate_limits` and `check_api_rate_limit` RPC

## Env vars

All in `.env.example`. Key rules:

- `VITE_*` vars are client-side and baked into the bundle
- `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `THREADS_*`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET` are server-only. Never prefix with `VITE_`
- `TOKEN_ENCRYPTION_KEY` / `CRON_SECRET` must be random 32+ byte strings
- For local dev, set `VITE_SUPABASE_URL=http://127.0.0.1:54321`

## Express 5 quirk

Express 5 uses `path-to-regexp` v8. Wildcard catch-all routes like `:path(*)` no longer work — use regex routes instead (see `server/index.js` for patterns).

## Tests

- Playwright in `tests/e2e/`, configured for Chromium only
- Requires demo production build (`npm run build:test`) served via `npm run preview` on port 4173
- CI retries: 2. Local retries: 0

## Production (Vercel)

- Frontend + API serverless functions deployed together
- Rewrites in `vercel.json` route SPA paths to `index.html`
- Daily cron via `api/cron/publish` runs once per day, not exact minute — use manual publish for precise timing
- Demo mode is E2E-only; production never uses demo stubs

## File conventions

- No `export default function` — pages re-export named exports from barrel files
- No comments in source code unless asked
- React components use arrow functions, no separate interface files
- All text in Russian (UI locale)

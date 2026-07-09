# Deployment Guide — Threads SMM Agent

## Prerequisites

- Node.js 20+
- PostgreSQL 17 (local dev)
- Vercel account (production)
- Meta Developer App (Threads API)

## Environment Setup

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL` — Supabase project URL or `http://127.0.0.1:54321` for local
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon/publishable key
- `SUPABASE_SECRET_KEY` — service_role key (server-only)
- `GEMINI_API_KEY` — Google AI Studio key
- `JWT_SECRET` — 32+ byte random string (local dev only, auto-fallback)

For Threads integration:
- Create Meta Developer App
- Configure Threads API product
- Set `THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_REDIRECT_URI`
- Generate `TOKEN_ENCRYPTION_KEY` (32+ random bytes, hex)

## Local Development

### Full stack (PostgreSQL + API proxy + Vite)

```bash
# Terminal 1: PostgreSQL + API
npm run dev:server

# Terminal 2: Vite frontend
npm run dev
```

### Demo mode (no backend)

```bash
npm run dev:demo
```

## Vercel Deployment

### Frontend

1. Push to GitHub
2. Import repo into Vercel
3. Set framework: Vite
4. Set build command: `npm run build`
5. Set output directory: `dist`

### Environment Variables (Vercel)

Add all vars from `.env.example`. Note:
- `VITE_*` vars are available to frontend
- `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, etc. are server-only

### Cron Job

Add a Vercel Cron Job in Vercel Dashboard → your project → Cron Jobs:
- Endpoint: `/api/cron/publish`
- Schedule: `0 9 * * *` (daily at 9 AM)
- Header: `x-cron-secret: <your CRON_SECRET>`

## Verification

Open `/setup` in the deployed app to verify all environment variables are correctly configured.

## Database Migrations

```bash
npx supabase db push
```

Apply migrations in order from `supabase/migrations/`.

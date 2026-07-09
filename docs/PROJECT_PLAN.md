# Threads SMM Agent — Project Plan

## Architecture & Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 SPA, Vite 8, TypeScript |
| Backend | Vercel Serverless Functions (Express 5 dev proxy) |
| Database | PostgreSQL 17 + Supabase (Auth, RLS, RPC) |
| AI Providers | Google Gemini, OpenAI GPT, xAI Grok, Anthropic Claude, DeepSeek |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| Deployment | Vercel (SPA + API) |

## What Has Been Implemented

### 1. Core Platform (`src/`, `api/`)

- **Auth** — Supabase Auth with demo fallback (`AuthContext`)
- **Workspace** — multi-tenant workspaces with brands, accounts, roles (`WorkspaceContext`)
- **Content pipeline** — drafts → approvals → publishing (AI + human review)
- **AI Studio** — prompt-to-variants generation with Intent Engine
- **Engagement Factory** — reply generation, risk scoring
- **Monitoring** — RSS sources, trend detection, mention tracking
- **Analytics** — post metrics, best-time calculation, PDF reports
- **Threads API** — OAuth connect/callback, post publish, rate limiting (250/24h)

### 2. Multi-Provider AI System

**15 AI models, 5 providers, 3 categories:**

| Provider | Budget | Mid | Flagship |
|----------|--------|-----|----------|
| Google Gemini | Flash-Lite, 2.0 Flash | 2.5 Flash | 2.5 Pro + Imagen 3 |
| OpenAI | GPT-4o Mini | — | GPT-4o + DALL·E 3 |
| xAI Grok | Grok 3 Mini | — | Grok 3 |
| Anthropic Claude | — | Haiku 3 | Sonnet 4, Opus 4 |
| DeepSeek | V3 | R1 | — |

- Each model called via provider-specific SDK or OpenAI-compatible API
- JSON Schema response parsing for structured output (3 variants)
- Token-based billing: `reserve_tokens` → generate → `log_token_spend` or `refund_tokens`

### 3. Monetization & Billing

**Plans:**

| Plan | Price | Tokens/mo | $/token | Margin |
|------|-------|-----------|---------|--------|
| Starter | $15 | 150 | $0.100 | 88.4% |
| Creator | $29 | 400 | $0.073 | 89.4% |
| Pro | $59 | 1000 | $0.059 | 89.7% |
| Agency | $149 | 3000 | $0.050 | 89.8% |

**Token Packs:** 200 tn / $19 · 600 tn / $50 · 2000 tn / $145

**Discounts:**
- Annual prepay: −20%
- Launch promo (100 users): −50% first 3 months
- Referral: 1 month free per referral
- 14-day free trial with 50–200 starter tokens

**Cost breakdown (worst case):**

| Item | % of revenue |
|------|-------------|
| AI API costs | ~0.1–2% |
| Infrastructure (Vercel + Supabase) | <1% |
| Payment processing (Stripe) | 3–5% |
| Taxes | ~5% |
| **Total costs** | **~10–12%** |
| **Net profit** | **88–90%** |

### 4. Database Schema

15 tables with RLS, custom enums, RPC functions:

- `workspaces`, `profiles`, `workspace_members` — multi-tenant
- `brands` — brand voice, tone, rules, risk tolerance
- `threads_accounts` — connected Threads profiles with encrypted tokens
- `drafts`, `approvals` — content pipeline
- `token_balances`, `token_transactions` — AI token billing
- `model_pricing` — 15 models with token costs
- `subscriptions`, `billing_events` — Stripe billing
- `monitor_sources`, `monitor_items` — RSS monitoring
- `post_metrics`, `usage_events`, `audit_logs` — analytics

### 5. Infrastructure

- Frontend: Vite 8 SPA on Vercel Edge
- API: 12+ serverless functions (`api/*`)
- Database: Supabase PostgreSQL with RLS
- Storage: Supabase (media assets)
- Cron: scheduled publish + insight sync
- Monitoring: audit log, error tracking

## Remaining Work

| Task | Priority | Status |
|------|----------|--------|
| Vercel deploy (`vercel --prod`) | High | Blocked (needs CLI login) |
| Set env vars in Vercel Dashboard | High | Pending |
| Create Stripe products & webhook | High | Pending |
| Apply DB migrations via `supabase db push` | Medium | Pending |
| Create Meta Developer App for Threads OAuth | Medium | Pending |
| E2E tests with Playwright | Low | Needs local setup |

## Env Vars Required for Production

```
VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
GEMINI_API_KEY, GEMINI_MODEL
OPENAI_API_KEY, GROK_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
THREADS_APP_ID, THREADS_APP_SECRET, THREADS_REDIRECT_URI
TOKEN_ENCRYPTION_KEY, CRON_SECRET
```

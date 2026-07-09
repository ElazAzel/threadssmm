# API Reference — Threads SMM Agent

## Vercel Serverless Functions

All API routes are served from `api/` and deployed as Vercel serverless functions.

### Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/threads/authorize` | GET | Start Meta OAuth flow |
| `/api/threads/callback` | GET | Handle OAuth callback |
| `/api/ai/generate` | POST | Generate content variants via Gemini |
| `/api/rss/monitor` | GET | Poll RSS feed sources |
| `/api/cron/publish` | POST | Cron-triggered scheduled publishing |

### Threads OAuth

**`GET /api/threads/authorize?workspace_id=X&brand_id=Y`**
Redirects to Meta's OAuth dialog. Required scopes: `threads_basic`, `threads_publish`.

**`GET /api/threads/callback?code=...&state=...`**
Exchanges OAuth code for long-lived token. Encrypts and stores token via `store_threads_token` RPC.

### AI Generation

**`POST /api/ai/generate`**
```json
{
  "workspaceId": "uuid",
  "brandId": "uuid",
  "topic": "Benefits of content planning",
  "format": "post",
  "count": 3
}
```

Returns 3 content variants with hook and compliance scores.

### Cron Publishing

**`POST /api/cron/publish`**
Requires `x-cron-secret` header matching `CRON_SECRET`. Publishes all drafts with `status=scheduled` and `scheduled_at <= now`.

## Supabase RPC Functions

Used internally by serverless functions:

| Function | Purpose |
|---|---|
| `create_workspace_with_defaults` | Creates workspace + first brand after onboarding |
| `reserve_ai_credit` | Checks and deducts AI generation credits |
| `refund_ai_credit` | Refunds on failed generation |
| `request_draft_approval` | Creates approval record for a draft |
| `review_draft_approval` | Process approve/reject/changes_requested |
| `store_threads_token` | Encrypt and store OAuth token |
| `get_threads_token` | Decrypt and retrieve token for publishing |
| `check_api_rate_limit` | Rate-limit check per identity |

## Client API (`src/lib/api.ts`)

```ts
authenticatedJson<T>(
  getAccessToken: () => Promise<string | null>,
  url: string,
  body: unknown,
): Promise<T>
```

Throws `ApiRequestError` on failure.

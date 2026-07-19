import type { ApiRequest, ApiResponse } from './_lib/http.js'

import healthHandler from './_lib/handlers/health.js'
import { generateHandler, generateImageHandler } from './_lib/handlers/ai.js'
import analyticsHandler from './_lib/handlers/analytics.js'
import { createCheckoutHandler, portalHandler, webhookHandler } from './_lib/handlers/billing.js'
import approvalsHandler from './_lib/handlers/approvals.js'
import { connectHandler, publishHandler, callbackHandler } from './_lib/handlers/threads.js'
import monitorHandler from './_lib/handlers/monitor.js'
import cronHandler from './_lib/handlers/cron.js'
import insightsHandler from './_lib/handlers/insights.js'
import mcpHandler from './_lib/handlers/mcp.js'

type Handler = (req: ApiRequest, res: ApiResponse) => void | Promise<void>

interface Route {
  pattern: RegExp
  methods: string[]
  handler: Handler
}

const routes: Route[] = [
  { pattern: /^\/api\/health\/?$/, methods: ['GET'], handler: healthHandler },
  { pattern: /^\/api\/ai\/generate\/?$/, methods: ['POST'], handler: generateHandler },
  { pattern: /^\/api\/ai\/generate-image\/?$/, methods: ['POST'], handler: generateImageHandler },
  { pattern: /^\/api\/analytics\/threads\/?$/, methods: ['GET', 'POST'], handler: analyticsHandler },
  { pattern: /^\/api\/billing\/create-checkout\/?$/, methods: ['POST'], handler: createCheckoutHandler },
  { pattern: /^\/api\/billing\/portal\/?$/, methods: ['POST'], handler: portalHandler },
  { pattern: /^\/api\/billing\/webhook\/?$/, methods: ['POST'], handler: webhookHandler },
  { pattern: /^\/api\/approvals\/comment\/?$/, methods: ['GET', 'POST', 'DELETE'], handler: approvalsHandler },
  { pattern: /^\/api\/threads\/connect\/?$/, methods: ['POST'], handler: connectHandler },
  { pattern: /^\/api\/threads\/publish\/?$/, methods: ['POST'], handler: publishHandler },
  { pattern: /^\/api\/threads\/callback\/?$/, methods: ['GET'], handler: callbackHandler },
  { pattern: /^\/api\/monitor\/rss\/?$/, methods: ['POST'], handler: monitorHandler },
  { pattern: /^\/api\/cron\/publish\/?$/, methods: ['POST'], handler: cronHandler },
  { pattern: /^\/api\/insights\/sync\/?$/, methods: ['POST'], handler: insightsHandler },
  { pattern: /^\/api\/mcp\/?$/, methods: ['POST'], handler: mcpHandler },
]

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const path = url.pathname

  if (request.method === 'OPTIONS') {
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.setHeader(key, value)
    }
    return response.status(204).json(null)
  }

  for (const route of routes) {
    if (route.pattern.test(path)) {
      if (!route.methods.includes(request.method ?? 'GET')) {
        return response.status(405).json({ error: 'Метод не поддерживается' })
      }
      return route.handler(request, response)
    }
  }

  response.status(404).json({ error: 'Not found' })
}

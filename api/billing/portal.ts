import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { getBearerToken } from '../_lib/http.js'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const FRONTEND_URL = process.env.VITE_FRONTEND_URL ?? 'http://localhost:5173'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  try {
    if (!process.env.STRIPE_SECRET_KEY) return response.status(503).json({ error: 'BILLING_NOT_CONFIGURED' })

    const token = getBearerToken(request)
    if (!token) return response.status(401).json({ error: 'UNAUTHORIZED' })

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) return response.status(503).json({ error: 'SUPABASE_SERVER_NOT_CONFIGURED' })

    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: user } = await admin.auth.getUser(token)
    if (!user?.user) return response.status(401).json({ error: 'UNAUTHORIZED' })

    const body = request.body as Record<string, string | undefined>
    const workspaceId = body.workspaceId
    if (!workspaceId) return response.status(400).json({ error: 'workspaceId required' })

    const { data: subscription } = await admin.from('subscriptions').select('stripe_customer_id').eq('workspace_id', workspaceId).maybeSingle()
    if (!subscription?.stripe_customer_id) return response.status(400).json({ error: 'NO_ACTIVE_SUBSCRIPTION' })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${FRONTEND_URL}/app/billing`,
    })

    return response.status(200).json({ url: portal.url })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'UNKNOWN' })
  }
}

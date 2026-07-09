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

    const { data: membership } = await admin.from('workspace_members')
      .select('role').eq('workspace_id', workspaceId).eq('user_id', user.user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'NOT_A_MEMBER' })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })

    const priceMap: Record<string, string> = {
      starter: 'price_starter_monthly',
      pro: 'price_pro_monthly',
      business: 'price_business_monthly',
      'tokens-100': 'price_tokens_100',
      'tokens-500': 'price_tokens_500',
      'tokens-2000': 'price_tokens_2000',
    }

    const priceId = priceMap[body.planId ?? body.tokenPackId ?? '']
    if (!priceId) return response.status(400).json({ error: 'INVALID_PRODUCT' })

    const session = await stripe.checkout.sessions.create({
      mode: body.planId ? 'subscription' : 'payment',
      customer_email: user?.user?.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { workspaceId, userId: user.user.id },
      success_url: `${FRONTEND_URL}/app/billing?success=1`,
      cancel_url: `${FRONTEND_URL}/app/billing?canceled=1`,
    })

    return response.status(200).json({ url: session.url })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'UNKNOWN' })
  }
}

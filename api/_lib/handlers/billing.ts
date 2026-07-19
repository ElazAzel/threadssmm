import type { ApiRequest, ApiResponse } from '../http.js'
import { getBearerToken } from '../http.js'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const FRONTEND_URL = process.env.VITE_FRONTEND_URL ?? 'http://localhost:5173'

export async function createCheckoutHandler(request: ApiRequest, response: ApiResponse) {
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

export async function portalHandler(request: ApiRequest, response: ApiResponse) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

async function handleCheckoutCompleted(admin: AdminClient, session: Record<string, unknown>) {
  const workspaceId = session.metadata ? (session.metadata as Record<string, string>).workspaceId : undefined
  if (!workspaceId) return

  const subscription = session.subscription as string | undefined
  if (session.mode === 'subscription' && subscription) {
    await admin.from('subscriptions').upsert({
      workspace_id: workspaceId,
      plan_id: 'starter',
      status: 'active',
      stripe_subscription_id: subscription,
      stripe_customer_id: session.customer as string,
      current_period_start: new Date((session.created as number) * 1000).toISOString(),
    }, { onConflict: 'workspace_id', ignoreDuplicates: false })
  }
}

async function handleSubscriptionChange(admin: AdminClient, sub: Record<string, unknown>) {
  try {
    const status = sub.status as string
    const mappedStatus = status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'canceled'
    await admin.from('subscriptions').update({
      status: mappedStatus,
      current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
      canceled_at: mappedStatus === 'canceled' ? new Date().toISOString() : null,
    }).eq('stripe_subscription_id', sub.id as string)
  } catch (e) {
    console.error('subscription change error:', e)
  }
}

async function handleInvoicePaid(admin: AdminClient, invoice: Record<string, unknown>) {
  const subId = invoice.subscription as string | undefined
  if (!subId) return

  try {
    if ((invoice.amount_due as number) > 0 && invoice.status === 'paid') {
      await admin.from('subscriptions').update({
        current_period_start: new Date((invoice.period_start as number) * 1000).toISOString(),
        current_period_end: new Date((invoice.period_end as number) * 1000).toISOString(),
      }).eq('stripe_subscription_id', subId)
    }
  } catch (e) {
    console.error('invoice paid error:', e)
  }
}

export async function webhookHandler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
      return response.status(503).json({ error: 'WEBHOOK_NOT_CONFIGURED' })
    }

    const sig = (Array.isArray(request.headers['stripe-signature']) ? request.headers['stripe-signature'][0] : request.headers['stripe-signature']) as string
    const rawBody = JSON.stringify(request.body)

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
      return response.status(400).json({ error: 'INVALID_SIGNATURE' })
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) return response.status(503).json({ error: 'SUPABASE_SERVER_NOT_CONFIGURED' })
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

    const payload = event.data.object as unknown as Record<string, unknown>
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(admin, payload)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(admin, payload)
        break
      case 'invoice.paid':
        await handleInvoicePaid(admin, payload)
        break
    }

    return response.status(200).json({ received: true })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'UNKNOWN' })
  }
}

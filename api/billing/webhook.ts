import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export default async function handler(request: ApiRequest, response: ApiResponse) {
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

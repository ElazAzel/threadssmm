/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const rawBody = request.body as string

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody as unknown as string, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
      return response.status(400).json({ error: 'INVALID_SIGNATURE' })
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) return response.status(503).json({ error: 'SUPABASE_SERVER_NOT_CONFIGURED' })
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

    const payload = event.data.object as any
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

async function handleCheckoutCompleted(admin: any, session: any) {
  const workspaceId = session.metadata?.workspaceId
  if (!workspaceId) return

  try {
    await admin.rpc('log_token_spend', {
      p_workspace_id: workspaceId,
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_amount: 0,
      p_model_id: 'stripe',
      p_description: `checkout:${session.id}`,
    })
  } catch {
    if (session.mode === 'subscription' && session.subscription) {
      await admin.from('subscriptions').upsert({
        workspace_id: workspaceId,
        plan_id: 'starter',
        status: 'active',
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        current_period_start: new Date(session.created * 1000).toISOString(),
      }, { onConflict: 'workspace_id', ignoreDuplicates: false })
    }
  }
}

async function handleSubscriptionChange(admin: any, sub: any) {
  try {
    const mappedStatus = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled'
    await admin.from('subscriptions').update({
      status: mappedStatus,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      canceled_at: mappedStatus === 'canceled' ? new Date().toISOString() : null,
    }).eq('stripe_subscription_id', sub.id)
  } catch (e) {
    console.error('subscription change error:', e)
  }
}

async function handleInvoicePaid(admin: any, invoice: any) {
  const subId = invoice.subscription
  if (!subId) return

  try {
    if (invoice.amount_due > 0 && invoice.status === 'paid') {
      await admin.from('subscriptions').update({
        current_period_start: new Date(invoice.period_start * 1000).toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', subId)
    }
  } catch (e) {
    console.error('invoice paid error:', e)
  }
}

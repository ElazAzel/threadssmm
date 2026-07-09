-- Billing & Subscription system

-- ─── Subscriptions ───────────────────────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  plan_id text not null,
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure private.set_updated_at();

alter table public.subscriptions enable row level security;
create policy subscriptions_select_member on public.subscriptions for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy subscriptions_insert_admin on public.subscriptions for insert to authenticated
  with check (private.is_workspace_admin(workspace_id));
create policy subscriptions_update_admin on public.subscriptions for update to authenticated
  using (private.is_workspace_admin(workspace_id))
  with check (private.is_workspace_admin(workspace_id));
grant select, insert, update on public.subscriptions to authenticated;

-- ─── Stripe Checkout Sessions Log ────────────────
create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  event_type text not null,
  stripe_event_id text unique,
  data jsonb default '{}',
  created_at timestamptz not null default now()
);

create index billing_events_workspace_idx on public.billing_events(workspace_id);

alter table public.billing_events enable row level security;
create policy billing_events_select_member on public.billing_events for select to authenticated
  using (private.is_workspace_member(workspace_id));
grant select on public.billing_events to authenticated;

-- ─── Grant initial tokens on workspace creation ──
create or replace function public.grant_initial_tokens()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.token_balances (workspace_id, balance, total_earned, total_spent)
  values (new.id, 50, 50, 0)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

create trigger workspace_grant_tokens
after insert on public.workspaces
for each row execute procedure public.grant_initial_tokens();

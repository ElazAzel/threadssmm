-- Token-based AI billing system

-- ─── Token Balances ───────────────────────────────
create table public.token_balances (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id)
);

create trigger token_balances_updated_at
before update on public.token_balances
for each row execute procedure private.set_updated_at();

alter table public.token_balances enable row level security;
create policy token_balances_select_member on public.token_balances for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy token_balances_insert_admin on public.token_balances for insert to authenticated
  with check (private.is_workspace_admin(workspace_id));
create policy token_balances_update_admin on public.token_balances for update to authenticated
  using (private.is_workspace_admin(workspace_id))
  with check (private.is_workspace_admin(workspace_id));
grant select, insert, update on public.token_balances to authenticated;

-- ─── Token Transactions ───────────────────────────
create table public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('earn', 'spend', 'refund', 'admin_add', 'admin_remove')),
  model_id text,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index token_transactions_workspace_idx on public.token_transactions(workspace_id);
create index token_transactions_created_idx on public.token_transactions(created_at);

alter table public.token_transactions enable row level security;
create policy token_transactions_select_member on public.token_transactions for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy token_transactions_insert_member on public.token_transactions for insert to authenticated
  with check (private.is_workspace_member(workspace_id));
grant select, insert on public.token_transactions to authenticated;

-- ─── Model Pricing Reference ──────────────────────
create table public.model_pricing (
  model_id text primary key,
  provider text not null,
  label text not null,
  category text not null check (category in ('text_visual', 'text_only', 'visual_only')),
  token_cost integer not null check (token_cost > 0),
  max_tokens integer not null default 4096,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.model_pricing (model_id, provider, label, category, token_cost, max_tokens) values
  -- Google (5 моделей)
  ('gemini-2.0-flash-lite', 'google', 'Gemini 2.0 Flash-Lite', 'text_only', 1, 8192),
  ('gemini-2.0-flash', 'google', 'Gemini 2.0 Flash', 'text_only', 1, 8192),
  ('gemini-2.5-flash', 'google', 'Gemini 2.5 Flash', 'text_only', 2, 32768),
  ('gemini-2.5-pro', 'google', 'Gemini 2.5 Pro', 'text_visual', 8, 65536),
  ('imagen-3', 'google', 'Imagen 3', 'visual_only', 10, 0),
  -- OpenAI (3 модели)
  ('gpt-4o-mini', 'openai', 'GPT-4o Mini', 'text_only', 2, 16384),
  ('gpt-4o', 'openai', 'GPT-4o', 'text_visual', 7, 32768),
  ('dall-e-3', 'openai', 'DALL-E 3', 'visual_only', 12, 0),
  -- xAI Grok (2 модели)
  ('grok-3-mini', 'grok', 'Grok 3 Mini', 'text_only', 2, 16384),
  ('grok-3', 'grok', 'Grok 3', 'text_visual', 6, 32768),
  -- Anthropic (3 модели)
  ('claude-haiku-3', 'anthropic', 'Claude Haiku 3', 'text_only', 4, 16384),
  ('claude-sonnet-4', 'anthropic', 'Claude Sonnet 4', 'text_only', 8, 65536),
  ('claude-opus-4', 'anthropic', 'Claude Opus 4', 'text_only', 15, 131072),
  -- DeepSeek (2 модели)
  ('deepseek-v3', 'deepseek', 'DeepSeek V3', 'text_only', 1, 32768),
  ('deepseek-r1', 'deepseek', 'DeepSeek R1', 'text_only', 3, 32768);

alter table public.model_pricing enable row level security;
create policy model_pricing_select_all on public.model_pricing for select to authenticated
  using (true);
grant select on public.model_pricing to authenticated;

-- ─── RPC: Reserve tokens for generation ───────────
create or replace function public.reserve_tokens(
  p_workspace_id uuid,
  p_amount integer
) returns jsonb
language plpgsql security definer
as $$
declare
  v_balance integer;
begin
  select balance into v_balance
  from public.token_balances
  where workspace_id = p_workspace_id
  for update;

  if not found then
    insert into public.token_balances (workspace_id, balance, total_earned, total_spent)
    values (p_workspace_id, 0, 0, 0);
    v_balance := 0;
  end if;

  if v_balance < p_amount then
    return jsonb_build_object(
      'ok', false,
      'error', 'TOKENS_EXHAUSTED',
      'balance', v_balance,
      'required', p_amount
    );
  end if;

  update public.token_balances
  set balance = balance - p_amount,
      total_spent = total_spent + p_amount
  where workspace_id = p_workspace_id;

  return jsonb_build_object('ok', true, 'balance', v_balance - p_amount);
end;
$$;

-- ─── RPC: Refund tokens on error ─────────────────
create or replace function public.refund_tokens(
  p_workspace_id uuid,
  p_amount integer
) returns jsonb
language plpgsql security definer
as $$
begin
  update public.token_balances
  set balance = balance + p_amount,
      total_spent = greatest(total_spent - p_amount, 0)
  where workspace_id = p_workspace_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ─── RPC: Log token spend transaction ────────────
create or replace function public.log_token_spend(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_model_id text,
  p_description text default null
) returns void
language plpgsql security definer
as $$
begin
  insert into public.token_transactions (workspace_id, user_id, amount, type, model_id, description)
  values (p_workspace_id, p_user_id, -p_amount, 'spend', p_model_id, p_description);
end;
$$;

-- ─── RPC: Get token balance ──────────────────────
create or replace function public.get_token_balance(
  p_workspace_id uuid
) returns jsonb
language plpgsql security definer
as $$
declare
  v_balance integer;
  v_total_earned integer;
  v_total_spent integer;
begin
  select balance, total_earned, total_spent
  into v_balance, v_total_earned, v_total_spent
  from public.token_balances
  where workspace_id = p_workspace_id;

  if not found then
    return jsonb_build_object('balance', 0, 'total_earned', 0, 'total_spent', 0);
  end if;

  return jsonb_build_object(
    'balance', v_balance,
    'total_earned', v_total_earned,
    'total_spent', v_total_spent
  );
end;
$$;

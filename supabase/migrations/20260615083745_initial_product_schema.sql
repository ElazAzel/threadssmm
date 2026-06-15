create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');
create type public.content_format as enum ('post', 'thread', 'reply', 'content_plan', 'strategy', 'visual_prompt');
create type public.content_status as enum ('idea', 'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed', 'rejected');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'changes_requested');
create type public.risk_level as enum ('low', 'medium', 'high', 'blocked');
create type public.account_status as enum ('pending', 'active', 'expired', 'error', 'manual');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  locale text not null default 'ru',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  region text not null default 'СНГ',
  locale text not null default 'ru',
  timezone text not null default 'UTC',
  plan text not null default 'free',
  ai_credits integer not null default 200 check (ai_credits >= 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  niche text not null default '',
  product text not null default '',
  website text,
  geography text not null default '',
  language text not null default 'ru',
  audience text not null default '',
  icp text not null default '',
  competitors text[] not null default '{}',
  positioning text not null default '',
  usp text not null default '',
  goals text[] not null default '{}',
  forbidden_topics text[] not null default '{}',
  allowed_topics text[] not null default '{}',
  tone_of_voice text not null default '',
  content_pillars text[] not null default '{}',
  ctas text[] not null default '{}',
  good_examples text not null default '',
  bad_examples text not null default '',
  reply_style text not null default '',
  negative_response_rules text not null default '',
  risk_tolerance integer not null default 45 check (risk_tolerance between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  provider text not null default 'gemini',
  model text not null default 'gemini-3.5-flash',
  temperature numeric(3,2) not null default 0.7 check (temperature between 0 and 2),
  monthly_credit_limit integer not null default 200 check (monthly_credit_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.threads_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  threads_user_id text,
  username text not null,
  display_name text not null default '',
  profile_picture_url text,
  status public.account_status not null default 'manual',
  permissions text[] not null default '{}',
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, username)
);

create table private.threads_tokens (
  account_id uuid primary key references public.threads_accounts(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_type text not null default 'bearer',
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function public.store_threads_token(
  p_account_id uuid,
  p_access_token text,
  p_expires_at timestamptz
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.threads_tokens (account_id, access_token, token_type, expires_at, updated_at)
  values (p_account_id, p_access_token, 'bearer', p_expires_at, now())
  on conflict (account_id) do update set
    access_token = excluded.access_token,
    token_type = excluded.token_type,
    expires_at = excluded.expires_at,
    updated_at = now();
end;
$$;

create or replace function public.get_threads_token(p_account_id uuid)
returns table(access_token text, expires_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select tokens.access_token, tokens.expires_at
  from private.threads_tokens as tokens
  where tokens.account_id = p_account_id;
$$;

revoke all on function public.store_threads_token(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.get_threads_token(uuid) from public, anon, authenticated;
grant execute on function public.store_threads_token(uuid, text, timestamptz) to service_role;
grant execute on function public.get_threads_token(uuid) to service_role;

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  account_id uuid references public.threads_accounts(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  format public.content_format not null default 'post',
  title text not null default '',
  content text not null default '',
  variants jsonb not null default '[]'::jsonb,
  selected_variant text,
  source text not null default 'manual',
  status public.content_status not null default 'draft',
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  risk_level public.risk_level not null default 'low',
  compliance_notes jsonb not null default '[]'::jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  threads_post_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status public.approval_status not null default 'pending',
  reason text not null default '',
  decision_note text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draft_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  width integer,
  height integer,
  source text not null default 'upload',
  prompt text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, storage_path)
);

create table public.monitor_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  type text not null check (type in ('rss', 'keyword', 'account', 'manual_url')),
  name text not null,
  value text not null,
  active boolean not null default true,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, type, value)
);

create table public.monitor_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid references public.monitor_sources(id) on delete set null,
  external_id text,
  url text not null,
  author text not null default '',
  title text not null,
  summary text not null default '',
  published_at timestamptz,
  relevance_score integer not null default 0 check (relevance_score between 0 and 100),
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  sentiment text not null default 'neutral' check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),
  recommendation text not null default 'ignore' check (recommendation in ('reply', 'comment', 'post', 'thread', 'ignore')),
  ai_reasoning text not null default '',
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, url)
);

create table public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  captured_at timestamptz not null default now(),
  views integer not null default 0,
  likes integer not null default 0,
  replies integer not null default 0,
  reposts integer not null default 0,
  quotes integer not null default 0,
  clicks integer not null default 0,
  followers_delta integer not null default 0,
  raw jsonb not null default '{}'::jsonb
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null,
  model text not null,
  operation text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  credits integer not null default 1 check (credits >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  risk public.risk_level not null default 'low',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workspace_members_user_idx on public.workspace_members(user_id);
create index brands_workspace_idx on public.brands(workspace_id);
create index accounts_workspace_idx on public.threads_accounts(workspace_id);
create index drafts_workspace_status_idx on public.drafts(workspace_id, status);
create index drafts_schedule_idx on public.drafts(status, scheduled_at) where status = 'scheduled';
create index approvals_workspace_status_idx on public.approvals(workspace_id, status);
create index media_workspace_idx on public.media_assets(workspace_id, created_at desc);
create index monitor_sources_workspace_idx on public.monitor_sources(workspace_id, active);
create index monitor_items_workspace_idx on public.monitor_items(workspace_id, created_at desc);
create index metrics_draft_idx on public.post_metrics(draft_id, captured_at desc);
create index usage_workspace_created_idx on public.usage_events(workspace_id, created_at desc);
create index audit_workspace_created_idx on public.audit_logs(workspace_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = (select auth.uid())
  ) or exists (
    select 1 from public.workspaces
    where id = target_workspace_id and owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  ) or exists (
    select 1 from public.workspaces
    where id = target_workspace_id and owner_id = (select auth.uid())
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'locale', 'ru')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

create trigger profiles_updated_at before update on public.profiles for each row execute procedure private.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute procedure private.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute procedure private.set_updated_at();
create trigger ai_settings_updated_at before update on public.ai_settings for each row execute procedure private.set_updated_at();
create trigger accounts_updated_at before update on public.threads_accounts for each row execute procedure private.set_updated_at();
create trigger drafts_updated_at before update on public.drafts for each row execute procedure private.set_updated_at();
create trigger approvals_updated_at before update on public.approvals for each row execute procedure private.set_updated_at();
create trigger monitor_sources_updated_at before update on public.monitor_sources for each row execute procedure private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.brands enable row level security;
alter table public.ai_settings enable row level security;
alter table public.threads_accounts enable row level security;
alter table public.drafts enable row level security;
alter table public.approvals enable row level security;
alter table public.media_assets enable row level security;
alter table public.monitor_sources enable row level security;
alter table public.monitor_items enable row level security;
alter table public.post_metrics enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy workspaces_select_member on public.workspaces for select to authenticated using (owner_id = (select auth.uid()) or private.is_workspace_member(id));
create policy workspaces_insert_owner on public.workspaces for insert to authenticated with check (owner_id = (select auth.uid()));
create policy workspaces_update_admin on public.workspaces for update to authenticated using (private.is_workspace_admin(id)) with check (private.is_workspace_admin(id));
create policy workspaces_delete_owner on public.workspaces for delete to authenticated using (owner_id = (select auth.uid()));
create policy members_select_member on public.workspace_members for select to authenticated using (private.is_workspace_member(workspace_id));
create policy members_insert_admin on public.workspace_members for insert to authenticated with check (private.is_workspace_admin(workspace_id));
create policy members_update_admin on public.workspace_members for update to authenticated using (private.is_workspace_admin(workspace_id)) with check (private.is_workspace_admin(workspace_id));
create policy members_delete_admin on public.workspace_members for delete to authenticated using (private.is_workspace_admin(workspace_id));
create policy brands_member_all on public.brands for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy ai_settings_member_all on public.ai_settings for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_admin(workspace_id));
create policy accounts_member_all on public.threads_accounts for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy drafts_member_all on public.drafts for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy approvals_member_all on public.approvals for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy media_member_all on public.media_assets for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy monitor_sources_member_all on public.monitor_sources for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy monitor_items_member_all on public.monitor_items for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy metrics_member_all on public.post_metrics for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy usage_select_member on public.usage_events for select to authenticated using (private.is_workspace_member(workspace_id));
create policy audit_select_member on public.audit_logs for select to authenticated using (private.is_workspace_member(workspace_id));
create policy audit_insert_member on public.audit_logs for insert to authenticated with check (private.is_workspace_member(workspace_id) and actor_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_admin(uuid) to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces, public.workspace_members, public.brands, public.ai_settings, public.threads_accounts, public.drafts, public.approvals, public.media_assets, public.monitor_sources, public.monitor_items, public.post_metrics to authenticated;
grant select on public.usage_events to authenticated;
grant select, insert on public.audit_logs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media-assets', 'media-assets', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy media_storage_select on storage.objects for select to authenticated
using (bucket_id = 'media-assets' and private.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy media_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'media-assets' and private.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy media_storage_update on storage.objects for update to authenticated
using (bucket_id = 'media-assets' and private.is_workspace_member(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'media-assets' and private.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy media_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'media-assets' and private.is_workspace_member(((storage.foldername(name))[1])::uuid));

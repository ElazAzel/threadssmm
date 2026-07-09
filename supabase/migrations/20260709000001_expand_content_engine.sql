-- Expand Content Engine: audience segments, locations, content pillars, comment campaigns, risk assessments

-- ─── Audience Segments ──────────────────────────────────────
create table public.audience_segments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  segment_type text not null check (segment_type in (
    'entrepreneur', 'startup_founder', 'student', 'marketer', 'smm',
    'hr', 'ceo', 'small_business', 'corp', 'university', 'investor',
    'developer', 'designer', 'creator'
  )),
  location_id uuid references public.locations(id) on delete set null,
  awareness_level text not null default 'cold' check (awareness_level in ('cold', 'warm', 'hot', 'client', 'partner', 'community')),
  archetype text not null default 'pragmatic' check (archetype in ('pragmatic', 'ambitious', 'skeptic', 'beginner', 'expert', 'tech_lover')),
  pains text[] default '{}',
  desires text[] default '{}',
  triggers text[] default '{}',
  forbidden_topics text[] default '{}',
  communication jsonb not null default '{"language":"ru","formality":50,"boldness":30,"humor":20,"ctaFormulas":[],"postFormats":[],"forbiddenPhrases":[]}',
  offer_mapping jsonb default '{"primaryOffer":"","objections":[],"valueProps":[],"localReferences":[]}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audience_segments_brand_idx on public.audience_segments(brand_id);

create trigger audience_segments_updated_at
before update on public.audience_segments
for each row execute procedure private.set_updated_at();

alter table public.audience_segments enable row level security;
create policy audience_segments_select_member on public.audience_segments for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy audience_segments_insert_admin on public.audience_segments for insert to authenticated
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy audience_segments_update_admin on public.audience_segments for update to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)))
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy audience_segments_delete_admin on public.audience_segments for delete to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, update, delete on public.audience_segments to authenticated;

-- ─── Locations ──────────────────────────────────────────────
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  country text,
  city text,
  region text,
  currency text not null default '₸',
  language text not null default 'ru' check (language in ('ru', 'kk', 'en')),
  formality integer not null default 50 check (formality between 0 and 100),
  timezone text not null default 'Asia/Almaty',
  post_hours jsonb default '{"start":10,"end":20}',
  local_examples text[] default '{}',
  local_references text[] default '{}',
  local_context text,
  local_events text[] default '{}',
  local_business_terms text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_brand_idx on public.locations(brand_id);

create trigger locations_updated_at
before update on public.locations
for each row execute procedure private.set_updated_at();

alter table public.locations enable row level security;
create policy locations_select_member on public.locations for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy locations_insert_admin on public.locations for insert to authenticated
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy locations_update_admin on public.locations for update to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)))
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy locations_delete_admin on public.locations for delete to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, update, delete on public.locations to authenticated;

-- ─── Content Pillars ────────────────────────────────────────
create table public.content_pillars (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  goal text,
  audience_segments uuid[] default '{}',
  frequency text not null default 'weekly' check (frequency in ('daily', 'weekly', 'biweekly', 'monthly')),
  style text,
  cta_template text,
  examples text[] default '{}',
  risk_level integer not null default 0 check (risk_level between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_pillars_brand_idx on public.content_pillars(brand_id);

create trigger content_pillars_updated_at
before update on public.content_pillars
for each row execute procedure private.set_updated_at();

alter table public.content_pillars enable row level security;
create policy content_pillars_select_member on public.content_pillars for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy content_pillars_insert_admin on public.content_pillars for insert to authenticated
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy content_pillars_update_admin on public.content_pillars for update to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)))
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy content_pillars_delete_admin on public.content_pillars for delete to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, update, delete on public.content_pillars to authenticated;

-- ─── Comment Campaigns ──────────────────────────────────────
create table public.comment_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  goal text not null check (goal in ('awareness', 'leads', 'expertise', 'local_domination', 'trend_hijacking', 'community')),
  target_audience jsonb default '{"segments":[],"locations":[],"topics":[]}',
  tone text not null default 'expert' check (tone in ('expert', 'friendly', 'ironic', 'supportive', 'controversial')),
  cta_style text not null default 'none' check (cta_style in ('none', 'soft', 'direct')),
  forbidden_words text[] default '{}',
  source_lists text[] default '{}',
  rss_feeds text[] default '{}',
  competitor_accounts text[] default '{}',
  influencer_accounts text[] default '{}',
  limits jsonb not null default '{"perDay":30,"perHour":5,"minInterval":5}',
  approval_mode text not null default 'approve_and_publish' check (approval_mode in ('draft_only','approve_and_publish','manual_copy','team_approval')),
  status text not null default 'draft' check (status in ('draft','active','paused','completed','archived')),
  schedule jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comment_campaigns_brand_idx on public.comment_campaigns(brand_id);

create trigger comment_campaigns_updated_at
before update on public.comment_campaigns
for each row execute procedure private.set_updated_at();

alter table public.comment_campaigns enable row level security;
create policy comment_campaigns_select_member on public.comment_campaigns for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy comment_campaigns_insert_admin on public.comment_campaigns for insert to authenticated
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy comment_campaigns_update_admin on public.comment_campaigns for update to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)))
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy comment_campaigns_delete_admin on public.comment_campaigns for delete to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, update, delete on public.comment_campaigns to authenticated;

-- ─── Comment Opportunities ──────────────────────────────────
create table public.comment_opportunities (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.comment_campaigns(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  threads_post_id text not null,
  author_id text,
  author_username text,
  post_text text,
  topic text[] default '{}',
  language text,
  location text,
  freshness_hours integer,
  conversation_activity integer default 0,
  opportunity_score numeric(5,2) default 0,
  topic_match numeric(5,2) default 0,
  audience_match numeric(5,2) default 0,
  location_match numeric(5,2) default 0,
  freshness_score numeric(5,2) default 0,
  activity_score numeric(5,2) default 0,
  toxicity_risk numeric(5,2) default 0,
  spam_risk numeric(5,2) default 0,
  lead_potential numeric(5,2) default 0,
  brand_fit_score numeric(5,2) default 0,
  status text not null default 'found' check (status in ('found','proposed','reviewed','approved','published','rejected','dismissed')),
  source text not null default 'manual' check (source in ('rss','user_list','competitor','influencer','keyword','trend','manual')),
  created_at timestamptz not null default now()
);

create index comment_opportunities_campaign_idx on public.comment_opportunities(campaign_id);
create index comment_opportunities_brand_idx on public.comment_opportunities(brand_id);
create index comment_opportunities_status_idx on public.comment_opportunities(status);

alter table public.comment_opportunities enable row level security;
create policy comment_opportunities_select_member on public.comment_opportunities for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy comment_opportunities_insert_admin on public.comment_opportunities for insert to authenticated
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy comment_opportunities_update_admin on public.comment_opportunities for update to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)))
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy comment_opportunities_delete_admin on public.comment_opportunities for delete to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, update, delete on public.comment_opportunities to authenticated;

-- ─── Generated Comments ─────────────────────────────────────
create table public.generated_comments (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.comment_opportunities(id) on delete cascade,
  text text not null,
  tone text not null default 'expert' check (tone in ('expert','short','question','supportive','soft_cta')),
  risk_score numeric(5,2) default 0,
  brand_fit_score numeric(5,2) default 0,
  uniqueness_score numeric(5,2) default 0,
  relevance_score numeric(5,2) default 0,
  is_best boolean not null default false,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','published','failed')),
  published_at timestamptz,
  threads_reply_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index generated_comments_opportunity_idx on public.generated_comments(opportunity_id);

alter table public.generated_comments enable row level security;
create policy generated_comments_select_member on public.generated_comments for select to authenticated
  using (private.is_workspace_member((
    select workspace_id from public.brands b
    join public.comment_opportunities co on co.brand_id = b.id
    where co.id = opportunity_id
  )));
create policy generated_comments_insert_member on public.generated_comments for insert to authenticated
  with check (private.is_workspace_member((
    select workspace_id from public.brands b
    join public.comment_opportunities co on co.brand_id = b.id
    where co.id = opportunity_id
  )));
create policy generated_comments_update_member on public.generated_comments for update to authenticated
  using (private.is_workspace_member((
    select workspace_id from public.brands b
    join public.comment_opportunities co on co.brand_id = b.id
    where co.id = opportunity_id
  )));
create policy generated_comments_delete_admin on public.generated_comments for delete to authenticated
  using (private.is_workspace_admin((
    select workspace_id from public.brands b
    join public.comment_opportunities co on co.brand_id = b.id
    where co.id = opportunity_id
  )));
grant select, insert, update, delete on public.generated_comments to authenticated;

-- ─── Risk Assessments ───────────────────────────────────────
create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','draft','campaign')),
  target_id uuid not null,
  score numeric(5,2) not null default 0,
  verdict text not null check (verdict in ('safe','low_risk','needs_review','high_risk','blocked')),
  factors jsonb not null default '{}',
  warnings text[] default '{}',
  recommendations text[] default '{}',
  created_at timestamptz not null default now()
);

create index risk_assessments_brand_idx on public.risk_assessments(brand_id);
create index risk_assessments_target_idx on public.risk_assessments(target_type, target_id);

alter table public.risk_assessments enable row level security;
create policy risk_assessments_select_member on public.risk_assessments for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy risk_assessments_insert_member on public.risk_assessments for insert to authenticated
  with check (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy risk_assessments_delete_admin on public.risk_assessments for delete to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, delete on public.risk_assessments to authenticated;

-- ─── AI Generation Log ──────────────────────────────────────
create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  agent_name text not null,
  input_hash text,
  output_hash text,
  model text not null default 'gemini-2.0-flash',
  tokens_input integer default 0,
  tokens_output integer default 0,
  latency_ms integer default 0,
  success boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

create index ai_generation_logs_brand_idx on public.ai_generation_logs(brand_id);
create index ai_generation_logs_created_idx on public.ai_generation_logs(created_at);

alter table public.ai_generation_logs enable row level security;
create policy ai_generation_logs_select_member on public.ai_generation_logs for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy ai_generation_logs_insert_member on public.ai_generation_logs for insert to authenticated
  with check (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
grant select, insert on public.ai_generation_logs to authenticated;

-- ─── Rate Limits Tracking ───────────────────────────────────
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  account_id uuid references public.threads_accounts(id) on delete cascade,
  action_type text not null check (action_type in ('publish','reply','comment')),
  window_start timestamptz not null,
  window_end timestamptz not null,
  current_count integer not null default 1 check (current_count > 0),
  limit_value integer not null,
  unique(brand_id, account_id, action_type, window_start)
);

create index rate_limits_lookup_idx on public.rate_limits(brand_id, account_id, action_type, window_end);

alter table public.rate_limits enable row level security;
create policy rate_limits_select_member on public.rate_limits for select to authenticated
  using (private.is_workspace_member((select workspace_id from public.brands where id = brand_id)));
create policy rate_limits_insert_admin on public.rate_limits for insert to authenticated
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
create policy rate_limits_update_admin on public.rate_limits for update to authenticated
  using (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)))
  with check (private.is_workspace_admin((select workspace_id from public.brands where id = brand_id)));
grant select, insert, update on public.rate_limits to authenticated;

-- ─── Brand Voice Extended (additional columns on existing brands table) ──
alter table public.brands
  add column if not exists loved_words text[] default '{}',
  add column if not exists hated_words text[] default '{}',
  add column if not exists cta_style text not null default 'soft' check (cta_style in ('none','soft','direct','question')),
  add column if not exists humor_style text not null default 'none' check (humor_style in ('none','subtle','friendly','playful','sarcastic')),
  add column if not exists boldness_level integer not null default 30 check (boldness_level between 0 and 100),
  add column if not exists formality_level integer not null default 50 check (formality_level between 0 and 100),
  add column if not exists reply_style_guide text default '',
  add column if not exists brand_archetype text default '' check (brand_archetype in ('','creator','caregiver','ruler','jester','sage','hero','outlaw','magician','regular_guy','lover','explorer','innocent'));

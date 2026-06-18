-- Make Data API exposure opt-in for all future objects.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

create table public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  security_enabled boolean not null default true,
  security_policy text not null default 'standard' check (security_policy in ('standard', 'strict', 'custom')),
  ai_enabled boolean not null default true,
  ai_policy text not null default 'standard' check (ai_policy in ('standard', 'strict', 'custom')),
  notifications_enabled boolean not null default true,
  notifications_policy text not null default 'standard' check (notifications_policy in ('standard', 'strict', 'custom')),
  audit_enabled boolean not null default true,
  audit_policy text not null default 'strict' check (audit_policy in ('standard', 'strict', 'custom')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.api_rate_limits (
  bucket text not null,
  identity_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (bucket, identity_hash, window_start)
);

create index api_rate_limits_window_idx on private.api_rate_limits(window_start);

create trigger workspace_settings_updated_at
before update on public.workspace_settings
for each row execute procedure private.set_updated_at();

alter table public.workspace_settings enable row level security;

create policy workspace_settings_select_member
on public.workspace_settings for select to authenticated
using (private.is_workspace_member(workspace_id));

create policy workspace_settings_insert_admin
on public.workspace_settings for insert to authenticated
with check (private.is_workspace_admin(workspace_id));

create policy workspace_settings_update_admin
on public.workspace_settings for update to authenticated
using (private.is_workspace_admin(workspace_id))
with check (private.is_workspace_admin(workspace_id));

grant select, insert, update on public.workspace_settings to authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.api_rate_limits to service_role;

create or replace function public.create_workspace_with_defaults(
  p_name text,
  p_slug text,
  p_region text,
  p_locale text,
  p_timezone text,
  p_brand_name text,
  p_niche text,
  p_audience text,
  p_goal text,
  p_threads_username text default null
) returns public.workspaces
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_workspace public.workspaces;
begin
  if current_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  insert into public.workspaces (
    owner_id, name, slug, region, locale, timezone, onboarding_completed
  ) values (
    current_user_id,
    trim(p_name),
    p_slug,
    coalesce(nullif(trim(p_region), ''), 'СНГ'),
    coalesce(nullif(trim(p_locale), ''), 'ru'),
    coalesce(nullif(trim(p_timezone), ''), 'UTC'),
    true
  ) returning * into created_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace.id, current_user_id, 'owner');

  insert into public.brands (
    workspace_id, name, niche, audience, goals, language, geography
  ) values (
    created_workspace.id,
    trim(p_brand_name),
    trim(p_niche),
    trim(p_audience),
    array[p_goal],
    created_workspace.locale,
    created_workspace.region
  );

  insert into public.ai_settings (workspace_id)
  values (created_workspace.id);

  insert into public.workspace_settings (workspace_id)
  values (created_workspace.id);

  if nullif(trim(coalesce(p_threads_username, '')), '') is not null then
    insert into public.threads_accounts (
      workspace_id, username, display_name, status
    ) values (
      created_workspace.id,
      regexp_replace(trim(p_threads_username), '^@', ''),
      trim(p_brand_name),
      'manual'
    );
  end if;

  insert into public.audit_logs (
    workspace_id, actor_id, action, resource_type, resource_id, risk, details
  ) values (
    created_workspace.id,
    current_user_id,
    'workspace.created',
    'workspace',
    created_workspace.id,
    'low',
    jsonb_build_object('source', 'onboarding')
  );

  return created_workspace;
end;
$$;

revoke all on function public.create_workspace_with_defaults(text, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_workspace_with_defaults(text, text, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.reserve_ai_credit(p_workspace_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  credits_remaining integer;
begin
  update public.workspaces
  set ai_credits = ai_credits - 1
  where id = p_workspace_id and ai_credits > 0
  returning ai_credits into credits_remaining;

  if credits_remaining is null then
    raise exception 'AI_CREDITS_EXHAUSTED';
  end if;

  return credits_remaining;
end;
$$;

create or replace function public.refund_ai_credit(p_workspace_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  credits_remaining integer;
begin
  update public.workspaces
  set ai_credits = ai_credits + 1
  where id = p_workspace_id
  returning ai_credits into credits_remaining;

  return credits_remaining;
end;
$$;

revoke all on function public.reserve_ai_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_ai_credit(uuid) from public, anon, authenticated;
grant execute on function public.reserve_ai_credit(uuid) to service_role;
grant execute on function public.refund_ai_credit(uuid) to service_role;

create or replace function public.check_api_rate_limit(
  p_bucket text,
  p_identity_hash text,
  p_limit integer,
  p_window_seconds integer
) returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_window timestamptz;
  current_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'INVALID_RATE_LIMIT';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into private.api_rate_limits (bucket, identity_hash, window_start, request_count)
  values (p_bucket, p_identity_hash, current_window, 1)
  on conflict (bucket, identity_hash, window_start)
  do update set request_count = private.api_rate_limits.request_count + 1
  returning request_count into current_count;

  delete from private.api_rate_limits
  where window_start < clock_timestamp() - interval '2 days';

  return query select
    current_count <= p_limit,
    greatest(p_limit - current_count, 0),
    greatest(
      ceil(extract(epoch from current_window + make_interval(secs => p_window_seconds) - clock_timestamp()))::integer,
      0
    );
end;
$$;

revoke all on function public.check_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_api_rate_limit(text, text, integer, integer) to service_role;

create or replace function public.request_draft_approval(
  p_draft_id uuid,
  p_reason text default ''
) returns public.approvals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_draft public.drafts;
  result public.approvals;
begin
  select * into target_draft
  from public.drafts
  where id = p_draft_id;

  if target_draft.id is null then
    raise exception 'DRAFT_NOT_FOUND';
  end if;

  update public.drafts
  set status = 'pending_approval'
  where id = p_draft_id;

  insert into public.approvals (
    workspace_id, draft_id, requested_by, status, reason,
    decision_note, reviewed_by, reviewed_at
  ) values (
    target_draft.workspace_id, p_draft_id, current_user_id, 'pending', p_reason,
    '', null, null
  )
  on conflict (draft_id) do update set
    requested_by = excluded.requested_by,
    status = 'pending',
    reason = excluded.reason,
    decision_note = '',
    reviewed_by = null,
    reviewed_at = null,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function public.review_draft_approval(
  p_approval_id uuid,
  p_status public.approval_status,
  p_note text default ''
) returns public.approvals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  next_draft_status public.content_status;
  result public.approvals;
begin
  if p_status not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'INVALID_APPROVAL_STATUS';
  end if;

  next_draft_status := case
    when p_status = 'approved' then 'approved'::public.content_status
    when p_status = 'rejected' then 'rejected'::public.content_status
    else 'draft'::public.content_status
  end;

  update public.approvals
  set status = p_status,
      decision_note = p_note,
      reviewed_by = current_user_id,
      reviewed_at = now()
  where id = p_approval_id
  returning * into result;

  if result.id is null then
    raise exception 'APPROVAL_NOT_FOUND';
  end if;

  update public.drafts
  set status = next_draft_status
  where id = result.draft_id;

  insert into public.audit_logs (
    workspace_id, actor_id, action, resource_type, resource_id, risk, details
  ) values (
    result.workspace_id,
    current_user_id,
    'approval.reviewed',
    'approval',
    result.id,
    case when p_status = 'approved' then 'low'::public.risk_level else 'medium'::public.risk_level end,
    jsonb_build_object('status', p_status, 'note', p_note)
  );

  return result;
end;
$$;

revoke all on function public.request_draft_approval(uuid, text) from public, anon;
revoke all on function public.review_draft_approval(uuid, public.approval_status, text) from public, anon;
grant execute on function public.request_draft_approval(uuid, text) to authenticated;
grant execute on function public.review_draft_approval(uuid, public.approval_status, text) to authenticated;

create or replace function private.can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin', 'editor')
  ) or exists (
    select 1 from public.workspaces
    where id = target_workspace_id and owner_id = (select auth.uid())
  );
$$;

revoke all on function private.can_edit_workspace(uuid) from public, anon;
grant execute on function private.can_edit_workspace(uuid) to authenticated;

drop policy brands_member_all on public.brands;
create policy brands_select_member on public.brands for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy brands_insert_editor on public.brands for insert to authenticated
with check (private.can_edit_workspace(workspace_id));
create policy brands_update_editor on public.brands for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy brands_delete_editor on public.brands for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy ai_settings_member_all on public.ai_settings;
create policy ai_settings_select_member on public.ai_settings for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy ai_settings_insert_admin on public.ai_settings for insert to authenticated
with check (private.is_workspace_admin(workspace_id));
create policy ai_settings_update_admin on public.ai_settings for update to authenticated
using (private.is_workspace_admin(workspace_id)) with check (private.is_workspace_admin(workspace_id));
create policy ai_settings_delete_admin on public.ai_settings for delete to authenticated
using (private.is_workspace_admin(workspace_id));

drop policy accounts_member_all on public.threads_accounts;
create policy accounts_select_member on public.threads_accounts for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy accounts_insert_editor on public.threads_accounts for insert to authenticated
with check (private.can_edit_workspace(workspace_id));
create policy accounts_update_editor on public.threads_accounts for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy accounts_delete_editor on public.threads_accounts for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy drafts_member_all on public.drafts;
create policy drafts_select_member on public.drafts for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy drafts_insert_editor on public.drafts for insert to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));
create policy drafts_update_editor on public.drafts for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy drafts_delete_editor on public.drafts for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy approvals_member_all on public.approvals;
create policy approvals_select_member on public.approvals for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy approvals_insert_editor on public.approvals for insert to authenticated
with check (private.can_edit_workspace(workspace_id) and requested_by = (select auth.uid()));
create policy approvals_update_editor on public.approvals for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy approvals_delete_editor on public.approvals for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy media_member_all on public.media_assets;
create policy media_select_member on public.media_assets for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy media_insert_editor on public.media_assets for insert to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));
create policy media_update_editor on public.media_assets for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy media_delete_editor on public.media_assets for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy monitor_sources_member_all on public.monitor_sources;
create policy monitor_sources_select_member on public.monitor_sources for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy monitor_sources_insert_editor on public.monitor_sources for insert to authenticated
with check (private.can_edit_workspace(workspace_id));
create policy monitor_sources_update_editor on public.monitor_sources for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy monitor_sources_delete_editor on public.monitor_sources for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy monitor_items_member_all on public.monitor_items;
create policy monitor_items_select_member on public.monitor_items for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy monitor_items_insert_editor on public.monitor_items for insert to authenticated
with check (private.can_edit_workspace(workspace_id));
create policy monitor_items_update_editor on public.monitor_items for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy monitor_items_delete_editor on public.monitor_items for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy metrics_member_all on public.post_metrics;
create policy metrics_select_member on public.post_metrics for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy metrics_insert_editor on public.post_metrics for insert to authenticated
with check (private.can_edit_workspace(workspace_id));
create policy metrics_update_editor on public.post_metrics for update to authenticated
using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id));
create policy metrics_delete_editor on public.post_metrics for delete to authenticated
using (private.can_edit_workspace(workspace_id));

drop policy media_storage_insert on storage.objects;
drop policy media_storage_update on storage.objects;
drop policy media_storage_delete on storage.objects;
create policy media_storage_insert_editor on storage.objects for insert to authenticated
with check (bucket_id = 'media-assets' and private.can_edit_workspace(((storage.foldername(name))[1])::uuid));
create policy media_storage_update_editor on storage.objects for update to authenticated
using (bucket_id = 'media-assets' and private.can_edit_workspace(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'media-assets' and private.can_edit_workspace(((storage.foldername(name))[1])::uuid));
create policy media_storage_delete_editor on storage.objects for delete to authenticated
using (bucket_id = 'media-assets' and private.can_edit_workspace(((storage.foldername(name))[1])::uuid));

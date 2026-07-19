-- approval_comments table
create table if not exists public.approval_comments (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.approvals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) >= 1),
  created_at timestamptz not null default now()
);

alter table public.approval_comments enable row level security;

create policy "workspace members can view approval comments"
  on public.approval_comments for select
  using (private.is_workspace_member(
    (select workspace_id from public.approvals where id = approval_id)
  ));

create policy "workspace members can insert approval comments"
  on public.approval_comments for insert
  with check (private.is_workspace_member(
    (select workspace_id from public.approvals where id = approval_id)
  ));

create policy "users can delete own comments"
  on public.approval_comments for delete
  using (user_id = auth.uid());

-- workspace_members table (some schemas define it inline, ensure it exists)
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null default 'member',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

create policy "workspace members can view members"
  on public.workspace_members for select
  using (private.is_workspace_member(workspace_id));

create policy "admins can insert members"
  on public.workspace_members for insert
  with check (private.is_workspace_admin(workspace_id));

create policy "admins can update members"
  on public.workspace_members for update
  using (private.is_workspace_admin(workspace_id));

create policy "admins can delete members"
  on public.workspace_members for delete
  using (private.is_workspace_admin(workspace_id));

-- add voice_traits column to brands if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brands' and column_name = 'voice_traits'
  ) then
    alter table public.brands add column voice_traits jsonb;
  end if;
end $$;

-- add display_name to profiles if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) then
    alter table public.profiles add column display_name text;
  end if;
end $$;

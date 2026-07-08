-- Create Supabase-specific roles
create role anon with nologin noinherit;
create role authenticated with nologin noinherit;
create role service_role with nologin noinherit;

-- Create auth schema
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  instance_id uuid,
  id uuid not null primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar(255),
  confirmation_sent_at timestamptz,
  recovery_token varchar(255),
  recovery_sent_at timestamptz,
  email_change_token_new varchar(255),
  email_change varchar(255),
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_user boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone varchar(255) default null,
  phone_confirmed_at timestamptz,
  phone_change varchar(255) default '',
  phone_change_token varchar(255) default '',
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz generated always as (least(email_confirmed_at, phone_confirmed_at)) stored,
  email_change_confirm_status smallint default 0,
  banned_until timestamptz,
  reauthentication_token varchar(255) default '',
  reauthentication_sent_at timestamptz,
  is_sso_user boolean default false,
  deleted_at timestamptz,
  role_id uuid,
  is_anonymous boolean default false
);

create index if not exists users_instance_id_idx on auth.users(instance_id);
create index if not exists users_email_idx on auth.users(email);

-- Helper function used by RLS policies
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

-- Create storage schema
create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;

create table if not exists storage.buckets (
  id text not null primary key,
  name text not null,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  public boolean default false,
  avif_autodetection boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner_id text
);

create table if not exists storage.objects (
  id uuid not null default gen_random_uuid() primary key,
  bucket_id text not null references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  metadata jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored,
  version text,
  owner_id text,
  user_metadata jsonb
);

create index if not exists objects_bucket_id_idx on storage.objects(bucket_id);
create index if not exists objects_name_idx on storage.objects(name);
create unique index if not exists bucketid_objname_idx on storage.objects(bucket_id, name);

-- Storage helper function
create or replace function storage.foldername(name text)
returns text[]
language plpgsql
stable
as $$
begin
  return string_to_array(name, '/');
end;
$$;

-- Grant usage
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;

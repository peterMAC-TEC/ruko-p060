-- Last Call: Supabase schema.
-- One row per tab (the whole tab is one JSON document with a version for optimistic locking),
-- photos stored as bytes. Tables have RLS on and no policies: nothing reads them directly.
-- The server calls the lc_* functions below with a server-only secret whose SHA-256 is stored here,
-- so the app only ever needs the project's publishable key plus that secret.
-- Replace <SHA256_OF_SUPABASE_RPC_SECRET> before running.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.tabs (
  id text primary key,
  version integer not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  tab_id text not null,
  name text not null,
  content_type text not null,
  bytes bytea not null,
  created_at timestamptz not null default now(),
  primary key (tab_id, name)
);

create table if not exists public.app_secret (
  id integer primary key default 1 check (id = 1),
  secret_sha256 text not null
);

alter table public.tabs enable row level security;
alter table public.photos enable row level security;
alter table public.app_secret enable row level security;

insert into public.app_secret (id, secret_sha256)
values (1, '<SHA256_OF_SUPABASE_RPC_SECRET>')
on conflict (id) do update set secret_sha256 = excluded.secret_sha256;

create or replace function public.lc_check(p_secret text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from app_secret where secret_sha256 = encode(extensions.digest(p_secret, 'sha256'), 'hex')) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;

create or replace function public.lc_get(p_secret text, p_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform lc_check(p_secret);
  return (select data from tabs where id = p_id);
end $$;

create or replace function public.lc_put(p_secret text, p_id text, p_version integer, p_data jsonb, p_expected integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  perform lc_check(p_secret);
  if p_expected is null then
    insert into tabs (id, version, data) values (p_id, p_version, p_data) on conflict (id) do nothing;
  else
    update tabs set version = p_version, data = p_data, updated_at = now() where id = p_id and version = p_expected;
  end if;
  get diagnostics n = row_count;
  return n = 1;
end $$;

create or replace function public.lc_list(p_secret text) returns setof jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform lc_check(p_secret);
  return query select data from tabs order by created_at desc limit 2000;
end $$;

create or replace function public.lc_put_photo(p_secret text, p_tab text, p_name text, p_type text, p_base64 text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform lc_check(p_secret);
  insert into photos (tab_id, name, content_type, bytes) values (p_tab, p_name, p_type, decode(p_base64, 'base64'))
  on conflict (tab_id, name) do update set content_type = excluded.content_type, bytes = excluded.bytes;
end $$;

create or replace function public.lc_get_photo(p_secret text, p_tab text, p_name text)
returns table (content_type text, base64 text)
language plpgsql security definer set search_path = public as $$
begin
  perform lc_check(p_secret);
  return query select p.content_type, encode(p.bytes, 'base64') from photos p where p.tab_id = p_tab and p.name = p_name;
end $$;

revoke all on function public.lc_check(text) from public, anon, authenticated;

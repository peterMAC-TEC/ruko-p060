-- v2 Phase 0–1: the scam pattern library as remote config, community number
-- reports, anonymous metrics, and per-user sensitivity.

-- New scams are added by inserting a row; no app update needed.
create table scam_patterns (
  id text primary key,
  version int not null default 1,
  active boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- "Was this a scam?" answers. Numbers are stored only as a salted hash, so the
-- table can't be read back as a list of who called whom.
create table number_reports (
  id uuid primary key default gen_random_uuid(),
  number_hash text not null,
  verdict text not null check (verdict in ('scam', 'not_scam', 'unsure')),
  pattern_id text,
  -- One report per reporter per number counts; the reporter is hashed too.
  reporter_hash text not null,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (number_hash, reporter_hash)
);
create index number_reports_hash on number_reports (number_hash);

-- Anonymous metrics: no user id, no phone number, ever.
create table events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'scam_flagged', 'stop_shown', 'money_lock_triggered', 'payment_abandoned',
    'false_positive', 'confirmed_scam', 'time_to_warning', 'emergency_opened'
  )),
  value numeric,
  pattern_id text,
  demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index events_kind on events (kind, created_at);

alter table users add column sensitivity text not null default 'normal'
  check (sensitivity in ('low', 'normal', 'high'));

alter table scam_patterns enable row level security;
alter table number_reports enable row level security;
alter table events enable row level security;

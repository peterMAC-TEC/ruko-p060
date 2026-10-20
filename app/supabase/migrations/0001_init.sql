-- Ruko schema. Follows the master prompt's data model, plus payees and
-- call_signals (needed by the bank rules) and a `seeded` flag so demo data is
-- always labelled apart from real trial data.

create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  language text not null default 'en',
  role text not null check (role in ('elder', 'family', 'fraud_analyst', 'researcher')),
  created_at timestamptz not null default now()
);

create table circles (
  elder_id uuid not null references users (id) on delete cascade,
  member_id uuid not null references users (id) on delete cascade,
  relation text not null,
  code_word_hash text,
  primary key (elder_id, member_id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  scope text not null check (scope in ('call_signals', 'app_usage', 'transcript')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table call_signals (
  elder_id uuid primary key references users (id) on delete cascade,
  on_call boolean not null default false,
  unknown_number boolean not null default false,
  call_minutes int not null default 0,
  call_ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table payees (
  elder_id uuid not null references users (id) on delete cascade,
  name text not null,
  account text not null,
  first_paid_at timestamptz not null default now(),
  primary key (elder_id, account)
);

create table risk_events (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references users (id) on delete cascade,
  source text not null check (source in ('agent', 'signal', 'bank')),
  score int not null check (score between 0 and 100),
  reasons jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  risk_event_id uuid not null references risk_events (id) on delete cascade,
  member_id uuid not null references users (id) on delete cascade,
  channel text not null check (channel in ('sms', 'voice', 'app')),
  status text not null default 'sent' check (status in ('sent', 'ack_calling', 'ack_fine')),
  ts timestamptz not null default now()
);

create table transfers (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payee text not null,
  payee_account text not null,
  flagged boolean not null default false,
  score int not null default 0,
  reasons jsonb not null default '[]',
  status text not null check (status in ('held', 'released', 'blocked', 'completed', 'cancelled')),
  seeded boolean not null default false,
  created_at timestamptz not null default now(),
  hold_until timestamptz,
  decided_at timestamptz
);

create table trials (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references users (id) on delete cascade,
  arm text not null check (arm in ('baseline', 'ruko')),
  script text not null,
  is_scam boolean not null,
  stopped_before_transfer boolean,
  time_to_stop_s int,
  intervention_fired text,
  transcript_url text,
  seeded boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Row Level Security on everything. The app talks to the database only from
-- server routes with the service-role key, which bypasses RLS; the anon key
-- can read nothing. Per-role policies come with real sign-in.
alter table users enable row level security;
alter table circles enable row level security;
alter table consents enable row level security;
alter table call_signals enable row level security;
alter table payees enable row level security;
alter table risk_events enable row level security;
alter table alerts enable row level security;
alter table transfers enable row level security;
alter table trials enable row level security;

-- Realtime for the fraud console and the results dashboard.
alter publication supabase_realtime add table transfers, alerts, trials;

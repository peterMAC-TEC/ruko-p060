-- Ruko threat engine, verified bank calls, duress PIN, coercion signals and
-- mule intelligence (docs/SECURITY.md, docs/research/08).

-- Every observation and every automatic action, per person, in a hash chain:
-- each row's hash covers the previous row's hash, so editing or deleting any
-- row breaks the chain (tamper-evident evidence for the bank, 1930 and research).
create table threat_events (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references users (id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind in ('observation', 'action')),
  source text not null,
  tactic text,
  action text,
  lr numeric,
  evidence text,
  demo boolean not null default false,
  prev_hash text not null,
  hash text not null unique
);
create index threat_events_elder on threat_events (elder_id, at);

-- Signed "we are calling you now" notices from the bank (Ed25519).
create table call_intents (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references users (id) on delete cascade,
  org text not null,
  payload jsonb not null,
  sig text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz
);
create index call_intents_elder on call_intents (elder_id, expires_at);

-- Community and bank reports of mule accounts, by salted hash only.
create table mule_reports (
  id uuid primary key default gen_random_uuid(),
  account_hash text not null,
  reporter_hash text not null,
  pattern_id text,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (account_hash, reporter_hash)
);
create index mule_reports_account on mule_reports (account_hash);

-- The practice bank's UPI PIN and the duress ("safety") PIN, scrypt-hashed.
alter table users
  add column if not exists pin_hash text,
  add column if not exists duress_hash text,
  add column if not exists pin_fails int not null default 0,
  add column if not exists pin_locked_until timestamptz;

-- Payments: duress flag (shown to the customer as sent, really frozen),
-- consented coercion signals, and the payee's salted hash for mule analytics.
alter table transfers
  add column if not exists duress boolean not null default false,
  add column if not exists behaviour jsonb,
  add column if not exists payee_hash text;
create index if not exists transfers_payee_hash on transfers (payee_hash);

alter table threat_events enable row level security;
alter table call_intents enable row level security;
alter table mule_reports enable row level security;

-- Trial lab: the feasibility pilot that measures the north star (share of
-- role-played scam calls where the person stops before money moves).
-- Participants are pseudonymous (P01, P02 …): no names, phone numbers or
-- audio are stored. Each one gets a practice account (a sandbox user with a
-- mock bank) so the app's own logs show what happened during each call.

-- Baseline calls switch Ruko off for that practice account.
alter table users add column if not exists ruko_enabled boolean not null default true;

create table participants (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  account_id uuid references users (id) on delete set null,
  age_band text not null check (age_band in ('60-64', '65-69', '70-74', '75-79', '80+')),
  language text not null default 'en',
  phone_type text check (phone_type in ('smartphone', 'feature', 'none')),
  uses_upi boolean,
  lives_alone boolean,
  family_present_default boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  plan jsonb not null default '[]',
  withdrawn_at timestamptz,
  notes text,
  seeded boolean not null default false,
  created_at timestamptz not null default now()
);

create table trial_calls (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete cascade,
  order_no int not null,
  arm text not null check (arm in ('baseline', 'ruko', 'control')),
  script_id text not null,
  is_scam boolean not null,
  channel text not null default 'browser' check (channel in ('browser', 'phone')),
  lang text not null default 'en',
  family_present boolean not null default false,
  status text not null default 'ready' check (status in ('ready', 'live', 'ended', 'aborted')),
  -- What the caller screen should be saying right now (the director drives it).
  live jsonb not null default '{}',
  started_at timestamptz,
  ended_at timestamptz,
  furthest_step int check (furthest_step between 0 and 7),
  -- Seconds from the start of the call when each scale step was first reached.
  step_times jsonb not null default '{}',
  stopped_by text check (stopped_by in ('self', 'ruko_check', 'family', 'bank_hold', 'stop_word', 'facilitator')),
  time_to_stop_s int,
  ruko_used boolean,
  ruko_level text check (ruko_level in ('stop', 'caution', 'clear')),
  family_alerted boolean,
  bank_held boolean,
  -- Control calls: the person turned down a legitimate request.
  participant_refused boolean,
  stress int check (stress between 1 and 5),
  confidence int check (confidence between 1 and 5),
  debriefed boolean not null default false,
  notes text,
  seeded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (participant_id, order_no)
);

create index trial_calls_participant on trial_calls (participant_id);

alter table participants enable row level security;
alter table trial_calls enable row level security;
alter publication supabase_realtime add table trial_calls;

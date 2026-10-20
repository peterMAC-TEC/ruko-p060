-- Week 1 of the blueprint: real accounts, consent per purpose, family invites
-- (each family member consents to their own data), trusted-person approval
-- (mirrors RBI's April 2026 proposal) and a protection hold that follows the
-- elder across payments and channels until family or the bank clears it.

-- Accounts: an app user can be linked to a Supabase Auth login.
alter table users add column auth_id uuid unique references auth.users (id) on delete set null;
alter table users add column email text;
alter table users add column birth_year int check (birth_year between 1900 and 2100);

-- Consent per purpose, with the notice version, language and the elder's own
-- words from teach-back.
alter table consents drop constraint consents_scope_check;
alter table consents add constraint consents_scope_check
  check (scope in ('call_signals', 'app_usage', 'transcript', 'family_alerts', 'transaction_risk', 'drills'));
alter table consents add column notice_version text not null default 'v1';
alter table consents add column lang text not null default 'en';
alter table consents add column teach_back text;

-- The trusted person (RBI proposal: one per elder) is marked on the circle.
alter table circles add column trusted boolean not null default false;

-- Family invites: nobody's number is used until they accept.
create table invites (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references users (id) on delete cascade,
  name text not null,
  phone text not null,
  relation text not null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  member_id uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  decided_at timestamptz
);

-- Trusted-person approvals for large payments.
create table approvals (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references transfers (id) on delete cascade,
  member_id uuid not null references users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- Protection: once Ruko sees a scam, large payments stay on hold on every
-- channel until a family member or the bank clears it. The elder can't clear
-- it alone, because a scammer would simply coach them to.
create table protection (
  elder_id uuid primary key references users (id) on delete cascade,
  active boolean not null default false,
  since timestamptz,
  reason text,
  cleared_by uuid references users (id) on delete set null,
  cleared_at timestamptz
);

-- Payment channel, and whether a trusted person must approve.
alter table transfers add column channel text not null default 'upi'
  check (channel in ('upi', 'imps', 'neft', 'rtgs', 'cash', 'fd_break'));
alter table transfers add column needs_approval boolean not null default false;

alter table invites enable row level security;
alter table approvals enable row level security;
alter table protection enable row level security;

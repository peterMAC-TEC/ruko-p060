-- Survey bot: answers from participants and families after a drill call, and from outsiders (the open link).
-- No names, phone numbers or emails: free text is scrubbed before it is stored (lib/survey.ts).
-- Erasing a participant erases their survey answers with them.
create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('participant', 'family', 'open')),
  call_id uuid references trial_calls (id) on delete cascade,
  participant_id uuid references participants (id) on delete cascade,
  arm text check (arm in ('baseline', 'ruko', 'control')),
  is_scam boolean,
  lang text not null default 'en' check (lang in ('en', 'hing')),
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists survey_responses_kind on survey_responses (kind, created_at desc);
alter table survey_responses enable row level security;

-- Ruko Companion: what the elder tells Ruko during an alert, shown on the family's phone.
-- A code only (never words): talking, hung_up, needs_help or paid.
alter table risk_events
  add column if not exists elder_status text check (elder_status in ('talking', 'hung_up', 'needs_help', 'paid')),
  add column if not exists elder_status_at timestamptz;

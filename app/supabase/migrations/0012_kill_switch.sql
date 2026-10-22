-- The customer's kill switch (the RBI draft's "disable all digital payments" idea): a separate flag from Money Lock,
-- so a duress freeze or a Money Lock reason is never overwritten. Additive and safe for older code.
alter table protection add column if not exists payments_paused boolean not null default false;
alter table protection add column if not exists paused_at timestamptz;

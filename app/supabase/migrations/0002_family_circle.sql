-- Family Safety Circle: the elder pressing "Alert my family" is its own risk
-- source, and each alert keeps the exact text that was sent.
alter table risk_events drop constraint risk_events_source_check;
alter table risk_events add constraint risk_events_source_check
  check (source in ('agent', 'signal', 'bank', 'elder'));

alter table alerts add column message text not null default '';

-- Fixes from the adversarial security review (docs/SECURITY.md §6).

-- H2: count wrong PIN tries atomically, so parallel guesses can't all read
-- "0 fails" and slip past the lock. Returns the new count and any lock time.
create or replace function ruko_pin_fail(uid uuid, max_tries int, lock_minutes int)
returns table (fails int, locked_until timestamptz)
language sql
as $$
  update users
     set pin_fails = case when pin_fails + 1 >= max_tries then 0 else pin_fails + 1 end,
         pin_locked_until = case when pin_fails + 1 >= max_tries then now() + make_interval(mins => lock_minutes) else pin_locked_until end
   where id = uid
  returning case when pin_locked_until > now() then max_tries else pin_fails end, pin_locked_until;
$$;

-- M5: no forks in a person's evidence chain (two writers reading the same head
-- now collide; the app retries on the new head), and rows can't be edited.
-- Deletion stays possible: the right to erasure (DPDP) and practice resets.
alter table threat_events add constraint threat_events_chain unique (elder_id, prev_hash);

create or replace function ruko_no_update() returns trigger language plpgsql as $$
begin
  raise exception 'threat_events is append-only';
end;
$$;
create trigger threat_events_append_only before update on threat_events for each row execute function ruko_no_update();

-- M2: a verified bank call only lowers risk once the person confirms the caller
-- read out the right code.
alter table call_intents
  add column if not exists confirmed_at timestamptz,
  add column if not exists code_match boolean;

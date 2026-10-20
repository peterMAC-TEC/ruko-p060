-- Trial method v2 (docs/research/06-trial-methodology.md):
-- controls carry an arm, the primary outcome is "stopped before pay" (same act
-- in both arms), fixed allocation rows, an event log fed by the practice phone,
-- distress readings, and an audit log of manual level changes.

alter table participants
  add column if not exists row_no int,
  add column if not exists arm_order text check (arm_order in ('AB', 'BA')),
  add column if not exists gender text check (gender in ('f', 'm', 'x', 'na')),
  add column if not exists prior_awareness boolean,
  add column if not exists teachback_passed boolean,
  add column if not exists teachback_attempts int,
  add column if not exists self_efficacy_pre int check (self_efficacy_pre between 1 and 5),
  add column if not exists self_efficacy_post int check (self_efficacy_post between 1 and 5),
  add column if not exists deception_acceptable boolean;

alter table trial_calls
  add column if not exists block int,
  add column if not exists money_moved boolean,
  add column if not exists control_outcome text check (control_outcome in ('C0', 'C1', 'C2', 'C3')),
  add column if not exists belief_real text check (belief_real in ('yes', 'unsure', 'no')),
  add column if not exists stress_pre int check (stress_pre between 1 and 5),
  add column if not exists stress_after int check (stress_after between 1 and 5),
  add column if not exists adverse_event_level int check (adverse_event_level between 0 and 3),
  add column if not exists deviation text,
  add column if not exists facilitator_in_room boolean not null default true,
  add column if not exists t_money_ask_s int,
  add column if not exists events jsonb not null default '[]',
  add column if not exists level_edit_log jsonb not null default '[]';

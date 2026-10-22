-- Ruko Companion's "help warn others" report is stored with the surveys, as kind 'incident'.
alter table survey_responses drop constraint if exists survey_responses_kind_check;
alter table survey_responses add constraint survey_responses_kind_check check (kind in ('participant', 'family', 'open', 'incident'));

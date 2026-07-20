-- live_results: status CHECK now includes 'finalist' ------------------------
-- "Finalist" sits between upcoming and in_progress: a Final round (Track or
-- Field) whose qualified lineup is known (bibs typed) but hasn't actually
-- started yet. Same drop-by-introspection-then-recreate pattern as
-- 0006_live_hub.sql (the constraint name is dashboard-created in prod, so
-- it's found by content rather than assumed by name).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.live_results'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.live_results drop constraint %I', c.conname);
  end loop;
end $$;
alter table live_results add constraint live_results_status_check
  check (status in ('upcoming', 'in_progress', 'paused', 'completed', 'finalist'));

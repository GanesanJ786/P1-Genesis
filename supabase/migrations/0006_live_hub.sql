-- ============================================================================
-- Genesis Track Fest — Live Event Hub
-- Multi-event live tracking: evolves live_results into per-event schedule
-- items, adds announcements + event_sponsors, and flags events for the hub.
--
-- IMPORTANT: live_results was originally created via the Supabase dashboard
-- (no repo migration existed), so every statement here is idempotent and the
-- prod status CHECK constraint is dropped by introspection, not by name.
-- Safe to run more than once.
-- ============================================================================

-- events: hub flag --------------------------------------------------------
alter table events add column if not exists live_tracking boolean not null default false;

-- live_results: full shape for fresh environments -------------------------
-- (No-op in prod where the table already exists; the alters below converge it.)
create table if not exists live_results (
  id                 uuid primary key default gen_random_uuid(),
  event_key          text unique not null,
  event_name         text not null,
  category           text not null,
  gender             text,
  event_type         text,
  heat_label         text,
  day                int not null default 1,
  sort_order         int not null default 0,
  status             text not null default 'upcoming',
  results            jsonb not null default '[]'::jsonb,
  notes              text,
  event_id           uuid references events(id) on delete set null,
  scheduled_at       timestamptz,
  venue              text,
  poc_name           text,
  poc_phone          text,
  wind               text,
  participants_count int,
  media              jsonb not null default '[]'::jsonb,
  updated_at         timestamptz not null default now()
);

-- live_results: new columns for the existing prod table -------------------
alter table live_results add column if not exists event_id uuid references events(id) on delete set null;
alter table live_results add column if not exists scheduled_at timestamptz;
alter table live_results add column if not exists venue text;
alter table live_results add column if not exists poc_name text;
alter table live_results add column if not exists poc_phone text;
alter table live_results add column if not exists wind text;
alter table live_results add column if not exists participants_count int;
alter table live_results add column if not exists media jsonb not null default '[]'::jsonb;

-- live_results: status CHECK now includes 'paused' -------------------------
-- The prod constraint name is unknown (dashboard-created), so drop any CHECK
-- mentioning status by introspection, then recreate under a stable name.
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
  check (status in ('upcoming', 'in_progress', 'paused', 'completed'));

-- live_results: keep updated_at honest for admin edits ---------------------
-- (The public board's stale-poll reconciliation compares updated_at.)
drop trigger if exists live_results_touch_updated_at on live_results;
create trigger live_results_touch_updated_at
  before update on live_results
  for each row execute function public.touch_updated_at();

create index if not exists live_results_event_idx on live_results (event_id, day, sort_order);

-- announcements -------------------------------------------------------------
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  message    text not null,
  type       text not null default 'info'
             check (type in ('info', 'delay', 'venue', 'safety', 'results')),
  is_pinned  boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists announcements_event_idx
  on announcements (event_id, is_pinned desc, created_at desc);

-- event_sponsors junction (per-event sponsor showcase) -----------------------
create table if not exists event_sponsors (
  event_id   uuid not null references events(id) on delete cascade,
  sponsor_id uuid not null references sponsors(id) on delete cascade,
  sort_order int not null default 0,
  primary key (event_id, sponsor_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table live_results enable row level security;
alter table announcements enable row level security;
alter table event_sponsors enable row level security;

-- live_results: public read; staff manage (drop-then-create for idempotency)
drop policy if exists "public read live results" on live_results;
create policy "public read live results" on live_results
  for select using (true);
drop policy if exists "staff manage live results" on live_results;
create policy "staff manage live results" on live_results
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- announcements: public read; staff manage
drop policy if exists "public read announcements" on announcements;
create policy "public read announcements" on announcements
  for select using (true);
drop policy if exists "staff manage announcements" on announcements;
create policy "staff manage announcements" on announcements
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- event_sponsors: public read; staff manage
drop policy if exists "public read event sponsors" on event_sponsors;
create policy "public read event sponsors" on event_sponsors
  for select using (true);
drop policy if exists "staff manage event sponsors" on event_sponsors;
create policy "staff manage event sponsors" on event_sponsors
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ============================================================================
-- Realtime publication (live_results was added via dashboard; guard both)
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'live_results'
  ) then
    alter publication supabase_realtime add table live_results;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'announcements'
  ) then
    alter publication supabase_realtime add table announcements;
  end if;
end $$;

-- ============================================================================
-- Backfill (run AFTER the Track Fest event exists and is meant to go live).
-- Adjust the slug if it differs, then uncomment and run:
-- ============================================================================
-- update events set live_tracking = true
--   where slug = 'coimbatore-track-fest-2026';
-- update live_results
--   set event_id = (select id from events where slug = 'coimbatore-track-fest-2026')
--   where event_id is null;

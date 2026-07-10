-- ============================================================================
-- Genesis Live Hub — TEST DATA (disposable)
-- Realistic multi-round meet so you can see how heats / semis / finals render
-- on /live before real data arrives. Attaches to your one live-tracked event.
--
-- Safe + re-runnable (upserts on event_key). To remove it all afterwards, use
-- the "Clear all results" button on /admin/live, or:
--   delete from live_results where event_key like 'demo-%';
-- ============================================================================

with ev as (
  select id as event_id
  from events
  where live_tracking = true
  order by start_date desc
  limit 1
)
insert into live_results (
  event_id, event_key, event_name, category, gender, event_type, heat_label,
  day, sort_order, status, venue, wind, participants_count, scheduled_at, notes,
  results, updated_at
)
select ev.event_id, x.*
from ev, (values
  -- ── 100m U-14 Boys: three heats → semifinal → final ─────────────────────
  ('demo-100m-u14-boys-heat1','100m','U-14','Boys','100m','Heat 1',
    1, 10, 'completed', 'Main Track', '+0.8 m/s', 8,
    null::timestamptz, null::text,
    '[{"rank":1,"bib":"112","name":"Arjun Ramesh","school":"SVN School, Erode","result":"12.8s"},
      {"rank":2,"bib":"118","name":"Karthik S","school":"Kongu Vidyalaya","result":"13.0s"},
      {"rank":3,"bib":"124","name":"Vishnu P","school":"Stanes School","result":"13.1s"},
      {"rank":4,"bib":"131","name":"Mohammed Ali","school":"Suguna PIP","result":"13.3s"}]'::jsonb,
    now()),

  ('demo-100m-u14-boys-heat2','100m','U-14','Boys','100m','Heat 2',
    1, 11, 'completed', 'Main Track', '-0.3 m/s', 8,
    null, null,
    '[{"rank":1,"bib":"115","name":"Dinesh Kumar","school":"CBSE Model, Tirupur","result":"12.7s"},
      {"rank":2,"bib":"120","name":"Ragul V","school":"SVN School, Erode","result":"12.9s"},
      {"rank":3,"bib":"127","name":"Sanjay M","school":"Chinmaya Vidyalaya","result":"13.2s"},
      {"rank":4,"bib":"133","name":"Aravind R","school":"PSG Public","result":"13.4s"}]'::jsonb,
    now()),

  ('demo-100m-u14-boys-heat3','100m','U-14','Boys','100m','Heat 3',
    1, 12, 'in_progress', 'Main Track', null, 8,
    null, null,
    '[]'::jsonb,
    now()),

  ('demo-100m-u14-boys-semi','100m','U-14','Boys','100m','Semifinal',
    1, 20, 'upcoming', 'Main Track', null, 8,
    now() + interval '30 minutes', null,
    '[]'::jsonb,
    now()),

  ('demo-100m-u14-boys-final','100m','U-14','Boys','100m','Final',
    1, 30, 'upcoming', 'Main Track', null, 8,
    now() + interval '90 minutes', null,
    '[]'::jsonb,
    now()),

  -- ── Long Jump U-16 Girls: final in progress (field event) ───────────────
  ('demo-lj-u16-girls-final','Long Jump','U-16','Girls','Long Jump','Final',
    1, 40, 'in_progress', 'Field Area B', '+1.1 m/s', 10,
    null, null,
    '[{"rank":1,"bib":"212","name":"Priya Dharshini","school":"GHSS Peelamedu","result":"5.42m"},
      {"rank":2,"bib":"208","name":"Ananya R","school":"Stanes School","result":"5.31m"},
      {"rank":3,"bib":"215","name":"Kavya S","school":"Suguna PIP","result":"5.18m"}]'::jsonb,
    now()),

  -- ── 200m Open Boys: completed final with a meet record ──────────────────
  ('demo-200m-open-boys-final','200m','Open','Boys','200m','Final',
    1, 50, 'completed', 'Main Track', '-0.2 m/s', 6,
    null, null,
    '[{"rank":1,"bib":"301","name":"Surya Prakash","school":"Kongu Athletic Club","result":"22.1s","record":"MR"},
      {"rank":2,"bib":"305","name":"Naveen Kumar","school":"Genesis Sports Foundation","result":"22.4s"},
      {"rank":3,"bib":"309","name":"Hari Krishnan","school":"PSG College","result":"22.6s"},
      {"rank":4,"bib":"312","name":"Bala Murugan","school":"CBE Track Club","result":"22.9s"},
      {"rank":5,"bib":"316","name":"Ashwin R","school":"Stanes School","result":"23.1s"},
      {"rank":6,"bib":"320","name":"Vignesh M","school":"Suguna PIP","result":"23.3s"}]'::jsonb,
    now()),

  -- ── Shot Put U-16 Boys: completed final, national record ────────────────
  ('demo-shotput-u16-boys-final','Shot Put','U-16','Boys','Shot Put','Final',
    1, 60, 'completed', 'Throw Circle', null, 8,
    null, null,
    '[{"rank":1,"bib":"405","name":"Gokul Nath","school":"Kongu Vidyalaya","result":"14.20m","record":"NR"},
      {"rank":2,"bib":"401","name":"Manoj Kumar","school":"SVN School, Erode","result":"13.85m"},
      {"rank":3,"bib":"409","name":"Prithvi Raj","school":"PSG Public","result":"13.10m"}]'::jsonb,
    now()),

  -- ── 4x100m Relay Open Girls: upcoming, scheduled (countdown) ────────────
  ('demo-relay-4x100-open-girls-final','4x100m Relay','Open','Girls','Relay','Final',
    1, 70, 'upcoming', 'Main Track', null, null,
    now() + interval '150 minutes', null,
    '[]'::jsonb,
    now()),

  -- ── 800m U-14 Girls: heat paused (tests the Paused state) ───────────────
  ('demo-800m-u14-girls-heat1','800m','U-14','Girls','800m','Heat 1',
    1, 80, 'paused', 'Main Track', null, 12,
    null, 'Paused — brief track obstruction, resuming shortly',
    '[{"rank":1,"bib":"512","name":"Deepika S","school":"GHSS Peelamedu","result":"2:24.5"}]'::jsonb,
    now())
) as x(
  event_key, event_name, category, gender, event_type, heat_label,
  day, sort_order, status, venue, wind, participants_count, scheduled_at, notes,
  results, updated_at
)
on conflict (event_key) do update set
  event_id           = excluded.event_id,
  event_name         = excluded.event_name,
  category           = excluded.category,
  gender             = excluded.gender,
  event_type         = excluded.event_type,
  heat_label         = excluded.heat_label,
  day                = excluded.day,
  sort_order         = excluded.sort_order,
  status             = excluded.status,
  venue              = excluded.venue,
  wind               = excluded.wind,
  participants_count = excluded.participants_count,
  scheduled_at       = excluded.scheduled_at,
  notes              = excluded.notes,
  results            = excluded.results,
  updated_at         = excluded.updated_at;

-- A couple of announcements so that section isn't empty either:
insert into announcements (event_id, message, type, is_pinned)
select
  (select id from events where live_tracking = true order by start_date desc limit 1),
  m.message, m.type, m.is_pinned
from (values
  ('Welcome to the Genesis Track Fest 2026! Follow every race live on this page.', 'info', true),
  ('Lunch break 1:00–2:00 PM. Track events resume with the 100m U-14 semifinal.', 'delay', false)
) as m(message, type, is_pinned);

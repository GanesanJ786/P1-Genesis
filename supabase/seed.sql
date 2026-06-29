-- ============================================================================
-- Seed data for Genesis Track Fest
-- Mirrors lib/seed-data.ts so the live DB matches the preview content.
-- Run AFTER creating your admin auth user (see README) — the profile row is
-- auto-created by the on_auth_user_created trigger; promote it to 'admin' there.
-- ============================================================================

-- Editable site copy --------------------------------------------------------
insert into site_content (key, value) values
  ('hero.eyebrow', '"1st Junior & Senior Athletic Championship"'),
  ('hero.title', '"Genesis Track Fest 2026"'),
  ('hero.tagline', '"A platform to discover future champions — and an invitation to build them with us."'),
  ('event.oneliner', '"Built to feel like a national-level meet from the very first year."'),
  ('foundation.quote', '"From two students to five academies and four straight state titles — Genesis Track Fest is where that story opens to the public."'),
  ('impact.commitment', '"Together, we will build champions and win Olympic medals for India."')
on conflict (key) do nothing;

-- Sponsor tiers (display rows) ----------------------------------------------
insert into sponsors (name, tier, amount_inr, sort_order, is_active) values
  ('Title Sponsor', 'title', 500000, 1, true),
  ('Platinum Sponsor', 'platinum', 300000, 2, true),
  ('Gold Sponsor', 'gold', 200000, 3, true),
  ('Silver Sponsor', 'silver', 100000, 4, true)
on conflict do nothing;

-- Leadership team -----------------------------------------------------------
insert into team_members (name, role_title, bio, sort_order, is_active) values
  ('K. Mohanraj', 'President', 'Chairman, Creator Construction · International Athlete', 1, true),
  ('Sivakumar S', 'Vice President', 'VS. Foundation', 2, true),
  ('Vairavanathan S', 'Secretary', 'Chief Coach & Founder, Genesis Sports Foundation. World Athletics Level 2 certified, 10+ years building Coimbatore''s athletics pipeline.', 3, true),
  ('Dr. Madhu Shankar', 'Joint Secretary', null, 4, true),
  ('Maria Catherine D', 'Treasurer', null, 5, true)
on conflict do nothing;

-- Events --------------------------------------------------------------------
insert into events (slug, title, summary, body, start_date, end_date, location, status, sort_order) values
  ('genesis-track-fest-2026', 'Genesis Track Fest 2026',
   'The flagship two-day Junior & Senior Athletic Championship at Nehru Stadium, Coimbatore.',
   'Genesis Track Fest is a professional athletics competition created to encourage school, club, and academy athletes. The event gives young athletes a platform to compete, perform, and grow with confidence — turning Nehru Stadium into a stage for Coimbatore''s next generation of track and field talent.',
   '2026-07-31', '2026-08-01', 'Nehru Stadium, Coimbatore', 'published', 1),
  ('junior-championship-day-1', 'Junior Championship — Day 1',
   'U12, U14 & U17 track and field finals across the morning and afternoon sessions.',
   'Day one of the championship focuses on the junior age categories with heats, semi-finals, and finals across sprints, middle distance, jumps and throws, capped by a structured medal ceremony.',
   '2026-07-31', '2026-07-31', 'Nehru Stadium, Coimbatore', 'published', 2),
  ('senior-open-championship-day-2', 'Senior & Open Championship — Day 2',
   'U19 and Open category finals, relays, and the closing medal ceremony.',
   'The second day brings the senior and open categories to the track, featuring marquee sprint finals, relays, and the grand closing ceremony celebrating the meet''s champions.',
   '2026-08-01', '2026-08-01', 'Nehru Stadium, Coimbatore', 'published', 3)
on conflict (slug) do nothing;

-- Academy locations (future module reference) -------------------------------
insert into academies (name, city, is_active) values
  ('Nehru Stadium', 'Coimbatore', true),
  ('Saravanampatti', 'Coimbatore', true),
  ('Decathlon', 'Coimbatore', true),
  ('Kovaipudur', 'Coimbatore', true),
  ('Tirupur', 'Tirupur', true)
on conflict do nothing;

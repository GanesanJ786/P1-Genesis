-- ============================================================
-- Genesis Track Fest — full setup (schema + storage + seed)
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ============================================================================
-- Genesis Track Fest — initial schema
-- Tables, enums, the is_staff() helper, and RLS policies.
-- ============================================================================

-- Enums --------------------------------------------------------------------
create type user_role as enum ('admin', 'staff', 'coach');
create type event_status as enum ('draft', 'published', 'archived');
create type sponsor_tier as enum ('title', 'platinum', 'gold', 'silver', 'bronze', 'medical', 'sound', 'partner', 'supporter');
create type team_member_type as enum ('leadership', 'coach');

-- profiles (1:1 with auth.users) -------------------------------------------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       user_role not null default 'staff',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- events --------------------------------------------------------------------
create table events (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  summary     text,
  body        text,
  cover_image text,
  start_date  date,
  end_date    date,
  location    text,
  status      event_status not null default 'draft',
  sort_order  int not null default 0,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index events_status_idx on events (status);

-- slides --------------------------------------------------------------------
create table slides (
  id         uuid primary key default gen_random_uuid(),
  group_key  text not null default 'home_hero',
  title      text,
  subtitle   text,
  image_path text not null,
  link_url   text,
  event_id   uuid references events(id) on delete set null,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index slides_group_active_idx on slides (group_key, is_active);

-- sponsors ------------------------------------------------------------------
create table sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tier        sponsor_tier not null,
  logo_path   text,
  website_url text,
  amount_inr  bigint,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- team_members --------------------------------------------------------------
create table team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role_title  text,
  bio         text,
  photo_path  text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  member_type team_member_type not null default 'leadership'
);

-- site_content (editable copy) ----------------------------------------------
create table site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- contact_submissions -------------------------------------------------------
create table contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  message    text,
  created_at timestamptz not null default now()
);

-- Future stubs (created now so the later students/coaches phase is additive) -
create table academies (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  city      text,
  address   text,
  is_active boolean not null default true
);
create table coaches (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  name       text not null,
  specialty  text,
  academy_id uuid references academies(id) on delete set null
);
create table students (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  dob        date,
  academy_id uuid references academies(id) on delete set null,
  coach_id   uuid references coaches(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Helper: is the current user a staff member? -------------------------------
-- security definer + fixed search_path avoids RLS recursion on profiles.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'staff', 'coach')
  );
$$;

-- updated_at trigger for events --------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger events_touch_updated_at
  before update on events
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table slides enable row level security;
alter table sponsors enable row level security;
alter table team_members enable row level security;
alter table site_content enable row level security;
alter table contact_submissions enable row level security;
alter table academies enable row level security;
alter table coaches enable row level security;
alter table students enable row level security;

-- profiles: each user reads/updates own row; staff/admin read all
create policy "read own profile" on profiles
  for select using (auth.uid() = id or public.is_staff());
create policy "update own profile" on profiles
  for update using (auth.uid() = id);

-- events: public reads published; staff manage all
create policy "public read published events" on events
  for select using (status = 'published' or public.is_staff());
create policy "staff manage events" on events
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- slides: public reads active; staff manage all
create policy "public read active slides" on slides
  for select using (is_active = true or public.is_staff());
create policy "staff manage slides" on slides
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- sponsors: public reads active; staff manage all
create policy "public read active sponsors" on sponsors
  for select using (is_active = true or public.is_staff());
create policy "staff manage sponsors" on sponsors
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- team_members: public reads active; staff manage all
create policy "public read active team" on team_members
  for select using (is_active = true or public.is_staff());
create policy "staff manage team" on team_members
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- site_content: public read all; staff write
create policy "public read content" on site_content
  for select using (true);
create policy "staff manage content" on site_content
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- contact_submissions: anyone may insert; only staff may read
create policy "anon insert submissions" on contact_submissions
  for insert to anon, authenticated with check (true);
create policy "staff read submissions" on contact_submissions
  for select to authenticated using (public.is_staff());

-- future tables: staff only (coach-scoped policies added in that phase)
create policy "staff manage academies" on academies
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage coaches" on coaches
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage students" on students
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Auto-create a profile row when a new auth user is created -----------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Storage buckets + policies
--   public-media : public read, staff write (slides, covers, logos, photos)
--   private-docs : staff only (stubbed for the future students/coaches phase)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private-docs', 'private-docs', false)
on conflict (id) do nothing;

-- public-media: anyone can read
create policy "public read media"
  on storage.objects for select
  using (bucket_id = 'public-media');

-- public-media: only staff can write/update/delete
create policy "staff upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and public.is_staff());

create policy "staff update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and public.is_staff());

create policy "staff delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and public.is_staff());

-- private-docs: staff only, all operations
create policy "staff read private docs"
  on storage.objects for select to authenticated
  using (bucket_id = 'private-docs' and public.is_staff());

create policy "staff write private docs"
  on storage.objects for all to authenticated
  using (bucket_id = 'private-docs' and public.is_staff())
  with check (bucket_id = 'private-docs' and public.is_staff());

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

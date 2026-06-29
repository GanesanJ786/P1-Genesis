-- ============================================================================
-- Genesis Track Fest — initial schema
-- Tables, enums, the is_staff() helper, and RLS policies.
-- ============================================================================

-- Enums --------------------------------------------------------------------
create type user_role as enum ('admin', 'staff', 'coach');
create type event_status as enum ('draft', 'published', 'archived');
create type sponsor_tier as enum ('title', 'platinum', 'gold', 'silver', 'supporter');

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
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role_title text,
  bio        text,
  photo_path text,
  sort_order int not null default 0,
  is_active  boolean not null default true
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

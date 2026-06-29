# Genesis Track Fest 2026 — Website

A modern marketing site + admin panel for **Genesis Sports Foundation**'s
Genesis Track Fest 2026 athletics championship (Nehru Stadium, Coimbatore).

Built with **Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase ·
Framer Motion · Lenis · Embla**. Designed to deploy on **Vercel**.

## Features

- **Parallax hero** with optimized background video + scroll-layered copy
- **Dynamic event sliders** (Embla) driven by admin-managed content
- Full prospectus content: event, sponsorship tiers, foundation, leadership,
  achievements, impact, contact (with QR + prospectus download)
- **Admin panel** (`/admin`) — auth-gated CRUD for events, slides, sponsors,
  team, and editable site copy, with drag-drop image upload (auto-WebP)
- **Extensible** — `academies` / `coaches` / `students` tables are pre-stubbed
  for the planned student & coach tracking module
- Renders fully from bundled **seed data** before Supabase is configured

## Quick start (preview — no backend)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the public site works immediately from seed data.
The admin panel shows a setup notice until Supabase is configured.

## Enabling the backend (Supabase)

1. **Create a project** at https://supabase.com (free tier).
2. **Env vars** — copy `.env.example` → `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
3. **Run migrations** — either paste the files in `supabase/migrations/` into
   the Supabase SQL Editor (in order: `0001_init.sql`, then `0002_storage.sql`),
   or with the CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
4. **Seed content** — run `supabase/seed.sql` in the SQL Editor.
5. **Create the admin user** — Dashboard → Authentication → Add user (email +
   password). A `profiles` row is auto-created by a trigger; promote it:
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
6. Restart `npm run dev`, go to `/admin/login`, and sign in.

### Regenerate DB types after schema changes
```bash
supabase gen types typescript --linked > types/database.types.ts
```

## Project structure

```
app/(public)/   Marketing site (route group, public layout)
app/admin/      Auth-gated admin panel (sidebar layout)
components/      public/ + admin/ + ui/ + providers/
lib/            supabase clients, queries, actions, validations, seed-data
supabase/       migrations (schema + RLS + storage) and seed.sql
types/          hand-authored database.types.ts
middleware.ts   refreshes session + guards /admin
```

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add the three env vars from `.env.local` in Vercel → Settings → Environment
   Variables.
3. Deploy. Point the production Supabase project at the same migrations/seed.

## Architecture notes

- **Supabase clients** are split in `lib/supabase/`: `client` (browser anon),
  `server` (cookie SSR), `admin` (service-role, **server-only**). The
  service-role key bypasses RLS and must never reach the client.
- **RLS** is enabled on every table: public read of published/active rows;
  writes restricted to staff via the `is_staff()` security-definer helper.
  Server actions also call `requireAdmin()` as defense in depth.
- **Reduced motion**: parallax and Lenis smooth-scroll disable automatically
  under `prefers-reduced-motion`.

-- ============================================================================
-- Genesis — external media + registration for events
-- Additive & non-destructive: adds an external-registration link and an
-- external-media list (YouTube / Instagram URLs) so the site can showcase
-- video & social content without using Supabase image storage.
-- ============================================================================

alter table events
  add column if not exists registration_url text,
  add column if not exists media jsonb not null default '[]'::jsonb;

comment on column events.registration_url is
  'External sign-up link (e.g. Google Form) shown as the Register CTA for upcoming events.';
comment on column events.media is
  'Array of external media: [{ "type": "youtube"|"instagram", "url": "...", "caption": "..." }]. No images are stored in Supabase.';

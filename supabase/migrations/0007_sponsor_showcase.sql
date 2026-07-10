-- 0007_sponsor_showcase.sql
-- Enriches the per-event sponsor showcase (see 0006 event_sponsors):
--   * adds a description + banner image to each sponsor, and
--   * extends the tier list with bronze, a medical partner and a generic
--     event partner (on top of title/platinum/gold/silver/supporter).
-- Apply AFTER 0006_live_hub.sql. All statements are idempotent.

-- New tier values. `add value if not exists` is idempotent and safe to re-run.
-- The values are not used within this migration, so Postgres' "can't use a new
-- enum value in the same transaction" restriction does not apply here.
alter type sponsor_tier add value if not exists 'bronze';
alter type sponsor_tier add value if not exists 'medical';
alter type sponsor_tier add value if not exists 'partner';

-- Rich showcase fields on the sponsor entity (shared across every event it is
-- attached to via event_sponsors).
alter table sponsors add column if not exists description text;
alter table sponsors add column if not exists banner_path text;

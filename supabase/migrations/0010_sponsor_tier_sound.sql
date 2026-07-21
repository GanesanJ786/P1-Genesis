-- sponsors: add "sound" to the sponsor_tier enum ---------------------------
-- Same pattern as 0007_sponsor_showcase.sql's bronze/medical/partner
-- additions — a new tier for a sound/audio-equipment partner.
alter type sponsor_tier add value if not exists 'sound';

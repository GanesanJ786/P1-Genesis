-- events: schedule visibility toggle ---------------------------------------
-- Lets the owner hide the /live "Schedule" section entirely for an event
-- (e.g. if race times were never entered, a list full of "TBA" isn't
-- useful). Defaults to true so shipping this doesn't silently hide the
-- feature for events that already have it live.
alter table events add column if not exists show_schedule boolean not null default true;

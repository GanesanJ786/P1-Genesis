-- team_members: distinguish Leadership from Coaches on the public Team page -
-- Additive only — every existing row defaults to 'leadership', so today's
-- Team page (leadership-only) renders identically until an admin adds a
-- 'coach' row.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'team_member_type') then
    create type team_member_type as enum ('leadership', 'coach');
  end if;
end $$;

alter table team_members
  add column if not exists member_type team_member_type not null default 'leadership';

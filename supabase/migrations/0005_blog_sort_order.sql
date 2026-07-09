-- ============================================================================
-- Genesis — manual sort order for blog posts
-- Matches the sort_order convention already used by events/slides/team/sponsors,
-- so admins can pin/reorder posts instead of always being locked to published_at.
-- ============================================================================

alter table blog_posts
  add column if not exists sort_order integer not null default 0;

comment on column blog_posts.sort_order is
  'Manual display order (ascending) for the public blog list; ties break by published_at desc.';

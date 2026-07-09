-- ============================================================================
-- Genesis — blog cover image orientation
-- Lets the admin flag a post's cover image as landscape or portrait so the
-- public blog card/hero can pick a matching aspect ratio instead of always
-- cropping to 16:9 (which cuts off faces on tall phone photos).
-- ============================================================================

alter table blog_posts
  add column if not exists cover_image_orientation text not null default 'landscape'
    check (cover_image_orientation in ('landscape', 'portrait'));

comment on column blog_posts.cover_image_orientation is
  'How the cover image should be framed on the public site: landscape (16:9) or portrait (taller crop for phone photos).';

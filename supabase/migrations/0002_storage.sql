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

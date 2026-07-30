begin;

update storage.buckets
set file_size_limit = 2147483648
where id = 'trip-media';

alter table public.media
  drop constraint if exists media_file_size_by_type_check;

alter table public.media
  add constraint media_file_size_by_type_check
  check (
    (media_type = 'photo' and file_size <= 31457280)
    or
    (media_type = 'video' and file_size <= 2147483648)
  );

commit;

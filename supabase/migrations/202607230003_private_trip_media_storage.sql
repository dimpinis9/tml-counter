begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'trip-media',
  'trip-media',
  false,
  1073741824,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.media
  add constraint media_allowed_mime_type_check
  check (
    (media_type = 'photo' and mime_type in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ))
    or
    (media_type = 'video' and mime_type in (
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ))
  );

alter table public.media
  add constraint media_file_size_by_type_check
  check (
    (media_type = 'photo' and file_size <= 31457280)
    or
    (media_type = 'video' and file_size <= 1073741824)
  );

create or replace function public.trip_id_from_storage_path(object_name text)
returns uuid
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  folders text[] := storage.foldername(object_name);
begin
  if array_length(folders, 1) <> 4
    or folders[1] <> 'trips'
    or folders[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return null;
  end if;

  return folders[2]::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.is_valid_trip_media_path(object_name text)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  folders text[] := storage.foldername(object_name);
begin
  return array_length(folders, 1) = 4
    and folders[1] = 'trips'
    and folders[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and folders[3] = auth.uid()::text
    and folders[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(object_name) !~ '(^|/)\.\.(/|$)'
    and lower(storage.extension(object_name)) in (
      'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif',
      'mp4', 'mov', 'webm'
    );
end;
$$;

revoke all on function public.trip_id_from_storage_path(text) from public;
revoke all on function public.is_valid_trip_media_path(text) from public;
grant execute on function public.trip_id_from_storage_path(text) to authenticated;
grant execute on function public.is_valid_trip_media_path(text) to authenticated;

create policy "trip_media_insert_members"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-media'
  and public.is_valid_trip_media_path(name)
  and public.is_trip_member(public.trip_id_from_storage_path(name))
);

create policy "trip_media_select_members"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trip-media'
  and public.trip_id_from_storage_path(name) is not null
  and public.is_trip_member(public.trip_id_from_storage_path(name))
);

create policy "trip_media_update_uploader"
on storage.objects for update
to authenticated
using (
  bucket_id = 'trip-media'
  and owner_id = auth.uid()::text
  and public.is_valid_trip_media_path(name)
  and public.is_trip_member(public.trip_id_from_storage_path(name))
)
with check (
  bucket_id = 'trip-media'
  and owner_id = auth.uid()::text
  and public.is_valid_trip_media_path(name)
  and public.is_trip_member(public.trip_id_from_storage_path(name))
);

create policy "trip_media_delete_uploader"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-media'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[3] = auth.uid()::text
);

drop policy "media_insert_members" on public.media;

create policy "media_insert_members"
on public.media for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and uploaded_by = auth.uid()
  and storage_path =
    'trips/' || trip_id::text || '/' || uploaded_by::text || '/' ||
    id::text || '/' || storage.filename(storage_path)
  and storage.filename(storage_path) !~ '(^|/)\.\.(/|$)'
  and (
    album_id is null
    or exists (
      select 1
      from public.albums
      where albums.id = media.album_id
        and albums.trip_id = media.trip_id
    )
  )
);

commit;

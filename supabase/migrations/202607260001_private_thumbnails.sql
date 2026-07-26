alter table public.media
add column if not exists thumbnail_path text;

alter table public.media
add constraint media_thumbnail_path_safe
check (
  thumbnail_path is null
  or (
    thumbnail_path ~ '^trips/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/thumbnail\.webp$'
    and thumbnail_path not like '%..%'
  )
);

comment on column public.media.thumbnail_path is
  'Private browser-generated gallery thumbnail. The original remains untouched.';

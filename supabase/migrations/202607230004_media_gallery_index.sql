-- Supports filtered, ordered, paginated gallery queries without scanning all
-- media rows for a trip.
create index if not exists media_trip_type_created_id_idx
  on public.media (trip_id, media_type, created_at desc, id desc);

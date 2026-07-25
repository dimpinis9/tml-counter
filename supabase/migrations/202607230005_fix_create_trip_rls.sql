begin;

-- Creating a trip and its first owner membership is a bootstrap operation:
-- the caller cannot satisfy the trips membership SELECT policy until the
-- membership trigger has run. This narrowly scoped definer function performs
-- that atomic bootstrap while deriving created_by exclusively from auth.uid().
create or replace function public.create_trip(
  p_name text,
  p_description text default null,
  p_cover_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_trip_id uuid := gen_random_uuid();
  current_user_id uuid := auth.uid();
  normalized_name text := trim(p_name);
  normalized_description text := nullif(trim(p_description), '');
  normalized_cover_path text := nullif(trim(p_cover_path), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 120 then
    raise exception 'Chapter name must be between 1 and 120 characters';
  end if;

  insert into public.trips (
    id,
    name,
    description,
    cover_path,
    created_by
  )
  values (
    new_trip_id,
    normalized_name,
    normalized_description,
    normalized_cover_path,
    current_user_id
  );

  -- on_trip_created adds current_user_id as owner in the same transaction.
  return new_trip_id;
end;
$$;

revoke all on function public.create_trip(text, text, text) from public;
revoke all on function public.create_trip(text, text, text) from anon;
grant execute on function public.create_trip(text, text, text) to authenticated;

commit;

begin;

create or replace function public.create_trip(
  p_name text,
  p_description text default null,
  p_cover_path text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_trip_id uuid;
  current_user_id uuid := auth.uid();
  normalized_name text := trim(p_name);
  normalized_description text := nullif(trim(p_description), '');
  normalized_cover_path text := nullif(trim(p_cover_path), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(normalized_name) < 1 or char_length(normalized_name) > 120 then
    raise exception 'Trip name must be between 1 and 120 characters';
  end if;

  insert into public.trips (name, description, cover_path, created_by)
  values (
    normalized_name,
    normalized_description,
    normalized_cover_path,
    current_user_id
  )
  returning id into new_trip_id;

  -- The existing on_trip_created trigger adds the creator as owner. Both the
  -- insert and trigger run inside this statement's transaction.
  return new_trip_id;
end;
$$;

revoke all on function public.create_trip(text, text, text) from public;
grant execute on function public.create_trip(text, text, text) to authenticated;

drop policy "trip_members_delete_owner" on public.trip_members;

create policy "trip_members_delete_owner_except_self"
on public.trip_members for delete
to authenticated
using (
  public.is_trip_owner(trip_id)
  and user_id <> auth.uid()
);

commit;

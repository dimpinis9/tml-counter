create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
  central_trip_id constant uuid :=
    '0f745d53-3882-4368-8d05-bb7b7e41140f'::uuid;
begin
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if requested_name is null or char_length(requested_name) < 2 then
    requested_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if requested_name is null or char_length(requested_name) < 2 then
    requested_name := 'New member';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(requested_name, 80))
  on conflict (id) do nothing;

  insert into public.trip_members (trip_id, user_id, role)
  select central_trip_id, new.id, 'member'
  from public.trips
  where id = central_trip_id
  on conflict (trip_id, user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

insert into public.trip_members (trip_id, user_id, role)
select
  '0f745d53-3882-4368-8d05-bb7b7e41140f'::uuid,
  profiles.id,
  case
    when profiles.id = trips.created_by then 'owner'
    else 'member'
  end
from public.profiles
join public.trips
  on trips.id = '0f745d53-3882-4368-8d05-bb7b7e41140f'::uuid
on conflict (trip_id, user_id) do nothing;

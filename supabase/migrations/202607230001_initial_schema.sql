begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  cover_path text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  album_id uuid references public.albums(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null check (char_length(trim(storage_path)) > 0),
  original_filename text not null check (char_length(trim(original_filename)) > 0),
  mime_type text not null check (char_length(trim(mime_type)) > 0),
  media_type text not null check (media_type in ('photo', 'video')),
  file_size bigint not null check (file_size > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  invited_email text not null check (
    invited_email = lower(trim(invited_email))
    and invited_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  token text not null unique check (char_length(token) >= 32),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (accepted_at is null or accepted_at >= created_at)
);

create index trips_created_by_idx on public.trips(created_by);
create index trips_created_at_idx on public.trips(created_at desc);
create index trip_members_user_id_idx on public.trip_members(user_id, trip_id);
create index albums_trip_id_idx on public.albums(trip_id, created_at desc);
create index albums_created_by_idx on public.albums(created_by);
create index media_trip_id_created_at_idx on public.media(trip_id, created_at desc);
create index media_album_id_idx on public.media(album_id) where album_id is not null;
create index media_uploaded_by_idx on public.media(uploaded_by);
create index trip_invitations_trip_id_idx on public.trip_invitations(trip_id);
create index trip_invitations_email_idx on public.trip_invitations(invited_email);
create index trip_invitations_pending_idx
  on public.trip_invitations(trip_id, expires_at)
  where accepted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create or replace function public.prevent_trip_creator_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.created_by <> old.created_by then
    raise exception 'Trip creator cannot be changed';
  end if;
  return new;
end;
$$;

create trigger prevent_trip_creator_change
before update on public.trips
for each row execute function public.prevent_trip_creator_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if requested_name is null or char_length(requested_name) < 2 then
    requested_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if requested_name is null or char_length(requested_name) < 2 then
    requested_name := 'New member';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(requested_name, 80));

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_trip_member(
  target_trip_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = target_trip_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(
  target_trip_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = target_trip_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

revoke all on function public.is_trip_member(uuid) from public;
revoke all on function public.is_trip_owner(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;

create or replace function public.add_trip_creator_as_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
after insert on public.trips
for each row execute function public.add_trip_creator_as_owner();

revoke all on function public.handle_new_user() from public;
revoke all on function public.add_trip_creator_as_owner() from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.prevent_trip_creator_change() from public;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_members to authenticated;
grant select, insert, update, delete on public.albums to authenticated;
grant select, insert, update, delete on public.media to authenticated;
grant select, insert, update, delete on public.trip_invitations to authenticated;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.albums enable row level security;
alter table public.media enable row level security;
alter table public.trip_invitations enable row level security;

create policy "profiles_select_self_or_trip_members"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.trip_members own_membership
    join public.trip_members shared_membership
      on shared_membership.trip_id = own_membership.trip_id
    where own_membership.user_id = auth.uid()
      and shared_membership.user_id = profiles.id
  )
);

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "trips_select_members"
on public.trips for select
to authenticated
using (public.is_trip_member(id));

create policy "trips_insert_creator"
on public.trips for insert
to authenticated
with check (created_by = auth.uid());

create policy "trips_update_owner"
on public.trips for update
to authenticated
using (public.is_trip_owner(id))
with check (public.is_trip_owner(id));

create policy "trips_delete_owner"
on public.trips for delete
to authenticated
using (public.is_trip_owner(id));

create policy "trip_members_select_members"
on public.trip_members for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "trip_members_insert_owner"
on public.trip_members for insert
to authenticated
with check (public.is_trip_owner(trip_id));

create policy "trip_members_update_owner"
on public.trip_members for update
to authenticated
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

create policy "trip_members_delete_owner"
on public.trip_members for delete
to authenticated
using (public.is_trip_owner(trip_id));

create policy "albums_select_members"
on public.albums for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "albums_insert_members"
on public.albums for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and created_by = auth.uid()
);

create policy "albums_update_creator_or_owner"
on public.albums for update
to authenticated
using (created_by = auth.uid() or public.is_trip_owner(trip_id))
with check (
  public.is_trip_member(trip_id)
  and (created_by = auth.uid() or public.is_trip_owner(trip_id))
);

create policy "albums_delete_creator_or_owner"
on public.albums for delete
to authenticated
using (created_by = auth.uid() or public.is_trip_owner(trip_id));

create policy "media_select_members"
on public.media for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "media_insert_members"
on public.media for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and uploaded_by = auth.uid()
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

create policy "media_update_uploader"
on public.media for update
to authenticated
using (uploaded_by = auth.uid())
with check (
  uploaded_by = auth.uid()
  and public.is_trip_member(trip_id)
);

create policy "media_delete_uploader"
on public.media for delete
to authenticated
using (uploaded_by = auth.uid());

create policy "trip_invitations_select_owner"
on public.trip_invitations for select
to authenticated
using (public.is_trip_owner(trip_id));

create policy "trip_invitations_insert_owner"
on public.trip_invitations for insert
to authenticated
with check (
  public.is_trip_owner(trip_id)
  and invited_by = auth.uid()
);

create policy "trip_invitations_update_owner"
on public.trip_invitations for update
to authenticated
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

create policy "trip_invitations_delete_owner"
on public.trip_invitations for delete
to authenticated
using (public.is_trip_owner(trip_id));

commit;

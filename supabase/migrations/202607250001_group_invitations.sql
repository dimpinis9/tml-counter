begin;

-- Invitation tokens are shared in URLs. Store only their SHA-256 digest so a
-- database read cannot be used to join a private trip.
create or replace function public.accept_trip_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.trip_invitations%rowtype;
  current_user_id uuid := auth.uid();
  current_email text;
  token_digest text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_token is null or char_length(p_token) < 32 then
    raise exception 'Invalid invitation';
  end if;

  token_digest := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select *
  into invitation
  from public.trip_invitations
  where token = token_digest
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if invitation.accepted_at is not null then
    raise exception 'Invitation has already been used';
  end if;

  if invitation.expires_at <= now() then
    raise exception 'Invitation has expired';
  end if;

  select lower(email)
  into current_email
  from auth.users
  where id = current_user_id;

  if current_email is null or current_email <> invitation.invited_email then
    raise exception 'This invitation belongs to another email address';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (invitation.trip_id, current_user_id, 'member')
  on conflict (trip_id, user_id) do nothing;

  update public.trip_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.trip_id;
end;
$$;

revoke all on function public.accept_trip_invitation(text) from public;
revoke all on function public.accept_trip_invitation(text) from anon;
grant execute on function public.accept_trip_invitation(text) to authenticated;

create unique index if not exists trip_invitations_one_pending_email_idx
  on public.trip_invitations (trip_id, invited_email)
  where accepted_at is null;

commit;

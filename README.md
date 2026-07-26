# Keepsake

A private photo and video sharing space for small groups after trips and
events. Keepsake is a personal application, not a SaaS product.

## Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS and shadcn/ui conventions
- Supabase Auth, Postgres, and Row Level Security
- Zod, React Hook Form, and Lucide React
- Vitest for unit tests

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Add the values from **Supabase Dashboard → Project Settings → API**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED=false
   ```

4. Apply the migration as described below, then run:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is not currently used by the
browser. It is used only by the server-side chapter cleanup path so an owner can
remove all members' private Storage objects before deleting a chapter. Never
import it into Client Components or expose it with a `NEXT_PUBLIC_` prefix.

## Database migrations

The initial schema is in
`supabase/migrations/202607230001_initial_schema.sql`. It creates profiles,
trips, memberships, albums, media metadata, invitations, indexes, profile/trip
triggers, and all RLS policies.

Install or run the Supabase CLI, authenticate, link this directory to your
project, and push migrations:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

For a fully local Supabase stack:

```bash
npx supabase@latest start
npx supabase@latest db reset
```

`db reset` recreates the local database and reapplies every migration. Do not
run it against a production database.

## Supabase Auth configuration

In **Authentication → URL Configuration**, set:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`
- Production redirect URL: `https://YOUR_DOMAIN/auth/callback`

Supabase allows query strings on the callback, so the app uses:

- `/auth/callback?next=/trips` for email confirmation
- `/auth/callback?next=/reset-password` for password recovery

In **Authentication → Providers → Email**:

1. Enable the Email provider.
2. Keep email confirmation enabled for the normal production flow.
3. Configure an SMTP provider before production; Supabase's default mailer is
   intended only for limited development use.

The signup form sends `display_name` as Auth user metadata. The database
trigger `handle_new_user()` creates the matching `profiles` row automatically.

## Creating the first account

1. Apply the migration.
2. Start the app with `npm run dev`.
3. Visit `http://localhost:3000/signup`.
4. Enter a display name, email, and strong password.
5. Open the confirmation email and follow its link.
6. After the callback completes, sign in at `/login`.

If email confirmation is disabled for local development, signup immediately
creates a session and the account can be used without the email step.

## Authentication routes

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`
- `/auth/signout`

`/trips` and `/profile` are protected by both the Next.js proxy and the server
layout. Authentication checks use `getUser()` rather than trusting an
unverified local session.

## Row Level Security

RLS is enabled on every public table. Membership and owner checks use
`SECURITY DEFINER` functions with an empty `search_path`, preventing recursive
policies on `trip_members`.

At a high level:

- members can read their trips, memberships, albums, and media;
- only owners can change trip settings, memberships, and invitations;
- members can insert media only for their own user ID;
- only the uploader can update or delete their media;
- profiles are visible to the user and people sharing a trip with them.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Trip management

Authenticated users can now:

- view their RLS-filtered trips at `/trips`;
- create a trip at `/trips/new`;
- view its private detail page at `/trips/[tripId]`;
- manage settings and memberships at `/trips/[tripId]/settings` when they are
  the owner.

Trip creation uses the `create_trip` database RPC. The trip insert and the
existing `on_trip_created` owner-membership trigger run in the same PostgreSQL
transaction, so a trip cannot be created without its initial owner.

Owners can update trip details, remove other members, and delete the trip.
Authorization is checked in Server Actions and enforced again through RLS.
Owners cannot remove themselves, including through direct Data API calls.

Owners can create an email-bound invitation link from chapter settings. The
link expires after seven days, stores only a SHA-256 token digest, and can be
accepted once by an authenticated account with the matching email address.

Deleting a trip first removes all private Storage objects in bounded batches
through a server-only admin client, then cascades through dependent database
records. Deletion is blocked if Storage cleanup is not configured or fails.

## Private media storage

The `trip-media` Supabase Storage bucket is created by
`202607230003_private_trip_media_storage.sql`. It is always private and accepts:

- JPEG, PNG, WebP, HEIC, and HEIF photos up to 30 MB;
- MP4, MOV, and WebM videos up to 1 GB.

Objects use immutable UUID paths:

```text
trips/{tripId}/{userId}/{mediaId}/{sanitizedFilename}
```

Storage RLS validates every path segment. Upload and read access requires trip
membership, while deletion requires both Storage ownership and the uploader's
user-ID folder. The matching `media` insert policy independently verifies that
the database IDs and object path agree.

Uploads use Supabase's resumable TUS endpoint directly from the browser with
6 MB chunks. File bytes never pass through a Next.js route, Server Action, or
service-role client. After Storage succeeds, the browser inserts the media
metadata row. If that insert fails, it attempts to remove the orphaned object.

## Private gallery, viewer, and downloads

`/trips/[tripId]` loads media in pages of 24. Filtering and sorting happen in
Postgres, so the browser never downloads the complete media table. The gallery
supports All/Photos/Videos filters, newest/oldest sorting, multi-select,
sequential original downloads, a keyboard- and swipe-friendly viewer, and
uploader-only deletion.

Every preview, viewer, and download URL is short-lived and generated by a
Server Action only after a fresh user and trip-membership check. URLs are never
stored in Postgres, the service-role key is never sent to the browser, and no
public URL is created. Failed or expired URLs can be refreshed from the viewer.
Downloads use signed URLs with the Storage `download` disposition and retain a
sanitized original filename.

Deletion first verifies uploader ownership, then removes the Storage object,
then removes its database record. Storage and Postgres cannot share one
transaction. If the second operation fails, the UI reports the partial failure
and leaves the record available for a cleanup retry. Storage policies and
database RLS independently deny deletion by another member.

### Thumbnail transformations

Supabase Storage image transformations are available on paid plans. On a paid
project, enable them in **Storage → Settings** and set:

```env
SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED=true
```

Photo grid previews then use 640×640 transformed signed URLs. Video items use a
local placeholder until the viewer is opened. On the Free plan keep the value
`false`: the gallery deliberately displays private placeholders instead of
loading every full-resolution original. The active original is signed only
when the user opens it. When transformations are disabled, the gallery uses a
short-lived signed URL for the private original as a functional fallback. This
keeps shared media visible to every trip member, but uses more bandwidth than
optimized thumbnails. HEIC source transformations are supported by Supabase,
but browser rendering still depends on the transformed output and plan
availability.

### Supabase plan limit

The bucket ceiling is configured for 1 GB, but the Supabase project's global
Storage limit still applies. Free projects currently allow files only up to
50 MB. Supporting videos larger than 50 MB therefore requires a paid Supabase
plan and a matching global limit in **Storage → Settings**.

## Production smoke test

The disposable smoke test creates three verified users, exercises group
creation, invitation acceptance, RLS isolation, private upload, byte-identical
signed download, delete permissions, and complete cleanup:

```bash
npm run test:smoke
```

It requires a server-only `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. The test
uses unique `example.test` accounts and removes all users, objects, and database
records in a `finally` cleanup block.

import {
  ArrowLeft,
  CalendarDays,
  Images,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaGallery } from "@/components/media/media-gallery";
import { OwnerArchiveDownload } from "@/components/media/owner-archive-download";
import {
  MemberAvatars,
  type MemberAvatar,
} from "@/components/trips/member-avatars";
import { TripCover } from "@/components/trips/trip-cover";
import { MediaUploadDialog } from "@/components/upload/media-upload-dialog";
import { Button } from "@/components/ui/button";
import { getMediaPage } from "@/features/media/data";
import { createClient } from "@/lib/supabase/server";

type TripRow = {
  id: string;
  name: string;
  description: string | null;
  cover_path: string | null;
  created_at: string;
};

type MemberRow = {
  user_id: string;
  role: "owner" | "member";
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ upload?: string }>;
}) {
  const { tripId } = await params;
  const { upload } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [tripResult, membersResult, galleryResult] = await Promise.all([
    supabase
      .from("trips")
      .select("id, name, description, cover_path, created_at")
      .eq("id", tripId)
      .maybeSingle<TripRow>(),
    supabase
      .from("trip_members")
      .select(
        "user_id, role, profiles!trip_members_user_id_fkey(display_name, avatar_url)",
      )
      .eq("trip_id", tripId)
      .order("joined_at", { ascending: true })
      .returns<MemberRow[]>(),
    getMediaPage({ tripId }),
  ]);

  const trip = tripResult.data;
  if (!trip) {
    notFound();
  }

  const members: MemberAvatar[] = (membersResult.data ?? []).map((member) => ({
    userId: member.user_id,
    displayName: member.profiles?.display_name ?? "Trip member",
    avatarUrl: member.profiles?.avatar_url ?? null,
  }));
  const currentMembership = (membersResult.data ?? []).find(
    (member) => member.user_id === user.id,
  );
  const isOwner = currentMembership?.role === "owner";
  if (!galleryResult.success) {
    notFound();
  }
  const mediaCount = galleryResult.data.total;

  return (
    <section className="mx-auto max-w-7xl px-3 pb-[max(5rem,env(safe-area-inset-bottom))] pt-5 min-[360px]:px-4 sm:px-8 sm:pt-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          href="/trips"
        >
          <ArrowLeft className="size-4" /> All chapters
        </Link>
        {isOwner && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/trips/${trip.id}/settings`}>
              <Settings className="size-4" /> Settings
            </Link>
          </Button>
        )}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-card sm:mt-8 sm:rounded-[2.5rem]">
        <TripCover
          className={
            isOwner
              ? "h-[18rem] min-[390px]:h-[21rem] sm:h-[30rem]"
              : "h-44 sm:h-64"
          }
          cover={trip.cover_path}
          label={new Intl.DateTimeFormat("en", {
            month: "long",
            year: "numeric",
          }).format(new Date(trip.created_at))}
        />
        <div className="relative -mt-24 p-5 text-white sm:-mt-28 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[.24em] text-white/70">
            Tomorrowland Belgium · Private chapter
          </p>
          <h1 className="mt-2 max-w-4xl break-words font-display text-[clamp(2.8rem,14vw,5rem)] leading-[.86] sm:text-8xl">
            {trip.name}
          </h1>
        </div>
      </div>

      {isOwner && (
      <div className="grid gap-7 py-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {trip.description || "This chapter is still waiting for its first words."}
          </p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              Created{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                new Date(trip.created_at),
              )}
            </span>
            <span className="flex items-center gap-2">
              <Images className="size-4 text-primary" /> {mediaCount} memories
            </span>
          </div>
        </div>
        <div>
          <MemberAvatars members={members} />
          <p className="mt-2 text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </div>
      )}

      <div className={isOwner ? "" : "pt-7"}>
        <div className="mb-5 flex flex-col items-start justify-between gap-4 min-[390px]:flex-row min-[390px]:items-end sm:mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.2em] text-primary">
              {isOwner ? "The memories within" : `${mediaCount} shared memories`}
            </p>
            <h2 className="mt-1 font-display text-4xl">
              {isOwner ? "Book of Memories" : "Photos & videos"}
            </h2>
          </div>
          <div className="flex w-full flex-col gap-2 min-[390px]:w-auto sm:flex-row">
            {isOwner && (
              <OwnerArchiveDownload
                mediaCount={mediaCount}
                tripId={trip.id}
              />
            )}
            <MediaUploadDialog
              autoOpen={!isOwner && upload === "1"}
              tripId={trip.id}
              userId={user.id}
            />
          </div>
        </div>
        <MediaGallery
          currentUserId={user.id}
          initialPage={galleryResult.data}
          simple={!isOwner}
          tripId={trip.id}
        />
      </div>
    </section>
  );
}

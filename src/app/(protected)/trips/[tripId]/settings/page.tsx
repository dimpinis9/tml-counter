import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  TripSettingsForm,
  type SettingsMember,
} from "@/components/trips/trip-settings-form";
import { createClient } from "@/lib/supabase/server";
import type { CoverPlaceholder } from "@/lib/validation/trips";

type TripRow = {
  id: string;
  name: string;
  description: string | null;
  cover_path: string | null;
};

type MemberRow = {
  user_id: string;
  role: "owner" | "member";
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const validCovers = new Set(["sunset", "sea", "forest", "night"]);

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const [tripResult, membershipResult, membersResult] = await Promise.all([
    supabase
      .from("trips")
      .select("id, name, description, cover_path")
      .eq("id", tripId)
      .maybeSingle<TripRow>(),
    supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .maybeSingle<{ role: "owner" | "member" }>(),
    supabase
      .from("trip_members")
      .select(
        "user_id, role, profiles!trip_members_user_id_fkey(display_name, avatar_url)",
      )
      .eq("trip_id", tripId)
      .order("joined_at", { ascending: true })
      .returns<MemberRow[]>(),
  ]);

  if (!tripResult.data || membershipResult.data?.role !== "owner") {
    notFound();
  }

  const trip = tripResult.data;
  const members: SettingsMember[] = (membersResult.data ?? []).map((member) => ({
    userId: member.user_id,
    displayName: member.profiles?.display_name ?? "Trip member",
    avatarUrl: member.profiles?.avatar_url ?? null,
    role: member.role,
  }));
  const coverPlaceholder: CoverPlaceholder =
    trip.cover_path && validCovers.has(trip.cover_path)
      ? (trip.cover_path as CoverPlaceholder)
      : "sunset";

  return (
    <section className="mx-auto max-w-4xl px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-8">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href={`/trips/${trip.id}`}
      >
        <ArrowLeft className="size-4" /> Back to chapter
      </Link>
      <div className="mb-10 mt-8">
        <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
          Owner controls
        </p>
        <h1 className="mt-2 font-display text-[clamp(3rem,15vw,4rem)] leading-[.92]">
          Chapter settings
        </h1>
        <p className="mt-2 break-words text-muted-foreground">{trip.name}</p>
      </div>
      <TripSettingsForm
        currentUserId={user.id}
        initialValues={{
          name: trip.name,
          description: trip.description ?? "",
          coverPlaceholder,
        }}
        members={members}
        tripId={trip.id}
        tripName={trip.name}
      />
    </section>
  );
}

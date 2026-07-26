import type { Metadata } from "next";
import { Compass, Plus } from "lucide-react";
import Link from "next/link";

import { StagePortal } from "@/components/tomorrowland/stage-portal";
import { TripCard } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { TripSummary } from "@/types";

export const metadata: Metadata = { title: "Your chapters" };

type CountRelation = { count: number };
type TripRow = {
  id: string;
  name: string;
  description: string | null;
  cover_path: string | null;
  created_at: string;
  trip_members: CountRelation[];
  media: CountRelation[];
};

export default async function TripsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [tripsResult, membershipsResult] = await Promise.all([
    supabase
      .from("trips")
      .select(
        "id, name, description, cover_path, created_at, trip_members(count), media(count)",
      )
      .order("created_at", { ascending: false })
      .returns<TripRow[]>(),
    supabase
      .from("trip_members")
      .select("trip_id, role")
      .eq("user_id", user?.id ?? ""),
  ]);
  const { data, error } = tripsResult;
  const isOwner = (membershipsResult.data ?? []).some(
    (membership) => membership.role === "owner",
  );

  const trips: TripSummary[] = (data ?? []).map((trip) => ({
    id: trip.id,
    title: trip.name,
    description: trip.description,
    coverPath: trip.cover_path,
    dateLabel: new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(new Date(trip.created_at)),
    mediaCount: trip.media[0]?.count ?? 0,
    memberCount: trip.trip_members[0]?.count ?? 0,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pt-12">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
            {isOwner ? "Your Book of Memories" : "Your private gallery"}
          </p>
          <h1 className="mt-2 font-display text-[clamp(3.4rem,17vw,4.5rem)] leading-[.9]">
            {isOwner ? "Festival chapters" : "Shared memories"}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {isOwner
              ? "Every stage, every sunrise and every friendship—kept between the people who were there."
              : "Choose your group, then upload or download the moments you shared."}
          </p>
        </div>
        {isOwner && (
          <Button asChild>
            <Link href="/trips/new">
              <Plus className="size-4" /> New chapter
            </Link>
          </Button>
        )}
      </div>

      {isOwner && (
        <div className="mt-10">
          <StagePortal compact />
        </div>
      )}

      {error && (
        <p className="mt-10 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          We could not open your chapters. Please try again.
        </p>
      )}

      {!error && trips.length === 0 && (
        <div className="mt-12 rounded-[2rem] border border-dashed border-border px-6 py-20 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10">
            <Compass className="size-6 text-primary" />
          </span>
          <h2 className="mt-5 font-display text-4xl">
            {isOwner ? "The book is waiting." : "No shared group yet."}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {isOwner
              ? "Begin with a Tomorrowland weekend, a stage, or the name your group gave the adventure."
              : "Ask the group owner to add you, then your shared photos will appear here."}
          </p>
          {isOwner && (
            <Button asChild className="mt-6">
              <Link href="/trips/new">Write the first chapter</Link>
            </Button>
          )}
        </div>
      )}

      {trips.length > 0 && (
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  );
}

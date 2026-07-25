import { ArrowUpRight, Images, Users } from "lucide-react";
import Link from "next/link";

import { TripCover } from "@/components/trips/trip-cover";
import type { TripSummary } from "@/types";

export function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link
      className="group overflow-hidden rounded-[2rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/5"
      href={`/trips/${trip.id}`}
    >
      <TripCover className="h-44" cover={trip.coverPath} label={trip.dateLabel} />
      <div className="relative p-6">
        <span className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-border bg-background/60 transition group-hover:rotate-45">
          <ArrowUpRight className="size-4" />
        </span>
        <h2 className="pr-12 font-display text-3xl leading-none">{trip.title}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {trip.description || "A private festival chapter waiting to be filled."}
        </p>
        <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" /> {trip.mediaCount} memories
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" /> {trip.memberCount} people
          </span>
        </div>
      </div>
    </Link>
  );
}

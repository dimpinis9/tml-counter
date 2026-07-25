import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { TripForm } from "@/components/trips/trip-form";

export const metadata: Metadata = { title: "Create a chapter" };

export default function NewTripPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pt-10">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href="/trips"
      >
        <ArrowLeft className="size-4" /> Back to the book
      </Link>
      <div className="mt-10 grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
            The next festival chapter
          </p>
          <h1 className="mt-3 font-display text-[clamp(3rem,15vw,4rem)] leading-[.9]">
            Write a new chapter.
          </h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Name your Tomorrowland chapter now. Your people, photos and videos
            can join when you are ready.
          </p>
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl shadow-foreground/5 sm:p-8">
          <TripForm />
        </div>
      </div>
    </section>
  );
}

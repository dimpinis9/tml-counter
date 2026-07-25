import { Skeleton } from "@/components/ui/skeleton";

export default function TripsLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-16 w-full max-w-xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-md" />
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            className="overflow-hidden rounded-[2rem] border border-border bg-card"
            key={item}
          >
            <Skeleton className="h-44 rounded-none" />
            <div className="space-y-3 p-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

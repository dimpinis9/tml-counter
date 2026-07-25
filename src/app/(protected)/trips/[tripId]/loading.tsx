import { Skeleton } from "@/components/ui/skeleton";

export default function TripGalleryLoading() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-20 pt-5 min-[360px]:px-4 sm:px-8 sm:pt-8">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <Skeleton className="mt-6 h-[18rem] rounded-[1.75rem] min-[390px]:h-[21rem] sm:mt-8 sm:h-[30rem] sm:rounded-[2.5rem]" />
      <div className="my-10 flex items-end justify-between">
        <div className="space-y-3">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-5 w-52" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2 min-[390px]:gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton
            className="aspect-[4/5] rounded-2xl"
            key={`trip-loading-${index}`}
          />
        ))}
      </div>
    </section>
  );
}

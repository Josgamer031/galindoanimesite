export function CardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[2/3] skeleton rounded-lg" />
      <div className="pt-2.5 space-y-1.5">
        <div className="h-3.5 skeleton rounded w-4/5" />
        <div className="h-3 skeleton rounded w-2/5" />
      </div>
    </div>
  );
}

export function EpisodeSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-video skeleton rounded-lg" />
      <div className="pt-2 space-y-1.5">
        <div className="h-3.5 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[75vh] min-h-[500px] skeleton">
      <div className="absolute bottom-16 left-8 lg:left-16 space-y-4">
        <div className="h-4 w-24 skeleton rounded" />
        <div className="h-10 w-80 skeleton rounded" />
        <div className="h-4 w-96 skeleton rounded" />
        <div className="h-4 w-72 skeleton rounded" />
        <div className="flex gap-3 mt-4">
          <div className="h-11 w-36 skeleton rounded-full" />
          <div className="h-11 w-32 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-20">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 mx-auto lg:mx-0">
          <div className="aspect-[2/3] skeleton rounded-xl w-56" />
        </div>
        <div className="flex-1 space-y-4 pt-4">
          <div className="h-8 skeleton rounded w-2/3" />
          <div className="h-4 skeleton rounded w-1/4" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-7 w-16 skeleton rounded-full" />
            ))}
          </div>
          <div className="space-y-2 mt-6">
            <div className="h-4 skeleton rounded w-full" />
            <div className="h-4 skeleton rounded w-full" />
            <div className="h-4 skeleton rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-60 animate-pulse rounded-[2rem] bg-slate-200/80 dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/10" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export function InlineSkeleton() {
  return <div className="h-24 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/10" />;
}

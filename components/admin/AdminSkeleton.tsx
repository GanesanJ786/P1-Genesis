/**
 * Lightweight skeleton primitives for admin `loading.tsx` fallbacks. Kept static
 * so Next.js can prefetch them — a tab click shows these instantly while the
 * dynamic (cookie-authed) page streams in behind them.
 */

/** A single shimmering block. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

/** Card placeholder matching the slides/sponsors/team grid tiles. */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
      <SkeletonBlock className="h-36 rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Grid of card placeholders. */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Table placeholder matching the events list. */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="bg-white/5 px-5 py-3">
        <SkeletonBlock className="h-3 w-24" />
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-t border-white/5 px-5 py-4"
          >
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-6 w-16" />
            <SkeletonBlock className="h-7 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

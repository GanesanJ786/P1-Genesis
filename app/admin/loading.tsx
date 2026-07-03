import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonBlock } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader title="Dashboard" subtitle="Welcome back." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-ink-soft p-6"
          >
            <SkeletonBlock className="h-6 w-6" />
            <SkeletonBlock className="mt-4 h-10 w-16" />
            <SkeletonBlock className="mt-2 h-4 w-24" />
            <SkeletonBlock className="mt-1 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft p-6">
        <SkeletonBlock className="h-5 w-40" />
        <div className="mt-4 flex flex-wrap gap-3">
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

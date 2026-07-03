import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonBlock } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Site Content"
        subtitle="Edit headline copy used across the public site. Changes publish immediately."
      />
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

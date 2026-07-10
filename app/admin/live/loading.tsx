import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonTable } from "@/components/admin/AdminSkeleton";

export default function AdminLiveLoading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Live Hub"
        subtitle="Schedule, statuses, results and announcements for live-tracked events."
      />
      <SkeletonTable rows={8} />
    </div>
  );
}

import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonTable } from "@/components/admin/AdminSkeleton";

export default function AdminLiveLoading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Live Results"
        subtitle="Real-time results synced from Google Sheets."
      />
      <SkeletonTable rows={8} />
    </div>
  );
}

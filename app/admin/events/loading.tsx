import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonTable } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Events"
        subtitle="Create and manage event details shown on the public site."
        action={{ href: "/admin/events/new", label: "New event" }}
      />
      <SkeletonTable />
    </div>
  );
}

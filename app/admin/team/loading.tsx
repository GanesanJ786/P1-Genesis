import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonCardGrid } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Team"
        subtitle="Manage leadership members shown on the Team page."
        action={{ href: "/admin/team/new", label: "New member" }}
      />
      <SkeletonCardGrid />
    </div>
  );
}

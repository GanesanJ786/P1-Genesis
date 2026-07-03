import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonCardGrid } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Sponsors"
        subtitle="Manage partner logos and tiers shown on the site."
        action={{ href: "/admin/sponsors/new", label: "New sponsor" }}
      />
      <SkeletonCardGrid />
    </div>
  );
}

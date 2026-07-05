import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonTable } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Blog"
        subtitle="Publish news, results, and stories for the foundation."
        action={{ href: "/admin/blog/new", label: "New post" }}
      />
      <SkeletonTable />
    </div>
  );
}

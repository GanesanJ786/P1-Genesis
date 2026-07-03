import { AdminHeader } from "@/components/admin/AdminHeader";
import { SkeletonCardGrid } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <AdminHeader
        title="Slides"
        subtitle="Upload and order images for the homepage hero and event carousels."
        action={{ href: "/admin/slides/new", label: "New slide" }}
      />
      <SkeletonCardGrid />
    </div>
  );
}

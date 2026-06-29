import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SlideForm } from "@/components/admin/SlideForm";

export default async function NewSlidePage() {
  await requireAdmin();
  return (
    <div className="p-8">
      <AdminHeader title="New Slide" subtitle="Add an image to a carousel." />
      <SlideForm />
    </div>
  );
}

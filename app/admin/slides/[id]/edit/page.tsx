import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSlide } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SlideForm } from "@/components/admin/SlideForm";

export default async function EditSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const slide = await getSlide(id);
  if (!slide) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Slide" subtitle={slide.title ?? "Slide"} />
      <SlideForm slide={slide} />
    </div>
  );
}

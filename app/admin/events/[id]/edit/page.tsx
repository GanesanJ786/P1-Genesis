import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getEvent } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventForm } from "@/components/admin/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Event" subtitle={event.title} />
      <EventForm event={event} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getEvent, listSponsors, listEventSponsorIds } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventForm } from "@/components/admin/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [event, sponsors, sponsorIds] = await Promise.all([
    getEvent(id),
    listSponsors(),
    listEventSponsorIds(id),
  ]);
  if (!event) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Event" subtitle={event.title} />
      <EventForm
        event={event}
        sponsors={sponsors.filter((s) => s.is_active)}
        sponsorIds={sponsorIds}
      />
    </div>
  );
}

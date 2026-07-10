import { requireAdmin } from "@/lib/auth";
import { listSponsors } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventForm } from "@/components/admin/EventForm";

export default async function NewEventPage() {
  await requireAdmin();
  const sponsors = (await listSponsors()).filter((s) => s.is_active);
  return (
    <div className="p-8">
      <AdminHeader title="New Event" subtitle="Add an event to the public programme." />
      <EventForm sponsors={sponsors} />
    </div>
  );
}

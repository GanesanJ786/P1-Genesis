import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventForm } from "@/components/admin/EventForm";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div className="p-8">
      <AdminHeader title="New Event" subtitle="Add an event to the public programme." />
      <EventForm />
    </div>
  );
}

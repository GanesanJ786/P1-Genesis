import { requireAdmin } from "@/lib/auth";
import { listLiveTrackedEvents } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { LiveItemForm } from "@/components/admin/LiveItemForm";

export default async function NewLiveItemPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  await requireAdmin();
  const { event } = await searchParams;
  const events = await listLiveTrackedEvents();

  return (
    <div className="p-8">
      <AdminHeader
        title="New Schedule Item"
        subtitle="A race or field event in the live programme."
      />
      <LiveItemForm events={events} defaultEventId={event} />
    </div>
  );
}

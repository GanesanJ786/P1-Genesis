import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLiveItem, listLiveTrackedEvents } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { LiveItemForm } from "@/components/admin/LiveItemForm";

export default async function EditLiveItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [item, events] = await Promise.all([
    getLiveItem(id),
    listLiveTrackedEvents(),
  ]);
  if (!item) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Schedule Item" subtitle={item.event_name} />
      <LiveItemForm item={item} events={events} />
    </div>
  );
}

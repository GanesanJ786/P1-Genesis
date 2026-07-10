import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getSponsor,
  listLiveEventOptions,
  listSponsorEventIds,
} from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SponsorForm } from "@/components/admin/SponsorForm";

export default async function EditSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [sponsor, events, selectedEventIds] = await Promise.all([
    getSponsor(id),
    listLiveEventOptions(),
    listSponsorEventIds(id),
  ]);
  if (!sponsor) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Sponsor" subtitle={sponsor.name} />
      <SponsorForm
        sponsor={sponsor}
        events={events}
        selectedEventIds={selectedEventIds}
      />
    </div>
  );
}

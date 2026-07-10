import { requireAdmin } from "@/lib/auth";
import { listLiveEventOptions } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SponsorForm } from "@/components/admin/SponsorForm";

export default async function NewSponsorPage() {
  await requireAdmin();
  const events = await listLiveEventOptions();
  return (
    <div className="p-8">
      <AdminHeader title="New Sponsor" subtitle="Add a partner to the site." />
      <SponsorForm events={events} />
    </div>
  );
}

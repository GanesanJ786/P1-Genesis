import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TeamForm } from "@/components/admin/TeamForm";

export default async function NewTeamMemberPage() {
  await requireAdmin();
  return (
    <div className="p-8">
      <AdminHeader title="New Team Member" subtitle="Add a leadership member." />
      <TeamForm />
    </div>
  );
}

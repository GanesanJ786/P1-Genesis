import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getTeamMember } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TeamForm } from "@/components/admin/TeamForm";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const member = await getTeamMember(id);
  if (!member) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Team Member" subtitle={member.name} />
      <TeamForm member={member} />
    </div>
  );
}

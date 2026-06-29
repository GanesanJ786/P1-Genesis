import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listTeam } from "@/lib/admin-queries";
import { deleteTeamMember } from "@/lib/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminTeamPage() {
  await requireAdmin();
  const team = await listTeam();

  return (
    <div className="p-8">
      <AdminHeader
        title="Team"
        subtitle="Manage leadership members shown on the Team page."
        action={{ href: "/admin/team/new", label: "New member" }}
      />

      {team.length === 0 ? (
        <p className="text-sand">No team members yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-sand">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Active</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="px-5 py-4 font-medium text-cream">{m.name}</td>
                  <td className="px-5 py-4 text-sand">{m.role_title || "—"}</td>
                  <td className="px-5 py-4 text-sand">{m.is_active ? "Yes" : "No"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/team/${m.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand hover:border-ember/50 hover:text-ember"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                      <DeleteButton action={deleteTeamMember.bind(null, m.id, m.photo_path)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

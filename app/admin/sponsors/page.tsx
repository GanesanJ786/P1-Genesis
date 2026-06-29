import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listSponsors } from "@/lib/admin-queries";
import { deleteSponsor } from "@/lib/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatINR } from "@/lib/utils";

export default async function AdminSponsorsPage() {
  await requireAdmin();
  const sponsors = await listSponsors();

  return (
    <div className="p-8">
      <AdminHeader
        title="Sponsors"
        subtitle="Manage partner logos and tiers shown on the site."
        action={{ href: "/admin/sponsors/new", label: "New sponsor" }}
      />

      {sponsors.length === 0 ? (
        <p className="text-sand">No sponsors yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-sand">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Active</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-5 py-4 font-medium text-cream">{s.name}</td>
                  <td className="px-5 py-4 capitalize text-sand">{s.tier}</td>
                  <td className="px-5 py-4 text-sand">{formatINR(s.amount_inr) || "—"}</td>
                  <td className="px-5 py-4 text-sand">{s.is_active ? "Yes" : "No"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/sponsors/${s.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand hover:border-ember/50 hover:text-ember"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                      <DeleteButton action={deleteSponsor.bind(null, s.id, s.logo_path)} />
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

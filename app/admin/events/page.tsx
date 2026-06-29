import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listEvents } from "@/lib/admin-queries";
import { deleteEvent } from "@/lib/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatDateRange } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-500/15 text-green-400",
  draft: "bg-yellow-500/15 text-yellow-400",
  archived: "bg-white/10 text-sand",
};

export default async function AdminEventsPage() {
  await requireAdmin();
  const events = await listEvents();

  return (
    <div className="p-8">
      <AdminHeader
        title="Events"
        subtitle="Create and manage event details shown on the public site."
        action={{ href: "/admin/events/new", label: "New event" }}
      />

      {events.length === 0 ? (
        <p className="text-sand">No events yet. Create your first one.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-sand">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <td className="px-5 py-4">
                    <p className="font-medium text-cream">{e.title}</p>
                    <p className="text-xs text-sand">/{e.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-sand">
                    {formatDateRange(e.start_date, e.end_date) || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_STYLES[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${e.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand hover:border-ember/50 hover:text-ember"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                      <DeleteButton action={deleteEvent.bind(null, e.id, e.cover_image)} />
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

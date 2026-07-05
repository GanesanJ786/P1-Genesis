import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { clearLiveResults } from "@/lib/actions/admin";

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-white/10 text-sand",
  in_progress: "bg-amber-500/20 text-amber-400",
  completed: "bg-green-500/15 text-green-400",
};

export default async function AdminLivePage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("live_results")
    .select("*")
    .order("day", { ascending: true })
    .order("sort_order", { ascending: true });

  const results = rows ?? [];

  return (
    <div className="p-8">
      <AdminHeader
        title="Live Results"
        subtitle="Real-time results synced from Google Sheets."
      />

      {/* Info panel */}
      <div className="mb-6 rounded-2xl border border-ember/20 bg-ember/5 p-5 text-sm text-sand">
        <p className="font-semibold text-cream">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Open the shared Google Sheet and update event rows.</li>
          <li>The Apps Script fires automatically on each edit.</li>
          <li>This page and the public <code className="text-ember">/live</code> page update within seconds.</li>
        </ol>
        <p className="mt-3 text-sand/70">
          Use <strong className="text-sand">Clear all results</strong> before each event day to start fresh.
        </p>
      </div>

      {/* Clear action */}
      <form action={clearLiveResults} className="mb-8">
        <button
          type="submit"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          Clear all results
        </button>
      </form>

      {/* Results table */}
      {results.length === 0 ? (
        <p className="text-sand">No live results yet. Update the Google Sheet to populate this page.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-sand">
              <tr>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Day</th>
                <th className="px-5 py-3 font-medium">Heat</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Finishers</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-5 py-4">
                    <p className="font-medium text-cream">{r.event_name}</p>
                    <p className="text-xs text-sand">{r.event_key}</p>
                  </td>
                  <td className="px-5 py-4 text-sand">Day {r.day}</td>
                  <td className="px-5 py-4 text-sand">{r.heat_label ?? "Final"}</td>
                  <td className="px-5 py-4 text-sand">{r.category}{r.gender ? ` · ${r.gender}` : ""}</td>
                  <td className="px-5 py-4 text-sand">
                    {Array.isArray(r.results) ? r.results.length : 0}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] ?? STATUS_STYLES.upcoming}`}>
                      {r.status === "in_progress" ? "Live" : r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sand">
                    {new Date(r.updated_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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

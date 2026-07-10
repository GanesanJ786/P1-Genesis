import Link from "next/link";
import { Pencil, Pin } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  listLiveTrackedEvents,
  listLiveItems,
  listAnnouncements,
  countUnassignedLiveItems,
} from "@/lib/admin-queries";
import {
  clearLiveResults,
  adoptUnassignedLiveItems,
  deleteLiveItem,
  deleteAnnouncement,
  toggleAnnouncementPinned,
} from "@/lib/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { LiveStatusButtons } from "@/components/admin/LiveStatusButtons";
import { AnnouncementComposer } from "@/components/admin/AnnouncementComposer";
import { ANNOUNCEMENT_TYPES, formatScheduledTime, relativeTime } from "@/lib/live";

export default async function AdminLivePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  await requireAdmin();
  const { event: eventParam } = await searchParams;

  const [events, unassigned] = await Promise.all([
    listLiveTrackedEvents(),
    countUnassignedLiveItems(),
  ]);
  const selected = events.find((e) => e.id === eventParam) ?? events[0] ?? null;

  const [items, announcements] = selected
    ? await Promise.all([
        listLiveItems(selected.id),
        listAnnouncements(selected.id),
      ])
    : [[], []];

  return (
    <div className="p-8">
      <AdminHeader
        title="Live Hub"
        subtitle="Schedule, statuses, results and announcements for live-tracked events."
        action={
          selected
            ? { href: `/admin/live/new?event=${selected.id}`, label: "Schedule item" }
            : undefined
        }
      />

      {events.length === 0 ? (
        <div className="rounded-2xl border border-ember/20 bg-ember/5 p-6 text-sm text-sand">
          <p className="font-semibold text-cream">No live-tracked events yet</p>
          <p className="mt-2">
            Enable <strong className="text-sand">“Show in Live Hub”</strong> on an
            event to manage its live schedule here.{" "}
            <Link href="/admin/events" className="text-ember hover:text-ember-bright">
              Go to Events →
            </Link>
          </p>
          {unassigned > 0 ? (
            <p className="mt-2 text-sand/70">
              {unassigned} existing result row{unassigned === 1 ? "" : "s"} will be
              adoptable once an event is live-tracked.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {/* Event selector */}
          {events.length > 1 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {events.map((e) => (
                <Link
                  key={e.id}
                  href={`/admin/live?event=${e.id}`}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    selected?.id === e.id
                      ? "bg-ember text-white"
                      : "bg-white/5 text-sand hover:text-cream"
                  }`}
                >
                  {e.title}
                </Link>
              ))}
            </div>
          ) : null}

          {selected ? (
            <>
              {/* Announcements */}
              <section className="mb-8 rounded-2xl border border-white/10 p-5">
                <h2 className="mb-4 font-display text-lg uppercase text-cream">
                  Announcements
                </h2>
                <AnnouncementComposer eventId={selected.id} />
                {announcements.length > 0 ? (
                  <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
                    {announcements.map((a) => {
                      const type = ANNOUNCEMENT_TYPES[a.type] ?? ANNOUNCEMENT_TYPES.info;
                      return (
                        <li key={a.id} className="flex items-start gap-3 text-sm">
                          <span
                            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${type.style}`}
                          >
                            {type.label}
                          </span>
                          <p className="min-w-0 flex-1 text-cream">{a.message}</p>
                          <span className="shrink-0 text-xs text-sand/60">
                            {relativeTime(a.created_at)}
                          </span>
                          <form
                            action={toggleAnnouncementPinned.bind(
                              null,
                              a.id,
                              !a.is_pinned,
                            )}
                          >
                            <button
                              type="submit"
                              aria-label={a.is_pinned ? "Unpin" : "Pin to top"}
                              className={`rounded-md border border-white/10 p-1.5 transition-colors hover:border-ember/50 ${
                                a.is_pinned ? "text-ember" : "text-sand/50"
                              }`}
                            >
                              <Pin size={13} />
                            </button>
                          </form>
                          <DeleteButton action={deleteAnnouncement.bind(null, a.id)} />
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>

              {/* Schedule table */}
              {items.length === 0 ? (
                <p className="mb-8 text-sand">
                  No schedule items yet. Add one above, or update the Google Sheet.
                </p>
              ) : (
                <div className="mb-8 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-sand">
                      <tr>
                        <th className="px-5 py-3 font-medium">Event</th>
                        <th className="px-5 py-3 font-medium">Day · Time</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Finishers</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.id} className="border-t border-white/5">
                          <td className="px-5 py-4">
                            <p className="font-medium text-cream">{r.event_name}</p>
                            <p className="text-xs text-sand">
                              {[r.heat_label, r.venue].filter(Boolean).join(" · ") ||
                                r.event_key}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sand">
                            Day {r.day}
                            {r.scheduled_at ? (
                              <p className="text-xs text-sand/70">
                                {formatScheduledTime(r.scheduled_at)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 text-sand">
                            {r.category}
                            {r.gender ? ` · ${r.gender}` : ""}
                          </td>
                          <td className="px-5 py-4 text-sand">
                            {Array.isArray(r.results) ? r.results.length : 0}
                          </td>
                          <td className="px-5 py-4">
                            <LiveStatusButtons id={r.id} current={r.status} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/live/${r.id}/edit`}
                                aria-label="Edit"
                                className="inline-flex items-center rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand transition-colors hover:border-ember/50 hover:text-ember-bright"
                              >
                                <Pencil size={13} />
                              </Link>
                              <DeleteButton action={deleteLiveItem.bind(null, r.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Info panel */}
              <div className="mb-8 rounded-2xl border border-ember/20 bg-ember/5 p-5 text-sm text-sand">
                <p className="font-semibold text-cream">How updates flow</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>
                    The Google Sheet remains the fast path for results — the Apps
                    Script pushes edits here within seconds.
                  </li>
                  <li>
                    Everything is also editable above: statuses (one tap), results,
                    schedule metadata and announcements.
                  </li>
                  <li>
                    For rows that exist in the sheet (same event key), the{" "}
                    <strong className="text-sand">sheet wins</strong> on status &
                    results at its next edit — fix mistakes in the sheet, not just
                    here.
                  </li>
                </ol>
              </div>

              {/* Danger zone */}
              <div className="flex flex-wrap gap-3">
                {unassigned > 0 ? (
                  <form action={adoptUnassignedLiveItems.bind(null, selected.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-400 transition-colors hover:bg-sky-500/20"
                    >
                      Adopt {unassigned} unassigned row{unassigned === 1 ? "" : "s"}
                    </button>
                  </form>
                ) : null}
                <form action={clearLiveResults.bind(null, selected.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    Clear all results for “{selected.title}”
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

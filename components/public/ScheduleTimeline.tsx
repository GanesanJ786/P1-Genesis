"use client";

import { useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Download,
  Loader2,
  MapPin,
  Phone,
  Share2,
} from "lucide-react";
import {
  formatScheduledTime,
  scheduleComparator,
  LIVE_STATUS_LABELS,
  LIVE_STATUS_STYLES,
  type LiveRow,
} from "@/lib/live";
import { Countdown } from "@/components/public/Countdown";

/** WhatsApp/native-share text for the full schedule, POC included — the same
 *  contact details are already public on the page per event. */
function buildScheduleShareText(rows: LiveRow[], eventTitle: string, url: string): string {
  const lines = rows.map((r) => {
    const label = [r.event_name, r.category, r.gender, r.heat_label].filter(Boolean).join(" · ");
    const time = r.scheduled_at ? formatScheduledTime(r.scheduled_at) : "TBA";
    const statusNote = r.status !== "upcoming" ? ` [${LIVE_STATUS_LABELS[r.status] ?? r.status}]` : "";
    const poc = r.poc_name || r.poc_phone
      ? ` (POC: ${[r.poc_name, r.poc_phone].filter(Boolean).join(", ")})`
      : "";
    return `${time} — ${label}${statusNote}${poc}`;
  });
  return [`📅 ${eventTitle} — Schedule`, ...lines, `Live updates: ${url}`].join("\n");
}

/**
 * The full event timetable — every race regardless of status (upcoming,
 * live, or already completed), in day → time → order sequence, each with
 * that block's POC if one was added. Meant to be usable and shareable
 * *before* the meet even starts (so families can plan around it), not just
 * a "what's next" countdown — that's why it doesn't filter down to upcoming
 * only. Collapsible (open by default) and shareable/downloadable as a PDF.
 */
export function ScheduleTimeline({
  items,
  eventTitle,
}: {
  items: LiveRow[];
  eventTitle: string;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);

  const schedule = [...items].sort(scheduleComparator);
  if (schedule.length === 0) return null;

  const share = async () => {
    const text = buildScheduleShareText(schedule, eventTitle, window.location.href);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        return; // dismissed — nothing to do
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadSchedulePdf } = await import("@/lib/live-pdf");
      await downloadSchedulePdf(schedule, eventTitle);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <details
      open
      className="group/timeline overflow-hidden rounded-2xl border border-sand/10 bg-ink-soft/40"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={16}
          className="shrink-0 text-sand/50 transition-transform group-open/timeline:rotate-90"
        />
        <CalendarClock size={15} className="shrink-0 text-ember" />
        <h2 className="min-w-0 truncate font-display text-base uppercase text-cream">
          Schedule
        </h2>
        <span className="ml-auto shrink-0 text-xs text-sand/50">{schedule.length} events</span>
      </summary>

      <div className="border-t border-sand/10 px-4 pb-2 pt-2">
        <div className="flex justify-end gap-2 pb-2">
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-sand transition-colors hover:bg-white/10 hover:text-cream"
          >
            <Share2 size={12} /> Share
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-sand transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-50"
          >
            {pdfBusy ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            PDF
          </button>
        </div>

        {schedule.map((r) => (
          <div
            key={r.id}
            className="flex items-start gap-3 border-t border-sand/10 py-3 first:border-t-0"
          >
            <div className="w-16 shrink-0 sm:w-20">
              <p className="text-sm font-semibold text-cream">
                {r.scheduled_at ? formatScheduledTime(r.scheduled_at) : "TBA"}
              </p>
              {(r.status === "upcoming" || r.status === "finalist") && r.scheduled_at ? (
                <Countdown iso={r.scheduled_at} className="mt-0.5" />
              ) : (
                <span
                  className={`mt-0.5 inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold capitalize ${
                    LIVE_STATUS_STYLES[r.status] ?? LIVE_STATUS_STYLES.upcoming
                  }`}
                >
                  {LIVE_STATUS_LABELS[r.status] ?? r.status}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <p className="truncate text-sm font-medium text-cream">
                {[r.event_name, r.category, r.gender].filter(Boolean).join(" · ")}
                {r.heat_label ? (
                  <span className="text-sand/60"> — {r.heat_label}</span>
                ) : null}
              </p>
              {r.venue || r.poc_name || r.poc_phone ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sand/70">
                  {r.venue ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} className="text-ember" />
                      {r.venue}
                    </span>
                  ) : null}
                  {r.poc_name || r.poc_phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={11} className="text-ember" />
                      {r.poc_name}
                      {r.poc_phone ? (
                        <a
                          href={`tel:${r.poc_phone.replace(/\s+/g, "")}`}
                          className="text-cream/90 underline-offset-2 hover:text-ember hover:underline"
                        >
                          {r.poc_phone}
                        </a>
                      ) : null}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

"use client";

import { useState } from "react";
import {
  ChevronRight,
  MapPin,
  Wind,
  Users,
  Phone,
  Download,
  Loader2,
} from "lucide-react";
import {
  LIVE_STATUS_LABELS,
  LIVE_STATUS_STYLES,
  TOP_FINISHERS,
  parseFinishers,
  isFinalHeat,
  liveItemMedia,
  relativeTime,
  formatScheduledTime,
  type LiveRow,
} from "@/lib/live";
import { FinisherList } from "@/components/public/FinisherList";
import { Countdown } from "@/components/public/Countdown";
import { ShareResultButton } from "@/components/public/ShareResultButton";
import { MediaGallery } from "@/components/public/MediaGallery";
import type { PdfSponsor } from "@/lib/live-pdf";

const PODIUM = 3;

/**
 * A single round (heat / semi / final) as a tap-to-expand row.
 * Collapsed, it already shows the top-3 podium when results exist (so the key
 * outcome is visible without tapping), or a one-line status/countdown when they
 * don't. Expanded, it shows the full field plus wind/venue/share.
 */
export function LiveRoundRow({
  item,
  eventTitle,
  defaultOpen = false,
  highlight,
  sponsors,
  showEventMeta = false,
}: {
  item: LiveRow;
  eventTitle: string;
  defaultOpen?: boolean;
  highlight?: string;
  sponsors: PdfSponsor[];
  /** Show the Event/Category/Gender line in the header. Off by default since
   *  this row is normally nested inside a group section that already shows
   *  that context once for the whole group (see LiveEventBoard's
   *  EventGroupSection/CategoryGroupSection) — repeating it per round there
   *  would just reintroduce the clutter that grouping was built to remove.
   *  Turned on only where LiveRoundRow renders standalone with no such
   *  wrapper, e.g. the page-wide search results list. */
  showEventMeta?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pdfBusy, setPdfBusy] = useState(false);

  const finishers = parseFinishers(item.results).slice(0, TOP_FINISHERS);
  const allFinishers = parseFinishers(item.results);

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadRoundPdf } = await import("@/lib/live-pdf");
      await downloadRoundPdf(item, eventTitle, sponsors);
    } finally {
      setPdfBusy(false);
    }
  };
  const isFinal = isFinalHeat(item.heat_label);
  const roundName = item.heat_label || "Final";
  const eventMeta = [item.event_name, item.category, item.gender].filter(Boolean).join(" · ");
  const isUpcoming = item.status === "upcoming";
  const isFinalistStage = item.status === "finalist";
  const isCompleted = item.status === "completed";
  const hasResults = finishers.length > 0;
  const podium = finishers.slice(0, PODIUM);
  const extra = finishers.length - podium.length;
  const media = isCompleted ? liveItemMedia(item) : [];
  const hasMeta = item.venue || item.wind || item.participants_count;

  const statusPill = (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold capitalize ${
        LIVE_STATUS_STYLES[item.status] ?? LIVE_STATUS_STYLES.upcoming
      }`}
    >
      {LIVE_STATUS_LABELS[item.status] ?? item.status}
    </span>
  );

  const header = (
    <div>
      {showEventMeta && eventMeta ? (
        <p className="mb-1 truncate text-[0.7rem] font-semibold uppercase tracking-wide text-ember">
          {eventMeta}
        </p>
      ) : null}
      <div className="flex items-center gap-2.5">
        <span className="w-16 shrink-0 text-sm font-semibold text-cream sm:w-24">
          {roundName}
        </span>
        <div className="min-w-0 flex-1 truncate text-xs">
          {hasResults ? null : isUpcoming && item.scheduled_at ? (
            <span className="inline-flex items-center gap-2 text-sand">
              <span className="text-cream/90">{formatScheduledTime(item.scheduled_at)}</span>
              <Countdown iso={item.scheduled_at} />
            </span>
          ) : isUpcoming ? (
            <span className="text-sand/60">Yet to start</span>
          ) : (
            <span className="italic text-sand/60">In progress…</span>
          )}
        </div>
        {statusPill}
        <ChevronRight
          size={15}
          className={`shrink-0 text-sand/40 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </div>
    </div>
  );

  // Share + Download PDF — rendered both in the collapsed peek and expanded view
  // so they never require drilling in to find. (Kept outside the toggle button
  // so they stay independently clickable — buttons can't nest.)
  // A Finalist row already has finishers (the qualified lineup) — the
  // header's own scheduled-time/Countdown display never reaches that case
  // (it only shows when hasResults is false), so it's rendered separately
  // here, right above the lineup, in both the collapsed peek and expanded view.
  const finalistCountdown =
    isFinalistStage && item.scheduled_at ? (
      <div className="mb-2 flex items-center gap-2 text-xs text-sand">
        <span className="font-medium text-cream/90">{formatScheduledTime(item.scheduled_at)}</span>
        <Countdown iso={item.scheduled_at} />
      </div>
    ) : null;

  const actions =
    isCompleted && allFinishers.length > 0 ? (
      <div className="flex items-center gap-2">
        <ShareResultButton result={item} />
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdfBusy}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-sand transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-50"
        >
          {pdfBusy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          PDF
        </button>
      </div>
    ) : null;

  return (
    <div className="border-t border-sand/10 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="-mx-1 w-[calc(100%+0.5rem)] cursor-pointer rounded-lg px-1 py-3 text-left transition-colors hover:bg-white/[0.02] active:bg-white/[0.05]"
      >
        {header}
      </button>

      {/* Collapsed peek — podium + Share/PDF, right under the row (no drill-in) */}
      {!open && hasResults ? (
        <div className="pb-3 pl-1 pr-1">
          {finalistCountdown}
          <FinisherList finishers={podium} isFinal={isFinal && isCompleted} highlight={highlight} />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            {actions}
            {extra > 0 ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-[0.7rem] font-medium text-ember hover:text-ember-bright"
              >
                +{extra} more · full result
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="pb-4 pl-1 pr-1">
          {hasMeta ? (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sand">
              {item.venue ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-ember" /> {item.venue}
                </span>
              ) : null}
              {item.wind ? (
                <span className="inline-flex items-center gap-1">
                  <Wind size={12} className="text-ember" /> {item.wind}
                </span>
              ) : null}
              {item.participants_count ? (
                <span className="inline-flex items-center gap-1">
                  <Users size={12} className="text-ember" /> {item.participants_count} athletes
                </span>
              ) : null}
            </div>
          ) : null}

          {hasResults ? (
            <>
              {finalistCountdown}
              <FinisherList finishers={finishers} isFinal={isFinal && isCompleted} highlight={highlight} />
            </>
          ) : (
            <p className="text-sm italic text-sand/60">
              {isUpcoming ? "Start list to be announced." : "Results pending…"}
            </p>
          )}

          {media.length > 0 ? (
            <MediaGallery media={media} className="mt-3 !grid-cols-1" />
          ) : null}

          {item.poc_name || item.poc_phone ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-sand">
              <Phone size={11} className="text-ember" />
              {item.poc_name}
              {item.poc_phone ? (
                <a
                  href={`tel:${item.poc_phone.replace(/\s+/g, "")}`}
                  className="text-cream/90 underline-offset-2 hover:text-ember hover:underline"
                >
                  {item.poc_phone}
                </a>
              ) : null}
            </p>
          ) : null}

          {item.notes ? (
            <p className="mt-3 text-xs text-sand/60">{item.notes}</p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-sand/50">
            {actions ?? <span />}
            <span className="shrink-0" suppressHydrationWarning>
              Updated {relativeTime(item.updated_at)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

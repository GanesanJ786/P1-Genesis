import { MapPin, Wind, Users, Phone } from "lucide-react";
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
import { Countdown } from "@/components/public/Countdown";
import { ShareResultButton } from "@/components/public/ShareResultButton";
import { MediaGallery } from "@/components/public/MediaGallery";
import { FinisherList } from "@/components/public/FinisherList";

export function ResultCard({ result }: { result: LiveRow }) {
  const finishers = parseFinishers(result.results).slice(0, TOP_FINISHERS);
  const statusStyle = LIVE_STATUS_STYLES[result.status] ?? LIVE_STATUS_STYLES.upcoming;
  const statusLabel = LIVE_STATUS_LABELS[result.status] ?? result.status;
  const heatLabel = result.heat_label;
  const isFinal = isFinalHeat(heatLabel);
  const isUpcoming = result.status === "upcoming";
  const isFinalistStage = result.status === "finalist";
  const isCompleted = result.status === "completed";
  const media = isCompleted ? liveItemMedia(result) : [];
  const hasMeta =
    ((isUpcoming || isFinalistStage) && result.scheduled_at) ||
    result.venue ||
    result.wind ||
    result.participants_count;

  return (
    <div
      className={`flex flex-col rounded-2xl border border-sand/10 bg-ink-soft p-5 ${
        result.status === "in_progress" ? "ring-2 ring-amber-500/40" : ""
      }`}
    >
      {/* Header badges */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-ember/15 px-2.5 py-0.5 text-xs font-semibold text-ember">
            {result.category}
          </span>
          {result.gender ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-sand">
              {result.gender}
            </span>
          ) : null}
          {result.event_type ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-sand">
              {result.event_type}
            </span>
          ) : null}
          {heatLabel ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isFinal
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-sky-500/15 text-sky-400"
              }`}
            >
              {heatLabel}
            </span>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg uppercase text-cream">
        {result.event_name}
      </h3>

      {/* Schedule meta: time/venue/wind/participants */}
      {hasMeta ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sand">
          {(isUpcoming || isFinalistStage) && result.scheduled_at ? (
            <span className="font-medium text-cream/90">
              {formatScheduledTime(result.scheduled_at)}
            </span>
          ) : null}
          {result.venue ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-ember" /> {result.venue}
            </span>
          ) : null}
          {result.wind ? (
            <span className="inline-flex items-center gap-1">
              <Wind size={12} className="text-ember" /> {result.wind}
            </span>
          ) : null}
          {result.participants_count ? (
            <span className="inline-flex items-center gap-1">
              <Users size={12} className="text-ember" /> {result.participants_count} athletes
            </span>
          ) : null}
        </div>
      ) : null}

      {(isUpcoming || isFinalistStage) && result.scheduled_at ? (
        <Countdown iso={result.scheduled_at} className="mt-2" />
      ) : null}

      {/* Finishers list (top 6) */}
      {finishers.length > 0 ? (
        <div className="mt-4 flex-1">
          <FinisherList finishers={finishers} isFinal={isFinal && isCompleted} />
        </div>
      ) : (
        <p className="mt-4 flex-1 text-sm italic text-sand/60">
          {isUpcoming || isFinalistStage ? "Yet to start" : "Results pending…"}
        </p>
      )}

      {/* Photo/video highlights */}
      {media.length > 0 ? (
        <MediaGallery media={media} className="mt-4 !grid-cols-1" />
      ) : null}

      {/* Point of contact */}
      {result.poc_name || result.poc_phone ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-sand">
          <Phone size={11} className="text-ember" />
          {result.poc_name}
          {result.poc_phone ? (
            <a
              href={`tel:${result.poc_phone.replace(/\s+/g, "")}`}
              className="text-cream/90 underline-offset-2 hover:text-ember hover:underline"
            >
              {result.poc_phone}
            </a>
          ) : null}
        </p>
      ) : null}

      {/* Footer */}
      {result.notes ? (
        <p className="mt-3 truncate text-xs text-sand/50">{result.notes}</p>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-sand/50">
        {isCompleted && finishers.length > 0 ? <ShareResultButton result={result} /> : <span />}
        <span className="shrink-0" suppressHydrationWarning>
          Updated {relativeTime(result.updated_at)}
        </span>
      </div>
    </div>
  );
}

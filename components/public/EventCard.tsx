import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clapperboard,
} from "lucide-react";
import type { EventItem } from "@/lib/seed-data";
import { mediaUrl } from "@/lib/storage";
import { formatDateRange } from "@/lib/utils";
import { RegisterButton } from "@/components/public/RegisterButton";

/**
 * Shared event card for the homepage and the events listing.
 * Upcoming events surface a Register CTA (external Google Form); completed
 * events show a "Successful event" badge and a media indicator.
 */
export function EventCard({
  event,
  past = false,
}: {
  event: EventItem;
  past?: boolean;
}) {
  const img = mediaUrl(event.cover_image);
  const mediaCount = event.media?.length ?? 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft transition-colors hover:border-ember/50">
      <Link
        href={`/events/${event.slug}`}
        className="relative block h-44 overflow-hidden sm:h-48"
      >
        {img ? (
          <Image
            src={img}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-ember/25 via-ink-soft to-ink">
            <span className="font-display text-4xl uppercase text-ember/40">
              Genesis
            </span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            past
              ? "bg-ink/80 text-sand"
              : "bg-ember text-white"
          }`}
        >
          {past ? (
            <>
              <CheckCircle2 size={12} /> Successful
            </>
          ) : (
            "Upcoming"
          )}
        </span>
        {mediaCount > 0 ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-cream">
            <Clapperboard size={12} className="text-ember" /> {mediaCount}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-sand">
          {event.start_date ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="text-ember" />
              {formatDateRange(event.start_date, event.end_date)}
            </span>
          ) : null}
          {event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-ember" />
              {event.location}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-xl uppercase leading-tight text-cream">
          <Link href={`/events/${event.slug}`} className="hover:text-ember">
            {event.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm text-sand">{event.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!past && event.registration_url ? (
            <RegisterButton url={event.registration_url} size="sm" />
          ) : null}
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-ember hover:gap-2"
          >
            View details <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

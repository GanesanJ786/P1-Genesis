"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/seed-data";
import { mediaUrl } from "@/lib/storage";
import { formatDateRange } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Dynamic "latest events" slider (Embla + autoplay). Touch/drag enabled,
 * accessible controls, and a gradient fallback when an event has no cover image.
 */
export function EventsCarousel({ events }: { events: EventItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 5000, stopOnInteraction: true })],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (events.length === 0) {
    return (
      <p className="text-sand">Event schedule coming soon — check back shortly.</p>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {events.map((event) => {
            const img = mediaUrl(event.cover_image);
            return (
              <div
                key={event.id}
                className="min-w-0 flex-[0_0_100%] pr-4 sm:flex-[0_0_70%] lg:flex-[0_0_48%]"
              >
                <Link
                  href={`/events/${event.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft transition-colors hover:border-ember/50"
                >
                  <div className="relative h-60 overflow-hidden">
                    {img ? (
                      <Image
                        src={img}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ember/30 via-ink-soft to-ink">
                        <span className="font-display text-5xl uppercase text-ember/40">
                          GTF
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-sand">
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
                    <h3 className="mt-3 font-display text-2xl uppercase text-cream group-hover:text-ember">
                      {event.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-sand">
                      {event.summary}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          {snaps.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === selected ? "w-8 bg-ember" : "w-3 bg-sand/30"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            aria-label="Previous"
            className="rounded-full border border-sand/30 p-2.5 text-cream transition-colors hover:border-ember hover:text-ember"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next"
            className="rounded-full border border-sand/30 p-2.5 text-cream transition-colors hover:border-ember hover:text-ember"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-8">
        <ButtonLink href="/events" variant="outline" size="sm">
          View All Events
        </ButtonLink>
      </div>
    </div>
  );
}

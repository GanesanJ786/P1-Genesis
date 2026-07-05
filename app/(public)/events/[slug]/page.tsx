import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { MediaGallery } from "@/components/public/MediaGallery";
import { JsonLd } from "@/components/ui/JsonLd";
import { getEventBySlug, getPublishedEvents } from "@/lib/queries";
import { isPastEvent } from "@/lib/events";
import { mediaUrl } from "@/lib/storage";
import { formatDateRange } from "@/lib/utils";
import { SITE } from "@/lib/constants";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export async function generateStaticParams() {
  const events = await getPublishedEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.summary ?? undefined,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const img = mediaUrl(event.cover_image);
  const past = isPastEvent(event);

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.title,
    description: event.summary ?? undefined,
    startDate: event.start_date ?? undefined,
    endDate: event.end_date ?? event.start_date ?? undefined,
    location: {
      "@type": "Place",
      name: event.location ?? SITE.venue,
      address: { "@type": "PostalAddress", addressLocality: "Coimbatore", addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", name: SITE.organiser, url: SITE.url },
    url: `${SITE.url}/events/${event.slug}`,
    ...(img ? { image: img } : {}),
  };

  return (
    <article>
      <JsonLd data={eventSchema} />
      {/* Breadcrumb — pt-20/24 clears the fixed navbar */}
      <div className="border-b border-sand/10 bg-ink pt-20 sm:pt-24">
        <Container className="pb-3">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-sand">
            <Link href="/" className="shrink-0 hover:text-ember transition-colors">Home</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <Link href="/events" className="shrink-0 hover:text-ember transition-colors">Events</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <span className="truncate text-cream/80">{event.title}</span>
          </nav>
        </Container>
      </div>
      <section className="relative h-[52vh] min-h-[360px] overflow-hidden">
        {img ? (
          <Image
            src={img}
            alt={event.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ember/30 via-ink-soft to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
        <Container className="absolute inset-x-0 bottom-0 pb-12">
          <Link
            href="/events"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-cream/80 hover:text-ember"
          >
            <ArrowLeft size={15} /> All events
          </Link>
          <span
            className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              past ? "bg-ink/70 text-sand" : "bg-ember text-white"
            }`}
          >
            {past ? (
              <>
                <CheckCircle2 size={13} /> Successful Event
              </>
            ) : (
              "Upcoming Event"
            )}
          </span>
          <h1 className="max-w-3xl font-display text-4xl uppercase text-cream sm:text-6xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/85">
            {event.start_date ? (
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-ember" />
                {formatDateRange(event.start_date, event.end_date)}
              </span>
            ) : null}
            {event.location ? (
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-ember" />
                {event.location}
              </span>
            ) : null}
          </div>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl">
          {event.summary ? (
            <p className="text-xl text-cream">{event.summary}</p>
          ) : null}
          {event.body ? (
            <div className="mt-6 space-y-4 text-sand leading-relaxed">
              {event.body.split("\n").map((para, i) =>
                para.trim() ? <p key={i}>{para}</p> : null,
              )}
            </div>
          ) : null}

          {event.media.length > 0 ? (
            <div className="mt-12 border-t border-sand/15 pt-8">
              <p className="eyebrow mb-5">
                {past ? "Highlights" : "Watch & Follow"}
              </p>
              <MediaGallery media={event.media} />
            </div>
          ) : null}

          <div className="mt-12 flex flex-wrap gap-4 border-t border-sand/15 pt-8">
            {!past && event.registration_url ? (
              <ButtonLink
                href={event.registration_url}
                external
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
              >
                Register for this Event
              </ButtonLink>
            ) : (
              <ButtonLink href="/events" size="lg">
                See Upcoming Events
              </ButtonLink>
            )}
            <ButtonLink href="/sponsorship" size="lg" variant="outline">
              Sponsor This Event
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </article>
  );
}

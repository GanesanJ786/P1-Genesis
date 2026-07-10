import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Section";
import { LiveEventBoard } from "@/components/public/LiveEventBoard";
import { SponsorStrip } from "@/components/public/SponsorStrip";
import { JsonLd } from "@/components/ui/JsonLd";
import {
  getLiveTrackedEvents,
  getLiveEventBySlug,
  getLiveItems,
  getAnnouncements,
  getEventSponsors,
} from "@/lib/queries";
import { mediaUrl } from "@/lib/storage";
import { formatDateRange } from "@/lib/utils";
import { SITE } from "@/lib/constants";

// Fresh initial data every ~30s; the client board carries the live delta via
// Supabase Realtime (with a 10s polling fallback against /api/live/[slug]).
export const revalidate = 30;

export async function generateStaticParams() {
  const events = await getLiveTrackedEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) return { title: "Live Event Not Found" };
  const description = `Live schedule, results and announcements from ${event.title}${
    event.location ? ` — ${event.location}` : ""
  }. Updated in real time as races complete.`;
  return {
    title: `Live Results · ${event.title}`,
    description,
    openGraph: {
      title: `Live Results · ${event.title}`,
      description,
      type: "website",
      url: `${SITE.url}/live/${event.slug}`,
    },
  };
}

export default async function LiveEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) notFound();

  const [items, announcements, sponsors] = await Promise.all([
    getLiveItems(event.id),
    getAnnouncements(event.id),
    getEventSponsors(event.id),
  ]);

  const titleSponsor = sponsors.find((s) => s.tier === "title");
  const img = mediaUrl(event.cover_image);
  const pageUrl = `${SITE.url}/live/${event.slug}`;
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.title,
    description: event.summary || undefined,
    startDate: event.start_date ?? undefined,
    endDate: event.end_date ?? event.start_date ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    location: {
      "@type": "Place",
      name: event.location ?? SITE.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location ?? SITE.venue,
        addressLocality: "Coimbatore",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
    },
    organizer: { "@type": "Organization", name: SITE.organiser, url: SITE.url },
    url: pageUrl,
    ...(img ? { image: [img] } : {}),
  };

  return (
    <>
      <JsonLd data={eventSchema} />
      {/* Breadcrumb */}
      <div className="border-b border-sand/10 bg-ink pt-20 sm:pt-24">
        <Container className="pb-3">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-sand">
            <Link href="/" className="shrink-0 hover:text-ember transition-colors">Home</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <Link href="/live" className="shrink-0 hover:text-ember transition-colors">Live</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <span className="truncate text-cream/80">{event.title}</span>
          </nav>
        </Container>
      </div>

      <Section>
        <Container>
          <div className="mb-8">
            <p className="eyebrow">{SITE.organiser}</p>
            <h1 className="mt-2 font-display text-4xl uppercase text-cream sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-3 text-sand">
              {[
                event.location,
                event.start_date
                  ? formatDateRange(event.start_date, event.end_date)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {titleSponsor ? (
              <p className="mt-2 text-sm text-sand/80">
                Presented by{" "}
                <span className="font-semibold text-cream">{titleSponsor.name}</span>
              </p>
            ) : null}
          </div>

          <LiveEventBoard
            event={{ id: event.id, slug: event.slug, title: event.title }}
            initialItems={items}
            initialAnnouncements={announcements}
          />

          {sponsors.length > 0 ? (
            <div className="mt-16 border-t border-sand/15 pt-10">
              <SponsorStrip sponsors={sponsors} />
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}

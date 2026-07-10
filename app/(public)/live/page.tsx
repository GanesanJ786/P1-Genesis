import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Section";
import { EventCard } from "@/components/public/EventCard";
import { getLiveTrackedEvents } from "@/lib/queries";
import { isPastEvent } from "@/lib/events";
import { cardGridClass } from "@/lib/utils";
import { SITE } from "@/lib/constants";

// The hub changes only when admin toggles an event; those writes revalidate it.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Live Events",
  description: `Follow Genesis Sports Foundation events live — real-time schedule, results and announcements from ${SITE.venue} and beyond.`,
  openGraph: {
    title: "Live Events · Genesis Sports Foundation",
    description: "Real-time schedule, results and announcements as each event unfolds.",
    type: "website",
    url: `${SITE.url}/live`,
  },
};

export default async function LiveHubPage() {
  const events = await getLiveTrackedEvents();

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-sand/10 bg-ink pt-20 sm:pt-24">
        <Container className="pb-3">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-sand">
            <Link href="/" className="shrink-0 hover:text-ember transition-colors">Home</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <span className="text-cream/80">Live Events</span>
          </nav>
        </Container>
      </div>

      <Section>
        <Container>
          <div className="mb-8">
            <p className="eyebrow">{SITE.organiser}</p>
            <h1 className="mt-2 font-display text-4xl uppercase text-cream sm:text-5xl">
              Live Events
            </h1>
            <p className="mt-3 text-sand">
              Tap an event for its live schedule, results and announcements — updated
              in real time.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-12 text-center">
              <p className="text-lg text-sand">No events are being tracked live right now.</p>
              <p className="mt-2 text-sm text-sand/60">
                Check back when the next meet begins — this page updates automatically.
              </p>
            </div>
          ) : (
            <div className={cardGridClass(events.length)}>
              {events.map((event) => {
                const past = isPastEvent(event);
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    href={`/live/${event.slug}`}
                    live={!past}
                    past={past}
                  />
                );
              })}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

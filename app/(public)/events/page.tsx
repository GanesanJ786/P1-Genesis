import type { Metadata } from "next";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { Reveal } from "@/components/public/Reveal";
import { EventCard } from "@/components/public/EventCard";
import { getPublishedEvents } from "@/lib/queries";
import { splitEvents } from "@/lib/events";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Genesis events to register for, and a record of our successful past meets and championships.",
};

export default async function EventsPage() {
  const events = await getPublishedEvents();
  const { upcoming, past } = splitEvents(events);

  return (
    <>
      <PageHero
        eyebrow="What's On"
        title="Events"
        description="Register for what's next, and explore the meets and championships we've already delivered."
      />

      <Section>
        <Container>
          {/* Upcoming — shown first, with priority */}
          <SectionHeading eyebrow="Register Now" title="Upcoming Events" />
          {upcoming.length === 0 ? (
            <p className="text-sand">
              New events are being finalised — check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.06}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {past.length > 0 ? (
        <Section className="bg-ink-soft/40">
          <Container>
            <SectionHeading
              eyebrow="Our Track Record"
              title="Successful Events"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.06}>
                  <EventCard event={event} past />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}

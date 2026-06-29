import type { Metadata } from "next";
import { CalendarDays, MapPin, Users, Ticket } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { StatCounter } from "@/components/public/StatCounter";
import { Reveal } from "@/components/public/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { RegistrationQR } from "@/components/public/RegistrationQR";
import { REACH_STATS, EVENT_CATEGORIES } from "@/lib/seed-data";
import { SITE } from "@/lib/constants";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Event",
  description:
    "Genesis Track Fest 2026 — a two-day Junior & Senior Athletic Championship at Nehru Stadium, Coimbatore across six age categories.",
};

const SNAPSHOT = [
  { icon: MapPin, label: "Venue", value: "Nehru Stadium, Coimbatore" },
  { icon: CalendarDays, label: "Dates", value: "31 July & 1 August 2026" },
  { icon: Users, label: "Categories", value: "8–10 yrs, U12, U14, U17, U19, Open" },
  { icon: Ticket, label: "Entry Fee", value: "₹300 (free for govt & corporation school teams)" },
];

export default function AboutEventPage() {
  return (
    <>
      <PageHero
        eyebrow="The Event"
        title="About Genesis Track Fest"
        description="Built to feel like a national-level meet from the very first year."
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
            <Reveal>
              <p className="text-lg text-cream">
                Genesis Track Fest is a professional athletics competition
                created to encourage school, club, and academy athletes. The
                event gives young athletes a platform to compete, perform, and
                grow with confidence — turning Nehru Stadium into a stage for
                Coimbatore&apos;s next generation of track and field talent.
              </p>
              <p className="mt-5 text-sand">
                Now in its first edition as a Junior &amp; Senior Athletic
                Championship, the Fest brings together athletes across six age
                categories, supported by certified officials, structured medal
                ceremonies, and a full programme of media coverage — built to
                feel like a national-level meet from the very first year.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-ember/40 px-4 py-1.5 text-sm font-medium text-ember"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {SNAPSHOT.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-sand/15 bg-ink-soft p-5"
                  >
                    <s.icon className="text-ember" size={22} />
                    <p className="mt-3 text-xs uppercase tracking-widest text-sand">
                      {s.label}
                    </p>
                    <p className="mt-1 font-medium text-cream">{s.value}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <RegistrationQR />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-sand/10 bg-ink-soft/40">
        <Container>
          <p className="eyebrow mb-3">By the Numbers</p>
          <h2 className="mb-12 font-display text-4xl uppercase text-cream sm:text-5xl">
            Expected Reach
          </h2>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {REACH_STATS.map((s, i) => (
              <StatCounter key={s.label} value={s.value} label={s.label} delay={i * 0.05} />
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <ButtonLink href="/sponsorship" size="lg">
              Become a Sponsor
            </ButtonLink>
            <ButtonLink href={SITE.prospectusPath} external target="_blank" variant="outline" size="lg">
              Download Prospectus
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}

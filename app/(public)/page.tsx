import { ArrowRight, Sparkles } from "lucide-react";
import { getContent, getPublishedEvents, getTeam, getSlides } from "@/lib/queries";
import { splitEvents } from "@/lib/events";
import { FOUNDATION_STATS } from "@/lib/seed-data";
import { SPONSOR_AUDIENCES } from "@/lib/constants";
import { cardGridClass } from "@/lib/utils";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Hero } from "@/components/public/Hero";
import { HeroResults } from "@/components/public/HeroResults";
import { StatCounter } from "@/components/public/StatCounter";
import { EventCard } from "@/components/public/EventCard";
import { Initiatives } from "@/components/public/Initiatives";
import { FuturePlans } from "@/components/public/FuturePlans";
import { FeatureBanner } from "@/components/public/FeatureBanner";
import { EventBanner } from "@/components/public/EventBanner";
import { TeamGrid } from "@/components/public/TeamGrid";
import { Reveal } from "@/components/public/Reveal";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export default async function HomePage() {
  const [
    events, team, heroSlides,
    heroMode, heroEyebrow, heroTitle, heroTagline,
    resultsEyebrow, resultsTitle, resultsBody, resultsCtaLabel, resultsCtaHref,
    purpose, quote, futureIntro, commitment,
  ] = await Promise.all([
    getPublishedEvents(),
    getTeam(),
    getSlides("home_hero"),
    getContent("hero.mode"),
    getContent("hero.eyebrow"),
    getContent("hero.title"),
    getContent("hero.tagline"),
    getContent("hero.results_eyebrow"),
    getContent("hero.results_title"),
    getContent("hero.results_body"),
    getContent("hero.results_cta_label"),
    getContent("hero.results_cta_href"),
    getContent("foundation.purpose"),
    getContent("foundation.quote"),
    getContent("future.intro"),
    getContent("impact.commitment"),
  ]);

  const { upcoming, past } = splitEvents(events);

  return (
    <>
      {heroMode === "post_event" ? (
        <HeroResults
          eyebrow={resultsEyebrow || "Thank You, Coimbatore"}
          title={resultsTitle || "Genesis Track Fest 2026 — Complete"}
          body={resultsBody || "Thank you to every athlete, coach, and supporter."}
          ctaLabel={resultsCtaLabel || "View Results"}
          ctaHref={resultsCtaHref || "/blog"}
        />
      ) : heroMode === "hidden" ? null : (
        <Hero
          eyebrow={heroEyebrow || "Genesis Sports Foundation · Coimbatore"}
          title={heroTitle || "The Beginning of Sports"}
          tagline={
            heroTagline ||
            "A decade building champions — accessible athletics coaching that turns grassroots talent into national and international medal winners."
          }
        />
      )}

      {/* Promotional event banner(s) — uploaded via Admin → Slides (Home hero).
          Renders nothing until at least one active banner exists. */}
      <EventBanner slides={heroSlides} />

      {/* Purpose / Who we are */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="eyebrow mb-3">Who We Are</p>
              <h2 className="font-display text-4xl uppercase text-cream sm:text-5xl">
                Built to launch athletes, not just host events
              </h2>
              <p className="mt-6 text-sand">
                {purpose ||
                  "Genesis Sports Foundation exists to give every young athlete in Coimbatore a genuine path to excel — regardless of background."}
              </p>
              <div className="mt-8">
                <ButtonLink href="/foundation" variant="outline">
                  About Genesis Sports Foundation <ArrowRight size={16} />
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative rounded-2xl border border-ember/30 bg-gradient-to-br from-ember/10 to-ink-soft p-8 sm:p-10">
                <Sparkles className="text-ember" size={28} />
                <p className="mt-5 font-display text-2xl uppercase leading-tight text-cream sm:text-3xl">
                  &ldquo;{quote || "From two students to five academies and four straight state titles."}&rdquo;
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-sand/15 pt-6">
                  <div>
                    <p className="font-display text-3xl text-ember">2015</p>
                    <p className="text-xs uppercase tracking-widest text-sand">Founded</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl text-ember">500+</p>
                    <p className="text-xs uppercase tracking-widest text-sand">Athletes</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl text-ember">5</p>
                    <p className="text-xs uppercase tracking-widest text-sand">Academies</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Ongoing initiatives */}
      <Section className="bg-ink-soft/40">
        <Container>
          <SectionHeading eyebrow="What We Do" title="Ongoing Initiatives" />
          <Initiatives />
        </Container>
      </Section>

      {/* Upcoming events — priority */}
      <Section>
        <Container>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Register Now" title="Upcoming Events" className="mb-0" />
            <p className="max-w-sm text-sm text-sand">
              New and future events appear here first — sign up before they fill.
            </p>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sand">New events are being finalised — check back soon.</p>
          ) : (
            <div className={cardGridClass(Math.min(upcoming.length, 3))}>
              {upcoming.slice(0, 3).map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.06}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
          <div className="mt-10">
            <ButtonLink href="/events" variant="outline" size="sm">
              View All Events
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Successful events */}
      {past.length > 0 ? (
        <Section className="bg-ink-soft/40">
          <Container>
            <SectionHeading eyebrow="Our Track Record" title="Successful Events" />
            <div className={cardGridClass(Math.min(past.length, 3))}>
              {past.slice(0, 3).map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.06}>
                  <EventCard event={event} past />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Impact / by the numbers */}
      <FeatureBanner className="border-y border-sand/10">
        <Container className="py-20 sm:py-28">
          <SectionHeading eyebrow="By the Numbers" title="Our Impact" />
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOUNDATION_STATS.map((s, i) => (
              <StatCounter key={s.label} value={s.value} label={s.label} delay={i * 0.05} />
            ))}
          </div>
        </Container>
      </FeatureBanner>

      {/* Leadership teaser */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Leadership" title="The People Behind It" />
          <TeamGrid members={team} />
          <div className="mt-10">
            <ButtonLink href="/team" variant="ghost">
              More About the Team <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Future plans / vision */}
      <Section className="bg-ink-soft/40">
        <Container>
          <div className="mb-12 max-w-2xl">
            <SectionHeading eyebrow="Where We're Headed" title="Future Plans" className="mb-4" />
            <p className="text-sand">
              {futureIntro || "We are only getting started. Here is where Genesis is headed."}
            </p>
          </div>
          <FuturePlans />
        </Container>
      </Section>

      {/* Sponsorship — kept prominent */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <p className="eyebrow mb-3">Partner With Genesis</p>
              <h2 className="font-display text-4xl uppercase text-cream sm:text-5xl">
                Put your brand behind the next generation
              </h2>
              <p className="mt-6 text-sand">
                Backing Genesis connects your brand with an engaged, family-oriented
                community — while directly funding coaching, equipment, and travel for
                young athletes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/sponsorship">View Sponsorship Tiers</ButtonLink>
                <ButtonLink href="/sponsorship" variant="ghost">
                  Branding Opportunities <ArrowRight size={16} />
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-3">
                {SPONSOR_AUDIENCES.map((a, i) => (
                  <div
                    key={a}
                    className="flex items-center gap-3 rounded-xl border border-sand/15 bg-ink-soft p-4"
                  >
                    <span className="font-display text-lg text-ember">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-cream">{a}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Commitment CTA */}
      <FeatureBanner>
        <Container className="py-24 sm:py-32">
          <Reveal>
            <p className="eyebrow mb-4">Our Commitment</p>
            <p className="max-w-4xl font-display text-3xl uppercase leading-tight text-cream sm:text-5xl">
              We are not just building athletes — we are building{" "}
              <span className="text-ember">the future of Indian sport.</span>
            </p>
            <p className="mt-6 max-w-2xl text-sand">
              {commitment ||
                "Together, we will build champions and win Olympic medals for India."}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href="/sponsorship" size="lg">
                Partner With Genesis
              </ButtonLink>
              <ButtonLink href="/contact" size="lg" variant="outline">
                Get in Touch
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </FeatureBanner>
    </>
  );
}

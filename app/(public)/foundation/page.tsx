import type { Metadata } from "next";
import { Trophy, Heart, GraduationCap, Plane, CheckCircle2 } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { StatCounter } from "@/components/public/StatCounter";
import { FeatureBanner } from "@/components/public/FeatureBanner";
import { Reveal } from "@/components/public/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { SITE, whatsappUrl } from "@/lib/constants";
import {
  FOUNDATION_STATS,
  FOUNDATION_ACHIEVEMENTS,
  ACADEMY_LOCATIONS,
  FOUNDER,
  IMPACT_USES,
  SOCIAL_RESPONSIBILITY,
} from "@/lib/seed-data";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Foundation",
  description:
    "Genesis Sports Foundation has spent a decade turning raw talent into champions across five academy locations in and around Coimbatore.",
  alternates: { canonical: `${SITE.url}/foundation` },
};

export default function FoundationPage() {
  return (
    <>
      <PageHero
        eyebrow="Who We Are"
        title="Genesis Sports Foundation"
        description="A decade turning raw talent into champions — Genesis Track Fest is the next chapter of that story."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOUNDATION_STATS.map((s, i) => (
              <StatCounter key={s.label} value={s.value} label={s.label} delay={i * 0.05} />
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-3xl uppercase text-cream">
                Academy Locations
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {ACADEMY_LOCATIONS.map((loc) => (
                  <span
                    key={loc}
                    className="rounded-lg border border-sand/20 bg-ink-soft px-4 py-2 text-sm text-cream"
                  >
                    {loc}
                  </span>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-ember/30 bg-ember/5 p-6">
                <p className="eyebrow mb-2">A Decade in Motion</p>
                <p className="text-cream">
                  From two students in 2015 to a 500-athlete academy across five
                  locations — Genesis has spent ten years building
                  Coimbatore&apos;s athletics pipeline, one season at a time.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-display text-3xl uppercase text-cream">
                Achievements
              </h2>
              <ul className="mt-5 space-y-4">
                {FOUNDATION_ACHIEVEMENTS.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <Trophy size={18} className="mt-1 shrink-0 text-ember" />
                    <span className="text-sand">{a}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Founder */}
      <Section className="border-y border-sand/10 bg-ink-soft/40">
        <Container>
          <SectionHeading eyebrow="Leadership" title="Chief Coach & Founder" />
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <div className="rounded-2xl border border-sand/15 bg-ink p-8">
                <p className="text-xs uppercase tracking-widest text-ember">
                  {FOUNDER.title}
                </p>
                <h3 className="mt-1 font-display text-3xl uppercase text-cream">
                  {FOUNDER.name}
                </h3>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-sand/15 pt-6">
                  {FOUNDER.stats.map((s) => (
                    <div key={s.label}>
                      <p className="font-display text-2xl text-ember">{s.value}</p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-sand">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-sand">{FOUNDER.bio}</p>
              <h4 className="mt-8 eyebrow">Coaching Qualifications</h4>
              <ul className="mt-4 space-y-4">
                {FOUNDER.qualifications.map((q) => (
                  <li key={q.year} className="flex gap-5 border-b border-sand/10 pb-4">
                    <span className="font-display text-2xl text-ember">{q.year}</span>
                    <div>
                      <p className="font-medium text-cream">{q.title}</p>
                      <p className="text-sm text-sand">{q.org}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-ember/30 bg-ember/5 p-5">
                <p className="eyebrow mb-2">Coaching Philosophy</p>
                <p className="text-sm text-cream">{FOUNDER.philosophy}</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Impact */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Beyond the Event" title="Our Impact & Commitment" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal>
              <div className="flex items-center gap-2 text-ember">
                <Heart size={18} />
                <h3 className="eyebrow mb-0">Social Responsibility</h3>
              </div>
              <ul className="mt-5 space-y-4">
                {SOCIAL_RESPONSIBILITY.map((s) => (
                  <li key={s} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ember" />
                    <span className="text-sand">{s}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <GraduationCap size={18} className="mt-0.5 shrink-0 text-ember" />
                  <span className="text-sand">
                    Sports quota admissions secured in reputed institutions like
                    Loyola College and PSG Arts.
                  </span>
                </li>
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex items-center gap-2 text-ember">
                <Plane size={18} />
                <h3 className="eyebrow mb-0">Why Your Support Matters</h3>
              </div>
              <p className="mt-5 text-sand">
                Surplus funds generated through Genesis Track Fest go directly
                toward:
              </p>
              <ul className="mt-4 space-y-3">
                {IMPACT_USES.map((u) => (
                  <li key={u} className="flex items-start gap-3 text-sand">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    {u}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Join the academy — the parent/athlete conversion point. */}
      <Section className="border-t border-sand/10">
        <Container>
          <div className="rounded-3xl border border-ember/30 bg-gradient-to-br from-ember/10 to-ink-soft p-8 text-center sm:p-12">
            <p className="eyebrow mb-3">Train With Us</p>
            <h2 className="mx-auto max-w-2xl font-display text-3xl uppercase leading-tight text-cream sm:text-4xl">
              Join the Genesis Athletics Academy
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sand">
              Coaching for every level — from young beginners taking their first
              strides to competitive athletes chasing state and national medals.
              Sessions run across five locations in and around Coimbatore. Reach
              out and we&apos;ll help you find the right starting point.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/contact?intent=join" size="lg">
                Enrol / Enquire
              </ButtonLink>
              <ButtonLink href={whatsappUrl()} external target="_blank" size="lg" variant="outline">
                Chat on WhatsApp
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <FeatureBanner className="border-t border-sand/10">
        <Container className="py-24 text-center">
          <p className="mx-auto max-w-3xl font-display text-3xl uppercase leading-tight text-cream sm:text-4xl">
            &ldquo;From two students to five academies and four straight state
            titles — Genesis Track Fest is where that story{" "}
            <span className="text-ember">opens to the public.</span>&rdquo;
          </p>
          <p className="mt-4 text-sm uppercase tracking-widest text-sand">
            — Genesis Sports Foundation
          </p>
        </Container>
      </FeatureBanner>
    </>
  );
}

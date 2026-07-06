import type { Metadata } from "next";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { SponsorTiers } from "@/components/public/SponsorTiers";
import { Reveal } from "@/components/public/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { BRANDING_TOUCHPOINTS, SPONSOR_AUDIENCES } from "@/lib/constants";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sponsorship",
  description:
    "Four headline sponsorship tiers plus supporter categories for Genesis Track Fest 2026, with 11 branding touchpoints across two days at Nehru Stadium.",
};

export default function SponsorshipPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner With Us"
        title="Sponsorship Packages"
        description="Four tiers of headline partnership, each scaled to a different level of visibility and investment."
      />

      <Section>
        <Container>
          <SponsorTiers />
        </Container>
      </Section>

      {/* Why sponsor / audiences */}
      <Section className="border-t border-sand/10 bg-ink-soft/40">
        <Container>
          <SectionHeading
            eyebrow="The Opportunity"
            title="Who Your Brand Reaches"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SPONSOR_AUDIENCES.map((a, i) => (
              <Reveal key={a} delay={(i % 4) * 0.05}>
                <div className="flex h-full items-center gap-3 rounded-xl border border-sand/15 bg-ink p-4">
                  <span className="font-display text-lg text-ember">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-cream">{a}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-ember/30 bg-ember/5 p-8">
            <p className="eyebrow mb-2">The Partnership</p>
            <p className="text-lg text-cream">
              This partnership shows your brand as a supporter of youth, health,
              discipline, and sports development — values that travel far beyond
              the two days of competition, and stay associated with your name
              long after the medals are handed out.
            </p>
          </div>
        </Container>
      </Section>

      {/* Branding touchpoints */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Where You'll Be Seen"
            title="Branding & Visibility"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BRANDING_TOUCHPOINTS.map((t, i) => (
              <Reveal key={t} delay={(i % 3) * 0.05}>
                <div className="flex items-start gap-4 rounded-xl border border-sand/15 bg-ink-soft p-5">
                  <span className="font-display text-2xl text-ember">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pt-1 text-cream">{t}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <ButtonLink href="/contact" size="lg">
              Discuss a Partnership
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}

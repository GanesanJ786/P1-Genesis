import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { FeatureBanner } from "@/components/public/FeatureBanner";
import { Reveal } from "@/components/public/Reveal";
import { FOUNDATION_ACHIEVEMENTS } from "@/lib/seed-data";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Achievements & Highlights",
  description:
    "Moments that define Genesis Sports Foundation — championship wins, medal ceremonies, and a decade of producing athletes.",
};

export default function AchievementsPage() {
  return (
    <>
      <PageHero
        eyebrow="Moments That Define Us"
        title="Achievements & Highlights"
        description="Every milestone here represents a season of training, discipline, and the pursuit of personal bests."
      />

      <Section>
        <Container>
          <div className="grid gap-5 sm:grid-cols-2">
            {FOUNDATION_ACHIEVEMENTS.map((a, i) => (
              <Reveal key={a} delay={(i % 2) * 0.06}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-sand/15 bg-ink-soft p-6">
                  <Trophy size={22} className="mt-0.5 shrink-0 text-ember" />
                  <p className="text-cream">{a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <FeatureBanner className="border-t border-sand/10">
        <Container className="py-24 text-center">
          <p className="mx-auto max-w-3xl font-display text-3xl uppercase leading-tight text-cream sm:text-4xl">
            &ldquo;Every photo here represents a season of training, discipline,
            and <span className="text-ember">the pursuit of personal bests.</span>&rdquo;
          </p>
          <p className="mt-4 text-sm uppercase tracking-widest text-sand">
            — Genesis Sports Foundation
          </p>
        </Container>
      </FeatureBanner>
    </>
  );
}

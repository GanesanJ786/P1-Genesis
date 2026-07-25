import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { TeamGrid } from "@/components/public/TeamGrid";
import { getTeam } from "@/lib/queries";
import { SITE } from "@/lib/constants";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Leadership & Coaches",
  description:
    "Meet the leadership team and coaches behind Genesis Track Fest 2026 and Genesis Sports Foundation.",
  alternates: { canonical: `${SITE.url}/team` },
};

export default async function TeamPage() {
  const team = await getTeam();
  return (
    <>
      <PageHero
        eyebrow="Our People"
        title="The Team"
        description="The leadership and coaching staff steering Genesis Sports Foundation and the championship."
      />
      <Section>
        <Container>
          <TeamGrid members={team} />
        </Container>
      </Section>
    </>
  );
}

import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { SkeletonCard, SkeletonCardGrid } from "@/components/admin/AdminSkeleton";

export default function Loading() {
  return (
    <>
      <PageHero eyebrow="Foundation News" title="Blog" />
      <Section>
        <Container>
          <SkeletonCardGrid count={6} />
        </Container>
      </Section>
    </>
  );
}

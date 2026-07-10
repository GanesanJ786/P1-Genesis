import { Container, Section } from "@/components/ui/Section";
import { SkeletonBlock, SkeletonCardGrid } from "@/components/admin/AdminSkeleton";

export default function LiveEventLoading() {
  return (
    <>
      <div className="border-b border-sand/10 bg-ink pt-20 sm:pt-24">
        <div className="mx-auto max-w-6xl px-5 pb-3 sm:px-8">
          <SkeletonBlock className="h-3 w-40" />
        </div>
      </div>
      <Section>
        <Container>
          <div className="mb-8 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-64" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <SkeletonBlock className="mb-6 h-14 w-full" />
          <SkeletonCardGrid count={6} />
        </Container>
      </Section>
    </>
  );
}

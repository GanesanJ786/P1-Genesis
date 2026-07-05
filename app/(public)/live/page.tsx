import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Section";
import { LiveResultsBoard } from "@/components/public/LiveResultsBoard";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE } from "@/lib/constants";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Live Results",
  description: `Real-time event results from Genesis Track Fest 2026 — ${SITE.venue}. Updated live as races complete.`,
  openGraph: {
    title: "Live Results · Genesis Track Fest 2026",
    description: `Follow the action live from ${SITE.venue}.`,
    type: "website",
    url: `${SITE.url}/live`,
  },
};

export default async function LivePage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("live_results")
    .select("*")
    .order("day", { ascending: true })
    .order("sort_order", { ascending: true });

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-sand/10 bg-ink pt-20 sm:pt-24">
        <Container className="pb-3">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-sand">
            <Link href="/" className="shrink-0 hover:text-ember transition-colors">Home</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <span className="text-cream/80">Live Results</span>
          </nav>
        </Container>
      </div>

      <Section>
        <Container>
          <div className="mb-8">
            <p className="eyebrow">Genesis Track Fest 2026</p>
            <h1 className="mt-2 font-display text-4xl uppercase text-cream sm:text-5xl">
              Live Results
            </h1>
            <p className="mt-3 text-sand">{SITE.venue} · {SITE.dates}</p>
          </div>
          <LiveResultsBoard initialData={data ?? []} />
        </Container>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { SITE, CONTACT } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "FAQ — Athletics Coaching in Coimbatore",
  description:
    "Common questions about Genesis Sports Foundation — athletics coaching in Coimbatore, training venue, age groups, joining, and Genesis Track Fest 2026.",
  keywords: [
    "athletics coaching Coimbatore FAQ",
    "how to join athletics academy Coimbatore",
    "track and field coaching Tamil Nadu",
    "junior athletics Coimbatore",
    "Genesis Sports Foundation questions",
    "Genesis Track Fest 2026",
  ],
  alternates: { canonical: `${SITE.url}/faq` },
  openGraph: {
    title: "FAQ · Genesis Sports Foundation",
    description:
      "Everything you need to know about athletics coaching with Genesis Sports Foundation in Coimbatore.",
    type: "website",
    url: `${SITE.url}/faq`,
    siteName: SITE.name,
    locale: "en_IN",
  },
};

/**
 * Single source of truth for the FAQ: rendered visibly *and* emitted as
 * FAQPage structured data. Google requires the schema answers to match the
 * on-page text, so both must come from this one array. Answers are written to
 * target real local search phrasing (Coimbatore / Tamil Nadu athletics) —
 * concrete, non-generic terms, per our SEO strategy.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Where is Genesis Sports Foundation located?",
    a: `Genesis Sports Foundation is based in Coimbatore, Tamil Nadu. Our office is at ${CONTACT.address} Athletics training takes place at ${SITE.venue}.`,
  },
  {
    q: "What does Genesis Sports Foundation do?",
    a: "We are an athletics coaching foundation in Coimbatore focused on grassroots track and field — sprints, jumps, throws and middle-distance running. Our mission is to discover young talent across Tamil Nadu and develop them into national and international medal winners.",
  },
  {
    q: "Who can join — what age groups do you coach?",
    a: "We coach both junior and senior athletes. Young beginners as well as competitive athletes preparing for district, state and national meets are welcome. If you are unsure whether it is the right fit, contact us and we will guide you.",
  },
  {
    q: "Where do athletes train?",
    a: `Coaching and track sessions are held at ${SITE.venue} — a full athletics track in the heart of Coimbatore, easily reachable from across the city and nearby districts.`,
  },
  {
    q: "What is Genesis Track Fest 2026?",
    a: `Genesis Track Fest 2026 is our junior and senior athletics championship at ${SITE.venue} on ${SITE.dates}. It is a platform for young athletes across Tamil Nadu to compete and be discovered. Live results are published on our website during the event.`,
  },
  {
    q: "How do I register for Genesis Track Fest 2026?",
    a: "Registration links for each event are published on our Events page as they open. Visit the event you are interested in and use the Register button, or contact us and we will help you sign up.",
  },
  {
    q: "Do you coach complete beginners?",
    a: "Yes. A large part of our work is introducing children and youth to athletics for the first time and building strong fundamentals in running, jumping and throwing before moving on to competition.",
  },
  {
    q: "How can schools, colleges or sponsors partner with Genesis Sports Foundation?",
    a: `We actively partner with schools and sponsors to widen access to athletics across Tamil Nadu. Reach us at ${CONTACT.emails[0]} or ${CONTACT.phones[0]}, or see our Sponsorship page to get involved.`,
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <PageHero
        eyebrow="Help & Answers"
        title="Frequently Asked Questions"
        description="Athletics coaching in Coimbatore, training venue, joining, and Genesis Track Fest 2026 — answered."
      />

      <Section>
        <Container className="max-w-3xl">
          <dl className="divide-y divide-sand/10">
            {FAQS.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-display text-xl uppercase leading-tight text-cream">
                  {f.q}
                </dt>
                <dd className="mt-3 text-sand leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>
    </>
  );
}

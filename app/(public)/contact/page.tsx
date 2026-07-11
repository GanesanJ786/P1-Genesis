import type { Metadata } from "next";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { ContactForm } from "@/components/public/ContactForm";
import { CONTACT, SITE, SPONSOR_TIERS, whatsappUrl } from "@/lib/constants";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Join the Genesis Sports Foundation athletics academy in Coimbatore, or partner with us for Genesis Track Fest 2026. Reach out by WhatsApp, phone, email, or the contact form.",
  alternates: { canonical: `${SITE.url}/contact` },
};

// Hero copy adapts to how the visitor arrived (?intent=join from a parent CTA,
// ?intent=sponsor from a partner CTA) so each audience feels addressed. The same
// intent seeds the form's enquiry-type dropdown.
const HEROES: Record<string, { eyebrow: string; title: string; description: string }> = {
  join: {
    eyebrow: "Join the Academy",
    title: "Train With Genesis",
    description:
      "Bring your child to athletics coaching in Coimbatore — beginners to competitive athletes are welcome. Message us and we'll help you get started.",
  },
  sponsor: {
    eyebrow: "Let's Talk",
    title: "Partner With Genesis",
    description:
      "Your support today can create the Olympians of tomorrow. Let's shape this championship — together.",
  },
  default: {
    eyebrow: "Get in Touch",
    title: "Talk to Genesis",
    description:
      "Whether you'd like to join the academy, sponsor the event, or just have a question — we'd love to hear from you.",
  },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; tier?: string }>;
}) {
  const { intent, tier } = await searchParams;
  const hero = HEROES[intent ?? "default"] ?? HEROES.default;

  // Deep-linked from a sponsorship tier → seed the message so the sponsor doesn't
  // have to restate what they came for.
  const tierName = SPONSOR_TIERS.find((t) => t.key === tier)?.name;
  const defaultMessage = tierName
    ? `I'm interested in the ${tierName} package for Genesis Track Fest 2026. Please share the next steps.`
    : undefined;

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-w-0">
              <h2 className="font-display text-2xl uppercase text-cream">
                Send a Message
              </h2>
              <p className="mt-2 mb-8 text-sand">
                Tell us how you&apos;d like to be involved and we&apos;ll get back
                to you shortly.
              </p>
              <ContactForm defaultEnquiry={intent} defaultMessage={defaultMessage} />
            </div>

            <div className="min-w-0 space-y-6">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 p-5 transition-colors hover:border-[#25D366]"
              >
                <MessageCircle className="shrink-0 text-[#25D366]" size={24} />
                <div>
                  <p className="font-semibold text-cream">Chat on WhatsApp</p>
                  <p className="text-sm text-sand">
                    Usually the fastest way to reach us
                  </p>
                </div>
              </a>
              <div className="space-y-5 rounded-2xl border border-sand/15 bg-ink-soft p-7">
                <div className="flex items-start gap-4">
                  <Mail className="mt-1 shrink-0 text-ember" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-sand">Email</p>
                    {CONTACT.emails.map((e) => (
                      <a
                        key={e}
                        href={`mailto:${e}`}
                        className="block text-cream hover:text-ember"
                      >
                        {e}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="mt-1 shrink-0 text-ember" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-sand">Phone</p>
                    {CONTACT.phones.map((p) => (
                      <a
                        key={p}
                        href={`tel:${p.replace(/\s/g, "")}`}
                        className="block text-cream hover:text-ember"
                      >
                        {p}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 shrink-0 text-ember" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-sand">Address</p>
                    <p className="text-cream">{CONTACT.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

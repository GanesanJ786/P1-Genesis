import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { ContactForm } from "@/components/public/ContactForm";
import { RegistrationQR } from "@/components/public/RegistrationQR";
import { CONTACT } from "@/lib/constants";

// Cache for 1 hour; admin edits revalidate instantly via revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Partner with Genesis Sports Foundation for Genesis Track Fest 2026. Reach out by email, phone, or the contact form.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Let's Talk"
        title="Partner With Genesis"
        description="Your support today can create the Olympians of tomorrow. Let's shape this championship — together."
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-display text-2xl uppercase text-cream">
                Send a Message
              </h2>
              <p className="mt-2 mb-8 text-sand">
                Tell us how you&apos;d like to be involved and we&apos;ll get back
                to you shortly.
              </p>
              <ContactForm />
            </div>

            <div className="space-y-6">
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

              <RegistrationQR />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { CONTACT, NAV_LINKS, SITE } from "@/lib/constants";
import { Container } from "@/components/ui/Section";

export function Footer() {
  return (
    <footer className="border-t border-sand/10 bg-ink">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Image
              src="/brand/genesis-logo.png"
              alt="Genesis Sports Foundation — The Beginning of Sports, Coimbatore"
              width={900}
              height={802}
              className="h-auto w-40 sm:w-48"
            />
            <p className="mt-5 max-w-sm text-sm text-sand">
              {SITE.description}
            </p>
            <p className="mt-4 eyebrow">{SITE.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cream">
              Explore
            </h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-sand transition-colors hover:text-ember"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cream">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-sand">
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0 text-ember" />
                <a href={`mailto:${CONTACT.emails[0]}`} className="hover:text-ember">
                  {CONTACT.emails[0]}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 shrink-0 text-ember" />
                <span>{CONTACT.phones.join(" · ")}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-ember" />
                <span>{CONTACT.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-sand/10 pt-6 text-xs text-sand sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.organiser}. All rights reserved.
          </p>
          <p>
            {SITE.venue} · {SITE.dates}
          </p>
        </div>
      </Container>
    </footer>
  );
}

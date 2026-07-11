import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { CONTACT, NAV_LINKS, SITE, SOCIAL, whatsappUrl } from "@/lib/constants";
import { Container } from "@/components/ui/Section";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  WhatsappIcon,
} from "@/components/public/SocialIcons";

// Only channels with a URL render — Facebook stays hidden until its URL is set
// in lib/constants (SOCIAL.facebook).
const SOCIAL_LINKS = [
  { label: "Instagram", href: SOCIAL.instagram, Icon: InstagramIcon },
  { label: "YouTube", href: SOCIAL.youtube, Icon: YoutubeIcon },
  { label: "Facebook", href: SOCIAL.facebook, Icon: FacebookIcon },
  { label: "WhatsApp", href: whatsappUrl(), Icon: WhatsappIcon },
].filter((s) => s.href);

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

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-sand transition-colors hover:border-ember hover:text-ember"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
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
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-sand transition-colors hover:text-ember"
                >
                  FAQ
                </Link>
              </li>
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
            Powered by{" "}
            <a
              href="https://connect2soft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sand transition-colors hover:text-ember"
            >
              Connect2Soft
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}

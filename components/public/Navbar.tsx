"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE, SOCIAL, whatsappUrl } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/Button";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  WhatsappIcon,
} from "@/components/public/SocialIcons";
import { cn } from "@/lib/utils";

// Only channels with a URL render (Facebook hidden until set in lib/constants).
const SOCIAL_LINKS = [
  { label: "Instagram", href: SOCIAL.instagram, Icon: InstagramIcon },
  { label: "YouTube", href: SOCIAL.youtube, Icon: YoutubeIcon },
  { label: "Facebook", href: SOCIAL.facebook, Icon: FacebookIcon },
  { label: "WhatsApp", href: whatsappUrl(), Icon: WhatsappIcon },
].filter((s) => s.href);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ink/90 backdrop-blur-md border-b border-sand/10 py-3"
          : "bg-transparent py-5",
      )}
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Genesis Sports Foundation — home"
        >
          <Image
            src="/brand/genesis-emblem.png"
            alt="Genesis Sports Foundation"
            width={512}
            height={255}
            priority
            className="h-8 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-9"
          />
          <span className="whitespace-nowrap font-display text-base uppercase tracking-tight text-cream sm:text-lg">
            Genesis<span className="text-ember"> Sports Foundation</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-ember",
                  active ? "text-ember" : "text-cream/80",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:block">
          <ButtonLink href="/sponsorship" size="sm">
            Become a Sponsor
          </ButtonLink>
        </div>

        <button
          className="text-cream lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile drawer. grid-rows 0fr→1fr animates to the content's exact height
          so the CTA + date can never be clipped (a fixed max-height was cutting
          them off). The inner wrapper caps at the viewport and scrolls on very
          short screens. */}
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto border-t border-sand/10 bg-ink/95 px-5 py-4 backdrop-blur-md">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-3 text-base text-cream/90 hover:bg-ink-soft hover:text-ember"
              >
                {link.label}
              </Link>
            ))}
            <ButtonLink href="/sponsorship" className="mt-2 w-full" size="md">
              Become a Sponsor
            </ButtonLink>

            <div className="mt-4 flex items-center gap-3 px-3">
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
            <p className="mt-3 px-3 text-xs text-sand">{SITE.dates}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

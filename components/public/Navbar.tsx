"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

      {/* Mobile drawer */}
      <div
        className={cn(
          "overflow-hidden border-t border-sand/10 bg-ink/95 backdrop-blur-md transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-[28rem]" : "max-h-0",
        )}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
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
          <p className="mt-3 px-3 text-xs text-sand">{SITE.dates}</p>
        </div>
      </div>
    </header>
  );
}

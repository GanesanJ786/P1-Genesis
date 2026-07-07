"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { mediaUrl } from "@/lib/storage";
import { Container, Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import type { Slide } from "@/lib/seed-data";

/**
 * Homepage "featured event" promo — designed posters uploaded via Admin →
 * Slides (group "Home hero"). Reuses the existing slides system so promoting
 * the next event is a content edit, not a code change.
 *
 * Rather than dumping the raw image full-width (posters are often square/portrait
 * on a light background, which clashes with the dark site), each slide renders
 * as a framed promo: the poster contained in a clean card on one side, and the
 * event title / description / CTA (from the slide's own fields) on the other.
 * One active slide → a single promo; multiple → an auto-advancing carousel.
 */
function BannerPromo({ slide }: { slide: Slide }) {
  const img = mediaUrl(slide.image_path);
  if (!img) return null;

  const poster = (
    // A light card frames the (usually white-background) poster so it reads as
    // an intentional flyer instead of a floating graphic. Plain <img> is
    // deliberate — posters have arbitrary aspect ratios (images are already
    // served unoptimized, so next/image adds nothing here).
    <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-lg shadow-black/20 ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={slide.title || "Genesis Sports Foundation event"}
        className="mx-auto max-h-[340px] w-full object-contain"
      />
    </div>
  );

  return (
    <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-sand/15 bg-gradient-to-br from-ink-soft to-ink p-6 sm:p-10 lg:grid-cols-2 lg:gap-12">
      <div className="mx-auto w-full max-w-sm">
        {slide.link_url ? (
          <Link
            href={slide.link_url}
            className="block transition-opacity hover:opacity-90"
            aria-label={slide.title || "View event details"}
          >
            {poster}
          </Link>
        ) : (
          poster
        )}
      </div>

      <div className="text-center lg:text-left">
        <p className="eyebrow mb-3 text-ember">Featured Event</p>
        {slide.title ? (
          <h2 className="font-display text-3xl uppercase leading-tight text-cream sm:text-4xl">
            {slide.title}
          </h2>
        ) : null}
        {slide.subtitle ? (
          <p className="mt-4 text-sand">{slide.subtitle}</p>
        ) : null}
        {slide.link_url ? (
          <div className="mt-7">
            <ButtonLink href={slide.link_url} size="lg">
              View Event Details
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BannerCarousel({ banners }: { banners: Slide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((s) => (
            <div key={s.id} className="min-w-0 flex-[0_0_100%]">
              <BannerPromo slide={s} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous event"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-sand/30 bg-ink/70 p-2 text-cream backdrop-blur transition-colors hover:border-ember hover:text-ember sm:left-4"
      >
        <ArrowLeft size={18} />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next event"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-sand/30 bg-ink/70 p-2 text-cream backdrop-blur transition-colors hover:border-ember hover:text-ember sm:right-4"
      >
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

export function EventBanner({ slides }: { slides: Slide[] }) {
  const banners = slides.filter((s) => s.is_active && s.image_path);
  if (banners.length === 0) return null;

  return (
    <Section className="py-12 sm:py-16">
      <Container>
        {banners.length === 1 ? (
          <BannerPromo slide={banners[0]} />
        ) : (
          <BannerCarousel banners={banners} />
        )}
      </Container>
    </Section>
  );
}

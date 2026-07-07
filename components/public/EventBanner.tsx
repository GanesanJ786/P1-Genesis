"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { mediaUrl } from "@/lib/storage";
import { Container, Section } from "@/components/ui/Section";
import type { Slide } from "@/lib/seed-data";

/**
 * Homepage promotional banner(s) — designed event posters uploaded via
 * Admin → Slides (group "Home hero"). Reuses the existing slides system so
 * swapping in the next event's poster is a content edit, not a code change.
 *
 * A finished poster (text/logos baked in) is shown at its natural aspect ratio
 * with `w-full h-auto object-contain`, so it scales down to any screen width
 * without ever cropping the baked-in artwork. One active slide → a single
 * banner; multiple → an auto-advancing, swipeable carousel of upcoming events.
 */
function BannerImage({ slide }: { slide: Slide }) {
  const img = mediaUrl(slide.image_path);
  if (!img) return null;

  // Plain <img> (not next/image) is deliberate: posters are uploaded at
  // arbitrary aspect ratios, and next/image needs fixed width/height. Images
  // are already served unoptimized (next.config), so there's nothing to gain.
  const picture = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img}
      alt={slide.title || "Genesis Sports Foundation event"}
      className="h-auto w-full object-contain"
    />
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft">
      {slide.link_url ? (
        <Link
          href={slide.link_url}
          className="block transition-opacity hover:opacity-95"
          aria-label={slide.title || "View event details"}
        >
          {picture}
        </Link>
      ) : (
        picture
      )}
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
              <BannerImage slide={s} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous banner"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-sand/30 bg-ink/70 p-2 text-cream backdrop-blur transition-colors hover:border-ember hover:text-ember"
      >
        <ArrowLeft size={18} />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-sand/30 bg-ink/70 p-2 text-cream backdrop-blur transition-colors hover:border-ember hover:text-ember"
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
    <Section className="py-10 sm:py-12">
      <Container className="max-w-5xl">
        {banners.length === 1 ? (
          <BannerImage slide={banners[0]} />
        ) : (
          <BannerCarousel banners={banners} />
        )}
      </Container>
    </Section>
  );
}

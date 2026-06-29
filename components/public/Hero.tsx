import { ArrowDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SITE, HERO_VERBS } from "@/lib/constants";

/**
 * Full-bleed hero — entirely CSS-driven, no image assets. A large, responsive
 * "Run · Jump · Throw · Grow" typographic backdrop replaces the old hero image.
 * Sizing is fluid via clamp/vw (set both in globals.css and inline so it always
 * renders at image scale regardless of CSS load order).
 */
export function Hero({
  eyebrow,
  title,
  tagline,
}: {
  eyebrow: string;
  title: string;
  tagline: string;
}) {
  // Inline fallbacks mirror the .hero-verbs CSS so the backdrop renders even if
  // the stylesheet loads late. Sized to stay contained on the right (no bleed).
  const verbSize = "clamp(2.5rem, 11vw, 9.5rem)";
  const outlineStroke = "0.12vw color-mix(in srgb, var(--color-sand) 28%, transparent)";
  const accentStroke = "0.14vw color-mix(in srgb, var(--color-ember) 45%, transparent)";

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* CSS background: gradient + grain + soft glows (no images) */}
      <div aria-hidden className="hero-gradient absolute inset-0 -z-20" />
      <div aria-hidden className="bg-grain absolute inset-0 -z-20 opacity-40" />

      {/* Outlined verb backdrop — kinetic "Run · Jump · Throw · Grow" texture,
          anchored to the right and kept low-contrast so it never fights the copy. */}
      <div
        aria-hidden
        className="hero-verbs pointer-events-none absolute inset-y-0 right-0 -z-10 flex flex-col items-end justify-center gap-[0.4vh] pr-[4vw] opacity-50 sm:opacity-60"
      >
        {HERO_VERBS.map((v) => (
          <span
            key={v.word}
            className={v.accent ? "is-accent" : "is-outline"}
            style={{
              fontSize: verbSize,
              color: "transparent",
              WebkitTextStroke: v.accent ? accentStroke : outlineStroke,
            }}
          >
            {v.word}
          </span>
        ))}
      </div>

      {/* Scrim: keeps the left-aligned copy fully legible while letting the
          outlined verbs fade in on the right. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink from-30% via-ink/65 to-transparent"
      />

      {/* Foreground copy */}
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4 text-flame">{eyebrow}</p>
          <h1 className="font-display text-[2.75rem] uppercase leading-[0.95] text-cream sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            {title.split(" ").map((word, i) => (
              <span
                key={i}
                className={
                  ["fest", "sports"].includes(word.toLowerCase())
                    ? "text-ember"
                    : undefined
                }
              >
                {word}{" "}
              </span>
            ))}
          </h1>

          {/* Visible verb line — reinforces the theme as readable text */}
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold uppercase tracking-[0.25em] text-sand">
            {HERO_VERBS.map((v, i) => (
              <span key={v.word} className="flex items-center gap-3">
                <span className={v.accent ? "text-ember" : "text-cream"}>
                  {v.word}
                </span>
                {i < HERO_VERBS.length - 1 ? (
                  <span className="text-ember/60">·</span>
                ) : null}
              </span>
            ))}
          </p>

          <p className="mt-6 max-w-xl text-base text-cream/85 sm:text-lg">{tagline}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
            <ButtonLink href="/events" size="lg">
              Upcoming Events
            </ButtonLink>
            <ButtonLink href="/foundation" size="lg" variant="outline">
              About the Foundation
            </ButtonLink>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/70 sm:gap-x-8">
            <span>
              <span className="font-semibold text-cream">Since</span> · 2015
            </span>
            <span>
              <span className="font-semibold text-cream">500+</span> athletes
            </span>
            <span>
              <span className="font-semibold text-cream">5</span> academies
            </span>
            <span>
              <span className="font-semibold text-cream">Base</span> · {SITE.venue}
            </span>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/70">
        <ArrowDown className="animate-bounce" size={22} />
      </div>
    </section>
  );
}

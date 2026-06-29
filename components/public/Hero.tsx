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
  // Inline fallbacks guarantee the backdrop renders at full size.
  const verbSize = "clamp(4.5rem, 22vw, 20rem)";

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* CSS background: gradient + grain + soft glows (no images) */}
      <div aria-hidden className="hero-gradient absolute inset-0 -z-20" />
      <div aria-hidden className="bg-grain absolute inset-0 -z-20 opacity-40" />

      {/* Oversized verb backdrop — pure text conveying Run · Jump · Throw · Grow */}
      <div
        aria-hidden
        className="hero-verbs pointer-events-none absolute inset-0 -z-10 flex flex-col items-end justify-center pr-[2vw]"
      >
        {HERO_VERBS.map((v) => (
          <span
            key={v.word}
            className={v.accent ? "is-accent" : "is-outline"}
            style={
              v.accent
                ? { fontSize: verbSize, color: "var(--color-ember)" }
                : {
                    fontSize: verbSize,
                    color: "transparent",
                    WebkitTextStroke: "0.22vw rgba(184,171,152,0.45)",
                  }
            }
          >
            {v.word}
          </span>
        ))}
      </div>

      {/* Left-to-right scrim keeps foreground copy legible over the verbs */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/20"
      />

      {/* Foreground copy */}
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4 text-flame">{eyebrow}</p>
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-cream sm:text-7xl md:text-8xl lg:text-[7rem]">
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

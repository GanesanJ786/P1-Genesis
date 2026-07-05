import { ButtonLink } from "@/components/ui/Button";

/**
 * Post-event hero banner. Shown when hero.mode = "post_event".
 * All copy is editable via /admin/content (hero.results_* keys).
 */
export function HeroResults({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain bg-gradient-to-br from-ink-soft via-ink to-black"
      />
      <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-ember/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-64 w-64 rounded-full bg-ember/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="eyebrow mb-4 text-ember">{eyebrow}</p>
        <h1 className="font-display text-[2.75rem] uppercase leading-[0.95] text-cream sm:text-6xl md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-cream/80 sm:text-lg">{body}</p>
        {ctaLabel && ctaHref ? (
          <div className="mt-9">
            <ButtonLink href={ctaHref} size="lg">
              {ctaLabel}
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}

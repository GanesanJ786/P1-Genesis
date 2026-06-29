import { Container } from "@/components/ui/Section";

/** Compact inner-page hero with eyebrow + display title over the dark theme. */
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-sand/10 pt-36 pb-16 sm:pt-40 sm:pb-20">
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-ember/10 blur-3xl" />
      <Container>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display text-5xl uppercase text-cream sm:text-6xl md:text-7xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-lg text-sand">{description}</p>
        ) : null}
      </Container>
    </section>
  );
}

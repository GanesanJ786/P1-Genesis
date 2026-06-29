/**
 * Full-width statement banner with a static gradient + glow background.
 * No scroll/parallax effects.
 */
export function FeatureBanner({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain bg-gradient-to-br from-ink-soft via-ink to-black"
      />
      <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-ember/10 blur-3xl" />
      {children}
    </section>
  );
}

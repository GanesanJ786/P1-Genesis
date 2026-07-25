/**
 * Coimbatore Track Fest's running mascot — a small, purely decorative corner
 * accent on the live results page (where the "run, jump, throw" energy fits
 * best). Bottom-LEFT, mirroring the site-wide WhatsApp button (bottom-right,
 * see WhatsAppButton.tsx) — deliberately NOT near the top, where the page's
 * own sticky search/filter bar lives; a fixed element there visually
 * collides with sticky content at certain scroll positions. A plain <img>,
 * not next/image — Next's image optimizer doesn't preserve GIF animation.
 */
export function TrackFestMascot() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image breaks GIF animation
    <img
      src="/mascot/track-fest-mascot.gif"
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed bottom-4 left-4 z-40 h-20 w-auto drop-shadow-lg sm:h-24"
    />
  );
}

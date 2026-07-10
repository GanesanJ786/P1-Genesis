import Image from "next/image";
import type { Database, SponsorTier } from "@/types/database.types";
import { mediaUrl } from "@/lib/storage";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];

const TIER_ORDER: SponsorTier[] = ["title", "platinum", "gold", "silver", "supporter"];
const TIER_LABELS: Record<SponsorTier, string> = {
  title: "Title Sponsor",
  platinum: "Platinum Sponsors",
  gold: "Gold Sponsors",
  silver: "Silver Sponsors",
  supporter: "Supporters",
};

function SponsorTile({ sponsor, large }: { sponsor: SponsorRow; large?: boolean }) {
  const logo = mediaUrl(sponsor.logo_path);
  const tile = (
    <div
      className={`flex items-center justify-center rounded-2xl border border-sand/10 bg-cream px-6 transition-colors hover:border-ember/50 ${
        large ? "h-28 min-w-56" : "h-20 min-w-40"
      }`}
    >
      {logo ? (
        <Image
          src={logo}
          alt={sponsor.name}
          width={large ? 200 : 140}
          height={large ? 88 : 56}
          className={`w-auto object-contain ${large ? "max-h-20" : "max-h-14"}`}
        />
      ) : (
        <span className="font-display text-lg uppercase text-ink">{sponsor.name}</span>
      )}
    </div>
  );
  return sponsor.website_url ? (
    <a
      href={sponsor.website_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={sponsor.name}
    >
      {tile}
    </a>
  ) : (
    tile
  );
}

/**
 * Tier-grouped sponsor logo showcase — the sponsors table's public surface.
 * Generic (props-only) so other pages can adopt it beyond the live hub.
 */
export function SponsorStrip({
  sponsors,
  heading = "Our Partners",
}: {
  sponsors: SponsorRow[];
  heading?: string;
}) {
  if (sponsors.length === 0) return null;

  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    items: sponsors.filter((s) => s.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <section aria-label="Sponsors">
      <p className="eyebrow mb-5">{heading}</p>
      <div className="space-y-6">
        {byTier.map(({ tier, items }) => (
          <div key={tier}>
            <p className="mb-3 text-[0.65rem] uppercase tracking-widest text-sand/60">
              {TIER_LABELS[tier]}
            </p>
            <div className="flex flex-wrap gap-4">
              {items.map((s) => (
                <SponsorTile key={s.id} sponsor={s} large={tier === "title"} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

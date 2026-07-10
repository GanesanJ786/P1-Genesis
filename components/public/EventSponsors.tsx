import type { ReactNode } from "react";
import Image from "next/image";
import type { Database, SponsorTier } from "@/types/database.types";
import { mediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];

type Level = "hero" | "feature" | "standard";

/**
 * Ordered tier config. `level` drives the visual weight of each group so the
 * showcase reads as a hierarchy — title = hero, platinum/gold = larger feature
 * cards, silver/bronze/medical/partner = a uniform card grid, supporters =
 * chips. Only tiers with sponsors render. Logos are normalised into identical
 * plates (below) so wildly different logo shapes/sizes read as equal weight.
 */
const TIERS: { key: SponsorTier; label: string; level: Level }[] = [
  { key: "title", label: "Title Sponsor", level: "hero" },
  { key: "platinum", label: "Platinum Sponsors", level: "feature" },
  { key: "gold", label: "Gold Sponsors", level: "feature" },
  { key: "silver", label: "Silver Sponsors", level: "standard" },
  { key: "bronze", label: "Bronze Sponsors", level: "standard" },
  { key: "medical", label: "Medical Partner", level: "standard" },
  { key: "partner", label: "Event Partners", level: "standard" },
  { key: "supporter", label: "Event Supporters", level: "standard" },
];

/** Wraps children in an external link when the sponsor has a website. */
function SponsorLink({
  url,
  label,
  className,
  children,
}: {
  url: string | null;
  label: string;
  className: string;
  children: ReactNode;
}) {
  if (!url) return <div className={className}>{children}</div>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * The key to a tidy sponsor wall: every logo sits in an identical light plate
 * and is scaled to *fit* it (object-contain), so a wide wordmark and a small
 * round mark end up the same visual size. Falls back to the name when no logo.
 */
function LogoPlate({
  sponsor,
  className,
  padding = "p-5",
}: {
  sponsor: SponsorRow;
  className?: string;
  padding?: string;
}) {
  const logo = mediaUrl(sponsor.logo_path);
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-cream",
        className,
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt={sponsor.name}
          fill
          sizes="320px"
          className={cn("object-contain", padding)}
        />
      ) : (
        <span className="px-3 text-center font-display text-base uppercase leading-tight text-ink">
          {sponsor.name}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function HeroCard({ sponsor }: { sponsor: SponsorRow }) {
  const banner = mediaUrl(sponsor.banner_path);

  if (banner) {
    return (
      <SponsorLink
        url={sponsor.website_url}
        label={sponsor.name}
        className="group relative block overflow-hidden rounded-3xl border border-ember/40"
      >
        <div className="relative aspect-[16/7] w-full sm:aspect-[16/5]">
          <Image
            src={banner}
            alt={`${sponsor.name} banner`}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-x-5 gap-y-3 p-5 sm:p-8">
            <LogoPlate
              sponsor={sponsor}
              padding="p-2"
              className="h-16 w-28 shrink-0 rounded-xl sm:h-20 sm:w-36"
            />
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-ember">Title Sponsor</p>
              <h3 className="mt-1 font-display text-2xl uppercase leading-none text-cream sm:text-4xl">
                {sponsor.name}
              </h3>
              {sponsor.description ? (
                <p className="mt-2 max-w-2xl text-sm text-cream/80">
                  {sponsor.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </SponsorLink>
    );
  }

  return (
    <SponsorLink
      url={sponsor.website_url}
      label={sponsor.name}
      className="group mx-auto block max-w-xl rounded-3xl border border-ember/40 bg-gradient-to-b from-ember/[0.08] to-transparent px-6 py-9 text-center transition-colors hover:border-ember sm:py-11"
    >
      <LogoPlate
        sponsor={sponsor}
        padding="p-6"
        className="mx-auto aspect-[16/7] w-full max-w-sm rounded-2xl"
      />
      <p className="eyebrow mt-6 text-ember">Title Sponsor</p>
      <h3 className="mt-1 font-display text-2xl uppercase leading-tight text-cream sm:text-3xl">
        {sponsor.name}
      </h3>
      {sponsor.description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-sand">
          {sponsor.description}
        </p>
      ) : null}
    </SponsorLink>
  );
}

/* ------------------------------- logo cards ------------------------------- */

/** Uniform vertical card (plate on top, name + optional description below). */
function LogoCard({ sponsor, width }: { sponsor: SponsorRow; width: string }) {
  return (
    <SponsorLink
      url={sponsor.website_url}
      label={sponsor.name}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-sand/12 bg-ink-soft transition-colors hover:border-ember/45",
        width,
      )}
    >
      <LogoPlate sponsor={sponsor} className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col justify-center p-4 text-center">
        <p className="text-sm font-semibold text-cream">{sponsor.name}</p>
        {sponsor.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-sand">
            {sponsor.description}
          </p>
        ) : null}
      </div>
    </SponsorLink>
  );
}

/* -------------------------------- section --------------------------------- */

function TierGroup({
  label,
  level,
  items,
}: {
  label: string;
  level: Level;
  items: SponsorRow[];
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span aria-hidden className="h-4 w-1 rounded-full bg-ember/70" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand/70">
          {label}
        </p>
      </div>

      {level === "hero" ? (
        <div className="space-y-4">
          {items.map((s) => (
            <HeroCard key={s.id} sponsor={s} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {items.map((s) => (
            <LogoCard
              key={s.id}
              sponsor={s}
              width={
                level === "feature"
                  ? "w-full sm:w-72"
                  : "w-[calc(50%-0.5rem)] sm:w-56"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Per-event sponsor showcase — tier-grouped, responsive, with normalised logos,
 * optional description and (for the title sponsor) an optional banner. Rendered
 * on the live event page from the event's active sponsors (see getEventSponsors);
 * sponsors are ordered within each tier by their showcase sort order.
 */
export function EventSponsors({
  sponsors,
  heading = "Our Partners",
}: {
  sponsors: SponsorRow[];
  heading?: string;
}) {
  if (sponsors.length === 0) return null;

  const groups = TIERS.map((t) => ({
    ...t,
    items: sponsors.filter((s) => s.tier === t.key),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section aria-label="Event partners">
      <div className="mb-8 flex items-center gap-4">
        <p className="eyebrow whitespace-nowrap">{heading}</p>
        <span aria-hidden className="h-px flex-1 bg-sand/15" />
      </div>
      <div className="space-y-12">
        {groups.map((g) => (
          <TierGroup key={g.key} label={g.label} level={g.level} items={g.items} />
        ))}
      </div>
    </section>
  );
}
